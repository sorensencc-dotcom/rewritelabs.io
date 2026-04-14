// File: engine/queueIngestion.js

import fs from "fs/promises";
import path from "path";
import { fetchHtmlForUrl } from "./fetchHtml.js";
import { logInfo, logWarn } from "./logger.js";

const FEEDS_DIR = path.join("data", "feeds");
const QUEUE_DIR = path.join("data", "queue");

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readLines(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export async function enqueueFromDomains(limit = 100) {
  await ensureDir(QUEUE_DIR);

  const domainsFile = path.join(FEEDS_DIR, "domains.txt");
  const domains = await readLines(domainsFile);

  logInfo(`queue ingestion: ${domains.length} domains loaded`);

  let count = 0;
  for (const domain of domains) {
    if (count >= limit) break;

    const url = domain.startsWith("http") ? domain : `http://${domain}`;
    const { ok, html } = await fetchHtmlForUrl(url);
    if (!ok || !html) {
      logWarn(`skipping ${url} (no html)`);
      continue;
    }

    const id =
      Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
    const fileName = `${id}.json`;
    const fullPath = path.join(QUEUE_DIR, fileName);

    const payload = { url, html, fetchedAt: new Date().toISOString() };
    await fs.writeFile(fullPath, JSON.stringify(payload, null, 2), "utf8");

    logInfo(`queued ${url} → ${fileName}`);
    count++;
  }

  logInfo(`queue ingestion complete (${count} items added)`);
  return count;
}