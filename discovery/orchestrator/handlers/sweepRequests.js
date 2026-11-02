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

  const values = [];
  const params = [];
  for (let i = 0; i < shardSpecs.length; i++) {
    const [start, end] = shardSpecs[i].split("-");
    const node = nodes[i % nodes.length];

    values.push(`(gen_random_uuid(), $${params.length + 1}, $${params.length + 2}, $${params.length + 3}, 'assigned')`);
    params.push(sweepId, node.id, { type: "tld_range", start, end });
  }

  const { rows } = await db.query(
    `INSERT INTO shard (id, sweep_id, node_id, spec, status)
     VALUES ${values.join(", ")}
     RETURNING id, node_id, spec`,
    params
  );

  const timestamp = new Date().toISOString();
  const jobs = rows.map(row => ({
    name: "assign",
    data: {
      v: 1,
      shard_id: row.id,
      sweep_id: sweepId,
      node_id: row.node_id,
      spec: row.spec,
      timestamp
    }
  }));

  await queues.shardAssignments.addBulk(jobs);

  console.log("[orchestrator] Sweep started:", sweepId, "level:", level);
}