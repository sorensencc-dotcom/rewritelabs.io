// File: engine/parallel.js

import { loadQueueItems } from "./ingest.js";
import { fingerprintHtml } from "./fingerprint.js";
import { classifyFingerprint } from "./classify.js";
import { updateFeeds } from "./updateFeeds.js";
import fs from "fs/promises";
import { logInfo, logWarn, logError } from "./logger.js";

export async function processQueueParallel(concurrency = 20) {
  const items = await loadQueueItems();
  const queue = [...items];

  logInfo(`processing queue: ${queue.length} items`);

  const workers = [];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;

      try {
        logInfo(`fp: ${item.url}`);
        const fp = fingerprintHtml({ url: item.url, html: item.html });

        logInfo(`classify: ${item.url}`);
        const classified = classifyFingerprint(fp);

        await updateFeeds(classified);
        await fs.unlink(item.path);

        logInfo(`done: ${item.url}`);
      } catch (err) {
        logError(`error processing ${item.url}: ${err}`);
      }
    }
  }

  const workerCount = Math.min(concurrency, queue.length || concurrency);
  for (let i = 0; i < workerCount; i++) workers.push(worker());

  await Promise.all(workers);

  logInfo(`queue processing complete`);
}