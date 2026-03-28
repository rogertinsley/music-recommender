/**
 * Strips HTML tags and the trailing "Read more on Last.fm" from a bio string.
 */
export function stripBio(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/Read more on Last\.fm\.?\s*$/i, "")
    .trim();
}
