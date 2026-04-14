// File: engine/ingest.js
import fs from "fs/promises";
import path from "path";

const QUEUE_DIR = path.join("data", "queue");

export async function loadQueueItems() {
  const files = await fs.readdir(QUEUE_DIR);
  const items = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const fullPath = path.join(QUEUE_DIR, file);
    const raw = await fs.readFile(fullPath, "utf8");

    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.url && parsed.html) {
        items.push({
          id: file,
          path: fullPath,
          url: parsed.url,
          html: parsed.html
        });
      }
    } catch {
      // ignore malformed JSON
    }
  }

  return items;
}