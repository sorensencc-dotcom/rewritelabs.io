// FILE: discovery/sweeper/handlers/shardAssignments.js
// VERSION: v1.1.0
// DATE: 2026-05-11
// CHANGES: Wired in deterministic techDetector pre-filter.
//          fetchHtml now returns headers. detectTech runs before AI classify.
//          Domains with legacy_score < 0.3 are skipped — no AI call made.
//          tech_fingerprint is now detector output (deterministic), not AI guess.

import fetch from "node-fetch";
import { db } from "../../shared/db.js";
import { queues } from "../../shared/queue.js";
import { detectTech } from "../lib/techDetector.js";

// Minimum legacy_score to proceed to AI classify + DB insert.
// Sites below this threshold are modern enough to skip.
const LEGACY_SCORE_THRESHOLD = 0.3;

async function fetchHtml(url) {
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow", timeout: 10000 });
    const text = await res.text();
    // Normalize headers to lowercase keys for consistent pattern matching
    const headers = {};
    res.headers.forEach((value, key) => { headers[key.toLowerCase()] = value; });
    return { ok: true, status: res.status, body: text, headers };
  } catch {
    return { ok: false };
  }
}

async function aiClassify(html, domain) {
  const res = await fetch("http://localhost:4020/classify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html, domain })
  });
  return res.ok ? res.json() : null;
}

async function aiRewrite(html, domain) {
  const res = await fetch("http://localhost:4020/rewrite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html, domain })
  });
  return res.ok ? res.json() : null;
}

async function deployRewrite(candidate_id, domain, rewrite) {
  const res = await fetch("http://localhost:4015/deploy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      candidate_id,
      domain,
      html: rewrite.html,
      css: rewrite.css,
      js: rewrite.js
    })
  });
  return res.ok ? res.json() : null;
}

async function crawlDomain(domain) {
  const url = `http://${domain}`;
  const res = await fetchHtml(url);
  if (!res.ok) return null;

  const html = res.body || "";
  const headers = res.headers || {};

  // 1) Deterministic tech detection — zero cost, runs on already-fetched HTML
  const tech_fingerprint = detectTech(html, headers);

  console.log(`[sweeper] ${domain} legacy_score=${tech_fingerprint.legacy_score} cms=${tech_fingerprint.cms} signals=${tech_fingerprint.signals.join(',') || 'none'}`);

  // 2) Pre-filter: skip modern sites — no AI call, no DB insert
  if (tech_fingerprint.legacy_score < LEGACY_SCORE_THRESHOLD) {
    console.log(`[sweeper] ${domain} skipped — below legacy threshold (${tech_fingerprint.legacy_score})`);
    return null;
  }

  // 3) AI classify for vertical + rewrite priority
  //    We no longer use ai.tech — tech_fingerprint is authoritative
  const ai = await aiClassify(html, domain);

  const category_guess = ai?.vertical || "unknown";
  const mobile_score = ai?.modernization_score ?? 0.3;
  const ssl = headers['strict-transport-security'] != null || url.startsWith('https');

  // 4) Rewrite if AI flags high priority AND legacy score confirms target quality
  let deployed_url = null;

  if (ai?.rewrite_priority === "high" && tech_fingerprint.legacy_score >= 0.5) {
    const rewrite = await aiRewrite(html, domain);
    if (rewrite) {
      const deploy = await deployRewrite(null, domain, rewrite);
      deployed_url = deploy?.hosting_url || null;
    }
  }

  return {
    domain,
    country: "US",
    region: "FL",
    category_guess,
    tech_fingerprint,   // deterministic — cms, js_libs, css_frameworks, signals, legacy_score
    mobile_score,
    ssl,
    deployed_url
  };
}

async function crawlShard(spec) {
  const sampleDomains = [
    `example-${spec.start}.com`,
    `example-${spec.end}.com`
  ];

  const results = [];
  for (const d of sampleDomains) {
    const site = await crawlDomain(d);
    if (site) results.push(site);
  }
  return results;
}

export async function handleShardAssignment(job) {
  const msg = job.data;

  const sites = await crawlShard(msg.spec);

  for (const site of sites) {
    const { rows } = await db.query(
      `INSERT INTO candidate (id, domain, country_id, region, category_guess,
                              tech_fingerprint, mobile_score, ssl, last_sweep_id, deployed_url)
       VALUES (gen_random_uuid(), $1,
         (SELECT id FROM country WHERE code = $2),
         $3, $4, $5::jsonb, $6, $7, $8, $9)
       ON CONFLICT (domain) DO UPDATE
         SET last_seen     = NOW(),
             tech_fingerprint = EXCLUDED.tech_fingerprint,
             deployed_url  = EXCLUDED.deployed_url
       RETURNING id`,
      [
        site.domain,
        site.country,
        site.region,
        site.category_guess,
        JSON.stringify(site.tech_fingerprint),
        site.mobile_score,
        site.ssl,
        msg.sweep_id,
        site.deployed_url
      ]
    );

    const candidate_id = rows[0].id;

    await queues.candidateDiscovered.add("discovered", {
      v: 1,
      candidate_id,
      ...site,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      sweep_id: msg.sweep_id
    });
  }

  await db.query(
    `UPDATE shard SET status = 'completed', updated_at = NOW() WHERE id = $1`,
    [msg.shard_id]
  );

  console.log(`[sweeper] Completed shard: ${msg.shard_id} — ${sites.length} candidates inserted`);
}
