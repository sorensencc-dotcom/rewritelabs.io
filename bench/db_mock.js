export const db = {
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
      if (sql.includes('VALUES (gen_random_uuid(), $1, $2, $3, \'assigned\')')) {
        return { rows: [{ id: 'shard' + Math.random(), node_id: params[1], spec: params[2] }] };
      } else {
        // Bulk insert mock
        const numInserted = (params.length) / 3;
        const rows = [];
        for(let i=0; i<numInserted; i++) {
           rows.push({ id: 'shard' + Math.random(), node_id: params[i*3 + 1], spec: params[i*3 + 2] });
        }
        return { rows };
      }
    }
    return { rows: [] };
  }
};
