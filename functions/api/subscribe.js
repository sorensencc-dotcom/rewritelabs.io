// Newsletter signup for the blog and AI News Feed. Kept apart from the product waitlist on purpose:
// its own endpoint, its own KV binding (NEWSLETTER), its own records. Nothing here touches WAITLIST.
// Each signup is stored as "pending", then sent to Kit, the email platform. Kit's own double opt-in
// (the form's incentive email) confirms the address, so nobody gets the newsletter without clicking it.
// Until the Kit settings below exist, signups stay "pending" in KV and nothing is sent anywhere.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Where the signup came from, such as "feed:2026-11-23" or "blog:index". Anything else is dropped.
const SOURCE_RE = /^[a-z0-9:_\-/]{1,80}$/i;
// The two tracks a reader can pick. Each becomes one tag on the email platform.
export const TRACKS = ['operator', 'field'];

const KIT_API = 'https://api.kit.com/v4';
// Settings for the Pages project. KIT_API_KEY is a secret; the ids are plain variables from Kit.
const KIT_TAG_VARS = { operator: 'KIT_TAG_OPERATOR', field: 'KIT_TAG_FIELD' };
export const kitReady = (env) =>
  Boolean(env?.KIT_API_KEY && env?.KIT_FORM_ID && Object.values(KIT_TAG_VARS).every((v) => env?.[v]));

const MAX_BODY_BYTES = 2048;
const LIMIT = 5;
const WINDOW_SECONDS = 3600;

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
  });

async function visitorKey(request) {
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `rl:${hex.slice(0, 32)}`;
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

// Keeps known tracks only, in a fixed order, without repeats.
export function cleanTracks(value) {
  const picked = Array.isArray(value) ? value.map((t) => String(t).toLowerCase()) : [];
  return TRACKS.filter((t) => picked.includes(t));
}

async function kitPost(env, path, body) {
  const res = await fetch(`${KIT_API}${path}`, {
    method: 'POST',
    headers: { 'x-kit-api-key': env.KIT_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`kit ${path.split('/')[1]} answered ${res.status}`);
}

// Sends one signup to Kit: create the subscriber as inactive, add them to the double opt-in form (Kit
// emails the confirmation), then tag each track they picked. Marks the KV entry "sent" once Kit took
// it; on any failure the entry stays "pending" so it can be sent again. Never logs the address.
export async function syncToKit(env, key, entry) {
  try {
    await kitPost(env, '/subscribers', { email_address: entry.email, state: 'inactive' });
    await kitPost(env, `/forms/${env.KIT_FORM_ID}/subscribers`, { email_address: entry.email });
    for (const track of entry.tracks) {
      await kitPost(env, `/tags/${env[KIT_TAG_VARS[track]]}/subscribers`, { email_address: entry.email });
    }
    await env.NEWSLETTER.put(key, JSON.stringify({ ...entry, status: 'sent', sentAt: new Date().toISOString() }));
    return true;
  } catch (err) {
    console.error(`subscribe: Kit sync failed, entry left pending (${err.message})`);
    return false;
  }
}

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env?.NEWSLETTER) {
    console.error('subscribe: the NEWSLETTER KV binding is missing; add it under the Pages project settings');
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  if (!sameOrigin(request)) return json({ ok: false, error: 'forbidden_origin' }, 403);
  if (!(request.headers.get('content-type') || '').toLowerCase().includes('application/json')) {
    return json({ ok: false, error: 'unsupported_media_type' }, 415);
  }
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
    return json({ ok: false, error: 'payload_too_large' }, 413);
  }
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return json({ ok: false, error: 'payload_too_large' }, 413);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  if (typeof data?.website === 'string' && data.website.trim()) return json({ ok: true });

  const email = String(data?.email || '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'invalid_email' }, 400);
  }
  const tracks = cleanTracks(data?.tracks);
  if (tracks.length === 0) return json({ ok: false, error: 'no_track' }, 400);

  // Same answer for a known address, so the endpoint cannot be used to check who is subscribed.
  // Track changes for an existing reader go through the email platform's preference page, not here.
  const key = `email:${email}`;
  if (await env.NEWSLETTER.get(key)) return json({ ok: true });

  const visitor = await visitorKey(request);
  const now = Math.floor(Date.now() / 1000);
  const seen = await env.NEWSLETTER.get(visitor, 'json');
  const active = seen && seen.exp > now ? seen : null;
  if (active && active.n >= LIMIT) {
    console.warn('subscribe: rate limited a visitor');
    return json({ ok: false, error: 'rate_limited' }, 429, { 'retry-after': String(active.exp - now) });
  }

  const source = SOURCE_RE.test(String(data?.source ?? '')) ? String(data.source) : null;
  const entry = {
    email,
    tracks,
    source,
    status: 'pending',
    createdAt: new Date().toISOString(),
    country: request.cf?.country || null,
  };
  await env.NEWSLETTER.put(key, JSON.stringify(entry));

  const exp = active ? active.exp : now + WINDOW_SECONDS;
  await env.NEWSLETTER.put(visitor, JSON.stringify({ n: (active?.n ?? 0) + 1, exp }), { expiration: Math.max(exp, now + 60) });

  // The reader's answer does not wait on Kit, and is the same whether or not Kit took the signup.
  if (kitReady(env)) {
    const sync = syncToKit(env, key, entry);
    if (typeof waitUntil === 'function') waitUntil(sync);
    else await sync;
  } else {
    console.warn('subscribe: Kit settings missing, signup stored as pending only');
  }
  return json({ ok: true });
}

export const onRequest = () => json({ ok: false, error: 'method_not_allowed' }, 405);
