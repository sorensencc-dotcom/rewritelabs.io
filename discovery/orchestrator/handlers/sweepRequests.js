import { db } from "../../shared/db.js";
import { queues } from "../../shared/queue.js";

export async function handleSweepRequest(job) {
  const msg = job.data;

  const level = msg.level; // 'continent' | 'country'
  const sweepId = msg.sweep_id;

  await db.query(
    `UPDATE sweep
     SET status = 'running', started_at = NOW()
     WHERE id = $1`,
    [sweepId]
  );

  const shardSpecs = ["aa-ff", "fg-ll", "lm-rr", "rs-zz"];

  const { rows: nodes } = await db.query(
    `SELECT id FROM sweeper_node
     WHERE status = 'online'
     ORDER BY random()
     LIMIT $1`,
    [shardSpecs.length]
  );

  if (nodes.length === 0) {
    console.warn("[orchestrator] No online sweeper nodes available");
    return;
  }

  for (let i = 0; i < shardSpecs.length; i++) {
    const [start, end] = shardSpecs[i].split("-");
    const node = nodes[i % nodes.length];

    const { rows } = await db.query(
      `INSERT INTO shard (id, sweep_id, node_id, spec, status)
       VALUES (gen_random_uuid(), $1, $2, $3, 'assigned')
       RETURNING id`,
      [sweepId, node.id, { type: "tld_range", start, end }]
    );

    const shardId = rows[0].id;

    await queues.shardAssignments.add("assign", {
      v: 1,
      shard_id: shardId,
      sweep_id: sweepId,
      node_id: node.id,
      spec: { type: "tld_range", start, end },
      timestamp: new Date().toISOString()
    });
  }

  console.log("[orchestrator] Sweep started:", sweepId, "level:", level);
}