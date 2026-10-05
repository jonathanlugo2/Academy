// Validación de la petición de alta de usuario. Sin dependencias para poder
// testearse con `deno test`.

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface NewUserInput {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'admin';
  passport: string | null;
  nie: string | null;
  address: string | null;
  postalCode: string | null;
  arrivalDate: string | null;
  aeatDate: string | null;
  ssDate: string | null;
  absences: number;
  allowedResources: string[];
}

export const MIN_PASSWORD_LENGTH = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

export function parseNewUser(body: unknown): NewUserInput {
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'Cuerpo de la petición no válido');
  }
  const b = body as Record<string, unknown>;

  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email) || email.length > 254) {
    throw new HttpError(400, 'El correo electrónico no es válido');
  }

  const password = typeof b.password === 'string' ? b.password : '';
  if (password.length < MIN_PASSWORD_LENGTH || password.length > 72) {
    throw new HttpError(400, `La contraseña debe tener entre ${MIN_PASSWORD_LENGTH} y 72 caracteres`);
  }

  const name = optionalText(b.name, 'nombre', 120);
  if (!name) throw new HttpError(400, 'El nombre es obligatorio');

  const role = b.role === undefined ? 'student' : b.role;
  if (role !== 'student' && role !== 'admin') {
    throw new HttpError(400, 'Rol no válido');
  }

  const absences = b.absences === undefined || b.absences === null || b.absences === '' ? 0 : Number(b.absences);
  if (!Number.isInteger(absences) || absences < 0 || absences > 366) {
    throw new HttpError(400, 'Las ausencias deben ser un número entero entre 0 y 366');
  }

  const allowedResources = b.allowedResources ?? [];
  if (!Array.isArray(allowedResources) || !allowedResources.every((id) => typeof id === 'string' && UUID_RE.test(id))) {
    throw new HttpError(400, 'La lista de recursos asignados no es válida');
  }

  return {
    email,
    password,
    name,
    role,
    passport: optionalText(b.passport, 'pasaporte', 50),
    nie: optionalText(b.nie, 'NIE', 20),
    address: optionalText(b.address, 'dirección', 300),
    postalCode: optionalText(b.postalCode, 'código postal', 10),
    arrivalDate: optionalDate(b.arrivalDate, 'de llegada'),
    aeatDate: optionalDate(b.aeatDate, 'de alta en AEAT'),
    ssDate: optionalDate(b.ssDate, 'de alta en la Seguridad Social'),
    absences,
    allowedResources: allowedResources as string[],
  };
}
