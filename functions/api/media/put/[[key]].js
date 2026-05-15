function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function onRequestPut({ request, env, params }) {
  // params.key is an array for catch-all routes; rejoin to get full path
  const key = Array.isArray(params.key) ? params.key.join('/') : params.key;

  if (!key) return json({ error: 'Key required' }, 400);

  // Enforce that the key belongs to the authenticated user
  const userId = request.user.id;
  if (!key.startsWith(`media/${userId}/`)) {
    return json({ error: 'Forbidden' }, 403);
  }

  const contentType = request.headers.get('Content-Type') || 'application/octet-stream';

  await env.MEDIA.put(key, request.body, {
    httpMetadata: { contentType },
  });

  return json({ ok: true, key });
}
