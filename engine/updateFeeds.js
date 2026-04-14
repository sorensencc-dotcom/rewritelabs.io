// File: engine/updateFeeds.js
import fs from "fs/promises";
import path from "path";

const FEEDS_DIR = path.join("data", "feeds");
const RESULTS_DIR = path.join("data", "results");

async function appendLine(file, line) {
  await fs.appendFile(path.join(FEEDS_DIR, file), line + "\n", "utf8");
}

export async function updateFeeds(result) {
  const { url, isWordPress, isOutdated } = result;

  await appendLine("domains.txt", url);

  if (isWordPress) {
    await appendLine("wordpress.txt", url);
  }

  if (isOutdated) {
    await appendLine("outdated.txt", url);
  }

  const fpLine = JSON.stringify(result);
  await appendLine("fingerprints.jsonl", fpLine);

  const safeName = url.replace(/[^a-z0-9.-]+/gi, "_");
  const outPath = path.join(RESULTS_DIR, `${safeName}.json`);
  await fs.writeFile(outPath, JSON.stringify(result, null, 2), "utf8");
}