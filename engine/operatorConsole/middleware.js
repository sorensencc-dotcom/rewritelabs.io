// engine/operatorConsole/middleware.js

import { sweepState, pushMetric } from "./api.js";

export function updateSweepState({ city, zip, category, pct }) {
  sweepState.currentCity = city;
  sweepState.currentZip = zip;
  sweepState.currentCategory = category;
  sweepState.progressPct = pct;
}

export function updateBreakerState(isOpen) {
  sweepState.osmBreakerOpen = isOpen;
}

export function recordMetric(m) {
  pushMetric(m);
}