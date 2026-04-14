//engine/category/score.js

const fp = require('./fingerprint');

module.exports = function score(normalized, category) {
  if (!normalized || !category) return 0;

  const nf = fp(normalized);
  const cf = fp(category.name);

  let score = 0;

  if (nf.root === cf.root) score += 0.6;
  if (nf.tokensOverlap > 0) score += nf.tokensOverlap * 0.1;
  if (nf.prefixMatch) score += 0.2;
  if (nf.suffixMatch) score += 0.1;

  return score;
};