import { generateTempPassword, HttpError, parseAction, parseNewUser, parseUserId } from './validation.ts';

function assertEquals(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Esperado ${JSON.stringify(expected)}, obtenido ${JSON.stringify(actual)}`);
  }
}

function assertThrows(fn: () => unknown, status = 400) {
  try {
    fn();
  } catch (error) {
    if (error instanceof HttpError && error.status === status) return;
    throw error;
  }
  throw new Error('Se esperaba un rechazo');
}

const valid = {
  email: '  Alumno@Example.com ',
  name: ' Ana ',
};

Deno.test('normaliza email y nombre y aplica valores por defecto', () => {
  const parsed = parseNewUser(valid);
  assertEquals(parsed.email, 'alumno@example.com');
  assertEquals(parsed.name, 'Ana');
  assertEquals(parsed.role, 'student');
  assertEquals(parsed.access, 'invite');
  assertEquals(parsed.nie, null);
});

Deno.test('admite alumnos y asesores', () => {
  assertEquals(parseNewUser({ ...valid, role: 'student' }).role, 'student');
  assertEquals(parseNewUser({ ...valid, role: 'advisor' }).role, 'advisor');
});

Deno.test('no permite crear administradores ni roles desconocidos', () => {
  assertThrows(() => parseNewUser({ ...valid, role: 'admin' }));
  assertThrows(() => parseNewUser({ ...valid, role: 'superadmin' }));
});

Deno.test('un asesor no guarda datos de residencia', () => {
  const parsed = parseNewUser({
    ...valid,
    role: 'advisor',
    nie: 'X1234567L',
    passport: 'PA1',
    address: 'Calle 1',
    postalCode: '28001',
    arrivalDate: '2024-01-01',
  });
  assertEquals([parsed.nie, parsed.passport, parsed.address, parsed.postalCode, parsed.arrivalDate], [null, null, null, null, null]);
});

Deno.test('un alumno conserva sus datos de residencia', () => {
  const parsed = parseNewUser({ ...valid, nie: ' X1234567L ', arrivalDate: '2024-02-29' });
  assertEquals([parsed.nie, parsed.arrivalDate], ['X1234567L', '2024-02-29']);
});

Deno.test('valida el modo de acceso', () => {
  assertEquals(parseNewUser({ ...valid, access: 'password' }).access, 'password');
  assertThrows(() => parseNewUser({ ...valid, access: 'magic' }));
});

Deno.test('rechaza emails y nombres no válidos', () => {
  assertThrows(() => parseNewUser({ ...valid, email: 'sin-arroba' }));
  assertThrows(() => parseNewUser({ ...valid, name: '   ' }));
});

Deno.test('valida fechas reales en formato AAAA-MM-DD', () => {
  assertThrows(() => parseNewUser({ ...valid, arrivalDate: '2023-02-29' }));
  assertThrows(() => parseNewUser({ ...valid, arrivalDate: '01/02/2024' }));
});

Deno.test('valida acción e identificador de usuario', () => {
  assertEquals(parseAction({ action: 'deactivate' }), 'deactivate');
  assertThrows(() => parseAction({ action: 'drop' }));
  assertThrows(() => parseAction(null));
  assertEquals(parseUserId({ userId: 'A0000000-0000-0000-0000-0000000000A1' }), 'a0000000-0000-0000-0000-0000000000a1');
  assertThrows(() => parseUserId({ userId: "1; DROP TABLE" }));
});

Deno.test('genera contraseñas temporales legibles y distintas', () => {
  const a = generateTempPassword();
  const b = generateTempPassword();
  if (!/^Asidne-[A-HJ-NP-Za-km-z2-9]{4}-[A-HJ-NP-Za-km-z2-9]{4}-[A-HJ-NP-Za-km-z2-9]{4}$/.test(a)) {
    throw new Error(`Formato inesperado: ${a}`);
  }
  if (a === b) throw new Error('Dos contraseñas iguales');
});

Deno.test('descarta bytes sesgados al generar la contraseña', () => {
  // 255 queda fuera del rango uniforme (alfabeto de 57 → límite 228) y se ignora
  let calls = 0;
  const fake = (bytes: Uint8Array) => {
    bytes.fill(calls++ === 0 ? 255 : 0);
    return bytes;
  };
  assertEquals(generateTempPassword(fake), 'Asidne-AAAA-AAAA-AAAA');
});
