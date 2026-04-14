//engine/category/registry.js

const fs = require('fs');
const path = require('path');

const REG_PATH = path.join(__dirname, 'categories.json');

let cache = null;

function load() {
  if (cache) return cache;
  if (!fs.existsSync(REG_PATH)) return [];
  cache = JSON.parse(fs.readFileSync(REG_PATH, 'utf8'));
  return cache;
}

module.exports = {
  getAll() {
    return load();
  },
  add(cat) {
    const all = load();
    all.push(cat);
    fs.writeFileSync(REG_PATH, JSON.stringify(all, null, 2));
  },
  replaceAll(list) {
    cache = list;
    fs.writeFileSync(REG_PATH, JSON.stringify(list, null, 2));
  }
};