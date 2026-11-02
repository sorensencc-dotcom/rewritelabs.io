import { handleSweepRequest as baseline } from './sweepRequests_baseline.js';
import { handleSweepRequest as optimized } from './sweepRequests_optimized.js';

async function runBenchmark(name, fn) {
  const job = { data: { level: 'continent', sweep_id: 'test-123' } };
  const iterations = 50;

  // Warm up
  for(let i=0; i<5; i++) await fn(job);

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await fn(job);
  }
  const end = performance.now();

  console.log(`[${name}] Total time for ${iterations} iterations: ${(end - start).toFixed(2)}ms`);
  console.log(`[${name}] Average time per request: ${((end - start) / iterations).toFixed(2)}ms`);
}

async function main() {
  console.log("Running baseline...");
  await runBenchmark("Baseline", baseline);

  console.log("\nRunning optimized...");
  await runBenchmark("Optimized", optimized);
}
main().catch(console.error);
