import { parseLocalDate } from './dates';

// En España se es residente fiscal al permanecer MÁS de 183 días en el
// territorio durante el AÑO NATURAL (art. 9 LIRPF).
export const RESIDENCY_THRESHOLD_DAYS = 183;

// Solo las ausencias largas descuentan días; las cortas no son válidas para
// extranjería. La base de datos impone el mismo mínimo.
export const MIN_LONG_ABSENCE_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function utcDay(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

// Días entre dos fechas, ambas incluidas (0 si el intervalo está vacío)
function inclusiveDays(from, to) {
  if (from > to) return 0;
  return Math.round((utcDay(to) - utcDay(from)) / MS_PER_DAY) + 1;
}

function overlapDays(fromA, toA, fromB, toB) {
  const from = fromA > fromB ? fromA : fromB;
  const to = toA < toB ? toA : toB;
  return inclusiveDays(from, to);
}

export function absenceLengthDays(period) {
  const start = parseLocalDate(period?.startDate);
  const end = parseLocalDate(period?.endDate);
  return start && end ? inclusiveDays(start, end) : 0;
}

export function isLongAbsence(period) {
  return absenceLengthDays(period) >= MIN_LONG_ABSENCE_DAYS;
}

// Días de ausencia larga que caen dentro del intervalo [from, to]
function absenceDaysWithin(periods, from, to) {
  return (periods || [])
    .filter(isLongAbsence)
    .reduce((total, p) => total + overlapDays(parseLocalDate(p.startDate), parseLocalDate(p.endDate), from, to), 0);
}

// Días de ausencia larga dentro del año natural indicado
export function absenceDaysInYear(periods, year) {
  return absenceDaysWithin(periods, new Date(year, 0, 1), new Date(year, 11, 31));
}

// Ausencias que tocan el año indicado, ordenadas por fecha de salida
export function absencesInYear(periods, year) {
  return (periods || [])
    .filter(p => absenceDaysInYear([p], year) > 0)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

// Días de estancia en España durante el año natural `year`: desde el 1 de
// enero (o la llegada, si es posterior) hasta hoy (o el 31 de diciembre),
// menos las ausencias largas de ese tramo. Una ausencia que cruza de año se
// reparte entre ambos.
export function calculateResidencyDays(arrivalDate, absencePeriods = [], year, today = new Date()) {
  const arrival = parseLocalDate(arrivalDate);
  const targetYear = year ?? today.getFullYear();
  if (!arrival) return 0;

  const yearStart = new Date(targetYear, 0, 1);
  const yearEnd = new Date(targetYear, 11, 31);
  const from = arrival > yearStart ? arrival : yearStart;
  const to = today < yearEnd ? today : yearEnd;
  if (from > to) return 0;

  return Math.max(0, inclusiveDays(from, to) - absenceDaysWithin(absencePeriods, from, to));
}

// Años que se pueden consultar: desde el de llegada hasta el actual, más los
// años en los que haya ausencias registradas. Del más reciente al más antiguo.
export function residencyYears(arrivalDate, periods = [], today = new Date()) {
  const current = today.getFullYear();
  const arrival = parseLocalDate(arrivalDate);
  const years = new Set([current]);
  if (arrival) {
    for (let y = arrival.getFullYear(); y <= current; y += 1) years.add(y);
  }
  for (const p of periods || []) {
    const start = parseLocalDate(p.startDate);
    const end = parseLocalDate(p.endDate);
    if (start && end) {
      for (let y = start.getFullYear(); y <= end.getFullYear(); y += 1) years.add(y);
    }
  }
  return [...years].sort((a, b) => b - a);
}

export function residencyProgress(days) {
  return Math.min(100, (days / RESIDENCY_THRESHOLD_DAYS) * 100);
}

export function isFiscalResident(days) {
  return days > RESIDENCY_THRESHOLD_DAYS;
}

// Días que faltan para superar el umbral
export function daysUntilResidency(days) {
  return Math.max(0, RESIDENCY_THRESHOLD_DAYS + 1 - days);
}
