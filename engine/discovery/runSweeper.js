// File: engine/discovery/runSweeper.js

import { sweepGlobal } from "./globalSweeper.js";

async function main() {
  console.log("Starting global sweeper...");
  await sweepGlobal({});
  console.log("Global sweeper finished.");
}

main().catch(err => {
  console.error("Sweeper crashed:", err);
  process.exit(1);
});