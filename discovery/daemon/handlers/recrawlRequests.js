// FILE: C:\Users\soren\rewritelabs.io\discovery\daemon\handlers\recrawlRequests.js

import fetch from "node-fetch";
import { db } from "../../shared/db.js";
import { queues } from "../../shared/queue.js";

async function probe(domain) {
  try {
    const res = await fetch(`http://${domain}`, { method: "GET", redirect: "follow", timeout: 10000 });
    const text = await res.text();
    return { alive: true, status: res.status, body: text };
  } catch {
    return { alive: false };
  }
}

async function classifyWithAI(html, domain) {
  try {
    const res = await fetch("http://localhost:4020/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html, domain })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function handleRecrawlRequest(job) {
  const msg = job.data;

  const res = await probe(msg.domain);

  if (!res.alive) {
    await db.query(
      `UPDATE candidate
       SET status = 'invalid', last_seen = NOW()
       WHERE id = $1`,
      [msg.candidate_id]
    );

    await queues.candidateInvalid.add("invalid", {
      v: 1,
      candidate_id: msg.candidate_id,
      domain: msg.domain,
      reason: "domain_dead",
      timestamp: new Date().toISOString()
    });

    console.log("[daemon] Candidate invalid:", msg.domain);
    return;
  }

  const ai = await classifyWithAI(res.body || "", msg.domain);
  const modernized = ai?.modernization_score >= 0.8;
  const new_state = {
    modernization_score: ai?.modernization_score ?? 0.4,
    vertical: ai?.vertical || "unknown",
    tech: ai?.tech || {}
  };

  if (modernized) {
    await db.query(
      `UPDATE candidate
       SET status = 'graduated', last_seen = NOW()
       WHERE id = $1`,
      [msg.candidate_id]
    );

    await queues.candidateGraduated.add("graduated", {
      v: 1,
      candidate_id: msg.candidate_id,
      domain: msg.domain,
      reason: "modernized",
      timestamp: new Date().toISOString()
    });

    console.log("[daemon] Candidate graduated:", msg.domain);
    return;
  }

  await queues.candidateUpdated.add("updated", {
    v: 1,
    candidate_id: msg.candidate_id,
    domain: msg.domain,
    old_state: {},
    new_state,
    timestamp: new Date().toISOString()
  });

  console.log("[daemon] Candidate updated:", msg.domain);
}