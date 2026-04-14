// File: engine/discovery/commonDiscovery.js

import fs from "fs/promises";
import path from "path";

export const FEEDS_DIR = path.join("data", "feeds");

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function readLines(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return raw
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function looksLikeSmallBusinessDomain(domain) {
  if (!domain) return false;

  const bigPatterns = [
    "google.",
    "facebook.",
    "amazon.",
    "microsoft.",
    "apple.",
    "yahoo.",
    "bing.",
    "wikipedia.org",
    "linkedin.",
    "twitter.",
    "instagram.",
    "youtube.",
    "yelp.",
    "tripadvisor.",
    "booking.",
    "airbnb.",
    "shopify.",
    "yellowpages.",
    "maps.google.",
  ];

  if (bigPatterns.some(p => domain.includes(p))) return false;

  const parts = domain.split(".");
  if (parts.length < 2) return false;

  const sld = parts[parts.length - 2];
  if (sld.length > 30) return false;

  return true;
}

export async function appendDomainsToFeeds(domains) {
  await ensureDir(FEEDS_DIR);

  const domainsFile = path.join(FEEDS_DIR, "domains.txt");
  const existing = new Set(await readLines(domainsFile));

  const toAppend = [];
  for (const d of domains) {
    if (!d) continue;
    if (existing.has(d)) continue;
    existing.add(d);
    toAppend.push(d);
  }

  if (toAppend.length > 0) {
    await fs.appendFile(domainsFile, toAppend.join("\n") + "\n", "utf8");
  }

  return {
    discovered: domains.size,
    added: toAppend.length,
  };
}