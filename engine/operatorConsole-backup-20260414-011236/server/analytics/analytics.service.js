export function getAnalyticsDump() {
  return {
    totalRequests: 123,
    uniqueDomains: 45,
    avgResponseMs: 87,
    requestsByHour: { "09": 10, "10": 20 },
    topCategories: { "Restaurants": 12, "Plumbers": 8 },
    topZips: { "33602": 5, "33606": 3 },
    topDomains: { "example.com": 7 }
  };
}
