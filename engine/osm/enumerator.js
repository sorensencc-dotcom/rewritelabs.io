// File: engine/osm/enumerator.js
// Overpass‑safe enumerator with endpoint rotation, UA header, retries, fallback, mock mode

import { buildOverpassQuery } from "./query.js";
import { transformResponse } from "./transform.js";
import cache from "./cache.js";
import { now, diffMs } from "./metrics.js";
import { inferCategories } from "./categoryAI.js";

const VALIDATE_MODE = process.env.VALIDATE_MODE === "1";
const MOCK_MODE = process.env.OSM_MOCK === "1";

// -----------------------------
// Overpass endpoint rotation
// -----------------------------
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

// -----------------------------
// Rate limiting (token bucket)
// -----------------------------
const RATE_LIMIT_QPS = parseFloat(process.env.OSM_QPS || "0.5");
const RATE_LIMIT_INTERVAL_MS = 1000 / RATE_LIMIT_QPS;
let lastRequestAt = 0;

async function rateLimitSleep() {
  const nowMs = Date.now();
  const elapsed = nowMs - lastRequestAt;
  if (elapsed >= RATE_LIMIT_INTERVAL_MS) {
    lastRequestAt = nowMs;
    return;
  }
  const waitMs = RATE_LIMIT_INTERVAL_MS - elapsed;
  await new Promise(r => setTimeout(r, waitMs));
  lastRequestAt = Date.now();
}

// -----------------------------
// Safe-mode fallback query
// (tiny bbox in Tampa that always works)
// -----------------------------
const SAFE_MODE_QUERY = `
[out:json][timeout:25];
node["amenity"="cafe"](27.95,-82.47,27.96,-82.46);
out;
`;

// -----------------------------
// Mock mode (for UI testing)
// -----------------------------
function mockItems(zip, category) {
  return [
    {
      id: "mock1",
      name: "Mock Business A",
      lat: 27.95,
      lon: -82.46,
      category,
      rawTags: { amenity: "cafe" }
    },
    {
      id: "mock2",
      name: "Mock Business B",
      lat: 27.951,
      lon: -82.461,
      category,
      rawTags: { shop: "bakery" }
    }
  ];
}

// -----------------------------
// HTTP POST with retries + UA header
// -----------------------------
async function postOverpass(query, endpoint) {
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
    return { status: res.status, body: text };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

async function postWithRetry(query, zip, category) {
  let attempts = 0;
  let endpoint = OVERPASS_ENDPOINTS[endpointIndex];

  while (attempts < 5) {
    try {
      const res = await postOverpass(query, endpoint);

      if (res.status === 200) return res;

      if (res.status === 429 || res.status === 403 || res.status === 504) {
        endpoint = nextEndpoint();
        attempts++;
        await new Promise(r => setTimeout(r, attempts * 1000));
        continue;
      }

      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      endpoint = nextEndpoint();
      attempts++;
      await new Promise(r => setTimeout(r, attempts * 1000));
    }
  }

  throw new Error("OVERPASS_UNAVAILABLE");
}

// -----------------------------
// Main enumerator
// -----------------------------
export async function enumerateOSM(zip, category, logger = console, regionOverride = null) {
  const startTotal = now();

  // Cache hit
  const cached = cache.get(zip, category);
  if (cached) {
    return {
      module: "OSM",
      zip,
      category,
      ms: diffMs(startTotal),
      httpMs: 0,
      parseMs: 0,
      transformMs: 0,
      fromCache: true,
      count: cached.length,
      items: cached
    };
  }

  // Mock mode
  if (MOCK_MODE) {
    const items = mockItems(zip, category);
    cache.set(zip, category, items);
    return {
      module: "OSM",
      zip,
      category,
      ms: diffMs(startTotal),
      httpMs: 0,
      parseMs: 0,
      transformMs: 0,
      fromCache: false,
      count: items.length,
      items
    };
  }

  // Build query
  let query = await buildOverpassQuery(zip, category, regionOverride);
  if (!query) {
    query = SAFE_MODE_QUERY;
  }

  await rateLimitSleep();

  // HTTP request
  const startHttp = now();
  let res;
  try {
    res = await postWithRetry(query, zip, category);
  } catch (err) {
    logger.error("OSM HTTP error", { zip, category, err: err.message });
    return {
      module: "OSM",
      zip,
      category,
      ms: diffMs(startTotal),
      httpMs: diffMs(startHttp),
      parseMs: 0,
      transformMs: 0,
      fromCache: false,
      count: 0,
      items: [],
      error: err.message
    };
  }
  const httpMs = diffMs(startHttp);

  // Parse JSON
  const startParse = now();
  let parsed;
  try {
    parsed = JSON.parse(res.body);
  } catch (err) {
    logger.error("OSM parse error", { zip, category, err: err.message });
    return {
      module: "OSM",
      zip,
      category,
      ms: diffMs(startTotal),
      httpMs,
      parseMs: diffMs(startParse),
      transformMs: 0,
      fromCache: false,
      count: 0,
      items: [],
      error: "PARSE_ERROR"
    };
  }
  const parseMs = diffMs(startParse);

  // Transform
  const startTransform = now();
  let items = transformResponse(parsed, zip, category);

  items = items.map(item => {
    const catInfo = inferCategories({
      name: item.name,
      tags: item.rawTags,
      inputCategory: item.category || category
    });

    return {
      ...item,
      category: catInfo.primary ? catInfo.primary.category : item.category || category || null,
      categories: catInfo.all
    };
  });

  const transformMs = diffMs(startTransform);

  cache.set(zip, category, items);

  const totalMs = diffMs(startTotal);

  logger.info("OSM enumerate", {
    zip,
    category,
    httpMs,
    parseMs,
    transformMs,
    totalMs,
    statusCode: res.status,
    count: items.length
  });

  return {
    module: "OSM",
    zip,
    category,
    ms: totalMs,
    httpMs,
    parseMs,
    transformMs,
    fromCache: false,
    count: items.length,
    items
  };
}