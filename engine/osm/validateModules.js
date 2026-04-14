// File: engine/osm/validateModules.js
// Simple ESM validator for OSM engine

const modules = [
  "./metrics.js",
  "./cache.js",
  "./bbox/loader.js",
  "./endpoints.js",
  "./http.js",
  "./query.js",
  "./transform.js",
  "./categoryAI.js",
  "./dedupe.js",
  "./enumerator.js"
];

async function main() {
  for (const m of modules) {
    try {
      await import(m);
      console.log(`OK   ${m}`);
    } catch (err) {
      console.error(`FAIL ${m}:`, err.message);
      process.exitCode = 1;
    }
  }
}

main();