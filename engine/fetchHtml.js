// File: engine/fetchHtml.js

import { logInfo, logWarn, logError } from "./logger.js";

export async function fetchHtmlForUrl(url, timeoutMs = 8000) {
  logInfo(`fetching ${url}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    const contentType = res.headers.get("content-type") || "";

    if (!res.ok || !contentType.includes("text/html")) {
      logWarn(`non-html or bad status for ${url} (${res.status})`);
      return { ok: false, status: res.status, html: "", contentType };
    }

    const html = await res.text();
    logInfo(`fetched ${url} (${html.length} bytes)`);
    return { ok: true, status: res.status, html, contentType };
  } catch (err) {
    logError(`fetch failed for ${url}: ${err}`);
    return { ok: false, status: 0, html: "", error: String(err) };
  } finally {
    clearTimeout(timeout);
  }
}