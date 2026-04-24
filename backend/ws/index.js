const WebSocket = require("ws");
const { wsPath } = require("../config");

module.exports = function attachWs(server, state) {
  const wss = new WebSocket.Server({ server, path: wsPath });

  wss.on("connection", ws => {
    ws.send(JSON.stringify({ type: "hello", ts: Date.now() }));
  });

  function broadcast(msg) {
    const data = JSON.stringify(msg);
    wss.clients.forEach(c => c.readyState === WebSocket.OPEN && c.send(data));
  }

  server.wsBus = {
    queueUpdated() {
      broadcast({ type: "queue:update", payload: state.queue.summary() });
    },
    breakerUpdated() {
      broadcast({ type: "breaker:update", payload: state.breaker.getState() });
    },
    metricsUpdated() {
      broadcast({ type: "metrics:update", payload: state.metrics.getMetrics() });
    }
  };
};
