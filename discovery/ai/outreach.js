// FILE: C:\Users\soren\rewritelabs.io\discovery\ai\outreach.js

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMMA_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemma-4-9b-it" });

export async function outreach({ domain, issues }) {
  const prompt = `
Write a short, high-conversion outreach email to the owner of ${domain}.
Mention these issues:
${issues.join(", ")}

Output JSON:
{
  "subject": "...",
  "body": "..."
}
`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}