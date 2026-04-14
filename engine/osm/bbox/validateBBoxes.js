//engine/osm/bbox/validateBBoxes.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const regions = ["us", "ca", "uk", "eu", "latam", "asia", "oceania", "africa"];

function validateFile(region) {
  const file = path.join(__dirname, `${region}.json`);
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing bbox file: ${region}.json`);
    return false;
  }

  try {
    const raw = fs.readFileSync(file, "utf8");
    const json = JSON.parse(raw);

    for (const [k, v] of Object.entries(json)) {
      if (!Array.isArray(v) || v.length !== 4) {
        console.error(`❌ Invalid bbox for ${region}:${k}`);
        

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const regions = ["us", "ca", "uk", "eu", "latam", "asia", "oceania", "africa"];

function validateFile(region) {
  const file = path.join(__dirname, `${region}.json`);
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing bbox file: ${region}.json`);
    return false;
  }

  try {
    const raw = fs.readFileSync(file, "utf8");
    const json = JSON.parse(raw);

    for (const [k, v] of Object.entries(json)) {
      if (!Array.isArray(v) || v.length !== 4) {
        console.error(`❌ Invalid bbox for ${region}:${k}`);
        return false;
      }
    }

    console.log(`✔ ${region}.json OK`);
    return true;
  } catch (err) {
    console.error(`❌ Error reading ${region}.json:`, err.message);
    return false;
  }
}

function main() {
  let ok = true;
  for (const r of regions) {
    if (!validateFile(r)) ok = false;
  }
  if (!ok) process.exit(1);
}

main();