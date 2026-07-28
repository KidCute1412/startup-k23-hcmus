/**
 * Converts a Vietnamese string to an SEO-friendly URL slug.
 */
export function slugify(text?: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove Vietnamese accents
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric chars
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-");
}

/**
 * Generates an SEO-friendly gear detail URL path e.g. /gears/chuot-logitech-g-pro-x-superlight-2--30000000-0000-...
 */
export function getGearDetailUrl(id: string, name?: string): string {
  if (!id) return "/gears";
  const slug = slugify(name);
  return slug ? `/gears/${slug}--${id}` : `/gears/${id}`;
}

/**
 * Extracts UUID gear ID from route parameter string (supports both slug--id and raw id formats).
 */
export function extractGearId(param: string): string {
  if (!param) return "";
  if (param.includes("--")) {
    const parts = param.split("--");
    const potentialId = parts[parts.length - 1];
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(potentialId)) {
      return potentialId;
    }
  }
  return param;
}
