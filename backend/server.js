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
