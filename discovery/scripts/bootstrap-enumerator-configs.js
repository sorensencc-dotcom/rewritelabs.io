// FILE: scripts/bootstrap-enumerator-configs.js

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

const defaultConfig = {
  enabled: true,
  throttle_per_minute: 600,
  burst_mode: false,
  burst_multiplier: 5,
  kill_switch: false,
  log_level: "info"
};

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function writeFile(p, content) {
  fs.writeFileSync(p, content, { encoding: "utf8" });
}

function main() {
  services.forEach((svc) => {
    const svcDir = path.join(root, svc);
    const cfgPath = path.join(svcDir, "config.json");

    ensureDir(svcDir);

    if (!fs.existsSync(cfgPath)) {
      writeFile(cfgPath, JSON.stringify(defaultConfig, null, 2));
      console.log("Created", cfgPath);
    } else {
      console.log("Exists", cfgPath);
    }
  });

  console.log("Enumerator configs bootstrapped.");
}

main();