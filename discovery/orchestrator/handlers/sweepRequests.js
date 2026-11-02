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

  const insertValues = [];
  const queryParams = [];

  for (let i = 0; i < shardSpecs.length; i++) {
    const [start, end] = shardSpecs[i].split("-");
    const node = nodes[i % nodes.length];

    const offset = i * 3;
    insertValues.push(`(gen_random_uuid(), $${offset + 1}, $${offset + 2}, $${offset + 3}, 'assigned')`);

    queryParams.push(sweepId, node.id, { type: "tld_range", start, end });
  }

  if (insertValues.length > 0) {
    const { rows } = await db.query(
      `INSERT INTO shard (id, sweep_id, node_id, spec, status)
       VALUES ${insertValues.join(", ")}
       RETURNING id, node_id, spec`,
      queryParams
    );

    const queueJobs = rows.map((row) => ({
      name: "assign",
      data: {
        v: 1,
        shard_id: row.id,
        sweep_id: sweepId,
        node_id: row.node_id,
        spec: row.spec,
        timestamp: new Date().toISOString(),
      },
    }));

    await queues.shardAssignments.addBulk(queueJobs);
  }

  console.log("[orchestrator] Sweep started:", sweepId, "level:", level);
}