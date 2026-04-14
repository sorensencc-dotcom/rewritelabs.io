module.exports = {
  baseUrl: "https://overpass-api.de/api/interpreter",
  userAgent: "RewriteLabs-Enumerator-OSM/2026.04",
  timeoutMs: 15000,
  connectTimeoutMs: 6000,
  maxBytes: 250000,
  minBackoffMs: 500,
  maxBackoffMs: 5000,
  maxRetries: 3,
  cacheTtlMs: 24 * 60 * 60 * 1000,
  bboxByZip: {
    "33602": [ -82.459, 27.944, -82.445, 27.960 ],
    "33603": [ -82.470, 27.973, -82.445, 28.010 ],
    "33604": [ -82.470, 28.010, -82.435, 28.050 ],
    "33605": [ -82.460, 27.940, -82.430, 27.970 ]
  },
  osmKeyByCategory: {
    plumber: { key: "craft", value: "plumber" },
    roofer: { key: "craft", value: "roofer" },
    electrician: { key: "craft", value: "electrician" },
    dentist: { key: "amenity", value: "dentist" },
    hvac: { key: "craft", value: "hvac" },
    landscaping: { key: "craft", value: "gardener" },
    "cleaning service": { key: "office", value: "cleaning" },
    accountant: { key: "office", value: "accountant" },
    solicitor: { key: "office", value: "lawyer" },
    barber: { key: "shop", value: "hairdresser" },
    restaurant: { key: "amenity", value: "restaurant" },
    "auto repair": { key: "shop", value: "car_repair" }
  }
};
