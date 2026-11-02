import { db } from "./db_mock.js";
import { queues } from "./queue_mock.js";

export async function handleSweepRequest(job) {
  const msg = job.data;
  const level = msg.level;
  const sweepId = msg.sweep_id;

  await db.query(
    `UPDATE sweep
     SET status = 'running', started_at = NOW()
     WHERE id = $1`,
    [sweepId]
  );

  // increase shardSpecs array size to simulate larger N
  const shardSpecs = [];
  for (let i = 0; i < 100; i++) shardSpecs.push(`a${i}-b${i}`);

  const { rows: nodes } = await db.query(
    `SELECT id FROM sweeper_node
     WHERE status = 'online'
     ORDER BY random()
     LIMIT $1`,
    [shardSpecs.length]
  );

  if (nodes.length === 0) {
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
      timestamp: "2023-01-01T00:00:00Z"
    });
  }
}
