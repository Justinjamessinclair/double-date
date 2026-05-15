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

export async function onRequestPost({ request, env, params }) {
  const circleId = params.id;
  const userId = request.user.id;

  // Verify user is a member
  const member = await env.DB.prepare(
    `SELECT 1 FROM circle_members WHERE circle_id = ? AND user_id = ?`
  )
    .bind(circleId, userId)
    .first();
  if (!member) return json({ error: 'Not found' }, 404);

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(
    `INSERT INTO circle_invites (token, circle_id, created_by, expires_at) VALUES (?, ?, ?, ?)`
  )
    .bind(token, circleId, userId, expiresAt)
    .run();

  return json({ invite_url: `https://double-date.pages.dev/join/${token}` }, 201);
}
