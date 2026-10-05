import { describe, expect, it } from 'vitest';
import {
  absenceDaysInYear, absenceLengthDays, absencesInYear, calculateResidencyDays, daysUntilResidency,
  isFiscalResident, isLongAbsence, residencyProgress, residencyYears, RESIDENCY_THRESHOLD_DAYS
} from './residency';

const today = new Date(2026, 9, 5); // 5 de octubre de 2026
const absence = (startDate, endDate) => ({ id: startDate, startDate, endDate });

describe('ausencias', () => {
  it('cuenta los días de salida y regreso', () => {
    expect(absenceLengthDays(absence('2026-03-10', '2026-04-25'))).toBe(47);
  });

  it('solo son largas las de 30 días o más', () => {
    expect(isLongAbsence(absence('2026-03-01', '2026-03-30'))).toBe(true);
    expect(isLongAbsence(absence('2026-03-01', '2026-03-29'))).toBe(false);
  });

  it('reparte una ausencia que cruza de año', () => {
    const periods = [absence('2025-12-15', '2026-01-20')];
    expect(absenceDaysInYear(periods, 2025)).toBe(17);
    expect(absenceDaysInYear(periods, 2026)).toBe(20);
    expect(absencesInYear(periods, 2026)).toHaveLength(1);
    expect(absencesInYear(periods, 2024)).toHaveLength(0);
  });

  it('ignora las ausencias cortas aunque estén guardadas', () => {
    expect(absenceDaysInYear([absence('2026-03-01', '2026-03-10')], 2026)).toBe(0);
  });
});

describe('calculateResidencyDays', () => {
  it('cuenta desde la llegada, incluyendo el día de llegada y hoy', () => {
    expect(calculateResidencyDays('2026-10-01', [], 2026, today)).toBe(5);
    expect(calculateResidencyDays('2026-10-05', [], 2026, today)).toBe(1);
  });

  it('se acota al año natural', () => {
    // Llegada en 2025: en 2026 cuenta desde el 1 de enero hasta hoy
    expect(calculateResidencyDays('2025-10-05', [], 2026, today)).toBe(278);
    // Año ya cerrado: del 5 de octubre al 31 de diciembre
    expect(calculateResidencyDays('2025-10-05', [], 2025, today)).toBe(88);
    // Año completo sin ausencias
    expect(calculateResidencyDays('2020-01-01', [], 2024, today)).toBe(366);
  });

  it('usa el año en curso por defecto', () => {
    expect(calculateResidencyDays('2025-10-05', [], undefined, today)).toBe(278);
  });

  it('descuenta solo la parte de la ausencia dentro del año y hasta hoy', () => {
    const periods = [absence('2026-03-10', '2026-04-25'), absence('2026-09-20', '2026-12-31')];
    // 278 días en 2026 hasta hoy − 47 − 16 (20 sep a 5 oct)
    expect(calculateResidencyDays('2025-01-01', periods, 2026, today)).toBe(215);
  });

  it('no descuenta ausencias anteriores a la llegada', () => {
    expect(calculateResidencyDays('2026-06-01', [absence('2026-01-01', '2026-03-31')], 2026, today)).toBe(127);
  });

  it('devuelve 0 sin fecha, con llegada futura o año anterior a la llegada', () => {
    expect(calculateResidencyDays(null, [], 2026, today)).toBe(0);
    expect(calculateResidencyDays('2026-12-01', [], 2026, today)).toBe(0);
    expect(calculateResidencyDays('2026-01-01', [], 2025, today)).toBe(0);
  });

  it('no se desvía un día por cambios de horario (DST)', () => {
    expect(calculateResidencyDays('2026-03-01', [], 2026, new Date(2026, 3, 1))).toBe(32);
  });
});

describe('residencyYears', () => {
  it('lista desde el año actual hasta el de llegada', () => {
    expect(residencyYears('2024-09-01', [], today)).toEqual([2026, 2025, 2024]);
    expect(residencyYears(null, [], today)).toEqual([2026]);
  });

  it('incluye los años con ausencias registradas', () => {
    expect(residencyYears('2026-02-01', [absence('2026-12-10', '2027-01-20')], today)).toEqual([2027, 2026]);
  });
});

describe('umbral de residencia', () => {
  it('es residente al superar 183 días', () => {
    expect(isFiscalResident(RESIDENCY_THRESHOLD_DAYS)).toBe(false);
    expect(isFiscalResident(RESIDENCY_THRESHOLD_DAYS + 1)).toBe(true);
    expect(daysUntilResidency(180)).toBe(4);
    expect(daysUntilResidency(200)).toBe(0);
  });

  it('el progreso no supera el 100%', () => {
    expect(residencyProgress(0)).toBe(0);
    expect(residencyProgress(400)).toBe(100);
  });
});
