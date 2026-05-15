function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

const PROMPT_POOL = [
  "What's a small moment from this week that you want to remember?",
  "What's something the other couple did recently that inspired you?",
  "Describe a place you'd love to visit together.",
  "What's a tradition you want to start?",
  "What's something you're each looking forward to this month?",
  "Share a song that's been on your mind.",
  "What's a challenge you're each navigating right now?",
  "What made you laugh this week?",
  "What's something you appreciate about your partner that you don't say enough?",
  "If you could freeze one moment from the last month, what would it be?",
  "What's a dream you've been sitting with lately?",
  "Describe your ideal weekend, no budget.",
  "What's something new you tried recently?",
  "What's a question you've been afraid to ask?",
  "What does home mean to you right now?",
];

function getWeekKey(date = new Date()) {
  // ISO week: YYYY-WNN
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getQuestionForWeekKey(weekKey) {
  // Parse week number from key like "2024-W03"
  const match = weekKey.match(/W(\d+)/);
  const weekNum = match ? parseInt(match[1], 10) : 1;
  return PROMPT_POOL[(weekNum - 1) % PROMPT_POOL.length];
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const circleId = url.searchParams.get('circle_id');
  const userId = request.user.id;

  if (!circleId) return json({ error: 'circle_id required' }, 400);

  // Verify membership
  const member = await env.DB.prepare(
    `SELECT 1 FROM circle_members WHERE circle_id = ? AND user_id = ?`
  )
    .bind(circleId, userId)
    .first();
  if (!member) return json({ error: 'Forbidden' }, 403);

  const weekKey = getWeekKey();
  let prompt = await env.DB.prepare(
    `SELECT * FROM prompts WHERE circle_id = ? AND week_key = ?`
  )
    .bind(circleId, weekKey)
    .first();

  if (!prompt) {
    const promptId = crypto.randomUUID();
    const question = getQuestionForWeekKey(weekKey);
    await env.DB.prepare(
      `INSERT INTO prompts (id, week_key, question, circle_id) VALUES (?, ?, ?, ?)`
    )
      .bind(promptId, weekKey, question, circleId)
      .run();
    prompt = await env.DB.prepare(`SELECT * FROM prompts WHERE id = ?`)
      .bind(promptId)
      .first();
  }

  const { results: responses } = await env.DB.prepare(
    `SELECT pr.*, u.name AS author_name, u.color AS author_color
     FROM prompt_responses pr
     LEFT JOIN users u ON u.id = pr.author_id
     WHERE pr.prompt_id = ?
     ORDER BY pr.created_at ASC`
  )
    .bind(prompt.id)
    .all();

  return json({ prompt, responses });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { prompt_id, type, content, media_key } = body;
  if (!prompt_id) return json({ error: 'prompt_id required' }, 400);
  if (!type) return json({ error: 'type required' }, 400);

  const userId = request.user.id;

  // Verify prompt exists and user is a member of its circle
  const prompt = await env.DB.prepare(`SELECT * FROM prompts WHERE id = ?`)
    .bind(prompt_id)
    .first();
  if (!prompt) return json({ error: 'Prompt not found' }, 404);

  const member = await env.DB.prepare(
    `SELECT 1 FROM circle_members WHERE circle_id = ? AND user_id = ?`
  )
    .bind(prompt.circle_id, userId)
    .first();
  if (!member) return json({ error: 'Forbidden' }, 403);

  const responseId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO prompt_responses (id, prompt_id, author_id, type, content, media_key)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(responseId, prompt_id, userId, type, content ?? null, media_key ?? null)
    .run();

  const response = await env.DB.prepare(`SELECT * FROM prompt_responses WHERE id = ?`)
    .bind(responseId)
    .first();

  return json({ response }, 201);
}
