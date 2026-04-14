// File: /scanner/batchScan.js

import { scanSite } from "./scanSite.js";

export async function scanBatch(domains) {
  const results = [];

  for (const domain of domains) {
    const url = domain.startsWith("http") ? domain : `http://${domain}`;
    const data = await scanSite(url);

    if (data.score >= 30) {
      results.push(data);
    }
  }

  return results;
}
