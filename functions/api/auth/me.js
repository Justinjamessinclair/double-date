function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function onRequestGet({ request }) {
  const { id, email, name, partner_name, couple_name, color } = request.user;
  return json({ user: { id, email, name, partner_name, couple_name, color } });
}
