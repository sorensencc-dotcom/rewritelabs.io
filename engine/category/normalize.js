//engine/category/normalize.js

module.exports = function normalize(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9 ]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};