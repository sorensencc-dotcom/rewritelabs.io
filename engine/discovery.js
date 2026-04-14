// File: engine/discovery.js

import fs from "fs/promises";
import path from "path";

const FEEDS_DIR = path.join("data", "feeds");

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

export async function addDomains(domains) {
  await ensureDir(FEEDS_DIR);
  const filePath = path.join(FEEDS_DIR, "domains.txt");
  const existing = new Set(await readLines(filePath));

  const toAppend = [];
  for (const d of domains) {
    const trimmed = d.trim();
    if (!trimmed) continue;
    if (existing.has(trimmed)) continue;
    existing.add(trimmed);
    toAppend.push(trimmed);
  }

  if (toAppend.length > 0) {
    await fs.appendFile(filePath, toAppend.join("\n") + "\n", "utf8");
  }

  return toAppend.length;
}