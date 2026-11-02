export const queues = {
  shardAssignments: {
    add: async () => {
      // Simulate some latency
      await new Promise(r => setTimeout(r, 1));
    },
    addBulk: async () => {
      await new Promise(r => setTimeout(r, 1));
    }
  }
};
