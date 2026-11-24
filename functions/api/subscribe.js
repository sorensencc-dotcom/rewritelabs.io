// Newsletter signup for the blog and AI News Feed. Kept apart from the product waitlist on purpose:
// its own endpoint, its own KV binding (NEWSLETTER), its own records. Nothing here touches WAITLIST.
// The email platform is not chosen yet, so this only stores the signup as "pending". A sync step added
// once a platform is picked sends each pending entry to it, and the platform's double opt-in confirms it.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Where the signup came from, such as "feed:2026-11-23" or "blog:index". Anything else is dropped.
const SOURCE_RE = /^[a-z0-9:_\-/]{1,80}$/i;
// The two tracks a reader can pick. Each becomes one tag on the email platform.
export const TRACKS = ['operator', 'field'];

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

export async function onRequestPost({ request, env }) {
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
  await env.NEWSLETTER.put(
    key,
    JSON.stringify({
      email,
      tracks,
      source,
      status: 'pending',
      createdAt: new Date().toISOString(),
      country: request.cf?.country || null,
    }),
  );

  const exp = active ? active.exp : now + WINDOW_SECONDS;
  await env.NEWSLETTER.put(visitor, JSON.stringify({ n: (active?.n ?? 0) + 1, exp }), { expiration: Math.max(exp, now + 60) });
  return json({ ok: true });
}

export const onRequest = () => json({ ok: false, error: 'method_not_allowed' }, 405);
