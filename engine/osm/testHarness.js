// File: engine/osm/testHarness.js
// Simple test harness for enumerateOSM across regions

import { enumerateOSM } from "./enumerator.js";

async function runOne(zip, category, region) {
  console.log(`\n=== OSM test: zip=${zip} category=${category} region=${region || "auto"} ===`);
  const res = await enumerateOSM(zip, category, console, region);
  console.log({
    zip: res.zip,
    category: res.category,
    count: res.count,
    ms: res.ms,
    httpMs: res.httpMs,
    parseMs: res.parseMs,
    transformMs: res.transformMs,
    fromCache: res.fromCache,
    error: res.error || null
  });
}

async function main() {
  process.env.VALIDATE_MODE = "1";

  await runOne("33602", "restaurants", "us");
  await runOne("33602", "cafes", "us");
  await runOne("M5V", "restaurants", "ca");
  await runOne("EC1A", "cafes", "uk");
}

main().catch(err => {
  console.error("Test harness error:", err);
  process.exit(1);
});