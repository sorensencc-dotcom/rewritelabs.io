//engine/category/infer.js

const normalize = require('./normalize');
const expand = require('./expand');
const registry = require('./registry');

module.exports = function inferCategoryFromText(text) {
  const norm = normalize(text);
  const tokens = norm.split(' ').filter(Boolean);

  const cats = registry.getAll();
  const scores = [];

  for (const cat of cats) {
    const ex = expand(cat);
    let s = 0;

    for (const token of tokens) {
      if (ex.includes(token)) s += 1;
    }

    if (s > 0) {
      scores.push({ category: cat.name, score: s });
    }
  }

  scores.sort((a, b) => b.score - a.score);

  return scores[0] || null;
};