// File: engine/enrich.js

import { URL } from "url";

export function enrichResult(classified) {
  let hostname = null;
  let tld = null;
  let pathDepth = 0;

  try {
    const u = new URL(classified.url);
    hostname = u.hostname;
    const parts = hostname.split(".");
    tld = parts.length > 1 ? parts[parts.length - 1] : null;
    pathDepth = u.pathname.split("/").filter(Boolean).length;
  } catch {
    hostname = null;
    tld = null;
    pathDepth = 0;
  }

  const hasDeprecated = Array.isArray(classified.deprecatedTags)
    ? classified.deprecatedTags.length > 0
    : false;
  const isResponsive = !!classified.responsive;

  return {
    url: classified.url,
    hostname,
    tld,
    pathDepth,
    isWordPress: classified.isWordPress,
    isOutdated: classified.isOutdated,
    wordpressVersion: classified.wordpressVersion,
    hasDeprecated,
    isResponsive,
  };
}