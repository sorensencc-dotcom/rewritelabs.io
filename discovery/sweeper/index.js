// FILE: C:\Users\soren\rewritelabs.io\discovery\sweeper\index.js

import dotenv from "dotenv";
import express from "express";
import { db, testDB } from "../shared/db.js";
import { createWorker } from "../shared/queue.js";
import { handleShardAssignment } from "./handlers/shardAssignments.js";

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

// Worker: consume shard assignments
createWorker("shard_assignments", handleShardAssignment);

const port = process.env.PORT || 4002;
app.listen(port, async () => {
  console.log("[sweeper] listening on", port);
  await testDB();
});