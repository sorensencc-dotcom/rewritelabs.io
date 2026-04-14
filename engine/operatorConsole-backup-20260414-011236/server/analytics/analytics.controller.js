import { getAnalyticsDump } from "./analytics.service.js";

export function dumpAnalytics(req, res) {
  const data = getAnalyticsDump();
  res.json(data);
}
