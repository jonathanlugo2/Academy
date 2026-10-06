import { HttpError, MIN_PASSWORD_LENGTH, parseNewUser } from './validation.ts';

function assertEquals(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Esperado ${JSON.stringify(expected)}, obtenido ${JSON.stringify(actual)}`);
  }
}

function assertRejects(body: unknown, status = 400) {
  try {
    parseNewUser(body);
  } catch (error) {
    if (error instanceof HttpError && error.status === status) return;
    throw error;
  }
  throw new Error(`Se esperaba rechazo para ${JSON.stringify(body)}`);
}

const valid = {
  email: '  Alumno@Example.com ',
  password: 'x'.repeat(MIN_PASSWORD_LENGTH),
  name: ' Ana ',
};

Deno.test('normaliza email y nombre y aplica valores por defecto', () => {
  const parsed = parseNewUser(valid);
  assertEquals(parsed.email, 'alumno@example.com');
  assertEquals(parsed.name, 'Ana');
  assertEquals(parsed.role, 'student');
  assertEquals(parsed.absences, 0);
  assertEquals(parsed.nie, null);
});

Deno.test('respeta el rol admin (B3)', () => {
  assertEquals(parseNewUser({ ...valid, role: 'admin' }).role, 'admin');
});

Deno.test('rechaza roles desconocidos', () => {
  assertRejects({ ...valid, role: 'superadmin' });
});

Deno.test('exige contraseña de longitud mínima', () => {
  assertRejects({ ...valid, password: 'corta' });
});

Deno.test('rechaza emails no válidos', () => {
  assertRejects({ ...valid, email: 'sin-arroba' });
});

Deno.test('valida fechas reales en formato AAAA-MM-DD', () => {
  assertEquals(parseNewUser({ ...valid, arrivalDate: '2024-02-29' }).arrivalDate, '2024-02-29');
  assertRejects({ ...valid, arrivalDate: '2023-02-29' });
  assertRejects({ ...valid, arrivalDate: '01/02/2024' });
});

Deno.test('valida ausencias', () => {
  assertRejects({ ...valid, absences: -1 });
  assertRejects({ ...valid, absences: 400 });
});

Deno.test('ignora la antigua asignación de recursos (ahora son formaciones)', () => {
  assertEquals('allowedResources' in parseNewUser({ ...valid, allowedResources: ['x'] }), false);
});

Deno.test('rechaza cuerpos que no son objetos', () => {
  assertRejects(null);
  assertRejects('texto');
});
