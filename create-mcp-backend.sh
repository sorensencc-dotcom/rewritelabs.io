#!/bin/bash
set -e

BASE="backend"

echo "[MCP] Creating unified MCP backend at $BASE"

mkdir -p $BASE
mkdir -p $BASE/core
mkdir -p $BASE/mcp/tools
mkdir -p $BASE/routes
mkdir -p $BASE/ws
mkdir -p $BASE/adapters/google-drive
mkdir -p $BASE/adapters/rewritelabs
mkdir -p $BASE/operator

##############################################
# package.json
##############################################
cat > $BASE/package.json << 'EOF'
{
  "name": "cast-iron-mcp",
  "version": "0.1.0",
  "private": true,
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "NODE_ENV=development node server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "ws": "^8.18.0",
    "morgan": "^1.10.0"
  }
}
EOF

##############################################
# config.js
##############################################
cat > $BASE/config.js << 'EOF'
module.exports = {
  port: process.env.PORT || 4000,
  wsPath: "/ws",
  env: process.env.NODE_ENV || "development"
};
EOF

##############################################
# server.js
##############################################
cat > $BASE/server.js << 'EOF'
const http = require("http");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { port, wsPath, env } = require("./config");

const queue = require("./core/queue");
const breaker = require("./core/breaker");
const metrics = require("./core/metrics");
const sweeper = require("./core/sweeper");

const attachWs = require("./ws");
const mcpServer = require("./mcp");

const healthRoutes = require("./routes/health");
const queueRoutes = require("./routes/queue");
const breakerRoutes = require("./routes/breaker");
const metricsRoutes = require("./routes/metrics");
const sweeperRoutes = require("./routes/sweeper");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(morgan(env === "development" ? "dev" : "combined"));

app.use((req, res, next) => {
  req.state = { queue, breaker, metrics, sweeper };
  next();
});

app.use("/health", healthRoutes);
app.use("/queue", queueRoutes);
app.use("/breaker", breakerRoutes);
app.use("/metrics", metricsRoutes);
app.use("/sweeper", sweeperRoutes);

mcpServer(app, { queue, breaker, metrics, sweeper });
attachWs(server, { queue, breaker, metrics, sweeper });

server.listen(port, () => {
  console.log(`[MCP] backend running on port ${port} (${env})`);
});
EOF

##############################################
# core/queue.js
##############################################
cat > $BASE/core/queue.js << 'EOF'
const { randomUUID } = require("crypto");

const jobs = new Map();

function newJob({ type, region, shardIndex = 0, shardCount = 1, total = 0 }) {
  const id = randomUUID();
  const now = Date.now();

  const job = {
    id,
    type,
    region,
    shardIndex,
    shardCount,
    status: "queued",
    processed: 0,
    total,
    created: now,
    updated: now,
    meta: {}
  };

  jobs.set(id, job);
  return job;
}

function getJob(id) {
  return jobs.get(id) || null;
}

function getJobs(status) {
  let list = Array.from(jobs.values());
  if (status) list = list.filter(j => j.status === status);
  return list.sort((a, b) => a.created - b.created);
}

function setStatus(id, status) {
  const job = getJob(id);
  if (!job) return null;
  job.status = status;
  job.updated = Date.now();
  return job;
}

function updateProgress(id, { processed, total }) {
  const job = getJob(id);
  if (!job) return null;
  if (typeof processed === "number") job.processed = processed;
  if (typeof total === "number") job.total = total;
  job.updated = Date.now();
  return job;
}

function incrementProcessed(id, by = 1) {
  const job = getJob(id);
  if (!job) return null;
  job.processed = Math.max(0, job.processed + by);
  job.updated = Date.now();
  return job;
}

function removeJob(id) {
  return jobs.delete(id);
}

function clear() {
  jobs.clear();
}

function summary() {
  const list = Array.from(jobs.values());
  const total = list.length;
  const byStatus = list.reduce((acc, j) => {
    acc[j.status] = (acc[j.status] || 0) + 1;
    return acc;
  }, {});
  return { total, byStatus };
}

