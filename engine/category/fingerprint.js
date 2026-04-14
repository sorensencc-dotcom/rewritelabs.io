//engine/category/fingerprint.js

module.exports = function fingerprint(str) {
  const tokens = str.split(' ').filter(Boolean);

  return {
    root: tokens[0] || '',
    tokens,
    tokensOverlap: 0, // filled by score engine
    prefixMatch: false,
    suffixMatch: false
  };
};