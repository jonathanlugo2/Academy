// Validación de las peticiones de administración de cuentas y generación de
// contraseñas temporales. Sin dependencias para poder testearse con `deno test`.

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

// El administrador es único: desde el panel solo se dan de alta alumnos y asesores
export const MANAGED_ROLES = ['student', 'advisor'] as const;
export type ManagedRole = typeof MANAGED_ROLES[number];

export const ACTIONS = ['create', 'deactivate', 'reactivate', 'delete', 'send-access-link', 'reset-password'] as const;
export type Action = typeof ACTIONS[number];

// invite: el usuario recibe un correo y elige su contraseña.
// password: se genera una contraseña temporal que se muestra una vez al admin.
export type AccessMode = 'invite' | 'password';

export interface NewUserInput {
  email: string;
  name: string;
  role: ManagedRole;
  access: AccessMode;
  passport: string | null;
  nie: string | null;
  address: string | null;
  postalCode: string | null;
  arrivalDate: string | null;
  aeatDate: string | null;
  ssDate: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function optionalText(value: unknown, field: string, maxLength: number): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new HttpError(400, `El campo ${field} no es válido`);
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new HttpError(400, `El campo ${field} supera ${maxLength} caracteres`);
  }
  return trimmed || null;
}

function optionalDate(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !DATE_RE.test(value)) {
    throw new HttpError(400, `La fecha ${field} debe tener formato AAAA-MM-DD`);
  }
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    throw new HttpError(400, `La fecha ${field} no existe`);
  }
  return value;
}

function asObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Cuerpo de la petición no válido');
  }
  return body as Record<string, unknown>;
}

export function parseAction(body: unknown): Action {
  const action = asObject(body).action;
  if (!ACTIONS.includes(action as Action)) throw new HttpError(400, 'Acción no válida');
  return action as Action;
}

export function parseUserId(body: unknown): string {
  const userId = asObject(body).userId;
  if (typeof userId !== 'string' || !UUID_RE.test(userId)) {
    throw new HttpError(400, 'Usuario no válido');
  }
  return userId.toLowerCase();
}

export function parseNewUser(body: unknown): NewUserInput {
  const b = asObject(body);

  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email) || email.length > 254) {
    throw new HttpError(400, 'El correo electrónico no es válido');
  }

  const name = optionalText(b.name, 'nombre', 120);
  if (!name) throw new HttpError(400, 'El nombre es obligatorio');

  const role = b.role === undefined ? 'student' : b.role;
  if (!MANAGED_ROLES.includes(role as ManagedRole)) {
    throw new HttpError(400, 'Rol no válido');
  }

  const access = b.access === undefined ? 'invite' : b.access;
  if (access !== 'invite' && access !== 'password') {
    throw new HttpError(400, 'Modo de acceso no válido');
  }

  const input: NewUserInput = {
    email,
    name,
    role: role as ManagedRole,
    access,
    passport: optionalText(b.passport, 'pasaporte', 50),
    nie: optionalText(b.nie, 'NIE', 20),
    address: optionalText(b.address, 'dirección', 300),
    postalCode: optionalText(b.postalCode, 'código postal', 10),
    arrivalDate: optionalDate(b.arrivalDate, 'de llegada'),
    aeatDate: optionalDate(b.aeatDate, 'de alta en AEAT'),
    ssDate: optionalDate(b.ssDate, 'de alta en la Seguridad Social'),
  };

  // Los asesores son personal de la firma: sin expediente de residencia
  if (input.role === 'advisor') {
    input.passport = input.nie = input.address = input.postalCode = null;
    input.arrivalDate = input.aeatDate = input.ssDate = null;
  }
  return input;
}

// Sin caracteres que se confunden al dictarla o copiarla a mano (0/O, 1/l/I)
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

// Formato "Asidne-Xk7m-P4qz-9Rtw": 12 caracteres aleatorios (~70 bits)
export function generateTempPassword(random: (bytes: Uint8Array) => Uint8Array = (b) => crypto.getRandomValues(b)): string {
  const n = PASSWORD_ALPHABET.length;
  const limit = 256 - (256 % n); // descarta bytes que sesgarían la distribución
  const chars: string[] = [];
  while (chars.length < 12) {
    for (const byte of random(new Uint8Array(16))) {
      if (byte < limit && chars.length < 12) chars.push(PASSWORD_ALPHABET[byte % n]);
    }
  }
  const groups = [chars.slice(0, 4), chars.slice(4, 8), chars.slice(8, 12)].map((g) => g.join(''));
  return `Asidne-${groups.join('-')}`;
}
