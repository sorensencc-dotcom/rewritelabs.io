module.exports = function dashboardState({ queue, breaker, metrics }) {
  return {
    queue: queue.summary(),
    breaker: breaker.getState(),
    metrics: metrics.getMetrics()
  };
};
