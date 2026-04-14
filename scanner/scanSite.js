// scanner/scanSite.js

import fetch from "node-fetch";
import * as cheerio from "cheerio";

export async function scanSite(url) {
  const result = {
    url,
    tech: {
      wordpress_version: null,
      jquery_version: null,
      bootstrap_version: null,
      responsive: false,
      deprecated_tags: [],
    },
    performance: {
      html_size_kb: null,
      load_time_ms: null,
    },
    score: 0,
    reason: [],
  };

  const start = Date.now();
  let html;

  try {
    const res = await fetch(url, { timeout: 8000 });
    html = await res.text();
    result.performance.html_size_kb = (html.length / 1024).toFixed(1);
  } catch (err) {
    result.reason.push("Site unreachable");
    return result;
  }

  result.performance.load_time_ms = Date.now() - start;

  const $ = cheerio.load(html);

  // --- WordPress Version ---
  const wpMeta = $('meta[name="generator"]').attr("content");
  if (wpMeta && wpMeta.includes("WordPress")) {
    const version = wpMeta.replace("WordPress ", "").trim();
    result.tech.wordpress_version = version;

    if (parseFloat(version) < 5.0) {
      result.reason.push("Outdated WordPress version");
      result.score += 30;
    }
  }

  // --- jQuery Version ---
  $('script[src]').each((_, el) => {
    const src = $(el).attr("src");
    if (src && src.includes("jquery")) {
      const match = src.match(/jquery-(\d+\.\d+\.\d+)/);
      if (match) {
        const version = match[1];
        result.tech.jquery_version = version;

        if (parseFloat(version) < 3.0) {
          result.reason.push("Outdated jQuery version");
          result.score += 20;
        }
      }
    }
  });

  // --- Bootstrap Version ---
  $('link[href], script[src]').each((_, el) => {
    const href = $(el).attr("href") || $(el).attr("src");
    if (href && href.includes("bootstrap")) {
      const match = href.match(/bootstrap(?:\.min)?\.css.*?(\d+\.\d+\.\d+)/);
      if (match) {
        const version = match[1];
        result.tech.bootstrap_version = version;

        if (parseFloat(version) < 4.0) {
          result.reason.push("Outdated Bootstrap version");
          result.score += 20;
        }
      }
    }
  });

  // --- Responsive Check ---
  const viewport = $('meta[name="viewport"]').attr("content");
  if (viewport && viewport.includes("width=device-width")) {
    result.tech.responsive = true;
  } else {
    result.reason.push("Not mobile responsive");
    result.score += 25;
  }

  // --- Deprecated Tags ---
  const deprecated = ["font", "center", "marquee"];
  deprecated.forEach(tag => {
    if ($(tag).length > 0) {
      result.tech.deprecated_tags.push(tag);
      result.reason.push(`Uses deprecated <${tag}> tag`);
      result.score += 10;
    }
  });

  // --- Performance Flags ---
  if (result.performance.html_size_kb > 500) {
    result.reason.push("Large HTML payload");
    result.score += 10;
  }

  if (result.performance.load_time_ms > 3000) {
    result.reason.push("Slow initial response");
    result.score += 10;
  }

  return result;
}