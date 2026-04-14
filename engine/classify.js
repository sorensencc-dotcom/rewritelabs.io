// File: engine/classify.js

export function classifyFingerprint(fp) {
  const version = fp.tech.wordpress_version
    ? parseFloat(fp.tech.wordpress_version)
    : null;

  const isWordPress = fp.tech.wordpress;
  const isOutdated = isWordPress && version !== null && version < 5.0;

  return {
    url: fp.url,
    isWordPress,
    wordpressVersion: fp.tech.wordpress_version,
    isOutdated,
    responsive: fp.tech.responsive,
    jqueryVersion: fp.tech.jquery_version,
    bootstrapVersion: fp.tech.bootstrap_version,
    deprecatedTags: fp.tech.deprecated_tags,
    tech: fp.tech,
  };
}