function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

const VALID_TYPES = new Set(['text', 'voice', 'place', 'photo', 'prompt']);

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const circleId = url.searchParams.get('circle_id');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
  const before = url.searchParams.get('before');
  const userId = request.user.id;

  if (!circleId) return json({ error: 'circle_id required' }, 400);

  // Verify membership
  const member = await env.DB.prepare(
    `SELECT 1 FROM circle_members WHERE circle_id = ? AND user_id = ?`
  )
    .bind(circleId, userId)
    .first();
  if (!member) return json({ error: 'Forbidden' }, 403);

  let query, bindings;
  if (before) {
    query = `SELECT m.*, u.name AS author_name, u.color AS author_color
             FROM moments m
             LEFT JOIN users u ON u.id = m.author_id
             WHERE m.circle_id = ? AND m.created_at < ?
             ORDER BY m.created_at DESC
             LIMIT ?`;
    bindings = [circleId, before, limit];
  } else {
    query = `SELECT m.*, u.name AS author_name, u.color AS author_color
             FROM moments m
             LEFT JOIN users u ON u.id = m.author_id
             WHERE m.circle_id = ?
             ORDER BY m.created_at DESC
             LIMIT ?`;
    bindings = [circleId, limit];
  }

  const stmt = env.DB.prepare(query);
  const { results } = await stmt.bind(...bindings).all();

  return json({ moments: results });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { type, content, circle_id, coords, media_key } = body;

  if (!type || !VALID_TYPES.has(type)) {
    return json({ error: `type must be one of: ${[...VALID_TYPES].join(', ')}` }, 400);
  }
  if (!circle_id) return json({ error: 'circle_id required' }, 400);

  const userId = request.user.id;

  // Verify membership
  const member = await env.DB.prepare(
    `SELECT 1 FROM circle_members WHERE circle_id = ? AND user_id = ?`
  )
    .bind(circle_id, userId)
    .first();
  if (!member) return json({ error: 'Forbidden' }, 403);

  const momentId = crypto.randomUUID();

  await env.DB.prepare(
    `INSERT INTO moments (id, type, content, circle_id, author_id, coords, media_key)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(momentId, type, content ?? null, circle_id, userId, coords ?? null, media_key ?? null)
    .run();

  const moment = await env.DB.prepare(`SELECT * FROM moments WHERE id = ?`)
    .bind(momentId)
    .first();

  return json({ moment }, 201);
}
