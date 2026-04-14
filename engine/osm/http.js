// File: engine/osm/http.js
// Overpass-safe HTTP POST with retries, rotation, backoff, and UA header

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter"
];

let endpointIndex = 0;
function nextEndpoint() {
  endpointIndex = (endpointIndex + 1) % OVERPASS_ENDPOINTS.length;
  return OVERPASS_ENDPOINTS[endpointIndex];
}

/**
 * Low-level POST with timeout + UA header
 */
async function postRaw(query, endpoint) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      body: query,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "RewriteLabsSweeper/1.0 (contact: youremail@example.com)"
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    const text = await res.text();
    return {
      statusCode: res.status,
      body: text,
      bytes: text.length
    };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/**
 * High-level POST with:
 * - endpoint rotation
 * - retry logic
 * - exponential backoff
 * - Overpass-friendly behavior
 */
export async function postWithRetry(query, { zip, category }) {
  let attempts = 0;
  let endpoint = OVERPASS_ENDPOINTS[endpointIndex];

  while (attempts < 5) {
    try {
      const res = await postRaw(query, endpoint);

      // Success
      if (res.statusCode === 200) {
        return res;
      }

      // Overpass busy / rate-limited / blocked
      if ([403, 429, 504, 502, 503].includes(res.statusCode)) {
        endpoint = nextEndpoint();
        attempts++;
        await new Promise(r => setTimeout(r, attempts * 1000));
        continue;
      }

      // Other HTTP errors
      throw new Error(`HTTP_${res.statusCode}`);
    } catch (err) {
      // Network or timeout
      endpoint = nextEndpoint();
      attempts++;
      await new Promise(r => setTimeout(r, attempts * 1000));
    }
  }

  throw new Error("OVERPASS_UNAVAILABLE");
}