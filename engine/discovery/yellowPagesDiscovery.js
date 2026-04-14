// File: engine/discovery/yellowPagesDiscovery.js

import {
  extractDomain,
  looksLikeSmallBusinessDomain,
  appendDomainsToFeeds,
} from "./commonDiscovery.js";
import { logInfo, logWarn } from "../logger.js";

function buildYPUrl({ city, state, category }) {
  const loc = encodeURIComponent(`${city}, ${state}`);
  const cat = encodeURIComponent(category);
  return `https://www.yellowpages.com/search?search_terms=${cat}&geo_location_terms=${loc}`;
}

function extractBusinessWebsites(html) {
  const domains = new Set();
  const regex = /href="(https?:\/\/[^"]+)"/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const d = extractDomain(m[1]);
    if (!d) continue;
    if (!looksLikeSmallBusinessDomain(d)) continue;
    domains.add(d);
  }
  return domains;
}

export async function discoverFromYellowPages({
  city,
  state,
  category,
}) {
  const url = buildYPUrl({ city, state, category });
  logInfo(`yellowpages search: ${url}`);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "rewrite-labs-discovery/1.0",
    },
  });

  if (!res.ok) {
    logWarn(`yellowpages search failed: ${res.status}`);
    return { discovered: 0, added: 0 };
  }

  const html = await res.text();
  const domains = extractBusinessWebsites(html);

  const result = await appendDomainsToFeeds(domains);
  logInfo(`yellowpages discovery: discovered=${result.discovered} added=${result.added}`);
  return result;
}