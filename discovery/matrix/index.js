// FILE: C:\Users\soren\rewritelabs.io\discovery\matrix\index.js

import dotenv from "dotenv";
import express from "express";
import { db, testDB } from "../shared/db.js";
import { createWorker } from "../shared/queue.js";
import { handleCandidateDiscovered } from "./handlers/candidateDiscovered.js";

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

// Worker: update category index on candidate discovery
createWorker("candidate_discovered", handleCandidateDiscovered);

// Query endpoint
app.get("/query", async (req, res) => {
  const { vertical, geo, tech } = req.query;

  const { rows } = await db.query(
    `SELECT c.domain
     FROM category_index ci
     JOIN candidate c ON c.id = ci.candidate_id
     WHERE ci.vertical = $1
       AND ci.geo_key LIKE $2
       AND ci.tech_key LIKE $3
       AND c.status = 'active'
     LIMIT 500`,
    [
      vertical || "%",
      geo || "%",
      tech || "%"
    ]
  );

  res.json({ results: rows });
});

const port = process.env.PORT || 4004;
app.listen(port, async () => {
  console.log("[matrix] listening on", port);
  await testDB();
});