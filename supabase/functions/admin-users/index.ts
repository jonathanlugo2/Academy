import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  type Action,
  generateTempPassword,
  HttpError,
  type NewUserInput,
  parseAction,
  parseNewUser,
  parseUserId,
} from './validation.ts';

// Orígenes permitidos (separados por comas), p. ej.:
//   supabase secrets set ALLOWED_ORIGINS=https://academy.example.com,http://localhost:5173
// El primero es también la web a la que llevan los enlaces de los correos.
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  console.warn('ALLOWED_ORIGINS no está configurado: se acepta cualquier origen.');
}

// Baja = ban indefinido en Auth (100 años): no puede iniciar sesión ni refrescar el token
const BAN_FOREVER = '876000h';
const RESET_PATH = '/restablecer-contrasena';

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowOrigin = allowedOrigins.length === 0
    ? '*'
    : (allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function jsonResponse(req: Request, body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

// Página donde el usuario fija su contraseña (invitación o recuperación)
function resetRedirect(req: Request): string | undefined {
  const origin = req.headers.get('Origin') ?? '';
  const base = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return base ? `${base}${RESET_PATH}` : undefined;
}

const PROFILE_SELECT = 'id, name, role, email, active, must_change_password';

interface Context {
  req: Request;
  admin: SupabaseClient;
  adminId: string;
  body: unknown;
}

async function audit(ctx: Context, action: string, targetUserId: string | null, details: Record<string, unknown>) {
  const { error } = await ctx.admin.from('audit_logs').insert({
    admin_id: ctx.adminId,
    action,
    target_user_id: targetUserId,
    details,
  });
  if (error) console.error('Audit log error:', error.message);
}

// Perfil de un usuario gestionable (alumno o asesor, nunca el propio admin)
async function loadManagedProfile(ctx: Context, userId: string) {
  if (userId === ctx.adminId) throw new HttpError(400, 'No puedes modificar tu propia cuenta desde aquí');
  const { data, error } = await ctx.admin.from('profiles').select(PROFILE_SELECT).eq('id', userId).maybeSingle();
  if (error) {
    console.error('Profile read error:', error.message);
    throw new HttpError(500, 'No se pudo leer el usuario');
  }
  if (!data) throw new HttpError(404, 'El usuario no existe');
  if (data.role === 'admin') throw new HttpError(403, 'La cuenta de administración no se gestiona desde aquí');
  return data;
}

function profileFields(input: NewUserInput) {
  return {
    name: input.name,
    role: input.role,
    passport: input.passport,
    nie: input.nie,
    address: input.address,
    postal_code: input.postalCode,
    arrival_date: input.arrivalDate,
    aeat_date: input.aeatDate,
    ss_date: input.ssDate,
    active: true,
    deactivated_at: null,
    must_change_password: true,
  };
}

async function sendInvite(ctx: Context, email: string, name: string) {
  const { data, error } = await ctx.admin.auth.admin.inviteUserByEmail(email, {
    data: { name },
    redirectTo: resetRedirect(ctx.req),
  });
  if (error || !data.user) {
    console.error('Invite error:', error?.message);
    throw new HttpError(502, 'No se pudo enviar la invitación. Revisa la configuración de correo (SMTP).');
  }
  return data.user.id;
}

async function sendRecovery(ctx: Context, email: string) {
  const { error } = await ctx.admin.auth.resetPasswordForEmail(email, { redirectTo: resetRedirect(ctx.req) });
  if (error) {
    console.error('Recovery email error:', error.message);
    throw new HttpError(502, 'No se pudo enviar el correo. Revisa la configuración de correo (SMTP).');
  }
}

async function createUser(ctx: Context) {
  const input = parseNewUser(ctx.body);

  const { data: existing, error: existingError } = await ctx.admin
    .from('profiles')
    .select('id, active')
    .ilike('email', input.email.replace(/[\\%_]/g, (c) => `\\${c}`))
    .maybeSingle();
  if (existingError) throw new HttpError(500, 'No se pudo comprobar el correo');
  if (existing) {
    throw new HttpError(
      409,
      existing.active
        ? 'Ya existe un usuario con ese correo electrónico'
        : 'Ese correo pertenece a un usuario dado de baja: reactívalo desde la lista de usuarios',
      'email_exists',
    );
  }

  // Cuenta de Auth sin perfil (p. ej. un borrado antiguo a medias): se recupera
  const { data: orphan, error: orphanError } = await ctx.admin.rpc('admin_find_account', { p_email: input.email });
  if (orphanError) throw new HttpError(500, 'No se pudo comprobar el correo');
  const orphanId: string | undefined = orphan?.find((a: { has_profile: boolean }) => !a.has_profile)?.user_id;

  let userId: string;
  let tempPassword: string | null = null;
  let createdNow = false;

  if (orphanId) {
    userId = orphanId;
    const { error } = await ctx.admin.from('profiles').insert({ id: userId, email: input.email });
    if (error) throw new HttpError(500, 'No se pudo recuperar la cuenta existente');
    tempPassword = input.access === 'password' ? generateTempPassword() : null;
    const { error: authError } = await ctx.admin.auth.admin.updateUserById(userId, {
      ban_duration: 'none',
      user_metadata: { name: input.name },
      app_metadata: { role: input.role },
      ...(tempPassword ? { password: tempPassword, email_confirm: true } : {}),
    });
    if (authError) throw new HttpError(500, 'No se pudo reactivar la cuenta existente');
  } else if (input.access === 'invite') {
    userId = await sendInvite(ctx, input.email, input.name);
    createdNow = true;
  } else {
    tempPassword = generateTempPassword();
    const { data, error } = await ctx.admin.auth.admin.createUser({
      email: input.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: input.name },
      app_metadata: { role: input.role },
    });
    if (error || !data.user) {
      console.error('User creation error:', error?.message);
      throw new HttpError(400, 'No se pudo crear el usuario');
    }
    userId = data.user.id;
    createdNow = true;
  }

  // El trigger handle_new_user crea el perfil básico; aquí se completa
  const { data: profile, error: profileError } = await ctx.admin
    .from('profiles')
    .update(profileFields(input))
    .eq('id', userId)
    .select(PROFILE_SELECT)
    .single();

  if (profileError) {
    console.error('Profile update error:', profileError.message);
    if (createdNow) {
      // Compensación: no dejar una cuenta de Auth a medio crear
      const { error: rollbackError } = await ctx.admin.auth.admin.deleteUser(userId);
      if (rollbackError) console.error('Rollback error:', rollbackError.message);
    }
    throw new HttpError(500, 'No se pudo completar el perfil del usuario');
  }

  if (orphanId && input.access === 'invite') await sendRecovery(ctx, input.email);

  await audit(ctx, 'user_created', userId, {
    email: input.email,
    role: input.role,
    access: input.access,
    recovered: Boolean(orphanId),
  });

  return { profile, tempPassword, recovered: Boolean(orphanId) };
}

async function setActive(ctx: Context, active: boolean) {
  const userId = parseUserId(ctx.body);
  const target = await loadManagedProfile(ctx, userId);

  const { error: authError } = await ctx.admin.auth.admin.updateUserById(userId, {
    ban_duration: active ? 'none' : BAN_FOREVER,
  });
  if (authError) {
    console.error('Ban error:', authError.message);
    throw new HttpError(500, active ? 'No se pudo reactivar el usuario' : 'No se pudo dar de baja al usuario');
  }

  const { data: profile, error } = await ctx.admin
    .from('profiles')
    .update({ active, deactivated_at: active ? null : new Date().toISOString() })
    .eq('id', userId)
    .select(PROFILE_SELECT)
    .single();
  if (error) throw new HttpError(500, 'No se pudo actualizar el estado del usuario');

  await audit(ctx, active ? 'user_reactivated' : 'user_deactivated', userId, { email: target.email });
  return { profile };
}

async function deleteUser(ctx: Context) {
  const userId = parseUserId(ctx.body);
  const target = await loadManagedProfile(ctx, userId);
  if (target.active) {
    throw new HttpError(409, 'Da de baja al usuario antes de eliminarlo definitivamente');
  }

  const { error } = await ctx.admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error('Delete error:', error.message);
    throw new HttpError(500, 'No se pudo eliminar el usuario');
  }

  // El perfil ya no existe: el usuario se identifica en details
  await audit(ctx, 'user_deleted', null, { user_id: userId, email: target.email, name: target.name });
  return { deleted: true };
}

