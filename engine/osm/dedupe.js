// File: engine/osm/dedupe.js
// Multi-signal business deduplication

import crypto from "crypto";

function normalizePhone(phone) {
  if (!phone) return "";
  return phone.replace(/[^\d+]/g, "");
}

function normalizeWebsite(url) {
  if (!url) return "";
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function hash(str) {
  return crypto.createHash("sha1").update(str).digest("hex");
}

function makeKey(item) {
  const phone = normalizePhone(item.phone);
  const website = normalizeWebsite(item.website);
  const name = (item.name || "").trim().toLowerCase();
  const line1 = (item.address?.line1 || "").trim().toLowerCase();
  const postcode = (item.address?.postcode || "").trim().toLowerCase();
  const lat = item.location?.lat;
  const lon = item.location?.lon;

  if (phone) return `phone:${phone}`;
  if (website) return `web:${website}`;
  if (name && line1 && postcode) return `addr:${hash(`${name}|${line1}|${postcode}`)}`;
  if (name && lat != null && lon != null) return `geo:${hash(`${name}|${lat}|${lon}`)}`;

  return `fallback:${hash(JSON.stringify(item))}`;
}

function providerRank(source) {
  switch ((source || "").toUpperCase()) {
    case "GOOGLE":
    case "GOOGLE_PLACES":
      return 1;
    case "YELP":
      return 2;
    case "YELLOWPAGES":
    case "YP":
      return 3;
    case "OSM":
      return 4;
    default:
      return 5;
  }
}

function mergeBusiness(a, b) {
  const best = providerRank(a.source) <= providerRank(b.source) ? a : b;
  const other = best === a ? b : a;

  return {
    source: best.source,
    sources: Array.from(new Set([...(a.sources || [a.source]), ...(b.sources || [b.source])])),
    name: best.name || other.name,
    phone: best.phone || other.phone,
    website: best.website || other.website,
    address: {
      line1: best.address?.line1 || other.address?.line1 || "",
      city: best.address?.city || other.address?.city || "",
      state: best.address?.state || other.address?.state || "",
      postcode: best.address?.postcode || other.address?.postcode || ""
    },
    location: {
      lat: best.location?.lat ?? other.location?.lat ?? null,
      lon: best.location?.lon ?? other.location?.lon ?? null
    },
    categories: best.categories || other.categories || [],
    raw: {
      osm: best.source === "OSM" ? best.raw || a.raw || b.raw : (a.raw || b.raw),
      other: other.raw || null
    }
  };
}

export function dedupeBusinesses(items) {
  const map = new Map();

  for (const item of items) {
    const key = makeKey(item);
    if (!map.has(key)) {
      map.set(key, item);
    } else {
      map.set(key, mergeBusiness(map.get(key), item));
    }
  }

  return [...map.values()];
}