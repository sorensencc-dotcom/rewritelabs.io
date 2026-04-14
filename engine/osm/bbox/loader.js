// File: engine/osm/bbox/loader.js
// Hybrid region detection + lazy region file loading (fs-based, no JSON imports)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// SINGLE regionCache — exported and used internally
export const regionCache = new Map();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function detectRegion(postal, regionOverride) {
  if (regionOverride) return regionOverride.toLowerCase();

  const p = String(postal).trim().toUpperCase();

  if (/^\d{5}$/.test(p)) return "us";
  if (/^[A-Z]\d[A-Z]/.test(p)) return "ca";
  if (/^[A-Z]{1,2}\d/.test(p)) return "uk";
  if (/^\d{3}-\d{4}$/.test(p)) return "asia";
  if (/^\d{4}$/.test(p)) return "oceania";
  if (/^\d{4,5}$/.test(p)) return "eu";

  return "eu";
}

async function loadRegion(region) {
  if (regionCache.has(region)) return regionCache.get(region);

  const filePath = path.join(__dirname, `${region}.json`);

  let data = {};
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to load bbox file for region "${region}":`, err.message);
  }

  regionCache.set(region, data);
  return data;
}

export async function getBBox(postal, regionOverride) {
  const region = detectRegion(postal, regionOverride);
  const table = await loadRegion(region);
  const key = String(postal).trim().toUpperCase();

  if (table[key]) return table[key];

  for (const k of Object.keys(table)) {
    if (key.startsWith(k)) return table[k];
  }

  return null;
}