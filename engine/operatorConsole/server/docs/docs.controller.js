// C:\Users\soren\rewritelabs.io\engine\operatorConsole\server\docs\docs.controller.js

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  initDocsEngine,
  semanticSearch,
  keywordSearch,
  extractTOC,
  integrityCheck
} from "./docs.service.js";

const ROOT = path.resolve(__dirname, "..", "..");
const DOCS_ROOT = path.join(ROOT, "docs");

export async function initDocs(req, res) {
  await initDocsEngine();
  res.json({ status: "Docs engine initialized" });
}

export function listDocs(req, res) {
  const versions = fs.readdirSync(DOCS_ROOT);
  const result = versions.map(v => ({
    version: v,
    files: fs.readdirSync(path.join(DOCS_ROOT, v))
  }));
  res.json(result);
}

export function getDoc(req, res) {
  const { version, name } = req.params;
  const filePath = path.join(DOCS_ROOT, version, name);

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);

    res.json({
      version,
      name,
      content: parsed.content,
      metadata: parsed.data,
      toc: extractTOC(parsed.content),
      issues: integrityCheck({
        metadata: parsed.data,
        content: parsed.content
      })
    });
  } catch {
    res.status(404).json({ error: "Doc not found" });
  }
}

export function searchKeyword(req, res) {
  const { q } = req.query;
  res.json(keywordSearch(q));
}

export function searchSemantic(req, res) {
  const { q } = req.query;
  res.json(semanticSearch(q));
}
