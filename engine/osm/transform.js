// File: engine/osm/transform.js
// Transform Overpass JSON into internal business objects

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function transformResponse(parsed, zip, category) {
  if (!parsed || !Array.isArray(parsed.elements)) return [];

  return parsed.elements
    .filter(el => el.tags && (el.tags.name || el.tags["addr:housenumber"]))
    .map(el => {
      const tags = el.tags || {};
      const lat = safeNumber(el.lat || (el.center && el.center.lat));
      const lon = safeNumber(el.lon || (el.center && el.center.lon));

      const address = {
        line1: [
          tags["addr:housenumber"] || "",
          tags["addr:street"] || ""
        ].filter(Boolean).join(" "),
        city: tags["addr:city"] || "",
        state: tags["addr:state"] || "",
        postcode: tags["addr:postcode"] || zip || ""
      };

      return {
        source: "OSM",
        osmId: `${el.type}/${el.id}`,
        name: tags.name || "",
        phone: tags["contact:phone"] || tags.phone || "",
        website: tags["contact:website"] || tags.website || "",
        address,
        location: { lat, lon },
        zip: address.postcode || zip || "",
        category: category || null,
        rawTags: tags
      };
    });
}