import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      throw new Error('Missing environment variables');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Initialize client to verify the user making the request
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Extract token and get user explicitly
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error(`Unauthorized: ${userError?.message || 'Invalid user'}`);
    }

    // Initialize admin client (service role) to check permissions and create user
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Check if the requester is an admin in the profiles table
    const { data: profile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileCheckError || !profile || profile.role !== 'admin') {
      console.error('Permission check failed:', profileCheckError, profile);
      throw new Error('Forbidden: Only administrators can create students');
    }

    // Get student data from request body
    const userData = await req.json();
    const { 
      email, password, name, passport, nie, address, 
      postalCode, arrivalDate, aeatDate, ssDate, 
      absences, allowedResources 
    } = userData;

    if (!email || !password || !name) {
      throw new Error('Missing required fields: email, password, and name are mandatory');
    }

    // 1. Create new user in Supabase Auth
    const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: password,
      email_confirm: true,
      user_metadata: { name: name }
    });

    if (createError) {
      console.error('User creation error:', createError);
      throw createError;
    }

    // 2. Update the profile (which should have been created by a DB trigger)
    // We use the admin client to bypass RLS and ensure the profile is fully populated
    const profileUpdates = {
      name: name,
      passport: passport || null,
      nie: nie || null,
      address: address || null,
      postal_code: postalCode || null,
      arrival_date: arrivalDate || null,
      aeat_date: aeatDate || null,
      ss_date: ssDate || null,
      absences: absences || 0,
      allowed_resources: allowedResources || []
    };

    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', newAuthUser.user.id)
      .select()
      .single();

    if (profileError) {
      console.error('Profile update error:', profileError);
      // We don't throw here to avoid leaving an orphaned Auth user without reporting success, 
      // but in a real app you might want to handle this more robustly.
      throw profileError;
    }

    return new Response(JSON.stringify({ user: newAuthUser.user, profile: updatedProfile }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.message.includes('Unauthorized') ? 401 : (error.message.includes('Forbidden') ? 403 : 400),
    });
  }
});