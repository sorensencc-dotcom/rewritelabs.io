//engine/category/merge.js

const normalize = require('./normalize');

module.exports = function mergeCategories(list) {
  const map = new Map();

  for (const c of list) {
    const key = normalize(c.name);
    if (!map.has(key)) {
      map.set(key, { name: c.name, aliases: new Set(), sources: new Set() });
    }
    const entry = map.get(key);
    if (c.aliases) c.aliases.forEach(a => entry.aliases.add(a));
    if (c.source) entry.sources.add(c.source);
  }

  return Array.from(map.values()).map(x => ({
    name: x.name,
    aliases: Array.from(x.aliases),
    sources: Array.from(x.sources)
  }));
};