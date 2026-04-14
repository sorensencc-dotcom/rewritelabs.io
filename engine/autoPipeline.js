// File: engine/autoPipeline.js

import fs from "fs/promises";
import path from "path";
import { enqueueFromDomains } from "./queueIngestion.js";
import { processQueueParallel } from "./parallel.js";
import { enrichResult } from "./enrich.js";
import { scoreSite } from "./score.js";
import { logInfo } from "./logger.js";

const RESULTS_DIR = path.join("data", "results");

async function readJsonFiles(dir) {
  try {
    const files = await fs.readdir(dir);
    const out = [];
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      const full = path.join(dir, f);
      const raw = await fs.readFile(full, "utf8");
      try {
        out.push(JSON.parse(raw));
      } catch {}
    }
    return out;
  } catch {
    return [];
  }
}

export async function runFullPipeline({
  enqueueLimit = 50,
  concurrency = 20,
} = {}) {
  logInfo(`pipeline start`);

  await enqueueFromDomains(enqueueLimit);
  await processQueueParallel(concurrency);

  const classifiedResults = await readJsonFiles(RESULTS_DIR);
  logInfo(`results loaded: ${classifiedResults.length}`);

  const scored = classifiedResults.map(r => {
    const enriched = enrichResult(r);
    const score = scoreSite(r, enriched);
    logInfo(`score: ${r.url} → ${score.score}`);
    return { ...r, enriched, score };
  });

  const summaryPath = path.join(RESULTS_DIR, "summary.json");
  await fs.writeFile(summaryPath, JSON.stringify(scored, null, 2), "utf8");

  logInfo(`pipeline complete`);
  return scored.length;
}