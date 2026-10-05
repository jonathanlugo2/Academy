import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { formatDate, parseLocalDate } from './dates';

// Huso horario negativo: aquí `new Date('YYYY-MM-DD')` muestra el día anterior (B10)
const originalTz = process.env.TZ;
beforeAll(() => { process.env.TZ = 'America/Bogota'; });
afterAll(() => { process.env.TZ = originalTz; });

describe('parseLocalDate', () => {
  it('interpreta las fechas de columna date en hora local', () => {
    const date = parseLocalDate('2026-03-01');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(1);
  });

  it('reproduce el bug que corrige', () => {
    expect(new Date('2026-03-01').getDate()).toBe(28);
  });

  it('acepta timestamps ISO y devuelve null para valores vacíos o inválidos', () => {
    expect(parseLocalDate('2026-03-01T10:00:00Z')).toBeInstanceOf(Date);
    expect(parseLocalDate('')).toBeNull();
    expect(parseLocalDate('no-es-fecha')).toBeNull();
  });
});

describe('formatDate', () => {
  it('formatea en es-ES sin desfase de día', () => {
    expect(formatDate('2026-03-01')).toBe('1/3/2026');
  });

  it('usa el texto alternativo si no hay fecha', () => {
    expect(formatDate(null, 'PENDIENTE')).toBe('PENDIENTE');
  });
});
