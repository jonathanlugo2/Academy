import { describe, expect, it } from 'vitest';
import { authErrorMessage, passwordChecks, validateNewPassword } from './passwords';

describe('validateNewPassword', () => {
  it('acepta una contraseña que cumple todos los requisitos', () => {
    expect(validateNewPassword('Campus2026ok', 'Campus2026ok')).toBe('');
  });

  it('informa del primer requisito incumplido', () => {
    expect(validateNewPassword('Corta1', 'Corta1')).toMatch(/10 caracteres/);
    expect(validateNewPassword('sinmayusculas1', 'sinmayusculas1')).toMatch(/mayúsculas/);
    expect(validateNewPassword('SinNumerosAqui', 'SinNumerosAqui')).toMatch(/número/);
    expect(validateNewPassword('Campus2026ok', 'Campus2026OK')).toBe('Las contraseñas no coinciden.');
  });

  it('exige que la nueva sea distinta de la actual', () => {
    expect(validateNewPassword('Campus2026ok', 'Campus2026ok', 'Campus2026ok')).toMatch(/distinta/);
  });

  it('limita la longitud al máximo de Auth', () => {
    const long = 'Aa1' + 'x'.repeat(70);
    expect(validateNewPassword(long, long)).toMatch(/72/);
  });
});

describe('passwordChecks', () => {
  it('no da por coincidentes dos contraseñas vacías', () => {
    expect(passwordChecks('', '').find(c => c.id === 'match').ok).toBe(false);
  });
});

describe('authErrorMessage', () => {
  it('traduce los errores de Supabase por código', () => {
    expect(authErrorMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' }))
      .toBe('Correo o contraseña incorrectos.');
    expect(authErrorMessage({ code: 'user_banned', message: 'User is banned' })).toMatch(/dada de baja/);
  });

  it('traduce por mensaje cuando no hay código', () => {
    expect(authErrorMessage({ message: 'Invalid login credentials' })).toBe('Correo o contraseña incorrectos.');
  });

  it('no muestra mensajes en inglés de códigos desconocidos', () => {
    expect(authErrorMessage({ code: 'unexpected_failure', message: 'Something broke' }, 'Fallo')).toBe('Fallo');
  });

  it('conserva los mensajes propios de la app', () => {
    expect(authErrorMessage(new Error('La contraseña actual no es correcta.'))).toBe('La contraseña actual no es correcta.');
  });
});
