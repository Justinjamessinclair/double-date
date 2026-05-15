const PUBLIC_PATHS = ['/api/auth/request', '/api/auth/verify'];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Cookie',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  // Only guard /api/ routes
  if (!path.startsWith('/api/')) {
    return next();
  }

  // Allow public auth routes through
  if (PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '?'))) {
    return next();
  }

  // Extract session cookie
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)dd_session=([^;]+)/);
  const sessionId = match ? match[1] : null;

  if (!sessionId) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const now = new Date().toISOString();
  const row = await env.DB.prepare(
    `SELECT s.id, s.user_id, s.expires_at, u.email, u.name, u.partner_name, u.couple_name, u.color
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > ?`
  )
    .bind(sessionId, now)
    .first();

  if (!row) {
    return json({ error: 'Unauthorized' }, 401);
  }

  // Attach user to request context via a custom property workaround
  request.user = {
    id: row.user_id,
    email: row.email,
    name: row.name,
    partner_name: row.partner_name,
    couple_name: row.couple_name,
    color: row.color,
  };

  return next();
}
