// File: engine/discovery/categories.js

/**
 * Centralized category list for all sweepers.
 * This file is intentionally simple so AI or operators
 * can expand, refine, or regenerate the list safely.
 */

export const DEFAULT_CATEGORIES = [
  "plumber",
  "roofer",
  "electrician",
  "dentist",
  "hvac",
  "landscaping",
  "cleaning service",
  "accountant",
  "solicitor",
  "barber",
  "restaurant",
  "auto repair"
];

/**
 * Apply category filtering from CLI args or environment variables.
 * Supports:
 *   --categories plumber,roofer
 *   CATEGORY_FILTER=plumber,roofer
 */
export function applyCategoryFilter(categories, rawFilter) {
  if (!rawFilter) return categories;

  const filterList = rawFilter
    .split(",")
    .map(c => c.trim().toLowerCase())
    .filter(Boolean);

  const filtered = categories.filter(cat =>
    filterList.includes(cat.toLowerCase())
  );

  console.log("Category filter applied:", filtered);
  return filtered;
}