import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';

console.log("=== Rewrite MCP Test Suite ===");

const files = readdirSync('./tests').filter(f => f.endsWith('.test.js'));

for (const file of files) {
  console.log(`\n--- Running: ${file} ---`);
  const p = spawn('node', ['--test', `./tests/${file}`], { stdio: 'inherit' });
}
