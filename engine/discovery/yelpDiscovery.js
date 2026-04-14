// File: engine/discovery/yelpDiscovery.js

import {
  extractDomain,
  looksLikeSmallBusinessDomain,
  appendDomainsToFeeds,
} from "./commonDiscovery.js";
import { logInfo, logWarn } from "../logger.js";

function buildYelpSearchUrl({ city, state, category }) {
  const loc = encodeURIComponent(`${city}, ${state}`);
  const cat = encodeURIComponent(category);
  return `https://www.yelp.com/search?find_desc=${cat}&find_loc=${loc}`;
}

function extractBizPaths(html) {
  const paths = new Set();
  const regex = /href="(\/biz\/[^"?"]+)/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    paths.add(m[1]);
  }
  return Array.from(paths);
}

function extractWebsiteFromBizPage(html) {
  const urls = [];
  const regex = /href="(https?:\/\/[^"]+)"/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    urls.push(m[1]);
  }
  for (const u of urls) {
    const d = extractDomain(u);
    if (!d) continue;
    if (!looksLikeSmallBusinessDomain(d)) continue;
    return d;
  }
  return null;
}

export async function discoverFromYelp({
  city,
  state,
  category,
  maxBusinesses = 30,
}) {
  const searchUrl = buildYelpSearchUrl({ city, state, category });
  logInfo(`yelp search: ${searchUrl}`);

  const res = await fetch(searchUrl, {
    headers: {
      "User-Agent": "rewrite-labs-discovery/1.0",
    },
  });

  if (!res.ok) {
    logWarn(`yelp search failed: ${res.status}`);
    return { discovered: 0, added: 0 };
  }

  const html = await res.text();
  const bizPaths = extractBizPaths(html).slice(0, maxBusinesses);

  const domains = new Set();

  for (const p of bizPaths) {
    const url = `https://www.yelp.com${p}`;
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent": "rewrite-labs-discovery/1.0",
        },
      });
      if (!r.ok) continue;
      const h = await r.text();
      const d = extractWebsiteFromBizPage(h);
      if (d) domains.add(d);
    } catch {
      // ignore
    }
  }

  const result = await appendDomainsToFeeds(domains);
  logInfo(`yelp discovery: discovered=${result.discovered} added=${result.added}`);
  return result;
}