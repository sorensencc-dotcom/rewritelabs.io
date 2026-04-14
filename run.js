// File: run.js

import { runFullPipeline } from "./engine/autoPipeline.js";

async function main() {
  await runFullPipeline({
    enqueueLimit: 50,
    concurrency: 20,
  });
}

main();