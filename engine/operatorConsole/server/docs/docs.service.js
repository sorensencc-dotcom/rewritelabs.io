// C:\Users\soren\rewritelabs.io\engine\operatorConsole\server\docs\docs.service.js

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import lunr from "lunr";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import * as tf from "@tensorflow/tfjs-node";

const DOCS_ROOT = path.join(process.cwd(), "docs");

let semanticModel = null;
let vectorStore = [];
let lunrIndex = null;

export async function initDocsEngine() {
  semanticModel = await use.load();

  const versions = fs.readdirSync(DOCS_ROOT);
  const docs = [];

  versions.forEach(version => {
    const files = fs.readdirSync(path.join(DOCS_ROOT, version));

    files.forEach(file => {
      const raw = fs.readFileSync(path.join(DOCS_ROOT, version, file), "utf8");
      const parsed = matter(raw);

      docs.push({
        version,
        file,
        content: parsed.content,
        metadata: parsed.data
      });
    });
  });

  const embeddings = await semanticModel.embed(docs.map(d => d.content));
  const vectors = embeddings.arraySync();

  vectorStore = docs.map((doc, i) => ({
    ...doc,
    vector: vectors[i]
  }));

  lunrIndex = lunr(function () {
    this.ref("id");
    this.field("title");
    this.field("body");
    this.field("tags");

    docs.forEach((doc, i) => {
      this.add({
        id: i,
        title: doc.file,
        body: doc.content,
        tags: (doc.metadata.tags || []).join(" ")
      });
    });
  });
}

export function semanticSearch(query, limit = 10) {
  const queryEmbedding = semanticModel.embed([query]);
  const queryVector = queryEmbedding.arraySync()[0];

  const scores = vectorStore.map(doc => ({
    doc,
    score: cosineSimilarity(doc.vector, queryVector)
  }));

  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.doc);
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function keywordSearch(query) {
  const results = lunrIndex.search(query);
  return results.map(r => vectorStore[r.ref]);
}

export function extractTOC(content) {
  return content.match(/^#{1,6}.+/gm) || [];
}

export function integrityCheck(doc) {
  const issues = [];

  if (!doc.metadata.tags) issues.push("Missing tags");
  if (!doc.metadata.summary) issues.push("Missing summary");
  if (!doc.metadata.updated) issues.push("Missing updated date");

  const links = doc.content.match(/

\[

\[(.*?)\]

\]

/g);
  if (links) {
    links.forEach(link => {
      const file = link.replace("[[", "").replace("]]", "");
      const exists = vectorStore.find(d => d.file === file);
      if (!exists) issues.push(`Broken link: ${file}`);
    });
  }

  return issues;
}
