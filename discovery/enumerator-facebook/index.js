// FILE: C:\Users\soren\rewritelabs.io\discovery\enumerator-facebook\index.js

import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { queues } from "../shared/queue.js";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const SERVICE_NAME = "enumerator-facebook";
const configPath = path.join(__dirname, "config.json");

// -------------------------------
// Config load + hot reload
// -------------------------------
let config = JSON.parse(fs.readFileSync(configPath, "utf8"));

function reloadConfig() {
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (err) {
    console.error(`[${SERVICE_NAME}] Failed to reload config:`, err.message);
  }
}

setInterval(reloadConfig, 5000); // hot reload every 5s

// -------------------------------
// Helpers
// -------------------------------
function isFacebookUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.hostname === "facebook.com" || u.hostname.endsWith(".facebook.com");
  } catch {
    return false;
  }
}

function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return null;
  }
}

async function followRedirects(url, maxHops = 5) {
  let current = url;
  for (let i = 0; i < maxHops; i++) {
    const res = await fetch(current, {
      method: "GET",
      redirect: "manual"
    });

    // 3xx redirect
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      const loc = res.headers.get("location");
      try {
        const next = new URL(loc, current).toString();
        current = next;
        continue;
      } catch {
        break;
      }
    }

    return { finalUrl: current, status: res.status };
  }
  return { finalUrl: current, status: null };
}

// Very simple HTML contact extraction (public info only)
function extractPublicContact(html) {
  const lower = html.toLowerCase();
  const contact = {};

  const emailMatch = lower.match(
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i
  );
  if (emailMatch) contact.email = emailMatch[0];

  const phoneMatch = lower.match(
    /(\+?\d[\d\-\s().]{6,}\d)/ // very loose phone pattern
  );
  if (phoneMatch) contact.phone = phoneMatch[0];

  return contact;
}

// -------------------------------
// Express API
// -------------------------------
const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: SERVICE_NAME,
    config
  });
});

app.post("/control", (req, res) => {
  const updates = req.body || {};
  const newCfg = { ...config, ...updates };
  fs.writeFileSync(configPath, JSON.stringify(newCfg, null, 2));
  config = newCfg;
  res.json({ ok: true, config: newCfg });
});

// -------------------------------
// Source of candidate URLs
// -------------------------------
// In a real system, this would be:
// - public business directories
// - other enumerators
// - seed lists
// For now, we use a simple rotating list you can replace later.
const seedFacebookCandidates = [
  "https://www.facebook.com/Starbucks",
  "https://www.facebook.com/McDonalds",
  "https://www.facebook.com/BestBuy",
  "https://www.facebook.com/Target",
  "https://www.facebook.com/Walmart"
];

let seedIndex = 0;
function getNextSeed() {
  const url = seedFacebookCandidates[seedIndex % seedFacebookCandidates.length];
  seedIndex++;
  return url;
}

// -------------------------------
// Core enumeration logic
// -------------------------------
async function enumerateOnce() {
  if (config.kill_switch) return;
  if (!config.enabled) return;

  // 1) Get a candidate URL (from seeds / directories / etc.)
  const candidateUrl = getNextSeed();

  // 2) Follow redirects to see if it ends on Facebook or starts as Facebook
  const { finalUrl } = await followRedirects(candidateUrl);

  const startsAsFacebook = isFacebookUrl(candidateUrl);
  const endsAsFacebook = isFacebookUrl(finalUrl);

  if (!startsAsFacebook && !endsAsFacebook) {
    // Not a Facebook‑as‑website case; skip for now
    return;
  }

  // 3) Fetch the final URL HTML (public page only)
  let html = "";
  try {
    const res = await fetch(finalUrl, { method: "GET" });
    if (res.ok) {
      html = await res.text();
    }
  } catch (err) {
    console.error(`[${SERVICE_NAME}] fetch error:`, err.message);
  }

  // 4) Extract public contact info from HTML (if any)
  const contact = html ? extractPublicContact(html) : {};

  // 5) Build raw candidate record
  const domain = extractDomain(candidateUrl) || extractDomain(finalUrl);

  const rawCandidate = {
    v: 1,
    source: SERVICE_NAME,
    discovered_at: new Date().toISOString(),
    original_url: candidateUrl,
    final_url: finalUrl,
    is_facebook_start: startsAsFacebook,
    is_facebook_end: endsAsFacebook,
    domain,
    contact: {
      email: contact.email || null,
      phone: contact.phone || null
    },
    // Hosting / DNS enrichment can be added later in the rawCandidates worker
    hosting: null
  };

  // 6) Push into rawCandidates queue
  await queues.rawCandidates.add("raw", rawCandidate);
  console.log(`[${SERVICE_NAME}] queued`, rawCandidate.domain, rawCandidate.final_url);
}

// -------------------------------
// Throttle + burst mode
// -------------------------------
function startLoop() {
  const baseInterval = Math.max(
    1000,
    Math.floor(60000 / config.throttle_per_minute)
  );

  const effectiveInterval = config.burst_mode
    ? baseInterval / Math.max(1, config.burst_multiplier)
    : baseInterval;

  console.log(
    `[${SERVICE_NAME}] starting loop: ${effectiveInterval}ms interval`
  );

  setInterval(() => {
    if (config.kill_switch) return;
    if (!config.enabled) return;
    enumerateOnce().catch((err) =>
      console.error(`[${SERVICE_NAME}] error:`, err.message)
    );
  }, effectiveInterval);
}

// -------------------------------
// Start service
// -------------------------------
const port = process.env.PORT || 4102;
app.listen(port, () => {
  console.log(`[${SERVICE_NAME}] listening on ${port}`);
  startLoop();
});