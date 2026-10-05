export const ROLES = ['admin', 'student'];

export const isValidRole = (role) => ROLES.includes(role);

// Página de inicio de cada rol. Un rol desconocido vuelve al login para evitar
// bucles de redirección entre rutas protegidas.
export function homePathFor(role) {
  if (role === 'admin') return '/admin';
  if (role === 'student') return '/dashboard';
  return '/login';
}
