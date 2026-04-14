// FILE: C:\Users\soren\rewritelabs.io\discovery\ai\rewrite.js

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMMA_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemma-4-27b-it" });

export async function rewrite({ html, domain }) {
  const prompt = `
Rewrite this website into a modern, clean, mobile-first design.
Output:
{
  "html": "...",
  "css": "...",
  "js": "...",
  "notes": "..."
}

Original HTML:
${html}
`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}