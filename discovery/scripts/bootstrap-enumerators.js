// FILE: C:\Users\soren\rewritelabs.io\discovery\scripts\bootstrap-enumerators.js

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, "..");

const services = [
  "enumerator-seeds",
  "enumerator-facebook",
  "enumerator-reverseip",
  "enumerator-bruteforce"
];

const pkgTemplate = (name) => `{
  "name": "${name}",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "dependencies": {
    "dotenv": "^16.4.0",
    "express": "^4.19.0",
    "node-fetch": "^3.3.2",
    "bull": "^4.12.0"
  }
}
`;

const indexTemplate = (serviceName) => `// FILE: ${serviceName}/index.js

import dotenv from "dotenv";
import express from "express";
import { queues } from "../shared/queue.js";

dotenv.config();

const app = express();
app.use(express.json());

const SERVICE_NAME = "${serviceName}";
const THROTTLE_PER_MINUTE = parseInt(process.env.THROTTLE_PER_MINUTE || "600", 10);
const ENABLED = process.env.ENABLED !== "false";

let running = false;

app.get("/health", (req, res) => {
  res.json({ ok: true, service: SERVICE_NAME, enabled: ENABLED });
});

app.post("/control", (req, res) => {
  const { enabled, throttle } = req.body || {};
  if (typeof enabled === "boolean") {
    process.env.ENABLED = enabled ? "true" : "false";
  }
  if (typeof throttle === "number") {
    process.env.THROTTLE_PER_MINUTE = String(throttle);
  }
  res.json({
    service: SERVICE_NAME,
    enabled: process.env.ENABLED !== "false",
    throttle_per_minute: parseInt(process.env.THROTTLE_PER_MINUTE || "600", 10)
  });
});

async function enumerateOnce() {
  if (!ENABLED) return;

  // TODO: replace this with real enumeration logic per service.
  // For now, we push a dummy candidate into rawCandidates.
  const candidate = {
    v: 1,
    source: SERVICE_NAME,
    domain: \`\${SERVICE_NAME}-example-\${Date.now()}.com\`,
    discovered_at: new Date().toISOString()
  };

  await queues.rawCandidates.add("raw", candidate);
  console.log("[enumerator]", SERVICE_NAME, "queued", candidate.domain);
}

async function loop() {
  if (running) return;
  running = true;

  const intervalMs = Math.max(
    1000,
    Math.floor(60000 / parseInt(process.env.THROTTLE_PER_MINUTE || "600", 10))
  );

  console.log(
    "[enumerator]",
    SERVICE_NAME,
    "starting with interval",
    intervalMs,
    "ms"
  );

  setInterval(() => {
    if (process.env.ENABLED === "false") return;
    enumerateOnce().catch((err) => {
      console.error("[enumerator]", SERVICE_NAME, "error:", err.message);
    });
  }, intervalMs);
}

const port = process.env.PORT || {
  "enumerator-seeds": 4101,
  "enumerator-facebook": 4102,
  "enumerator-reverseip": 4103,
  "enumerator-bruteforce": 4104
}[SERVICE_NAME] || 4199;

app.listen(port, () => {
  console.log("[enumerator]", SERVICE_NAME, "listening on", port);
  loop();
});
`;

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function writeFile(p, content) {
  fs.writeFileSync(p, content, { encoding: "utf8" });
}

function main() {
  services.forEach((svc) => {
    const svcDir = path.join(root, svc);
    ensureDir(svcDir);

    const pkgPath = path.join(svcDir, "package.json");
    const idxPath = path.join(svcDir, "index.js");

    if (!fs.existsSync(pkgPath)) {
      writeFile(pkgPath, pkgTemplate(svc));
      console.log("Created", pkgPath);
    }

    if (!fs.existsSync(idxPath)) {
      writeFile(idxPath, indexTemplate(svc));
      console.log("Created", idxPath);
    }
  });

  console.log("Enumerator services bootstrapped.");
}

main();