/**
 * Mengubah path file relatif (mis. "/uploads/xxx.pdf") menjadi full URL
 * menggunakan BASE_URL dari env. Jika sudah berupa URL absolut (http/https),
 * dikembalikan apa adanya.
 */
const DEFAULT_BASE_URL = "https://pelaporan.ppns.ac.id";

export function toAbsoluteUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  if (/^https?:\/\//i.test(relativePath)) return relativePath;

  const base = (process.env.BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const path = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return `${base}${path}`;
}
