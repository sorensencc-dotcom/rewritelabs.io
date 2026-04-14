// File: engine/ai/aiClient.js

/**
 * Unified AI Client for Rewrite Labs
 *
 * Supports:
 *   - OpenAI API (default)
 *   - Azure OpenAI (if AZURE_OPENAI_ENDPOINT is set)
 *   - Anthropic (if ANTHROPIC_API_KEY is set)
 *
 * Provides a single function:
 *   generateWithAI(prompt: string) -> Promise<string>
 *
 * This keeps the rest of the system decoupled from vendor details.
 */

import fs from "fs";
import path from "path";

// -------------------------------
// Environment
// -------------------------------

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY || "";
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

const MODEL = process.env.AI_MODEL || "gpt-4o-mini"; // default, override as needed

// -------------------------------
// Vendor Detection
// -------------------------------

function usingAzure() {
  return AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_KEY;
}

function usingAnthropic() {
  return ANTHROPIC_API_KEY && !usingAzure();
}

function usingOpenAI() {
  return OPENAI_API_KEY && !usingAzure() && !usingAnthropic();
}

// -------------------------------
// Azure OpenAI Client
// -------------------------------

async function callAzureOpenAI(prompt) {
  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${MODEL}/chat/completions?api-version=2024-02-15-preview`;

  const body = {
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2048,
    temperature: 0.2
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": AZURE_OPENAI_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Azure OpenAI error: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json.choices[0].message.content;
}

// -------------------------------
// OpenAI Client
// -------------------------------

async function callOpenAI(prompt) {
  const url = "https://api.openai.com/v1/chat/completions";

  const body = {
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2048,
    temperature: 0.2
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json.choices[0].message.content;
}

// -------------------------------
// Anthropic Client
// -------------------------------

async function callAnthropic(prompt) {
  const url = "https://api.anthropic.com/v1/messages";

  const body = {
    model: "claude-3-sonnet-20240229",
    max_tokens: 2048,
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }]
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic error: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json.content[0].text;
}

// -------------------------------
// Unified Entry Point
// -------------------------------

export async function generateWithAI(prompt) {
  if (usingAzure()) {
    console.log("🤖 Using Azure OpenAI");
    return await callAzureOpenAI(prompt);
  }

  if (usingAnthropic()) {
    console.log("🤖 Using Anthropic");
    return await callAnthropic(prompt);
  }

  if (usingOpenAI()) {
    console.log("🤖 Using OpenAI");
    return await callOpenAI(prompt);
  }

  throw new Error("No AI provider configured. Set OPENAI_API_KEY, AZURE_OPENAI_KEY, or ANTHROPIC_API_KEY.");
}