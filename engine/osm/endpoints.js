// File: engine/osm/endpoints.js
// Overpass endpoint rotation with region-aware scoring + health scoring

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter"
];

// Region preference weights
const REGION_WEIGHTS = {
  us:      { "overpass-api.de": 1, "kumi": 2, "fr": 3, "nchc": 4 },
  eu:      { "fr": 1, "overpass-api.de": 2, "kumi": 3, "nchc": 4 },
  asia:    { "nchc": 1, "kumi": 2, "overpass-api.de": 3, "fr": 4 },
  oceania: { "nchc": 1, "kumi": 2, "overpass-api.de": 3, "fr": 4 },
  latam:   { "overpass-api.de": 1, "fr": 2, "kumi": 3, "nchc": 4 },
  africa:  { "fr": 1, "overpass-api.de": 2, "kumi": 3, "nchc": 4 }
};

// Health state per endpoint
const health = ENDPOINTS.map(() => ({
  fails: 0,
  lastFail: 0
}));

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

// Extract a short host key for weighting
function hostKey(url) {
  if (url.includes("kumi")) return "kumi";
  if (url.includes("nchc")) return "nchc";
  if (url.includes("fr")) return "fr";
  return "overpass-api.de";
}

/**
 * pickEndpoint(region)
 * region = "us" | "eu" | "asia" | ...
 */
export function pickEndpoint(region = "us") {
  const now = Date.now();
  const weights = REGION_WEIGHTS[region] || REGION_WEIGHTS["us"];

  const candidates = ENDPOINTS.map((url, i) => {
    const h = health[i];
    const coolingDown = h.lastFail && now - h.lastFail < COOLDOWN_MS;

    const host = hostKey(url);
    const regionWeight = weights[host] || 5;

    // Final score = health penalty + region preference + cooldown penalty
    const score =
      h.fails * 10 +
      regionWeight +
      (coolingDown ? 50 : 0);

    return { url, index: i, score };
  });

  // Lowest score = best endpoint
  candidates.sort((a, b) => a.score - b.score);

  return candidates[0];
}

export function reportSuccess(index) {
  if (health[index]) {
    health[index].fails = Math.max(0, health[index].fails - 1);
  }
}

export function reportFailure(index) {
  if (health[index]) {
    health[index].fails += 1;
    health[index].lastFail = Date.now();
  }
}