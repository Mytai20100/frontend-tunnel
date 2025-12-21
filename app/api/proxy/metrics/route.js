export async function GET(request) {
  console.log('Metrics proxy called');

  try {
    const BASE_URL = process.env.BACKEND_API;

    if (!BASE_URL) {
      return Response.json(
        { error: 'BACKEND_API is not defined' },
        { status: 500 }
      );
    }

    console.log('Fetching from:', BASE_URL);

    const response = await fetch(`${BASE_URL}/api/metrics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      return Response.json(
        { error: 'Failed to fetch metrics' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Data received successfully');

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
