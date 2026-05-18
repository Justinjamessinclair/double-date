function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function generateToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Valid email required' }, 400);
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await env.DB.prepare(
    `INSERT INTO magic_tokens (token, email, expires_at) VALUES (?, ?, ?)`
  )
    .bind(token, email, expiresAt)
    .run();

  const origin = new URL(request.url).origin;
  const magicLink = `${origin}/api/auth/verify?token=${token}`;

  if (!env.RESEND_API_KEY) {
    console.error('[auth/request] RESEND_API_KEY is not set');
    return json({ ok: true });
  }

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // TODO: swap to noreply@doubledate.app once that domain is verified in Resend
        from: 'Double Date <onboarding@resend.dev>',
        to: email,
        subject: 'Your Double Date sign-in link',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h2 style="color:#c2714f;">Double Date</h2>
            <p>Click the button below to sign in. This link expires in 15 minutes.</p>
            <a href="${magicLink}"
               style="display:inline-block;background:#c2714f;color:#fff;text-decoration:none;
                      padding:12px 24px;border-radius:8px;font-weight:600;margin:16px 0;">
              Sign in to Double Date
            </a>
            <p style="color:#888;font-size:13px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error(`[auth/request] Resend ${resp.status} for ${email}: ${detail}`);
    } else {
      console.log(`[auth/request] Resend accepted email for ${email}`);
    }
  } catch (err) {
    console.error(`[auth/request] Resend fetch failed for ${email}: ${err?.message || err}`);
  }

  return json({ ok: true });
}
