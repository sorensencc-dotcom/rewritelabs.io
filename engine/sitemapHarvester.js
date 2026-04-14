// File: engine/sitemapHarvester.js

import fs from "fs/promises";
import path from "path";

const FEEDS_DIR = path.join("data", "feeds");

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function extractLocs(xml) {
  const locs = [];
  const regex = /<loc>([^<]+)<\/loc>/gi;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const url = match[1].trim();
    if (url) locs.push(url);
  }
  return locs;
}

export async function ingestSitemapXml(xml) {
  await ensureDir(FEEDS_DIR);
  const urls = extractLocs(xml);
  if (urls.length === 0) return 0;

  const filePath = path.join(FEEDS_DIR, "domains.txt");
  const existingRaw = await fs
    .readFile(filePath, "utf8")
    .catch(() => "");
  const existing = new Set(
    existingRaw
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
  );

  const toAppend = [];
  for (const u of urls) {
    if (existing.has(u)) continue;
    existing.add(u);
    toAppend.push(u);
  }

  if (toAppend.length > 0) {
    await fs.appendFile(filePath, toAppend.join("\n") + "\n", "utf8");
  }

  return toAppend.length;
}