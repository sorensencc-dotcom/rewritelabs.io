// FILE: C:\Users\soren\rewritelabs.io\discovery\deployer\index.js

import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";
import { db, testDB } from "../shared/db.js";

dotenv.config();

const app = express();
app.use(express.json());

// POST /deploy
// body: { candidate_id, domain, html, css, js }
app.post("/deploy", async (req, res) => {
  const { candidate_id, domain, html, css, js } = req.body;

  // TODO: integrate with real hosting (Netlify, Vercel, custom)
  // Example placeholder for Netlify-like API:
  // const deployRes = await fetch("https://api.netlify.com/api/v1/sites", { ... });

  console.log("[deployer] Received deploy request for", domain);

  await db.query(
    `UPDATE candidate
     SET status = 'deployed', last_seen = NOW()
     WHERE id = $1`,
    [candidate_id]
  );

  res.json({
    ok: true,
    domain,
    hosting_url: `https://modern.${domain}`, // placeholder
    notes: "Deployment pipeline TODO: wire to real provider"
  });
});

const port = process.env.PORT || 4015;
app.listen(port, async () => {
  console.log("[deployer] listening on", port);
  await testDB();
});