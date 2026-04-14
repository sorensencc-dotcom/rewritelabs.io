// FILE: C:\Users\soren\rewritelabs.io\discovery\ai\classify.js

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMMA_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemma-4-9b-it" });

export async function classify({ html, domain }) {
  const prompt = `
You are a web intelligence classifier.

Given the HTML of a website, return:
- vertical (dentist, lawyer, plumber, restaurant, etc.)
- tech stack (CMS, framework)
- modernization score (0-1)
- rewrite priority (low, medium, high)

HTML:
${html}
`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}