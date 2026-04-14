// File: /scanner/techFingerprint.js
import fetch from "node-fetch";
import * as cheerio from "cheerio";

export async function fingerprintSite(url) {
  const result = {
    url,
    headers: {},
    tech: {
      wordpress: false,
      wordpress_version: null,
      jquery_version: null,
      bootstrap_version: null,
      responsive: false,
      deprecated_tags: [],
      scripts: [],
      stylesheets: [],
      meta_generator: null,
    },
  };

  let res;
  let html;

  try {
    res = await fetch(url, { timeout: 8000 });
    html = await res.text();
  } catch {
    return result;
  }

  // headers
  for (const [k, v] of res.headers.entries()) {
    result.headers[k.toLowerCase()] = v;
  }

  const $ = cheerio.load(html);

  // --- META GENERATOR ---
  const generator = $('meta[name="generator"]').attr("content") || null;
  result.tech.meta_generator = generator;

  if (generator && generator.toLowerCase().includes("wordpress")) {
    result.tech.wordpress = true;
    const version = generator.replace(/[^0-9.]/g, "").trim() || null;
    result.tech.wordpress_version = version || null;
  }

  // --- HTML PATH CHECKS ---
  const htmlLower = html.toLowerCase();
  if (
    htmlLower.includes("/wp-content/") ||
    htmlLower.includes("/wp-includes/") ||
    htmlLower.includes("/wp-admin/")
  ) {
    result.tech.wordpress = true;
  }

  // --- SCRIPTS ---
  $('script[src]').each((_, el) => {
    const src = $(el).attr("src");
    if (!src) return;
    result.tech.scripts.push(src);

    if (src.toLowerCase().includes("jquery")) {
      const match = src.match(/jquery-(\d+\.\d+\.\d+)/);
      if (match) result.tech.jquery_version = match[1];
    }

    // version from ?ver=4.9.8
    const verMatch = src.match(/ver=([0-9.]+)/);
    if (verMatch && result.tech.wordpress_version === null) {
      result.tech.wordpress_version = verMatch[1];
    }
  });

  // --- STYLESHEETS ---
  $('link[rel="stylesheet"][href]').each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    result.tech.stylesheets.push(href);

    if (href.toLowerCase().includes("bootstrap")) {
      const match = href.match(/bootstrap(?:\.min)?\.css.*?(\d+\.\d+\.\d+)/);
      if (match) result.tech.bootstrap_version = match[1];
    }

    const verMatch = href.match(/ver=([0-9.]+)/);
    if (verMatch && result.tech.wordpress_version === null) {
      result.tech.wordpress_version = verMatch[1];
    }
  });

  // --- RESPONSIVE ---
  const viewport = $('meta[name="viewport"]').attr("content");
  if (viewport && viewport.includes("width=device-width")) {
    result.tech.responsive = true;
  }

  // --- DEPRECATED TAGS ---
  const deprecated = ["font", "center", "marquee"];
  deprecated.forEach(tag => {
    if ($(tag).length > 0) result.tech.deprecated_tags.push(tag);
  });

  // --- WP JSON CHECK ---
  try {
    const wpJson = await fetch(url + "/wp-json/", { timeout: 5000 });
    if (wpJson.ok) {
      result.tech.wordpress = true;
    }
  } catch {}

  // --- WP README CHECK ---
  try {
    const readme = await fetch(url + "/readme.html", { timeout: 5000 });
    if (readme.ok) {
      const text = await readme.text();
      const match = text.match(/Version\s+([0-9.]+)/i);
      if (match) {
        result.tech.wordpress = true;
        result.tech.wordpress_version = match[1];
      }
    }
  } catch {}

  return result;
}