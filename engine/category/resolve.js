//engine/category/resolve.js

const normalize = require('./normalize');
const registry = require('./registry');
const score = require('./score');

module.exports = function resolveCategory(input) {
  const norm = normalize(input);
  const candidates = registry.getAll();

  let best = null;
  let bestScore = 0;

  for (const cat of candidates) {
    const s = score(norm, cat);
    if (s > bestScore) {
      bestScore = s;
      best = cat;
    }
  }

  return {
    input,
    normalized: norm,
    resolved: best,
    score: bestScore
  };
};