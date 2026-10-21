import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const website = path.resolve(root, '..', 'website');
const require = createRequire(path.join(root, 'package.json'));
const React = require('react');
const { renderToString } = require('react-dom/server');

const ROOT_OPEN = '<div id="root">';
const CREATE_ROOT = "ReactDOM.createRoot(document.getElementById('root')).render(";
const HYDRATE_ROOT = "ReactDOM.hydrateRoot(document.getElementById('root'),";

// Pages are React apps whose inline script mounts one tree into #root. Run that
// script against a stub ReactDOM to capture the tree, then render it to markup.
export function prerender(html, dir = website) {
  const open = html.indexOf(ROOT_OPEN);
  if (open === -1) return null;
  const innerStart = open + ROOT_OPEN.length;
  const firstScript = html.indexOf('<script', innerStart);
  const rootClose = html.lastIndexOf('</div>', firstScript);
  if (rootClose < innerStart) throw new Error('could not find the end of #root');

  const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
  const inline = scripts.find((m) => !/\ssrc=/.test(m[1]) && (m[2].includes(CREATE_ROOT) || m[2].includes(HYDRATE_ROOT)));
  if (!inline) throw new Error('no inline script mounts into #root');

  let tree;
  const ctx = {
    React,
    console,
    document: { getElementById: () => ({}) },
    ReactDOM: {
      createRoot: () => ({ render: (el) => (tree = el) }),
      hydrateRoot: (_el, el) => (tree = el),
    },
    addEventListener: () => {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const m of scripts) {
    const src = /\ssrc="([^"]+)"/.exec(m[1])?.[1];
    if (!src || /^https?:/.test(src)) continue;
    vm.runInContext(fs.readFileSync(path.join(dir, src), 'utf8'), ctx, { filename: src });
  }
  vm.runInContext(inline[2], ctx, { filename: 'inline' });
  if (!tree) throw new Error('inline script never called render()');

  const markup = renderToString(tree);
  const script = inline[0].replace(CREATE_ROOT, HYDRATE_ROOT);
  return (
    html.slice(0, innerStart) + markup + html.slice(rootClose, inline.index) + script +
    html.slice(inline.index + inline[0].length)
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  let stale = 0;
  for (const file of fs.readdirSync(website).filter((f) => f.endsWith('.html'))) {
    const full = path.join(website, file);
    const before = fs.readFileSync(full, 'utf8');
    const after = prerender(before);
    if (after === null || after === before) continue;
    if (check) {
      console.error(`stale prerender: website/${file}`);
      stale++;
    } else {
      fs.writeFileSync(full, after);
      console.log(`prerendered website/${file}`);
    }
  }
  if (stale) process.exit(1);
}
