// FILE: C:\Users\soren\rewritelabs.io\discovery\shared\queue.js

import { Queue } from "bullmq";
import IORedis from "ioredis";

// --------------------------------------
// Redis Connection
// --------------------------------------
const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379
});

// --------------------------------------
// Queues used by all enumerators
// --------------------------------------
export const queues = {
  rawCandidates: new Queue("rawCandidates", { connection })
};