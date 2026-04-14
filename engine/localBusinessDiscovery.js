// File: engine/localBusinessDiscovery.js

import fs from "fs/promises";
import path from "path";

const FEEDS_DIR = path.join("data", "feeds");
const BING_ENDPOINT = "https://api.bing.microsoft.com/v7.0/search";

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readLines(filePath) {
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

function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function looksLikeSmallBusinessDomain(domain) {
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
  ];

  if (bigPatterns.some(p => domain.includes(p))) return false;

  const parts = domain.split(".");
  if (parts.length < 2) return false;

  const sld = parts[parts.length - 2];
  if (sld.length > 25) return false;

  return true;
}

async function searchBing(query, count = 50) {
  const key = process.env.BING_SEARCH_KEY;
  if (!key) {
    throw new Error("BING_SEARCH_KEY env var is required for localBusinessDiscovery");
  }

  const url = `${BING_ENDPOINT}?q=${encodeURIComponent(query)}&count=${count}`;
  const res = await fetch(url, {
    headers: {
      "Ocp-Apim-Subscription-Key": key,
    },
  });

  if (!res.ok) {
    throw new Error(`Bing search failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const items = (data.webPages && data.webPages.value) || [];
  return items.map(i => i.url).filter(Boolean);
}

export async function discoverLocalBusinesses({
  city,
  state,
  country = "USA",
  category = "small business",
  maxResults = 100,
}) {
  await ensureDir(FEEDS_DIR);

  const query = `${category} "${city}, ${state}" site:.com OR site:.net OR site:.biz`;
  const urls = await searchBing(query, maxResults);

  const domains = new Set();
  for (const u of urls) {
    const d = extractDomain(u);
    if (!d) continue;
    if (!looksLikeSmallBusinessDomain(d)) continue;
    domains.add(d);
  }

  const domainsFile = path.join(FEEDS_DIR, "domains.txt");
  const existing = new Set(await readLines(domainsFile));

  const toAppend = [];
  for (const d of domains) {
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