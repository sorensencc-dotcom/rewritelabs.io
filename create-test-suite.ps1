# create-test-suite.ps1
# Operator-grade test suite generator for rewrite-mcp

$root = "C:\Users\soren\google-drive-mcp\rewrite-mcp"
$testDir = Join-Path $root "tests"

Write-Host "Creating test suite at $testDir"

# Ensure tests directory exists
if (!(Test-Path $testDir)) {
    New-Item -ItemType Directory -Path $testDir | Out-Null
}

# ------------------------------
# run-tests.js
# ------------------------------
@"
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';

console.log("=== Rewrite MCP Test Suite ===");

const files = readdirSync('./tests').filter(f => f.endsWith('.test.js'));

for (const file of files) {
  console.log(`\n--- Running: ${file} ---`);
  const p = spawn('node', ['--test', `./tests/${file}`], { stdio: 'inherit' });
}
"@ | Set-Content "$testDir/run-tests.js"

# ------------------------------
# enumerator.test.js
# ------------------------------
@"
import test from 'node:test';
import assert from 'node:assert';
import { runEnumerator } from '../src/enumerator.js';

test('Enumerator returns results', async () => {
  const results = await runEnumerator();
  assert.ok(Array.isArray(results));
  assert.ok(results.length > 0);
});
"@ | Set-Content "$testDir/enumerator.test.js"

# ------------------------------
# sweeper.test.js
# ------------------------------
@"
import test from 'node:test';
import assert from 'node:assert';
import { sweep } from '../src/sweeper.js';

test('Sweeper normalizes enumerator output', async () => {
  const input = [{ url: 'http://example.com', score: 1 }];
  const out = await sweep(input);
  assert.ok(out[0].normalized === true);
});
"@ | Set-Content "$testDir/sweeper.test.js"

# ------------------------------
# pipeline.test.js
# ------------------------------
@"
import test from 'node:test';
import assert from 'node:assert';
import { runPipeline } from '../src/pipeline.js';

test('Pipeline runs end-to-end', async () => {
  const result = await runPipeline();
  assert.ok(result.success === true);
});
"@ | Set-Content "$testDir/pipeline.test.js"

# ------------------------------
# loader-resolver-index.test.js
# ------------------------------
@"
import test from 'node:test';
import assert from 'node:assert';
import { load } from '../src/loader.js';
import { resolve } from '../src/resolver.js';
import { index } from '../src/index.js';

test('Loader → Resolver → Index chain works', async () => {
  const loaded = await load({ url: 'http://example.com' });
  const resolved = await resolve(loaded);
  const indexed = await index(resolved);

  assert.ok(indexed.id);
  assert.ok(indexed.timestamp);
});
"@ | Set-Content "$testDir/loader-resolver-index.test.js"

# ------------------------------
# artifacts.test.js
# ------------------------------
@"
import test from 'node:test';
import assert from 'node:assert';
import { writeArtifact } from '../src/artifacts.js';
import { existsSync } from 'node:fs';

test('Artifacts are written to disk', async () => {
  const path = await writeArtifact('test-output', { ok: true });
  assert.ok(existsSync(path));
});
"@ | Set-Content "$testDir/artifacts.test.js"

# ------------------------------
# error-handling.test.js
# ------------------------------
@"
import test from 'node:test';
import assert from 'node:assert';
import { runPipeline } from '../src/pipeline.js';

test('Pipeline handles errors gracefully', async () => {
  const result = await runPipeline({ forceError: true });
  assert.ok(result.errorHandled === true);
});
"@ | Set-Content "$testDir/error-handling.test.js"

Write-Host "Test suite created successfully."