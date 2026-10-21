const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Where the signup came from, such as "blog:autonomy-is-a-tooling-problem". Anything else is dropped.
const SOURCE_RE = /^[a-z0-9:_\-/]{1,80}$/i;

const MAX_BODY_BYTES = 2048;
// New signups allowed per visitor per window. Only new entries count, so repeats and bad input cost nothing.
const LIMIT = 5;
const WINDOW_SECONDS = 3600;

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
  });

// Visitors are keyed by a hash of their IP so no raw address is stored. The record expires with its window.
async function visitorKey(request) {
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `rl:${hex.slice(0, 32)}`;
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true; // non-browser clients send none; the limits below still apply
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function onRequestPost({ request, env }) {
  if (!env?.WAITLIST) {
    console.error('waitlist: the WAITLIST KV binding is missing; add it under the Pages project settings');
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  // Cheap checks first: none of these touch KV.
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

  // Honeypot: the forms carry a hidden "website" field that people never fill in. Bots that do get a fake success.
  if (typeof data?.website === 'string' && data.website.trim()) return json({ ok: true });

  const email = String(data?.email || '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'invalid_email' }, 400);
  }

  // An email already on the list gets the same answer as a new one, so the endpoint cannot be used to check membership.
  const key = `email:${email}`;
  if (await env.WAITLIST.get(key)) return json({ ok: true });

  const visitor = await visitorKey(request);
  const now = Math.floor(Date.now() / 1000);
  const seen = await env.WAITLIST.get(visitor, 'json');
  const active = seen && seen.exp > now ? seen : null;
  if (active && active.n >= LIMIT) {
    console.warn('waitlist: rate limited a visitor');
    return json({ ok: false, error: 'rate_limited' }, 429, { 'retry-after': String(active.exp - now) });
  }

  const source = SOURCE_RE.test(String(data?.source ?? '')) ? String(data.source) : null;
  await env.WAITLIST.put(
    key,
    JSON.stringify({
      email,
      createdAt: new Date().toISOString(),
      country: request.cf?.country || null,
      source,
    }),
  );

  // KV is eventually consistent, so this limit is approximate under a burst of parallel requests. A Cloudflare
  // rate limiting rule on /api/waitlist is the hard edge limit; this is the second layer.
  const exp = active ? active.exp : now + WINDOW_SECONDS;
  await env.WAITLIST.put(visitor, JSON.stringify({ n: (active?.n ?? 0) + 1, exp }), { expiration: Math.max(exp, now + 60) });
  return json({ ok: true });
}

export const onRequest = () => json({ ok: false, error: 'method_not_allowed' }, 405);
