/**
 * Health check service
 * Calls backend GET /health and measures roundtrip response time
 */
export async function fetchHealthCheck(backendUrl) {
  const cleanUrl = backendUrl.trim().replace(/\/$/, '');
  const targetUrl = `${cleanUrl}/health`;

  const startTime = performance.now();
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const elapsed = Math.round(performance.now() - startTime);
    const data = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      elapsed,
      data,
    };
  } catch (error) {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      ok: false,
      status: 0,
      statusText: 'Network Error / Server Offline',
      elapsed,
      error: error.message,
      data: {
        status: 'error',
        message: 'Could not connect to backend server. Make sure it is running.',
        error: error.message,
        targetUrl,
      },
    };
  }
}
