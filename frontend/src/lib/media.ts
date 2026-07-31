export function resolveMediaUrl(
  url?: string | null,
  fallback = "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
): string {
  if (!url) return fallback;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  const apiBase = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
  )
    .replace(/\/api\/v1\/?$/, "")
    .replace(/\/api\/?$/, "");

  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${apiBase}${cleanPath}`;
}
