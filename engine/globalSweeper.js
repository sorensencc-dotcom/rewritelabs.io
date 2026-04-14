// File: engine/discovery/globalSweeper.js
// OSM-only sweeper with metrics + progress exposed via globals

import { enumerateOSM } from "../osm/enumerator.js";

const logger = console;

// Globals consumed by the operator console
global.lastSweepAt = null;
global.lastZip = null;
global.lastCategory = null;

global.sweeperProgress = {
  totalJobs: 0,
  completedJobs: 0,
  currentZip: null,
  currentCategory: null
};

global.zipMetrics = {};        // { [zip]: { runs, lastDurationMs, lastCount } }
global.categoryStats = {};     // { [category]: { runs, totalCount } }
global.recentErrors = [];      // [{ ts, zip, category, message }]
global.osmTimings = [];        // last N timing samples

const MAX_ERRORS = 50;
const MAX_TIMINGS = 100;

function recordError(zip, category, err) {
  global.recentErrors.unshift({
    ts: new Date().toISOString(),
    zip,
    category,
    message: err?.message || String(err)
  });
  if (global.recentErrors.length > MAX_ERRORS) {
    global.recentErrors.length = MAX_ERRORS;
  }
}

function recordZipMetrics(zip, durationMs, count) {
  if (!global.zipMetrics[zip]) {
    global.zipMetrics[zip] = { runs: 0, lastDurationMs: 0, lastCount: 0 };
  }
  const m = global.zipMetrics[zip];
  m.runs += 1;
  m.lastDurationMs = durationMs;
  m.lastCount = count;
}

function recordCategoryStats(category, count) {
  if (!global.categoryStats[category]) {
    global.categoryStats[category] = { runs: 0, totalCount: 0 };
  }
  const c = global.categoryStats[category];
  c.runs += 1;
  c.totalCount += count;
}

function recordOsmTiming(zip, category, durationMs, rawResult) {
  global.osmTimings.unshift({
    ts: new Date().toISOString(),
    zip,
    category,
    durationMs,
    meta: {
      httpMs: rawResult?.httpMs,
      parseMs: rawResult?.parseMs,
      transformMs: rawResult?.transformMs,
      totalMs: rawResult?.totalMs
    }
  });
  if (global.osmTimings.length > MAX_TIMINGS) {
    global.osmTimings.length = MAX_TIMINGS;
  }
}

export async function sweepGlobal({ zips = [], categories = [] }) {
  logger.info("Starting global sweep...");

  if (zips.length === 0) {
    zips = ["33602"]; // default
  }
  if (categories.length === 0) {
    categories = ["restaurants"];
  }

  const jobs = [];
  for (const zip of zips) {
    for (const category of categories) {
      jobs.push({ zip, category });
    }
  }

  global.sweeperProgress.totalJobs = jobs.length;
  global.sweeperProgress.completedJobs = 0;

  for (const { zip, category } of jobs) {
    global.lastZip = zip;
    global.lastCategory = category;
    global.sweeperProgress.currentZip = zip;
    global.sweeperProgress.currentCategory = category;

    logger.info(`\n=== Sweeping ZIP ${zip} / category ${category} ===`);

    const t0 = Date.now();
    let result;
    try {
      result = await enumerateOSM(zip, category, logger);
    } catch (err) {
      logger.error(`OSM sweep failed for ${zip}/${category}:`, err);
      recordError(zip, category, err);
      global.sweeperProgress.completedJobs += 1;
      continue;
    }
    const t1 = Date.now();
    const durationMs = t1 - t0;

    const items = Array.isArray(result?.items) ? result.items : [];
    const count = items.length;

    recordZipMetrics(zip, durationMs, count);
    recordCategoryStats(category, count);
    recordOsmTiming(zip, category, durationMs, result);

    logger.info(
      `Completed OSM sweep for ${zip}/${category}: ${count} items in ${durationMs} ms`
    );

    global.sweeperProgress.completedJobs += 1;
    global.lastSweepAt = new Date().toISOString();
  }

  global.sweeperProgress.currentZip = null;
  global.sweeperProgress.currentCategory = null;

  logger.info("Global sweep complete.");
}