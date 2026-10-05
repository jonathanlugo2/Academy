import { createClient } from '@supabase/supabase-js';
import { HttpError, parseNewUser } from './validation.ts';

// Orígenes permitidos (separados por comas), p. ej.:
//   supabase secrets set ALLOWED_ORIGINS=https://academy.example.com,http://localhost:5173
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  console.warn('ALLOWED_ORIGINS no está configurado: se acepta cualquier origen.');
}

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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: requester, error: requesterError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (requesterError || requester?.role !== 'admin') {
      throw new HttpError(403, 'Solo administración puede crear usuarios');
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, 'Cuerpo de la petición no válido');
    }
    const input = parseNewUser(body);

    // El rol va en app_metadata (solo editable con service role). Auth lo
    // escribe después de crear la fila, así que el trigger handle_new_user crea
    // el perfil como 'student': el rol se fija también al completar el perfil.
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { name: input.name },
      app_metadata: { role: input.role },
    });
    if (createError || !created.user) {
      console.error('User creation error:', createError?.message);
      if (createError?.message?.toLowerCase().includes('already')) {
        throw new HttpError(409, 'Ya existe un usuario con ese correo electrónico');
      }
      throw new HttpError(400, 'No se pudo crear el usuario');
    }
    const newUserId = created.user.id;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: input.role,
        name: input.name,
        passport: input.passport,
        nie: input.nie,
        address: input.address,
        postal_code: input.postalCode,
        arrival_date: input.arrivalDate,
        aeat_date: input.aeatDate,
        ss_date: input.ssDate,
        absences: input.absences,
        allowed_resources: input.allowedResources,
      })
      .eq('id', newUserId)
      .select()
      .single();

    if (profileError) {
      // Compensación: no dejar una cuenta de Auth a medio crear
      console.error('Profile update error:', profileError.message);
      const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(newUserId);
      if (rollbackError) console.error('Rollback error:', rollbackError.message);
      throw new HttpError(500, 'No se pudo completar el perfil del usuario');
    }

    const { error: auditError } = await supabaseAdmin.from('audit_logs').insert({
      admin_id: user.id,
      action: 'user_created',
      target_user_id: newUserId,
      details: { email: input.email, role: input.role },
    });
    if (auditError) console.error('Audit log error:', auditError.message);

    return jsonResponse(req, { profile }, 200);
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(req, { error: error.message }, error.status);
    }
    console.error('Unexpected error:', error);
    return jsonResponse(req, { error: 'Error interno del servidor' }, 500);
  }
});
