function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function extFromContentType(contentType) {
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
  };
  return map[contentType] || 'bin';
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { filename, content_type } = body;
  if (!content_type) return json({ error: 'content_type required' }, 400);

  const userId = request.user.id;
  const ext = extFromContentType(content_type) || (filename ? filename.split('.').pop() : 'bin');
  const key = `media/${userId}/${crypto.randomUUID()}.${ext}`;

  // Return a relative upload URL — the companion PUT handler streams directly to R2
  return json({ upload_url: `/api/media/put/${key}`, key }, 200);
}
