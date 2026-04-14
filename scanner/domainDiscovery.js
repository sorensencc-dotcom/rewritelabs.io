// File: /scanner/domainDiscovery.js
// Very simple domain source placeholder – replace with real sources (CSV, APIs, etc.)

import fs from "fs/promises";

export async function loadDomainsFromFile(path) {
  const content = await fs.readFile(path, "utf8");
  return content
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
}

// Example static seed list (for quick testing)
export async function getSeedDomains() {
  return [
    "info.cern.ch",
    "www.paulgraham.com",
    "www.arngren.net",
    "www.cs.princeton.edu",
    "example.com",
  ];
}