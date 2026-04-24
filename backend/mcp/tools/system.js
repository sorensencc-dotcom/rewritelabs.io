module.exports = function systemTools({ queue, breaker, metrics }) {
  return {
    "system.queue.summary": async () => queue.summary(),
    "system.breaker.state": async () => breaker.getState(),
    "system.metrics": async () => metrics.getMetrics()
  };
};
