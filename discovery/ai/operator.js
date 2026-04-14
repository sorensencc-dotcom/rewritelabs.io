// FILE: C:\Users\soren\rewritelabs.io\discovery\ai\operator.js

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMMA_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemma-4-27b-it" });

export async function operatorBrain({ sweeps, nodes, shards, candidates }) {
  const prompt = `
You are the operator brain for a distributed discovery engine.

Given system metrics, produce:
- summary
- anomalies
- recommended actions
- priority queue

Data:
${JSON.stringify({ sweeps, nodes, shards, candidates }, null, 2)}
`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}