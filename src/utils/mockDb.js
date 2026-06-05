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
            : resourceData.tags || [],
          image_url: resourceData.imageUrl || null
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
            : resourceData.tags || [],
          image_url: resourceData.imageUrl || null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      // 1. Fetch resource to check if it has a storage_path
      const { data: res, error: fetchErr } = await supabase
        .from('resources')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr && fetchErr.code !== 'PGRST116') {
        console.warn("Error fetching resource before deletion:", fetchErr.message);
      }

      // 2. Delete file from storage if it exists
      if (res && res.storage_path) {
        const bucket = res.type === 'video' ? 'academy-videos' : 'academy-resources';
        const { error: storageErr } = await supabase.storage
          .from(bucket)
          .remove([res.storage_path]);
        if (storageErr) {
          console.warn("Failed to delete storage file from bucket:", storageErr.message);
        }
      }

      // 3. Delete the resource row from resources table
      const { error: deleteError } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // 4. Cascade cleanup of student profiles (allowed_resources / completed_resources arrays)
      try {
        const { data: profiles, error: pError } = await supabase
          .from('profiles')
          .select('id, allowed_resources, completed_resources');

        if (!pError && profiles) {
          const updatePromises = profiles
            .filter(p => 
              (p.allowed_resources && p.allowed_resources.includes(id)) || 
              (p.completed_resources && p.completed_resources.includes(id))
            )
            .map(p => {
              const newAllowed = (p.allowed_resources || []).filter(rid => rid !== id);
              const newCompleted = (p.completed_resources || []).filter(rid => rid !== id);
              return supabase
                .from('profiles')
                .update({ 
                  allowed_resources: newAllowed,
                  completed_resources: newCompleted
                })
                .eq('id', p.id);
            });
          await Promise.all(updatePromises);
        }
      } catch (err) {
        console.error("Error doing cascade profiles cleanup:", err);
      }

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
  },
  tickets: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, student:profiles(name, role)')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data.map(t => ({
        id: t.id,
        student_id: t.student_id,
        student_name: t.student?.name || 'Estudiante Nómada',
        title: t.title,
        status: t.status,
        created_at: t.created_at,
        updated_at: t.updated_at
      }));
    },
    create: async (ticketData) => {
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          student_id: ticketData.student_id,
          title: ticketData.title
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      const { data: message, error: messageError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: ticketData.student_id,
          content: ticketData.content,
          attachment_url: ticketData.attachment_url,
          attachment_name: ticketData.attachment_name,
          attachment_type: ticketData.attachment_type
        })
        .select()
        .single();

      if (messageError) {
        await supabase.from('tickets').delete().eq('id', ticket.id);
        throw messageError;
      }

      return {
        ...ticket,
        first_message: message
      };
    },
    close: async (id) => {
      const { data, error } = await supabase
        .from('tickets')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    getMessages: async (ticketId) => {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*, sender:profiles(name, role), ticket:tickets(student_id)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map(m => {
        const isStudent = m.sender_id === m.ticket?.student_id;
        return {
          id: m.id,
          ticket_id: m.ticket_id,
          sender_id: m.sender_id,
          sender_name: isStudent ? (m.sender?.name || 'Estudiante') : (m.sender?.name || 'Soporte ExpatFiscal'),
          sender_role: isStudent ? 'student' : 'admin',
          content: m.content,
          created_at: m.created_at,
          attachment_url: m.attachment_url,
          attachment_name: m.attachment_name,
          attachment_type: m.attachment_type
        };
      });
    },
    createMessage: async (messageData) => {
      const { data, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: messageData.ticket_id,
          sender_id: messageData.sender_id,
          content: messageData.content,
          attachment_url: messageData.attachment_url,
          attachment_name: messageData.attachment_name,
          attachment_type: messageData.attachment_type
        })
        .select('*, sender:profiles(name, role), ticket:tickets(student_id)')
        .single();

      if (error) throw error;

      const isStudent = data.sender_id === data.ticket?.student_id;
      return {
        id: data.id,
        ticket_id: data.ticket_id,
        sender_id: data.sender_id,
        sender_name: isStudent ? (data.sender?.name || 'Estudiante') : (data.sender?.name || 'Soporte ExpatFiscal'),
        sender_role: isStudent ? 'student' : 'admin',
        content: data.content,
        created_at: data.created_at,
        attachment_url: data.attachment_url,
        attachment_name: data.attachment_name,
        attachment_type: data.attachment_type
      };
    },
    uploadAttachment: async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `ticket-uploads/${fileName}`;

      try {
        const { error } = await supabase.storage
          .from('support-attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('support-attachments')
          .getPublicUrl(filePath);

        return {
          url: urlData.publicUrl,
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'document'
        };
      } catch (err) {
        console.warn("Storage upload failed, falling back to local Object URL:", err);
        return {
          url: URL.createObjectURL(file),
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'document'
        };
      }
    }
  }
};

