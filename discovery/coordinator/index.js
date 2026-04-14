// FILE: C:\Users\soren\rewritelabs.io\discovery\coordinator\index.js

import dotenv from "dotenv";
import express from "express";
import { db, testDB } from "../shared/db.js";
import { createWorker } from "../shared/queue.js";
import { handleSweeperMetrics } from "./handlers/sweeperMetrics.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

// Register or heartbeat a node
app.post("/nodes/register", async (req, res) => {
  const { id, name, region, provider } = req.body;

  await db.query(
    `INSERT INTO sweeper_node (id, name, region, provider, status, last_heartbeat)
     VALUES ($1, $2, $3, $4, 'online', NOW())
     ON CONFLICT (id) DO UPDATE
       SET last_heartbeat = NOW(),
           status = 'online'`,
    [id, name, region, provider]
  );

  res.json({ ok: true });
});

// List all nodes
app.get("/nodes", async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, name, region, provider, status, last_heartbeat
     FROM sweeper_node
     ORDER BY last_heartbeat DESC`
  );

  res.json(rows);
});

// Worker: sweeper metrics
createWorker("sweeper_metrics", handleSweeperMetrics);

const port = process.env.PORT || 4005;
app.listen(port, async () => {
  console.log("[coordinator] listening on", port);
  await testDB();
});