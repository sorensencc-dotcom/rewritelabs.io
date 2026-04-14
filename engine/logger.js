// File: engine/logger.js

import fs from "fs/promises";
import path from "path";

export function logInfo(msg) {
  console.log(`[INFO] ${new Date().toISOString()} ${msg}`);
}

export function logWarn(msg) {
  console.log(`[WARN] ${new Date().toISOString()} ${msg}`);
}

export function logSkip(msg) {
  console.log(`[SKIP] ${new Date().toISOString()} ${msg}`);
}

export function logSuccess(msg) {
  console.log(`[OK]   ${new Date().toISOString()} ${msg}`);
}

export function logFail(msg) {
  console.log(`[FAIL] ${new Date().toISOString()} ${msg}`);
}

export function progressBar(label, current, total) {
  const width = 20;
  const ratio = total === 0 ? 1 : current / total;
  const filled = Math.round(ratio * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  process.stdout.write(`\r${label} [${bar}] ${current}/${total}`);
  if (current === total) process.stdout.write("\n");
}

const LOG_DIR = path.join("data", "logs");

export async function appendDailyLog(line) {
  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(LOG_DIR, `sweep-${date}.log`);
  await fs.mkdir(LOG_DIR, { recursive: true });
  await fs.appendFile(file, line + "\n", "utf8");
}