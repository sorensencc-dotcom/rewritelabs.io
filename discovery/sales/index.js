// FILE: C:\Users\soren\rewritelabs.io\discovery\sales\index.js

import dotenv from "dotenv";
import express from "express";
import { db } from "../shared/db.js";
import { createCheckoutLink, handleStripeWebhook } from "./stripe.js";
import { generateEmail, sendEmail } from "./outreach.js";

dotenv.config();

const app = express();
app.use(express.json());

// Stripe webhook needs raw body
app.use("/stripe/webhook", express.raw({ type: "application/json" }));

// 1) Create Stripe checkout link
app.post("/checkout", async (req, res) => {
  const { candidate_id } = req.body;

  const { rows } = await db.query(
    `SELECT domain, deployed_url FROM candidate WHERE id = $1`,
    [candidate_id]
  );

  if (!rows.length) return res.status(404).json({ error: "Candidate not found" });

  const { domain, deployed_url } = rows[0];

  const url = await createCheckoutLink({
    domain,
    candidate_id,
    deployed_url
  });

  await db.query(
    `UPDATE candidate SET checkout_url = $1 WHERE id = $2`,
    [url, candidate_id]
  );

  res.json({ checkout_url: url });
});

// 2) Send outreach email
app.post("/outreach", async (req, res) => {
  const { candidate_id, to } = req.body;

  const { rows } = await db.query(
    `SELECT domain, deployed_url, checkout_url, tech_fingerprint 
     FROM candidate WHERE id = $1`,
    [candidate_id]
  );

  if (!rows.length) return res.status(404).json({ error: "Candidate not found" });

  const { domain, deployed_url, checkout_url, tech_fingerprint } = rows[0];

  const issues = [
    `Outdated tech: ${JSON.stringify(tech_fingerprint)}`,
    `Modernized version available: ${deployed_url}`
  ];

  const email = await generateEmail({
    domain,
    issues,
    checkout_url
  });

  const ok = await sendEmail({
    to,
    subject: email.subject,
    body: email.body
  });

  if (ok) {
    await db.query(
      `UPDATE candidate SET outreach_sent = NOW() WHERE id = $1`,
      [candidate_id]
    );
  }

  res.json({ sent: ok });
});

// 3) Stripe webhook
app.post("/stripe/webhook", handleStripeWebhook);

const port = process.env.PORT || 4018;
app.listen(port, () => {
  console.log("[sales] listening on", port);
});