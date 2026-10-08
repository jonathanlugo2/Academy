export const ROLES = ['admin', 'student', 'advisor'];

// Roles que se dan de alta desde el panel (el administrador es único)
export const MANAGED_ROLES = ['student', 'advisor'];

// Roles que acceden al campus de formaciones
export const LEARNER_ROLES = ['student', 'advisor'];

export const ROLE_LABELS = {
  admin: 'Administrador',
  student: 'Alumno',
  advisor: 'Asesor'
};

export const isValidRole = (role) => ROLES.includes(role);

export const roleLabel = (role) => ROLE_LABELS[role] ?? 'Sin rol';

// Los asesores son personal de la firma: sin expediente fiscal ni soporte
export const hasFiscalProfile = (role) => role === 'student';
export const hasSupportChannel = (role) => role === 'student';

// Página de inicio de cada rol. Un rol desconocido vuelve al login para evitar
// bucles de redirección entre rutas protegidas.
export function homePathFor(role) {
  if (role === 'admin') return '/admin';
  if (LEARNER_ROLES.includes(role)) return '/dashboard';
  return '/login';
}
