// engine/operatorConsole/api.js

import fs from "fs";
import path from "path";

// ------------------------------
// In-memory state (updated by sweeper)
// ------------------------------

export const sweepState = {
  shardIndex: parseInt(process.env.SHARD_INDEX || "0", 10),
  totalShards: parseInt(process.env.TOTAL_SHARDS || "1", 10),

  currentCity: "",
  currentZip: "",
  currentCategory: "",
  progressPct: 0,

  osmBreakerOpen: false
};

// ------------------------------
// In-memory metrics buffer
// ------------------------------

const METRICS_BUFFER = [];
const METRICS_LIMIT = 5000;

export function pushMetric(m) {
  METRICS_BUFFER.push({
    ...m,
    ts: Date.now()
  });

  if (METRICS_BUFFER.length > METRICS_LIMIT) {
    METRICS_BUFFER.splice(0, METRICS_BUFFER.length - METRICS_LIMIT);
  }
}

// ------------------------------
// Log tail helper
// ------------------------------

const ROOT = path.resolve(__dirname, "..");
const DAILY_LOG = path.join(ROOT, "logs", "daily.log");

function tailFile(filePath, lines = 200) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const arr = data.trim().split("\n");
    return arr.slice(-lines).join("\n");
  } catch {
    return "";
  }
}

// ------------------------------
// HTTP Handlers
// ------------------------------

export function handleState(req, res) {
  res.json(sweepState);
}

export function handleMetrics(req, res) {
  res.json(METRICS_BUFFER.slice(-200)); // last 200 metrics
}

export function handleLogs(req, res) {
  try {
    // Read last 200 lines from daily.log
    const text = tailFile(DAILY_LOG, 200);

    // Convert to array of lines
    const lines = text
      ? text.split("\n").map(line => ({ line }))
      : [];

    // Always return valid JSON
    return res.json(lines);
  } catch (err) {
    // Never break the UI — always return valid JSON
    return res.json([]);
  }
}