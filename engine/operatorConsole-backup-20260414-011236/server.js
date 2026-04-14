// File: engine/operatorConsole/server.js

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import cache from "../osm/cache.js";
import { regionCache } from "../osm/bbox/loader.js";
import { sweepGlobal } from "../discovery/globalSweeper.js";

import analyticsRouter from "./server/analytics/analytics.router.js";
import {
  handleState,
  handleMetrics,
  handleLogs
} from "./api.js";

// --------------------------------------------------
// ESM dirname
// --------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --------------------------------------------------
// STATIC FILES — MUST BE FIRST
// --------------------------------------------------
const publicDir = path.join(__dirname, "public");
console.log("PUBLIC DIR:", publicDir);

app.use(express.static(publicDir));

// --------------------------------------------------
// APIs
// --------------------------------------------------
app.use("/api/analytics", analyticsRouter);

app.post("/api/sweeper/run", async (req, res) => {
  sweepGlobal({ zips: ["33602"], categories: ["restaurants"] });
  res.json({ ok: true });
});

app.get("/state", handleState);
app.get("/metrics", handleMetrics);
app.get("/logs/tail", handleLogs);
app.get("/api/logs/recent", handleLogs);

app.get("/api/osm/status", (req, res) => {
  res.json({
    cacheSize: cache.size?.() || 0,
    lastRequestAt: global.lastOSMRequestAt || null,
    qps: process.env.OSM_QPS || null,
    bboxRegionsLoaded: regionCache ? [...regionCache.keys()] : []
  });
});

app.get("/api/sweeper/status", (req, res) => {
  res.json({
    lastRun: global.lastSweepAt || null,
    lastZip: global.lastZip || null,
    lastCategory: global.lastCategory || null,
    progress: global.sweeperProgress || null,
    zipMetrics: global.zipMetrics || {},
    categoryStats: global.categoryStats || {}
  });
});

app.get("/api/errors/recent", (req, res) => {
  res.json(global.recentErrors || []);
});

app.get("/api/osm/timings", (req, res) => {
  res.json(global.osmTimings || []);
});

app.get("/api/redis/status", async (req, res) => {
  res.json({
    enabled: false,
    queues: [],
    note: "Redis metrics not wired yet"
  });
});

// --------------------------------------------------
// FALLBACK — MUST BE LAST
// --------------------------------------------------
app.use((req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});



// --------------------------------------------------
// PORT + CONFLICT HANDLING
// --------------------------------------------------
function startServer(port, maxAttempts = 5) {
  const server = app
    .listen(port, () => {
      console.log("==============================================");
      console.log(" Rewrite Labs Operator Console");
      console.log(` UI running at: http://localhost:${port}`);
      console.log("==============================================");
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE" && maxAttempts > 0) {
        const nextPort = port + 1;
        console.warn(
          `Port ${port} in use, trying ${nextPort} (remaining attempts: ${maxAttempts - 1})`
        );
        startServer(nextPort, maxAttempts - 1);
      } else {
        console.error("Failed to start operator console:", err);
        process.exit(1);
      }
    });

  return server;
}

startServer(5150);
