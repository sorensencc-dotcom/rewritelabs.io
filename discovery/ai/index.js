// FILE: C:\Users\soren\rewritelabs.io\discovery\ai\index.js

import dotenv from "dotenv";
import express from "express";
import { classify } from "./classify.js";
import { rewrite } from "./rewrite.js";
import { outreach } from "./outreach.js";
import { operatorBrain } from "./operator.js";

dotenv.config();

const app = express();
app.use(express.json());

app.post("/classify", async (req, res) => {
  const result = await classify(req.body);
  res.json(result);
});

app.post("/rewrite", async (req, res) => {
  const result = await rewrite(req.body);
  res.json(result);
});

app.post("/outreach", async (req, res) => {
  const result = await outreach(req.body);
  res.json(result);
});

app.post("/operator", async (req, res) => {
  const result = await operatorBrain(req.body);
  res.json(result);
});

const port = process.env.PORT || 4020;
app.listen(port, () => {
  console.log("[ai] listening on", port);
});