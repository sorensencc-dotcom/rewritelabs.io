// File: engine/osm/categoryAI.js
// Category Intelligence v2: multi-signal inference

const TAG_CATEGORY_RULES = [
  { key: "amenity", value: "restaurant", category: "restaurants" },
  { key: "amenity", value: "fast_food", category: "restaurants" },
  { key: "amenity", value: "cafe", category: "cafes" },
  { key: "amenity", value: "bar", category: "bars" },
  { key: "amenity", value: "pub", category: "bars" },
  { key: "shop", value: "supermarket", category: "groceries" },
  { key: "shop", value: "convenience", category: "groceries" },
  { key: "shop", value: "hairdresser", category: "salons" },
  { key: "shop", value: "beauty", category: "salons" },
  { key: "amenity", value: "pharmacy", category: "pharmacies" },
  { key: "amenity", value: "clinic", category: "healthcare" },
  { key: "amenity", value: "doctors", category: "healthcare" },
  { key: "amenity", value: "dentist", category: "healthcare" }
];

const NAME_KEYWORDS = [
  { pattern: /pizza/i, category: "restaurants" },
  { pattern: /grill/i, category: "restaurants" },
  { pattern: /cafe|coffee/i, category: "cafes" },
  { pattern: /bar|pub/i, category: "bars" },
  { pattern: /market|grocery|supermart/i, category: "groceries" },
  { pattern: /salon|barber|hair/i, category: "salons" },
  { pattern: /clinic|dental|doctor|pharmacy/i, category: "healthcare" }
];

function inferFromTags(tags) {
  if (!tags) return null;
  for (const rule of TAG_CATEGORY_RULES) {
    if (tags[rule.key] === rule.value) {
      return { category: rule.category, confidence: 0.8, signal: "osm_tags" };
    }
  }
  return null;
}

function inferFromName(name) {
  if (!name) return null;
  for (const rule of NAME_KEYWORDS) {
    if (rule.pattern.test(name)) {
      return { category: rule.category, confidence: 0.6, signal: "name" };
    }
  }
  return null;
}

export function inferCategories({ name, tags, inputCategory }) {
  const signals = [];

  const tagSignal = inferFromTags(tags);
  if (tagSignal) signals.push(tagSignal);

  const nameSignal = inferFromName(name);
  if (nameSignal) signals.push(nameSignal);

  if (inputCategory) {
    signals.push({
      category: inputCategory,
      confidence: 0.5,
      signal: "input"
    });
  }

  if (signals.length === 0) {
    return {
      primary: null,
      all: []
    };
  }

  const byCategory = new Map();
  for (const s of signals) {
    const prev = byCategory.get(s.category) || { category: s.category, confidence: 0, signals: [] };
    prev.confidence = Math.max(prev.confidence, s.confidence);
    prev.signals.push(s.signal);
    byCategory.set(s.category, prev);
  }

  const all = [...byCategory.values()].sort((a, b) => b.confidence - a.confidence);
  return {
    primary: all[0],
    all
  };
}