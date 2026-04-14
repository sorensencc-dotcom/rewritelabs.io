import { fingerprintSite } from "./techFingerprint.js";

export async function scanWordPressOutdated(url) {
  const fp = await fingerprintSite(url);

  const version = fp.tech.wordpress_version
    ? parseFloat(fp.tech.wordpress_version)
    : null;

  const isWP = fp.tech.wordpress;
  const isOutdated = isWP && version !== null && version < 5.0;

  return {
    url: fp.url,
    isWordPress: isWP,
    wordpressVersion: fp.tech.wordpress_version,
    isOutdated,
    responsive: fp.tech.responsive,
    jqueryVersion: fp.tech.jquery_version,
    bootstrapVersion: fp.tech.bootstrap_version,
    deprecatedTags: fp.tech.deprecated_tags,
    headers: fp.headers,
  };
}