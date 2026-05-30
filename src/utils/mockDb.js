import { supabase } from './supabaseClient';

// Mapeador de perfiles de base de datos a formato camelCase de React
const mapProfile = (p) => {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    role: p.role,
    passport: p.passport,
    nie: p.nie,
    address: p.address,
    postalCode: p.postal_code,
    arrivalDate: p.arrival_date,
    absences: p.absences || 0,
    aeatDate: p.aeat_date,
    ssDate: p.ss_date,
    allowedResources: p.allowed_resources || [],
    completedResources: p.completed_resources || [],
    residencyDoc: p.residency_doc,
    email: p.email
  };
};

export const mockDb = {
  users: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      return data.map(mapProfile);
    },
    create: async (userData) => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('Not authenticated');

      // Guardar tokens del admin ANTES de la operación para poder restaurar si se corrompe
      const adminAccessToken = sessionData.session.access_token;
      const adminRefreshToken = sessionData.session.refresh_token;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminAccessToken}`
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error creating student');
      }

      const { profile } = await response.json();

      // Verificar que la sesión del admin sigue activa después de la operación
      const { data: currentSession } = await supabase.auth.getSession();
      if (!currentSession.session || currentSession.session.access_token !== adminAccessToken) {
        // La sesión se corrompió — restaurar con refresh token
        console.warn('Session affected by user creation. Refreshing admin session...');
        await supabase.auth.refreshSession({ refresh_token: adminRefreshToken });
      }

      return {
        ...mapProfile(profile),
        email: userData.email.toLowerCase().trim()
      };
    },
    update: async (id, userData) => {
      const dbData = {};
      if (userData.name !== undefined) dbData.name = userData.name;
      if (userData.role !== undefined) dbData.role = userData.role;
      if (userData.passport !== undefined) dbData.passport = userData.passport;
      if (userData.nie !== undefined) dbData.nie = userData.nie;
      if (userData.address !== undefined) dbData.address = userData.address;
      if (userData.postalCode !== undefined) dbData.postal_code = userData.postalCode;
      if (userData.arrivalDate !== undefined) dbData.arrival_date = userData.arrivalDate;
      if (userData.absences !== undefined) dbData.absences = userData.absences;
      if (userData.aeatDate !== undefined) dbData.aeat_date = userData.aeatDate;
      if (userData.ssDate !== undefined) dbData.ss_date = userData.ssDate;
      if (userData.allowedResources !== undefined) dbData.allowed_resources = userData.allowedResources;
      if (userData.completedResources !== undefined) dbData.completed_resources = userData.completedResources;
      if (userData.residencyDoc !== undefined) dbData.residency_doc = userData.residencyDoc;
      dbData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('profiles')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapProfile(data);
    },
    delete: async (id) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  },
  resources: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    create: async (resourceData) => {
      const { data, error } = await supabase
        .from('resources')
        .insert({
          title: resourceData.title,
          type: resourceData.type,
          url: resourceData.url,
          description: resourceData.description,
          category: resourceData.category,
          tags: typeof resourceData.tags === 'string' 
            ? resourceData.tags.split(',').map(t => t.trim()).filter(Boolean)
            : resourceData.tags || []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    update: async (id, resourceData) => {
      const { data, error } = await supabase
        .from('resources')
        .update({
          title: resourceData.title,
          type: resourceData.type,
          url: resourceData.url,
          description: resourceData.description,
          category: resourceData.category,
          tags: typeof resourceData.tags === 'string' 
            ? resourceData.tags.split(',').map(t => t.trim()).filter(Boolean)
            : resourceData.tags || []
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  },
  messages: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles(name, role)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(m => ({
        id: m.id,
        sender_id: m.sender_id,
        sender_name: m.sender?.name || 'Estudiante Nómada',
        sender_role: m.sender?.role || 'student',
        content: m.content,
        reply: m.reply,
        created_at: m.created_at
      }));
    },
    create: async (messageData) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: messageData.sender_id,
          content: messageData.content
        })
        .select('*, sender:profiles(name, role)')
        .single();

      if (error) throw error;

      return {
        id: data.id,
        sender_id: data.sender_id,
        sender_name: data.sender?.name || 'Estudiante Nómada',
        sender_role: data.sender?.role || 'student',
        content: data.content,
        reply: data.reply,
        created_at: data.created_at
      };
    },
    reply: async (id, replyContent) => {
      const { data, error } = await supabase
        .from('messages')
        .update({ reply: replyContent })
        .eq('id', id)
        .select('*, sender:profiles(name, role)')
        .single();

      if (error) throw error;

      return {
        id: data.id,
        sender_id: data.sender_id,
        sender_name: data.sender?.name || 'Estudiante Nómada',
        sender_role: data.sender?.role || 'student',
        content: data.content,
        reply: data.reply,
        created_at: data.created_at
      };
    },
    delete: async (id) => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  }
};
