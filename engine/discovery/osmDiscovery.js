// File: engine/discovery/osmDiscovery.js

import {
  extractDomain,
  looksLikeSmallBusinessDomain,
  appendDomainsToFeeds,
} from "./commonDiscovery.js";
import { logInfo, logWarn } from "../logger.js";

async function geocodeCity({ city, state, country }) {
  const q = encodeURIComponent(`${city}, ${state}, ${country}`);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "rewrite-labs-discovery/1.0",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return data[0].boundingbox; // [south, north, west, east]
}

async function queryOverpass({ bbox, category }) {
  const [south, north, west, east] = bbox;
  const q = `
    [out:json][timeout:25];
    (
      node["website"]["shop"](${south},${west},${north},${east});
      node["website"]["amenity"](${south},${west},${north},${east});
    );
    out body;
  `;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "rewrite-labs-discovery/1.0",
    },
    body: `data=${encodeURIComponent(q)}`,
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.elements || []).map(e => e.tags && e.tags.website).filter(Boolean);
}

export async function discoverFromOSM({
  city,
  state,
  country = "USA",
}) {
  logInfo(`osm discovery: geocoding ${city}, ${state}, ${country}`);
  const bbox = await geocodeCity({ city, state, country });
  if (!bbox) {
    logWarn("osm discovery: geocoding failed");
    return { discovered: 0, added: 0 };
  }

  const websites = await queryOverpass({ bbox });
  const domains = new Set();

  for (const w of websites) {
    const d = extractDomain(w);
    if (!d) continue;
    if (!looksLikeSmallBusinessDomain(d)) continue;
    domains.add(d);
  }

  const result = await appendDomainsToFeeds(domains);
  logInfo(`osm discovery: discovered=${result.discovered} added=${result.added}`);
  return result;
}