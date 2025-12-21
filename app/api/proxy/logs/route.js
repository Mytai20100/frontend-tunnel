export async function GET(request) {
  const upgrade = request.headers.get('upgrade');
  const BASE_URL = process.env.BACKEND_API;

  if (!BASE_URL) {
    return Response.json(
      { error: 'BACKEND_API is not defined' },
      { status: 500 }
    );
  }

  if (upgrade?.toLowerCase() === 'websocket') {
    return Response.json(
      {
        error: 'WebSocket proxy not supported in Next.js API routes',
        message: 'Connect directly to miner WebSocket',
        directUrl: BASE_URL.replace('http', 'ws') + '/api/logs/stream',
      },
      { status: 400 }
    );
  }

  return Response.json(
    { error: 'WebSocket connection required' },
    { status: 400 }
  );
}
