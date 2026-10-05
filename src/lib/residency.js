import { parseLocalDate } from './dates';

// En España se es residente fiscal al superar 183 días en el territorio durante
// el AÑO NATURAL (art. 9 LIRPF).
export const RESIDENCY_THRESHOLD_DAYS = 183;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function utcDay(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

// Días de estancia desde la fecha de llegada hasta hoy (ambos incluidos) menos
// las ausencias registradas.
// PENDIENTE (decisión de producto): la norma cuenta por AÑO NATURAL, pero
// `absences` es un único valor sin año. Acotar el cómputo al año en curso exige
// antes guardar las ausencias por año (ver Plan de Mejora, 4.1).
export function calculateResidencyDays(arrivalDate, absences = 0, today = new Date()) {
  const arrival = parseLocalDate(arrivalDate);
  if (!arrival || arrival > today) return 0;

  const daysInSpain = Math.round((utcDay(today) - utcDay(arrival)) / MS_PER_DAY) + 1;
  return Math.max(0, daysInSpain - (Number(absences) || 0));
}

export function residencyProgress(days) {
  return Math.min(100, (days / RESIDENCY_THRESHOLD_DAYS) * 100);
}

export function isFiscalResident(days) {
  return days >= RESIDENCY_THRESHOLD_DAYS;
}
