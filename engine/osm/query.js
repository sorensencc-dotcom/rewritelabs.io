// File: engine/osm/query.js
// BBox-based Overpass QL with category → tag mapping

import { getBBox } from "./bbox/loader.js";

const CATEGORY_TAG_RULES = [
  { category: "restaurants", key: "amenity", values: ["restaurant", "fast_food"] },
  { category: "cafes",       key: "amenity", values: ["cafe"] },
  { category: "bars",        key: "amenity", values: ["bar", "pub"] },
  { category: "groceries",   key: "shop",    values: ["supermarket", "convenience"] },
  { category: "salons",      key: "shop",    values: ["hairdresser", "beauty"] },
  { category: "pharmacies",  key: "amenity", values: ["pharmacy"] },
  { category: "healthcare",  key: "amenity", values: ["clinic", "doctors", "dentist"] }
];

function findRuleForCategory(category) {
  if (!category) return null;
  const lc = category.toLowerCase();
  return CATEGORY_TAG_RULES.find(r => r.category === lc) || null;
}

export async function buildOverpassQuery(zip, category, regionOverride) {
  const bbox = await getBBox(zip, regionOverride);
  if (!bbox) return null;

  const [s, w, n, e] = bbox;
  const bboxStr = `${s},${w},${n},${e}`;

  const rule = findRuleForCategory(category);

  if (!rule) {
    return `
[out:json][timeout:25];
(
  node["amenity"](${bboxStr});
  way["amenity"](${bboxStr});
  relation["amenity"](${bboxStr});
);
out center;
`;
  }

  const filters = rule.values
    .map(v => `node["${rule.key}"="${v}"](${bboxStr});
  way["${rule.key}"="${v}"](${bboxStr});
  relation["${rule.key}"="${v}"](${bboxStr});`)
    .join("\n");

  return `
[out:json][timeout:25];
(
  ${filters}
);
out center;
`;
}