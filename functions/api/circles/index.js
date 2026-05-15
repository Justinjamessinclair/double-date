function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function onRequestGet({ request, env }) {
  const userId = request.user.id;

  const { results } = await env.DB.prepare(
    `SELECT c.*, COUNT(cm2.user_id) AS member_count
     FROM circles c
     JOIN circle_members cm ON cm.circle_id = c.id AND cm.user_id = ?
     JOIN circle_members cm2 ON cm2.circle_id = c.id
     GROUP BY c.id
     ORDER BY c.created_at DESC`
  )
    .bind(userId)
    .all();

  return json({ circles: results });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { name, color } = body;
  if (!name || !name.trim()) {
    return json({ error: 'Circle name is required' }, 400);
  }

  const userId = request.user.id;
  const circleId = crypto.randomUUID();

  await env.DB.prepare(
    `INSERT INTO circles (id, name, color, created_by) VALUES (?, ?, ?, ?)`
  )
    .bind(circleId, name.trim(), color || '#c2714f', userId)
    .run();

  await env.DB.prepare(
    `INSERT INTO circle_members (circle_id, user_id) VALUES (?, ?)`
  )
    .bind(circleId, userId)
    .run();

  const circle = await env.DB.prepare(`SELECT * FROM circles WHERE id = ?`)
    .bind(circleId)
    .first();

  return json({ circle }, 201);
}
