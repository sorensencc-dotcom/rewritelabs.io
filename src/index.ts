import * as fs from "fs";
import * as path from "path";
import * as http from "http";

type ToolSchema = {
  name: string;
  description: string;
  input_schema: unknown;
  output_schema: unknown;
};

type ToolHandler = (input: any) => Promise<any>;

const ROOT = process.cwd();
const TOOLS_DIR = path.join(ROOT, "tools");

function loadTools(): ToolSchema[] {
  const files = fs.readdirSync(TOOLS_DIR).filter(f => f.endsWith(".json"));
  return files.map(file => {
    const full = path.join(TOOLS_DIR, file);
    const raw = fs.readFileSync(full, "utf8");
    return JSON.parse(raw) as ToolSchema;
  });
}

const tools = loadTools();

// Simple in‑memory registry: name -> handler
const handlers: Record<string, ToolHandler> = {
  "docs.list": async (input) => {
    const base = path.resolve(ROOT, input.path);
    const recursive = input.recursive !== false;
    const result: string[] = [];

    function walk(p: string) {
      const entries = fs.readdirSync(p, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(p, e.name);
        if (e.isDirectory()) {
          if (recursive) walk(full);
        } else {
          result.push(full);
        }
      }
    }

    walk(base);
    return { files: result };
  },

  "docs.open": async (input) => {
    const full = path.resolve(ROOT, input.path);
    const content = fs.readFileSync(full, "utf8");
    return { path: input.path, content };
  },

  "docs.save": async (input) => {
    const full = path.resolve(ROOT, input.path);
    fs.writeFileSync(full, input.content, "utf8");
    return { path: input.path, status: "ok" };
  },

  // Stubs for the rest — safe no‑ops you can fill in later
  "docs.validate": async () => ({ valid: true, errors: [], warnings: [] }),
  "docs.visualize_links": async () => ({ graph: [] }),
  "sweeper.enumerate": async (input) => handlers["docs.list"](input),
  "sweeper.classify": async (input) => ({
    classes: input.paths.map((p: string) => ({ path: p, type: "unknown", recommended_action: "none" }))
  }),
  "sweeper.run_pipeline": async (input) => ({
    results: input.targets.map((p: string) => ({ path: p, status: "skipped", changes: [] }))
  }),
  "sweeper.report": async () => ({
    summary: "no sweeps implemented yet",
    stats: { processed: 0, changed: 0, errors: 0 }
  }),
  "classify.files": async (input) => ({
    classes: input.paths.map((p: string) => ({ path: p, type: "unknown" }))
  }),
  "classify.request": async (input) => ({
    intent: "unknown",
    recommended_tool: "none"
  }),
  "classify.priority": async (input) => ({
    prioritized: input.items
  }),
  "system.healthcheck": async () => ({
    status: "ok",
    components: {
      tools: "ok",
      fs: "ok"
    }
  }),
  "system.exec": async () => {
    // Intentionally disabled for safety; wire in a whitelist later.
    return { exit_code: 1, stdout: "", stderr: "system.exec not implemented" };
  },
  "system.logs": async () => ({ entries: [] }),
  "system.inspect": async () => ({ tasks: [] })
};

type RpcRequest = {
  tool: string;
  input: any;
};

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/tool") {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  let body = "";
  req.on("data", chunk => (body += chunk));
  req.on("end", async () => {
    try {
      const parsed = JSON.parse(body) as RpcRequest;
      const handler = handlers[parsed.tool];
      if (!handler) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: `Unknown tool: ${parsed.tool}` }));
        return;
      }
      const output = await handler(parsed.input || {});
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, output }));
    } catch (err: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: String(err?.message || err) }));
    }
  });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
server.listen(PORT, () => {
  console.log(`MCP-style server listening on http://localhost:${PORT}`);
  console.log(`Tools loaded: ${tools.map(t => t.name).join(", ")}`);
});
