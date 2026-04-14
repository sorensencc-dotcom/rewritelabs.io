// File: engine/osm/cache.js
// Simple in-memory cache keyed by zip:category

const store = new Map();

function key(zip, category) {
  return `${zip}::${category}`;
}

function get(zip, category) {
  return store.get(key(zip, category));
}

function set(zip, category, items) {
  store.set(key(zip, category), items);
}

function clear() {
  store.clear();
}

export default { get, set, clear };