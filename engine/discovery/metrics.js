// File: engine/discovery/metrics.js

import fs from "fs/promises";
import path from "path";

const METRICS_DIR = path.join("data", "metrics");

// ---- GLOBAL STATE (FIXED) ----
export const metricsState = {
  modules: [],          // { region, city, state, zip, category, module, ms, ok }
  perZip: new Map(),    // key: "city|state|zip" → { totalMs, count, ok, fail }
  perCategory: new Map() // key: "region|category" → { totalMs, count, ok, fail }
};

// ---- HELPERS ----
function zipKey(city, state, zip) {
  return `${city}|${state}|${zip}`;
}

function categoryKey(region, category) {
  return `${region}|${category}`;
}

// ---- RECORD MODULE METRIC ----
export function recordModuleMetric({ region, city, state, zip, category, module, ms, ok }) {
  metricsState.modules.push({ region, city, state, zip, category, module, ms, ok });

  if (zip) {
    const k = zipKey(city, state, zip);
    const prev = metricsState.perZip.get(k) || { totalMs: 0, count: 0, ok: 0, fail: 0 };
    prev.totalMs += ms;
    prev.count++;
    ok ? prev.ok++ : prev.fail++;
    metricsState.perZip.set(k, prev);
  }

  const kc = categoryKey(region, category);
  const prevCat = metricsState.perCategory.get(kc) || { totalMs: 0, count: 0, ok: 0, fail: 0 };
  prevCat.totalMs += ms;
  prevCat.count++;
  ok ? prevCat.ok++ : prevCat.fail++;
  metricsState.perCategory.set(kc, prevCat);
}

// ---- FLUSH DAILY METRICS ----
export async function flushDailyMetrics() {
  const date = new Date().toISOString().slice(0, 10);

  await fs.mkdir(METRICS_DIR, { recursive: true });

  const jsonFile = path.join(METRICS_DIR, `sweep-${date}.json`);
  const csvFile = path.join(METRICS_DIR, `sweep-${date}.csv`);
  const zipCsvFile = path.join(METRICS_DIR, `sweep-zip-${date}.csv`);
  const catCsvFile = path.join(METRICS_DIR, `sweep-category-${date}.csv`);

  // JSON
  await fs.writeFile(
    jsonFile,
    JSON.stringify({
      modules: metricsState.modules,
      perZip: Object.fromEntries(metricsState.perZip),
      perCategory: Object.fromEntries(metricsState.perCategory)
    }, null, 2),
    "utf8"
  );

  // MODULE CSV
  const moduleRows = [
    "region,city,state,zip,category,module,ms,ok",
    ...metricsState.modules.map(m =>
      [
        m.region, m.city, m.state, m.zip, m.category, m.module, m.ms, m.ok ? 1 : 0
      ].join(",")
    )
  ];
  await fs.writeFile(csvFile, moduleRows.join("\n") + "\n", "utf8");

  // ZIP CSV
  const zipRows = [
    "city,state,zip,avg_ms,count,ok,fail",
    ...Array.from(metricsState.perZip.entries()).map(([k, v]) => {
      const [city, state, zip] = k.split("|");
      const avg = v.count ? Math.round(v.totalMs / v.count) : 0;
      return [city, state, zip, avg, v.count, v.ok, v.fail].join(",");
    })
  ];
  await fs.writeFile(zipCsvFile, zipRows.join("\n") + "\n", "utf8");

  // CATEGORY CSV
  const catRows = [
    "region,category,avg_ms,count,ok,fail",
    ...Array.from(metricsState.perCategory.entries()).map(([k, v]) => {
      const [region, category] = k.split("|");
      const avg = v.count ? Math.round(v.totalMs / v.count) : 0;
      return [region, category, avg, v.count, v.ok, v.fail].join(",");
    })
  ];
  await fs.writeFile(catCsvFile, catRows.join("\n") + "\n", "utf8");
}