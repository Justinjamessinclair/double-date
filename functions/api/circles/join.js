function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { token } = body;
  if (!token) return json({ error: 'Token required' }, 400);

  const now = new Date().toISOString();
  const invite = await env.DB.prepare(
    `SELECT * FROM circle_invites WHERE token = ? AND used = 0 AND expires_at > ?`
  )
    .bind(token, now)
    .first();

  if (!invite) return json({ error: 'Invalid or expired invite' }, 400);

  const userId = request.user.id;
  const circleId = invite.circle_id;

  // Check if already a member — if so, return circle without error
  const existing = await env.DB.prepare(
    `SELECT 1 FROM circle_members WHERE circle_id = ? AND user_id = ?`
  )
    .bind(circleId, userId)
    .first();

  if (!existing) {
    await env.DB.prepare(
      `INSERT INTO circle_members (circle_id, user_id) VALUES (?, ?)`
    )
      .bind(circleId, userId)
      .run();

    // Mark invite used
    await env.DB.prepare(`UPDATE circle_invites SET used = 1 WHERE token = ?`)
      .bind(token)
      .run();
  }

  const circle = await env.DB.prepare(`SELECT * FROM circles WHERE id = ?`)
    .bind(circleId)
    .first();

  return json({ circle });
}
