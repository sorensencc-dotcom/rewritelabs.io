// File: engine/discovery/googlePlacesDiscovery.js

import {
  extractDomain,
  looksLikeSmallBusinessDomain,
  appendDomainsToFeeds,
} from "./commonDiscovery.js";
import { logInfo, logWarn } from "../logger.js";

const PLACES_TEXTSEARCH =
  "https://maps.googleapis.com/maps/api/place/textsearch/json";
const PLACES_DETAILS =
  "https://maps.googleapis.com/maps/api/place/details/json";

async function textSearch({ query, key, maxResults }) {
  const url = `${PLACES_TEXTSEARCH}?query=${encodeURIComponent(
    query
  )}&key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`places textsearch failed: ${res.status}`);
  const data = await res.json();
  return (data.results || []).slice(0, maxResults);
}

async function getDetails({ placeId, key }) {
  const url = `${PLACES_DETAILS}?place_id=${encodeURIComponent(
    placeId
  )}&fields=website&key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.result && data.result.website ? data.result.website : null;
}

export async function discoverFromGooglePlaces({
  city,
  state,
  category,
  maxResults = 30,
}) {
  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) {
    logSkip(`Google Places skipped (no GOOGLE_PLACES_KEY)`);
    return { discovered: 0, added: 0 };
  }

  const query = `${category} in ${city}, ${state}`;
  logInfo(`google places textsearch: ${query}`);

  const results = await textSearch({ query, key, maxResults });

  const domains = new Set();

  for (const r of results) {
    if (!r.place_id) continue;
    try {
      const website = await getDetails({ placeId: r.place_id, key });
      if (!website) continue;
      const d = extractDomain(website);
      if (!d) continue;
      if (!looksLikeSmallBusinessDomain(d)) continue;
      domains.add(d);
    } catch {
      // ignore
    }
  }

  const result = await appendDomainsToFeeds(domains);
  logInfo(
    `google places discovery: discovered=${result.discovered} added=${result.added}`
  );
  return result;
}