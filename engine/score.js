// File: engine/score.js

export function scoreSite(classified, enriched) {
  let score = 0;
  const reasons = [];

  if (classified.isWordPress) {
    score += 20;
    reasons.push("WordPress site");
  }

  if (classified.isOutdated) {
    score += 50;
    reasons.push("Outdated WordPress version");
  }

  if (!enriched.isResponsive) {
    score += 15;
    reasons.push("Not responsive");
  }

  if (enriched.hasDeprecated) {
    score += 10;
    reasons.push("Uses deprecated HTML tags");
  }

  if (enriched.tld === "com") {
    score += 5;
    reasons.push("Commercial TLD (.com)");
  }

  if (enriched.pathDepth <= 1) {
    score += 5;
    reasons.push("Simple URL structure");
  }

  return {
    url: classified.url,
    score,
    reasons,
  };
}