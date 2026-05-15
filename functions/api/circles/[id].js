function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function getCircleForUser(env, circleId, userId) {
  // Verify user is a member
  const member = await env.DB.prepare(
    `SELECT 1 FROM circle_members WHERE circle_id = ? AND user_id = ?`
  )
    .bind(circleId, userId)
    .first();
  return member ? true : false;
}

export async function onRequestGet({ request, env, params }) {
  const circleId = params.id;
  const userId = request.user.id;

  const isMember = await getCircleForUser(env, circleId, userId);
  if (!isMember) return json({ error: 'Not found' }, 404);

  const circle = await env.DB.prepare(`SELECT * FROM circles WHERE id = ?`)
    .bind(circleId)
    .first();
  if (!circle) return json({ error: 'Not found' }, 404);

  const { results: members } = await env.DB.prepare(
    `SELECT u.id, u.name, u.color, u.email, cm.joined_at
     FROM circle_members cm
     JOIN users u ON u.id = cm.user_id
     WHERE cm.circle_id = ?
     ORDER BY cm.joined_at ASC`
  )
    .bind(circleId)
    .all();

  return json({ circle, members });
}

export async function onRequestPatch({ request, env, params }) {
  const circleId = params.id;
  const userId = request.user.id;

  const circle = await env.DB.prepare(`SELECT * FROM circles WHERE id = ?`)
    .bind(circleId)
    .first();
  if (!circle) return json({ error: 'Not found' }, 404);
  if (circle.created_by !== userId) return json({ error: 'Forbidden' }, 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { name, color } = body;

  await env.DB.prepare(
    `UPDATE circles
     SET name = COALESCE(?, name),
         color = COALESCE(?, color)
     WHERE id = ?`
  )
    .bind(name ?? null, color ?? null, circleId)
    .run();

  const updated = await env.DB.prepare(`SELECT * FROM circles WHERE id = ?`)
    .bind(circleId)
    .first();

  return json({ circle: updated });
}
