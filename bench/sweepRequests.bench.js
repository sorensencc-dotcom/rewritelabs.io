import { handleSweepRequest } from '../discovery/orchestrator/handlers/sweepRequests.js';
import { db } from '../discovery/shared/db.js';
import { queues } from '../discovery/shared/queue.js';

const mockDb = {
  query: async (sql, params) => {
    // Simulate some latency
    await new Promise(r => setTimeout(r, 2));

    if (sql.includes('UPDATE sweep')) {
      return { rows: [] };
    }
    if (sql.includes('SELECT id FROM sweeper_node')) {
      return { rows: [{ id: 'node1' }, { id: 'node2' }] };
    }
    if (sql.includes('INSERT INTO shard')) {
      if (params && Array.isArray(params[0])) { // Unnest check roughly
         return { rows: params[0].map((_, i) => ({ id: 'shard' + i })) };
      }
      return { rows: [{ id: 'shard' + Math.random() }] };
    }
    return { rows: [] };
  }
};

const mockQueues = {
  shardAssignments: {
    add: async () => {
      // Simulate some latency
      await new Promise(r => setTimeout(r, 1));
    }
  }
};

db.query = mockDb.query;
queues.shardAssignments = mockQueues.shardAssignments;

async function runBenchmark() {
  const job = {
    data: {
      level: 'continent',
      sweep_id: 'test-sweep-123'
    }
  };

  const start = performance.now();
  const iterations = 50;

  for (let i = 0; i < iterations; i++) {
    await handleSweepRequest(job);
  }

  const end = performance.now();
  console.log(`Baseline benchmark: ${(end - start).toFixed(2)}ms for ${iterations} iterations`);
  console.log(`Average time per sweep request: ${((end - start) / iterations).toFixed(2)}ms`);
}

runBenchmark().catch(console.error);
