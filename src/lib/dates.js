const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

// Convierte una fecha de columna `date` ('YYYY-MM-DD') en un Date a medianoche
// LOCAL. `new Date('YYYY-MM-DD')` la interpreta como UTC y, en husos horarios
// negativos, se muestra el día anterior.
export function parseLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const match = DATE_ONLY_RE.exec(value);
  if (match) {
    const [, y, m, d] = match.map(Number);
    return new Date(y, m - 1, d);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value, fallback = '') {
  const date = parseLocalDate(value);
  return date ? date.toLocaleDateString('es-ES') : fallback;
}
