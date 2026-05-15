export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  const now = new Date().toISOString();
  const row = await env.DB.prepare(
    `SELECT * FROM magic_tokens WHERE token = ? AND used = 0 AND expires_at > ?`
  )
    .bind(token, now)
    .first();

  if (!row) {
    return new Response('Invalid or expired token', { status: 400 });
  }

  // Mark token as used
  await env.DB.prepare(`UPDATE magic_tokens SET used = 1 WHERE token = ?`)
    .bind(token)
    .run();

  const email = row.email;

  // Upsert user
  let user = await env.DB.prepare(`SELECT * FROM users WHERE email = ?`)
    .bind(email)
    .first();

  if (!user) {
    const userId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO users (id, email) VALUES (?, ?)`
    )
      .bind(userId, email)
      .run();
    user = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`)
      .bind(userId)
      .first();
  }

  // Create session (30-day expiry)
  const sessionId = crypto.randomUUID();
  const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`
  )
    .bind(sessionId, user.id, sessionExpiry)
    .run();

  const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
  const cookie = `dd_session=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': cookie,
    },
  });
}