module.exports = {
  newJob,
  getJob,
  getJobs,
  setStatus,
  updateProgress,
  incrementProcessed,
  removeJob,
  clear,
  summary
};
EOF

##############################################
# core/breaker.js
##############################################
cat > $BASE/core/breaker.js << 'EOF'
const state = {
  tripped: false,
  reason: null,
  lastErrorAt: null,
  errorWindow: [],
  windowMs: 5 * 60 * 1000,
  threshold: 10,
  cooldownMs: 5 * 60 * 1000
};

function recordError() {
  const now = Date.now();
  state.errorWindow.push(now);
  state.errorWindow = state.errorWindow.filter(t => now - t <= state.windowMs);
  state.lastErrorAt = now;

  if (!state.tripped && state.errorWindow.length >= state.threshold) {
    state.tripped = true;
    state.reason = \`error threshold \${state.threshold}\`;
  }
}

function maybeRecover() {
  if (!state.tripped) return;
  const now = Date.now();
  if (state.lastErrorAt && now - state.lastErrorAt >= state.cooldownMs) {
    state.tripped = false;
    state.reason = null;
    state.errorWindow = [];
  }
}

function forceTrip(reason = "manual") {
  state.tripped = true;
  state.reason = reason;
}

function forceReset() {
  state.tripped = false;
  state.reason = null;
  state.errorWindow = [];
  state.lastErrorAt = null;
}

function getState() {
  maybeRecover();
  return { ...state };
}

module.exports = {
  recordError,
  maybeRecover,
  forceTrip,
  forceReset,
  getState
};
EOF

##############################################
# core/metrics.js
##############################################
cat > $BASE/core/metrics.js << 'EOF'
const state = {
  totalRuns: 0,
  totalSuccess: 0,
  totalFailure: 0,
  lastRunAt: null
};

function recordRun({ success }) {
  state.totalRuns += 1;
  if (success) state.totalSuccess += 1;
  else state.totalFailure += 1;
  state.lastRunAt = Date.now();
}

function getMetrics() {
  return { ...state };
}

module.exports = { recordRun, getMetrics };
EOF

##############################################
# core/sweeper.js
##############################################
cat > $BASE/core/sweeper.js << 'EOF'
async function runSweep({ region, shardIndex = 0, shardCount = 1 }) {
  await new Promise(r => setTimeout(r, 250));
  return {
    region,
    shardIndex,
    shardCount,
    processed: 10,
    total: 10,
    success: true
  };
}

module.exports = { runSweep };
EOF

##############################################
# mcp/index.js
##############################################
cat > $BASE/mcp/index.js << 'EOF'
const router = require("./router");
const googleDriveTools = require("./tools/google-drive");
const rewritelabsTools = require("./tools/rewritelabs");
const systemTools = require("./tools/system");

module.exports = function initMcp(app, state) {
  const tools = {
    ...googleDriveTools(state),
    ...rewritelabsTools(state),
    ...systemTools(state)
  };

  app.use("/mcp", router(tools));
};
EOF

##############################################
# mcp/router.js
##############################################
cat > $BASE/mcp/router.js << 'EOF'
const express = require("express");

module.exports = function router(tools) {
  const r = express.Router();

  r.post("/call", async (req, res) => {
    const { tool, params } = req.body || {};
    if (!tool || !tools[tool]) {
      return res.status(400).json({ error: "unknown tool" });
    }

    try {
      const result = await tools[tool](params || {});
      res.json({ result });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  return r;
};
EOF

##############################################
# mcp/tools/google-drive.js
##############################################
cat > $BASE/mcp/tools/google-drive.js << 'EOF'
module.exports = function googleDriveTools({ queue, sweeper }) {
  return {
    "google.drive.sweep": async ({ region }) => {
      const job = queue.newJob({ type: "drive-sweep", region });
      queue.setStatus(job.id, "running");

      const result = await sweeper.runSweep({ region });
      queue.updateProgress(job.id, { processed: result.processed, total: result.total });
      queue.setStatus(job.id, "completed");

      return { jobId: job.id, result };
    }
  };
};
EOF

##############################################
# mcp/tools/rewritelabs.js
##############################################
cat > $BASE/mcp/tools/rewritelabs.js << 'EOF'
module.exports = function rewritelabsTools({ queue }) {
  return {
    "rewritelabs.scan": async ({ url }) => {
      const job = queue.newJob({ type: "scan", region: url });
      queue.setStatus(job.id, "completed");
      return { jobId: job.id, findings: ["placeholder"] };
    },

    "rewritelabs.rewrite": async ({ url }) => {
      const job = queue.newJob({ type: "rewrite", region: url });
      queue.setStatus(job.id, "completed");
      return { jobId: job.id, html: "<html>rewritten</html>" };
    }
  };
};
EOF

##############################################
# mcp/tools/system.js
##############################################
cat > $BASE/mcp/tools/system.js << 'EOF'
module.exports = function systemTools({ queue, breaker, metrics }) {
  return {
    "system.queue.summary": async () => queue.summary(),
    "system.breaker.state": async () => breaker.getState(),
    "system.metrics": async () => metrics.getMetrics()
  };
};
EOF

##############################################
# routes/health.js
##############################################
cat > $BASE/routes/health.js << 'EOF'
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ status: "ok", ts: Date.now() });
});

module.exports = router;
EOF

##############################################
# routes/queue.js
##############################################
cat > $BASE/routes/queue.js << 'EOF'
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json(req.state.queue.getJobs());
});

router.get("/summary", (req, res) => {
  res.json(req.state.queue.summary());
});

router.post("/clear", (req, res) => {
  req.state.queue.clear();
  res.json({ ok: true });
});

module.exports = router;
EOF

##############################################
# routes/breaker.js
##############################################
cat > $BASE/routes/breaker.js << 'EOF'
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json(req.state.breaker.getState());
});

router.post("/trip", (req, res) => {
  req.state.breaker.forceTrip("manual");
  res.json(req.state.breaker.getState());
});

router.post("/reset", (req, res) => {
  req.state.breaker.forceReset();
  res.json(req.state.breaker.getState());
});

module.exports = router;
EOF

##############################################
# routes/metrics.js
##############################################
cat > $BASE/routes/metrics.js << 'EOF'
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json(req.state.metrics.getMetrics());
});

module.exports = router;
EOF

##############################################
# routes/sweeper.js
##############################################
cat > $BASE/routes/sweeper.js << 'EOF'
const express = require("express");
const router = express.Router();

router.post("/run", async (req, res) => {
  const { region } = req.body || {};
  if (!region) return res.status(400).json({ error: "region required" });

  const result = await req.state.sweeper.runSweep({ region });
  res.json(result);
});

module.exports = router;
EOF

##############################################
# ws/index.js
##############################################
cat > $BASE/ws/index.js << 'EOF'
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
EOF

##############################################
# adapters/google-drive/client.js
##############################################
cat > $BASE/adapters/google-drive/client.js << 'EOF'
module.exports = {
  listFiles: async () => [],
  getFile: async () => null
};
EOF

##############################################
# adapters/rewritelabs/scanner.js
##############################################
cat > $BASE/adapters/rewritelabs/scanner.js << 'EOF'
module.exports = {
  scan: async url => ({ url, issues: [] })
};
EOF

##############################################
# operator/dashboard-state.js
##############################################
cat > $BASE/operator/dashboard-state.js << 'EOF'
module.exports = function dashboardState({ queue, breaker, metrics }) {
  return {
    queue: queue.summary(),
    breaker: breaker.getState(),
    metrics: metrics.getMetrics()
  };
};
EOF

##############################################
# Install dependencies
##############################################
echo "[MCP] Installing dependencies"
cd $BASE
npm install

echo "[MCP] Done. Start server with: npm start"
