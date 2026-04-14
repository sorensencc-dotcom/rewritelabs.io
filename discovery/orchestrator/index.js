import dotenv from "dotenv";
import express from "express";
import { db, testDB } from "../shared/db.js";
import { queues, createWorker } from "../shared/queue.js";
import { handleSweepRequest } from "./handlers/sweepRequests.js";

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

app.post("/sweeps/continent", async (req, res) => {
  const { sweep_id, continent } = req.body;

  await db.query(
    `INSERT INTO sweep (id, level, continent_id, status)
     VALUES ($1, 'continent',
       (SELECT id FROM continent WHERE code = $2),
       'pending'
     )`,
    [sweep_id, continent]
  );

  await queues.sweepRequests.add("continent", {
    v: 1,
    sweep_id,
    level: "continent",
    continent,
    requested_by: "api",
    timestamp: new Date().toISOString()
  });

  res.json({ ok: true, sweep_id });
});

app.post("/sweeps/country", async (req, res) => {
  const { sweep_id, country } = req.body;

  await db.query(
    `INSERT INTO sweep (id, level, country_id, status)
     VALUES ($1, 'country',
       (SELECT id FROM country WHERE code = $2),
       'pending'
     )`,
    [sweep_id, country]
  );

  await queues.sweepRequests.add("country", {
    v: 1,
    sweep_id,
    level: "country",
    country,
    requested_by: "api",
    timestamp: new Date().toISOString()
  });

  res.json({ ok: true, sweep_id });
});

createWorker("sweep_requests", handleSweepRequest);

const port = process.env.PORT || 4001;
app.listen(port, async () => {
  console.log("[orchestrator] listening on", port);
  await testDB();
});