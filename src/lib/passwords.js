// Reglas de contraseña y traducción de los errores de Supabase Auth

export const MIN_PASSWORD_LENGTH = 10;

// Requisitos que se muestran al usuario mientras escribe
export function passwordChecks(password, confirmation) {
  return [
    { id: 'length', label: `Al menos ${MIN_PASSWORD_LENGTH} caracteres`, ok: password.length >= MIN_PASSWORD_LENGTH },
    { id: 'letters', label: 'Mayúsculas y minúsculas', ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { id: 'digit', label: 'Al menos un número', ok: /\d/.test(password) },
    { id: 'match', label: 'Las dos contraseñas coinciden', ok: password.length > 0 && password === confirmation }
  ];
}

// Mensaje del primer requisito incumplido, o '' si la contraseña es válida
export function validateNewPassword(password, confirmation, currentPassword) {
  if (password.length > 72) return 'La contraseña no puede superar 72 caracteres.';
  const failed = passwordChecks(password, confirmation).find(c => !c.ok);
  if (failed) {
    return failed.id === 'match' ? 'Las contraseñas no coinciden.' : `La contraseña necesita: ${failed.label.toLowerCase()}.`;
  }
  if (currentPassword !== undefined && password === currentPassword) {
    return 'La nueva contraseña debe ser distinta de la actual.';
  }
  return '';
}

const AUTH_ERRORS = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  user_banned: 'Tu cuenta está dada de baja. Contacta con administración si crees que es un error.',
  email_not_confirmed: 'Tu cuenta aún no está activada. Usa el enlace de tu invitación o pide uno nuevo a administración.',
  same_password: 'La nueva contraseña debe ser distinta de la actual.',
  weak_password: 'La contraseña es demasiado débil. Elige una más larga o variada.',
  over_request_rate_limit: 'Demasiados intentos. Espera unos minutos y vuelve a probar.',
  over_email_send_rate_limit: 'Se han enviado demasiados correos. Espera unos minutos y vuelve a probar.',
  session_not_found: 'El enlace ha caducado o ya se ha usado. Solicita uno nuevo.',
  otp_expired: 'El enlace ha caducado o ya se ha usado. Solicita uno nuevo.'
};

// Error de Supabase Auth → mensaje en español para el usuario
export function authErrorMessage(error, fallback = 'No se pudo completar la operación. Inténtalo de nuevo.') {
  if (!error) return fallback;
  if (error.code && AUTH_ERRORS[error.code]) return AUTH_ERRORS[error.code];
  const message = String(error.message || '').toLowerCase();
  if (message.includes('invalid login credentials')) return AUTH_ERRORS.invalid_credentials;
  if (message.includes('banned')) return AUTH_ERRORS.user_banned;
  if (message.includes('email not confirmed')) return AUTH_ERRORS.email_not_confirmed;
  if (message.includes('different from the old password')) return AUTH_ERRORS.same_password;
  if (message.includes('rate limit')) return AUTH_ERRORS.over_request_rate_limit;
  // Los errores propios de la app ya vienen en español
  return error.code ? fallback : (error.message || fallback);
}
