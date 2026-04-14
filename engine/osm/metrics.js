// File: engine/osm/metrics.js

export function now() {
  return performance.now();
}

export function diffMs(start) {
  return Math.round(performance.now() - start);
}