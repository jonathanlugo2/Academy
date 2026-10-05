const LEGACY_PUBLIC_PREFIX = '/storage/v1/object/public/support-attachments/';

// Los adjuntos nuevos se guardan como ruta de Storage; los antiguos como URL
// pública del bucket (que ya no es público). Devuelve la ruta dentro del
// bucket, o null si es un enlace externo.
export function attachmentStoragePath(url) {
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return url;
  const index = url.indexOf(LEGACY_PUBLIC_PREFIX);
  return index >= 0 ? decodeURIComponent(url.slice(index + LEGACY_PUBLIC_PREFIX.length)) : null;
}
