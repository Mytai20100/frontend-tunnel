export async function GET(request, { params }) {
  try {
    const { wallet } = params;

    const BASE_URL = process.env.BACKEND_API;

    if (!BASE_URL) {
      return Response.json(
        { error: 'BACKEND_API is not defined' },
        { status: 500 }
      );
    }

    console.log('Miner proxy called for wallet:', wallet);
    console.log('Fetching from:', BASE_URL);

    const response = await fetch(`${BASE_URL}/api/i/${wallet}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // recommended cho API proxy
    });

    if (!response.ok) {
      return Response.json(
        { error: 'Failed to fetch miner data' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return Response.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
