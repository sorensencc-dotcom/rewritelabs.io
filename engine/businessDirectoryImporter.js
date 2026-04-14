// File: engine/businessDirectoryImporter.js

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

function extractDomainFromUrl(value) {
  try {
    const u = new URL(value);
    return u.hostname;
  } catch {
    return value;
  }
}

export async function importBusinessCsv(csvPath, domainColumn = "website") {
  await ensureDir(FEEDS_DIR);
  const raw = await fs.readFile(csvPath, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return 0;

  const header = lines[0]
    .split(",")
    .map(h => h.trim().replace(/^"|"$/g, ""));
  const idx = header.indexOf(domainColumn);
  if (idx === -1) return 0;

  const domains = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length <= idx) continue;
    const val = cols[idx].trim().replace(/^"|"$/g, "");
    if (!val) continue;
    const domain = extractDomainFromUrl(val);
    domains.push(domain);
  }

  const domainsFile = path.join(FEEDS_DIR, "domains.txt");
  const existing = new Set(await readLines(domainsFile));

  const toAppend = [];
  for (const d of domains) {
    if (!d) continue;
    if (existing.has(d)) continue;
    existing.add(d);
    toAppend.push(d);
  }

  if (toAppend.length > 0) {
    await fs.appendFile(domainsFile, toAppend.join("\n") + "\n", "utf8");
  }

  return toAppend.length;
}