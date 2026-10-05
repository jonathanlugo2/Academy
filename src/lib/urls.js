// true si `value` es una URL absoluta https (los enlaces adjuntos no admiten otros esquemas)
export function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}
