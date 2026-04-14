import * as cheerio from "cheerio";

export function fingerprintHtml({ url, html }) {
  const result = {
    url,
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

  const $ = cheerio.load(html);

  const generator = $('meta[name="generator"]').attr("content") || null;
  result.tech.meta_generator = generator;

  if (generator && generator.toLowerCase().includes("wordpress")) {
    result.tech.wordpress = true;
    const version = generator.replace(/[^0-9.]/g, "").trim() || null;
    result.tech.wordpress_version = version || null;
  }

  const htmlLower = html.toLowerCase();
  if (
    htmlLower.includes("/wp-content/") ||
    htmlLower.includes("/wp-includes/") ||
    htmlLower.includes("/wp-admin/")
  ) {
    result.tech.wordpress = true;
  }

  $('script[src]').each((_, el) => {
    const src = $(el).attr("src");
    if (!src) return;
    result.tech.scripts.push(src);

    if (src.toLowerCase().includes("jquery")) {
      const match = src.match(/jquery-(\d+\.\d+\.\d+)/);
      if (match) result.tech.jquery_version = match[1];
    }

    const verMatch = src.match(/ver=([0-9.]+)/);
    if (verMatch && result.tech.wordpress_version === null) {
      result.tech.wordpress_version = verMatch[1];
    }
  });

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

  const viewport = $('meta[name="viewport"]').attr("content");
  if (viewport && viewport.includes("width=device-width")) {
    result.tech.responsive = true;
  }

  const deprecated = ["font", "center", "marquee"];
  deprecated.forEach(tag => {
    if ($(tag).length > 0) result.tech.deprecated_tags.push(tag);
  });

  return result;
}