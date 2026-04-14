// FILE: C:\Users\soren\rewritelabs.io\discovery\sweeper\handlers\shardAssignments.js

import fetch from "node-fetch";
import { db } from "../../shared/db.js";
import { queues } from "../../shared/queue.js";

async function fetchHtml(url) {
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow", timeout: 10000 });
    const text = await res.text();
    return { ok: true, sta// FILE: C:\Users\soren\rewritelabs.io\discovery\sales\stripe.js

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckoutLink({ domain, candidate_id, deployed_url }) {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Modernized Website for ${domain}`,
            description: `Instant upgrade of ${domain}`,
          },
          unit_amount: 5000 // $50
        },
        quantity: 1
      }
    ],
    success_url: `${process.env.SALES_SUCCESS_URL}?domain=${domain}`,
    cancel_url: `${process.env.SALES_CANCEL_URL}?domain=${domain}`,
    metadata: {
      domain,
      candidate_id,
      deployed_url
    }
  });

  return session.url;
}

export async function handleStripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    console.log("[sales] Payment completed for:", session.metadata.domain);
    // TODO: update candidate status in DB
  }

  res.json({ received: true });
}tus: res.status, body: text };
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

  // 1) classify
  const ai = await aiClassify(html, domain);

  const category_guess = ai?.vertical || "unknown";
  const tech_fingerprint = ai?.tech || {};
  const mobile_score = ai?.modernization_score ?? 0.3;
  const ssl = false;

  // 2) rewrite if needed
  let deployed_url = null;

  if (ai?.rewrite_priority === "high") {
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
    tech_fingerprint,
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
         $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (domain) DO UPDATE
         SET last_seen = NOW(),
             deployed_url = EXCLUDED.deployed_url
       RETURNING id`,
      [
        site.domain,
        site.country,
        site.region,
        site.category_guess,
        site.tech_fingerprint,
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

  console.log("[sweeper] Completed shard:", msg.shard_id);
}