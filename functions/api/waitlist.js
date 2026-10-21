const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Where the signup came from, such as "blog:autonomy-is-a-tooling-problem". Anything else is dropped.
const SOURCE_RE = /^[a-z0-9:_\-/]{1,80}$/i;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export async function onRequestPost({ request, env }) {
  if (!env?.WAITLIST) {
    console.error('waitlist: the WAITLIST KV binding is missing; add it under the Pages project settings');
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  const email = String(data?.email || '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'invalid_email' }, 400);
  }

  const source = SOURCE_RE.test(String(data?.source ?? '')) ? String(data.source) : null;
  const key = `email:${email}`;
  if (!(await env.WAITLIST.get(key))) {
    await env.WAITLIST.put(
      key,
      JSON.stringify({
        email,
        createdAt: new Date().toISOString(),
        country: request.cf?.country || null,
        source,
      }),
    );
  }
  return json({ ok: true });
}

export const onRequest = () => json({ ok: false, error: 'method_not_allowed' }, 405);
