export const GENERAL_POST_TYPE = "general";
const LEGACY_GENERAL_POST_TYPE = "blank";

export const STATIC_POST_TAGS = [
  "Affiliate Marketing",
  "CPA",
  "CPL",
  "PPC",
  "SEO",
  "Lead Gen",
  "E-commerce",
  "Influencer",
  "Content Marketing",
  "Email Marketing",
  "Social Media",
  "Display Ads",
  "Networking",
  "Partnership",
  "SaaS",
];

export function isGeneralPostType(tag) {
  return !tag || tag === GENERAL_POST_TYPE || tag === LEGACY_GENERAL_POST_TYPE;
}

export function normalizePostType(tag) {
  return isGeneralPostType(tag) ? GENERAL_POST_TYPE : tag;
}

export function normalizePostTag(raw) {
  return raw.trim().replace(/^#+/, "").replace(/\s+/g, "");
}

export function parsePostHashtags(postDescription) {
  if (!postDescription?.trim()) return [];

  const matches = postDescription.match(/#[\w-]+/gi);
  if (!matches) return [];

  const seen = new Set();
  const tags = [];

  for (const match of matches) {
    const label = match.slice(1);
    const key = label.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      tags.push(label);
    }
  }

  return tags;
}

export function formatTagsForPostDescription(tags) {
  if (!tags.length) return "";
  return tags.map((t) => `#${normalizePostTag(t)}`).join(" ");
}
