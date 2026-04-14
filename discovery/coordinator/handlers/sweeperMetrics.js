// FILE: C:\Users\soren\rewritelabs.io\discovery\coordinator\handlers\sweeperMetrics.js

import { db } from "../../shared/db.js";

export async function handleSweeperMetrics(job) {
  const msg = job.data;

  await db.query(
    `UPDATE sweeper_node
     SET last_heartbeat = NOW(),
         meta = $2
     WHERE id = $1`,
    [msg.node_id, msg]
  );

  console.log("[coordinator] Metrics updated for node:", msg.node_id);
}