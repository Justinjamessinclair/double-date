function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function onRequestPatch({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { name, partner_name, couple_name, color } = body;
  const userId = request.user.id;

  await env.DB.prepare(
    `UPDATE users
     SET name = COALESCE(?, name),
         partner_name = COALESCE(?, partner_name),
         couple_name = COALESCE(?, couple_name),
         color = COALESCE(?, color)
     WHERE id = ?`
  )
    .bind(
      name ?? null,
      partner_name ?? null,
      couple_name ?? null,
      color ?? null,
      userId
    )
    .run();

  const user = await env.DB.prepare(
    `SELECT id, email, name, partner_name, couple_name, color FROM users WHERE id = ?`
  )
    .bind(userId)
    .first();

  return json({ user });
}
