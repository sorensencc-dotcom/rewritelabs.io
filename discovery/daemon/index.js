// FILE: C:\Users\soren\rewritelabs.io\discovery\daemon\index.js

import dotenv from "dotenv";
import express from "express";
import { db, testDB } from "../shared/db.js";
import { queues, createWorker } from "../shared/queue.js";
import { handleRecrawlRequest } from "./handlers/recrawlRequests.js";

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

// Scheduler: enqueue recrawls every minute
async function scheduleRecrawls() {
  const { rows } = await db.query(
    `SELECT id, domain
     FROM candidate
     WHERE status = 'active'
       AND last_seen < NOW() - INTERVAL '7 days'
     LIMIT 100`
  );

  for (const row of rows) {
    await queues.recrawlRequests.add("recrawl", {
      v: 1,
      candidate_id: row.id,
      domain: row.domain,
      priority: "7d",
      next_run: new Date().toISOString()
    });
  }

  if (rows.length > 0) {
    console.log("[daemon] Scheduled recrawls:", rows.length);
  }
}

setInterval(scheduleRecrawls, 60_000);

// Worker: consume recrawl requests
createWorker("recrawl_requests", handleRecrawlRequest);

const port = process.env.PORT || 4003;
app.listen(port, async () => {
  console.log("[daemon] listening on", port);
  await testDB();
});