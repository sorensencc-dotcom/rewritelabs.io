//engine/category/expand.js

module.exports = function expandCategory(cat) {
  const out = new Set();

  out.add(cat.name);

  if (cat.aliases) {
    for (const a of cat.aliases) out.add(a);
  }

  if (cat.name.includes(' ')) {
    const parts = cat.name.split(' ');
    for (const p of parts) out.add(p);
  }

  return Array.from(out);
};