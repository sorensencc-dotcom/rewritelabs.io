// FILE: discovery/sweeper/lib/techDetector.js
// VERSION: v1.0.0
// DATE: 2026-05-11
// PURPOSE: Deterministic tech stack detection from raw HTML + response headers.
//          Zero dependencies. ESM-only. Runs before AI classify to pre-filter
//          modern sites and eliminate wasted AI API calls.

/**
 * @typedef {Object} TechFingerprint
 * @property {string|null} cms          - Detected CMS (wordpress, joomla, drupal, squarespace, wix, shopify, weebly, godaddy, null)
 * @property {string[]}    js_libs      - Detected JS libraries (jquery, angularjs, backbone, mootools, prototype, modernizr)
 * @property {string[]}    css_frameworks - Detected CSS frameworks (bootstrap3, bootstrap4, foundation)
 * @property {string[]}    signals      - Raw legacy signals detected
 * @property {number}      legacy_score - 0.0–1.0. >= 0.5 = likely rewrite target.
 */

const PATTERNS = {
  cms: {
    wordpress:   [/wp-content\//i, /wp-includes\//i, /wp-json/i, /wordpress/i],
    joomla:      [/\/components\/com_/i, /Joomla!/i, /\/media\/jui\//i],
    drupal:      [/Drupal\.settings/i, /drupal\.js/i, /\/sites\/default\/files\//i, /data-drupal/i],
    squarespace: [/static\.squarespace\.com/i, /squarespace\.com\/s\//i],
    wix:         [/wixstatic\.com/i, /wix\.com\/lpvideo/i, /X-Wix-/i],
    shopify:     [/cdn\.shopify\.com/i, /Shopify\.theme/i, /shopify\.com\/s\/files/i],
    weebly:      [/weebly\.com/i, /editmysite\.com/i],
    godaddy:     [/godaddy\.com/i, /secureserver\.net/i, /websitebuilder\.com/i],
  },
  js_libs: {
    jquery:      [/jquery[-.](\d+\.\d+)/i, /jquery\.min\.js/i, /jquery\.js/i],
    angularjs:   [/angular\.min\.js/i, /ng-app=/i, /ng-controller=/i, /angularjs/i],
    backbone:    [/backbone\.js/i, /backbone\.min\.js/i],
    mootools:    [/mootools/i],
    prototype:   [/prototype\.js/i, /scriptaculous/i],
    modernizr:   [/modernizr/i],
  },
  css_frameworks: {
    bootstrap3:  [/bootstrap\.min\.css/i, /bootstrap\.css/i, /\"bootstrap\"/i],
    bootstrap4:  [/bootstrap@4/i, /bootstrap\/4\./i],
    foundation:  [/foundation\.min\.css/i, /foundation\.css/i],
  },
  legacy_signals: {
    flash:       [/<object[^>]+classid="clsid:D27CDB6E/i, /\.swf["'\s]/i, /ShockwaveFlash/i],
    table_layout:[/<table[^>]*>\s*<tr[^>]*>\s*<td/i],
    php_urls:    [/href="[^"]+\.php/i, /action="[^"]+\.php/i],
    old_doctype: [/<!DOCTYPE HTML PUBLIC "-\/\/W3C\/\/DTD HTML 4/i, /XHTML 1\.0/i],
    meta_generator_old: [/<meta[^>]+generator[^>]+(WordPress 2|WordPress 3|WordPress 4|Joomla! 1|Joomla! 2|Drupal 6|Drupal 7)/i],
  }
};

// Score weights — tune as lead quality data comes in
const WEIGHTS = {
  cms_legacy:      { wordpress: 0.25, joomla: 0.35, drupal: 0.30, godaddy: 0.20, weebly: 0.15 },
  cms_builder:     { squarespace: 0.10, wix: 0.10, shopify: 0.05 },
  js_libs:         { jquery: 0.15, angularjs: 0.20, backbone: 0.10, mootools: 0.20, prototype: 0.25, modernizr: 0.10 },
  css_frameworks:  { bootstrap3: 0.15, bootstrap4: 0.05, foundation: 0.05 },
  legacy_signals:  { flash: 0.30, table_layout: 0.15, php_urls: 0.10, old_doctype: 0.15, meta_generator_old: 0.25 },
};

/**
 * Extracts jQuery version from HTML if present.
 * @param {string} html
 * @returns {string|null} e.g. "1.11.3" or null
 */
function extractJQueryVersion(html) {
  const match = html.match(/jquery[-.](\d+\.\d+\.?\d*)(\.min)?\.js/i)
    || html.match(/jquery\/(\d+\.\d+\.?\d*)\//i)
    || html.match(/jquery@(\d+\.\d+\.?\d*)/i);
  return match ? match[1] : null;
}

/**
 * Clamp a number to [0, 1].
 * @param {number} n
 * @returns {number}
 */
function clamp(n) {
  return Math.min(1, Math.max(0, n));
}

/**
 * Detect tech stack from raw HTML and optional response headers.
 *
 * @param {string} html              - Raw HTML body
 * @param {Record<string,string>} [headers={}] - HTTP response headers (lowercase keys)
 * @returns {TechFingerprint}
 */
export function detectTech(html, headers = {}) {
  const signals = [];
  let score = 0;

  // ── CMS detection ──────────────────────────────────────────────────────────
  let cms = null;
  const headerStr = Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  const combined = html + '\n' + headerStr;

  for (const [name, patterns] of Object.entries(PATTERNS.cms)) {
    if (patterns.some(p => p.test(combined))) {
      cms = name;
      const w = WEIGHTS.cms_legacy[name] ?? WEIGHTS.cms_builder[name] ?? 0;
      score += w;
      signals.push(`cms:${name}`);
      break; // take first match — CMSes don't stack
    }
  }

  // ── JS libraries ───────────────────────────────────────────────────────────
  const js_libs = [];
  for (const [name, patterns] of Object.entries(PATTERNS.js_libs)) {
    if (patterns.some(p => p.test(combined))) {
      js_libs.push(name);
      score += WEIGHTS.js_libs[name] ?? 0;
      signals.push(`js:${name}`);

      // Extra penalty for old jQuery (< 2.x)
      if (name === 'jquery') {
        const ver = extractJQueryVersion(html);
        if (ver) {
          const major = parseInt(ver.split('.')[0], 10);
          if (major < 2) {
            score += 0.10;
            signals.push('js:jquery_v1');
          }
        }
      }
    }
  }

  // ── CSS frameworks ─────────────────────────────────────────────────────────
  const css_frameworks = [];
  for (const [name, patterns] of Object.entries(PATTERNS.css_frameworks)) {
    if (patterns.some(p => p.test(combined))) {
      css_frameworks.push(name);
      score += WEIGHTS.css_frameworks[name] ?? 0;
      signals.push(`css:${name}`);
    }
  }

  // ── Legacy signals ─────────────────────────────────────────────────────────
  for (const [name, patterns] of Object.entries(PATTERNS.legacy_signals)) {
    if (patterns.some(p => p.test(combined))) {
      score += WEIGHTS.legacy_signals[name] ?? 0;
      signals.push(`legacy:${name}`);
    }
  }

  // ── X-Powered-By header ────────────────────────────────────────────────────
  const powered = headers['x-powered-by'] || '';
  if (/php/i.test(powered)) {
    score += 0.05;
    signals.push('header:php');
  }
  if (/asp\.net/i.test(powered)) {
    score += 0.05;
    signals.push('header:aspnet');
  }

  return {
    cms,
    js_libs,
    css_frameworks,
    signals,
    legacy_score: clamp(parseFloat(score.toFixed(3))),
  };
}