async function sendAccessLink(ctx: Context) {
  const userId = parseUserId(ctx.body);
  const target = await loadManagedProfile(ctx, userId);
  if (!target.active) throw new HttpError(409, 'El usuario está dado de baja');

  const { data, error } = await ctx.admin.auth.admin.getUserById(userId);
  if (error || !data.user) throw new HttpError(404, 'La cuenta de acceso no existe');

  // Sin confirmar = nunca aceptó la invitación: se le reenvía
  if (data.user.email_confirmed_at) {
    await sendRecovery(ctx, target.email);
  } else {
    await sendInvite(ctx, target.email, target.name);
  }

  await audit(ctx, 'access_link_sent', userId, { email: target.email });
  return { sent: true };
}

async function resetPassword(ctx: Context) {
  const userId = parseUserId(ctx.body);
  const target = await loadManagedProfile(ctx, userId);
  if (!target.active) throw new HttpError(409, 'El usuario está dado de baja');

  const tempPassword = generateTempPassword();
  const { error } = await ctx.admin.auth.admin.updateUserById(userId, {
    password: tempPassword,
    email_confirm: true,
  });
  if (error) {
    console.error('Password reset error:', error.message);
    throw new HttpError(500, 'No se pudo generar la contraseña');
  }

  const { data: profile, error: profileError } = await ctx.admin
    .from('profiles')
    .update({ must_change_password: true })
    .eq('id', userId)
    .select(PROFILE_SELECT)
    .single();
  if (profileError) throw new HttpError(500, 'No se pudo actualizar el usuario');

  await audit(ctx, 'temp_password_generated', userId, { email: target.email });
  return { profile, tempPassword };
}

const HANDLERS: Record<Action, (ctx: Context) => Promise<unknown>> = {
  'create': createUser,
  'deactivate': (ctx) => setActive(ctx, false),
  'reactivate': (ctx) => setActive(ctx, true),
  'delete': deleteUser,
  'send-access-link': sendAccessLink,
  'reset-password': resetPassword,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }

  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      console.error('Faltan variables de entorno de Supabase');
      throw new HttpError(500, 'Error de configuración del servidor');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) throw new HttpError(401, 'No autorizado');

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.slice('Bearer '.length),
    );
    if (userError || !user) {
      console.error('Auth error:', userError?.message);
      throw new HttpError(401, 'No autorizado');
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: requester, error: requesterError } = await admin
      .from('profiles')
      .select('role, active')
      .eq('id', user.id)
      .single();
    if (requesterError || requester?.role !== 'admin' || !requester.active) {
      throw new HttpError(403, 'Solo administración puede gestionar usuarios');
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, 'Cuerpo de la petición no válido');
    }

    const result = await HANDLERS[parseAction(body)]({ req, admin, adminId: user.id, body });
    return jsonResponse(req, result, 200);
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(req, { error: error.message, code: error.code }, error.status);
    }
    console.error('Unexpected error:', error);
    return jsonResponse(req, { error: 'Error interno del servidor' }, 500);
  }
});
