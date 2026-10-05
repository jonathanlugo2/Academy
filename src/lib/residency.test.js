import { describe, expect, it } from 'vitest';
import { calculateResidencyDays, isFiscalResident, residencyProgress, RESIDENCY_THRESHOLD_DAYS } from './residency';

const today = new Date(2026, 9, 5); // 5 de octubre de 2026

describe('calculateResidencyDays', () => {
  it('cuenta desde la llegada, incluyendo el día de llegada y hoy', () => {
    expect(calculateResidencyDays('2026-10-01', 0, today)).toBe(5);
    expect(calculateResidencyDays('2026-10-05', 0, today)).toBe(1);
  });

  it('cuenta toda la estancia desde la llegada (sin acotar al año natural)', () => {
    expect(calculateResidencyDays('2025-10-05', 0, today)).toBe(366);
  });

  it('descuenta las ausencias sin bajar de cero', () => {
    expect(calculateResidencyDays('2026-10-01', 2, today)).toBe(3);
    expect(calculateResidencyDays('2026-10-01', 50, today)).toBe(0);
  });

  it('devuelve 0 sin fecha o con fecha futura', () => {
    expect(calculateResidencyDays(null, 0, today)).toBe(0);
    expect(calculateResidencyDays('2026-12-01', 0, today)).toBe(0);
  });

  it('no se desvía un día por cambios de horario (DST)', () => {
    // El cambio de hora de marzo no debe restar un día
    expect(calculateResidencyDays('2026-03-01', 0, new Date(2026, 3, 1))).toBe(32);
  });
});

describe('umbral de residencia', () => {
  it('es residente a partir de 183 días', () => {
    expect(isFiscalResident(RESIDENCY_THRESHOLD_DAYS - 1)).toBe(false);
    expect(isFiscalResident(RESIDENCY_THRESHOLD_DAYS)).toBe(true);
  });

  it('el progreso no supera el 100%', () => {
    expect(residencyProgress(0)).toBe(0);
    expect(residencyProgress(400)).toBe(100);
  });
});
