// File: /scanner/parallelBatchScan.js
import { scanWordPressOutdated } from "./wpScanner.js";

export async function scanBatchParallel(domains, concurrency = 50) {
  const queue = [...domains];
  const results = [];
  const workers = [];

  async function worker() {
    while (queue.length > 0) {
      const domain = queue.shift();
      if (!domain) break;

      const url = domain.startsWith("http") ? domain : `http://${domain}`;
      try {
        const data = await scanWordPressOutdated(url);
        results.push(data);
      } catch {}
    }
  }

  const workerCount = Math.min(concurrency, queue.length || concurrency);
  for (let i = 0; i < workerCount; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
}