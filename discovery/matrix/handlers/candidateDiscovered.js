// FILE: C:\Users\soren\rewritelabs.io\discovery\matrix\handlers\candidateDiscovered.js

import { db } from "../../shared/db.js";

function buildTechKey(tech, ssl, mobileScore) {
  const cms = tech?.cms || tech?.stack || "unknown";
  const version = tech?.version || "0";
  const mobile = mobileScore < 0.5 ? "mobile_bad" : "mobile_ok";
  const sslKey = ssl ? "ssl" : "no_ssl";
  return `${cms}_${version}_${sslKey}_${mobile}`;
}

export async function handleCandidateDiscovered(job) {
  const msg = job.data;

  const vertical = msg.category_guess || msg.vertical || "unknown";
  const geo_key = msg.region
    ? `${msg.country}-${msg.region}`
    : msg.country;

  const tech_key = buildTechKey(
    msg.tech_fingerprint,
    msg.ssl,
    msg.mobile_score
  );

  await db.query(
    `INSERT INTO category_index (candidate_id, vertical, geo_key, tech_key)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT DO NOTHING`,
    [msg.candidate_id, vertical, geo_key, tech_key]
  );

  console.log("[matrix] Indexed candidate:", msg.domain);
}