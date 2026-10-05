// Capa de acceso a datos (Supabase). La autorización real la imponen las
// políticas RLS y las funciones RPC de la base de datos; aquí solo se mapean
// datos y se orquestan las llamadas.
import { supabase } from '../utils/supabaseClient';
import { attachmentStoragePath } from '../lib/storagePaths';

const PROFILE_COLUMNS = 'id, name, role, passport, nie, address, postal_code, arrival_date, absences, aeat_date, ss_date, allowed_resources, completed_resources, residency_doc, email';
const RESOURCE_COLUMNS = 'id, title, type, url, description, category, tags, created_at, storage_path, image_url';

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const MB = 1024 * 1024;

const EXTENSION_BY_MIME = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const DOCUMENT_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

// Mapeo de perfiles de base de datos (snake_case) al formato del frontend
export const mapProfile = (p) => {
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

function parseTags(tags) {
  const list = typeof tags === 'string' ? tags.split(',') : (tags || []);
  return list.map(t => t.trim()).filter(Boolean);
}

function assertFile(file, allowedTypes, maxMb) {
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Formato de archivo no permitido.');
  }
  if (file.size > maxMb * MB) {
    throw new Error(`El archivo supera el límite de ${maxMb} MB.`);
  }
}

function randomFileName(file) {
  return `${crypto.randomUUID()}.${EXTENSION_BY_MIME[file.type]}`;
}

async function uploadFile(bucket, path, file) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) throw new Error(`No se pudo subir el archivo: ${error.message}`);
  return path;
}

async function createSignedUrl(bucket, path) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw new Error(`No se pudo acceder al archivo: ${error.message}`);
  return data.signedUrl;
}

const resourceBucket = (resource) => (resource.type === 'video' ? 'academy-videos' : 'academy-resources');

// --- Adjuntos de soporte -----------------------------------------------------

const SUPPORT_BUCKET = 'support-attachments';

// Sustituye las rutas de Storage de los adjuntos por URLs firmadas temporales
async function withSignedAttachments(messages) {
  const paths = [...new Set(
    messages
      .filter(m => m.attachment_type !== 'link')
      .map(m => attachmentStoragePath(m.attachment_url))
      .filter(Boolean)
  )];
  if (paths.length === 0) return messages;

  const { data, error } = await supabase.storage.from(SUPPORT_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) {
    console.error('Error firmando adjuntos:', error.message);
    return messages;
  }
  const signedByPath = new Map(data.filter(d => d.signedUrl).map(d => [d.path, d.signedUrl]));

  return messages.map(m => {
    if (m.attachment_type === 'link') return m;
    const path = attachmentStoragePath(m.attachment_url);
    return path ? { ...m, attachment_url: signedByPath.get(path) || null } : m;
  });
}

function mapTicketMessage(m) {
  const isStudent = m.sender_id === m.ticket?.student_id;
  return {
    id: m.id,
    ticket_id: m.ticket_id,
    sender_id: m.sender_id,
    sender_name: m.sender?.name || (isStudent ? 'Estudiante' : 'Soporte ExpatFiscal'),
    sender_role: isStudent ? 'student' : 'admin',
    content: m.content,
    created_at: m.created_at,
    attachment_url: m.attachment_url,
    attachment_name: m.attachment_name,
    attachment_type: m.attachment_type
  };
}

const TICKET_MESSAGE_SELECT = '*, sender:profiles(name, role), ticket:tickets(student_id)';

export const api = {
  users: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .order('name');

      if (error) throw error;
      return data.map(mapProfile);
    },
    getById: async (id) => {
      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', id)
        .single();

      if (error) throw error;
      return mapProfile(data);
    },
    // Alta mediante la Edge Function (requiere service role en el servidor)
    create: async (userData) => {
      const { data, error } = await supabase.functions.invoke('create-student', { body: userData });

      if (error) {
        const body = await error.context?.json?.().catch(() => null);
        throw new Error(body?.error || 'No se pudo crear el usuario.');
      }
      return mapProfile(data.profile);
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
      if (userData.completedResources !== undefined) dbData.completed_resources = userData.completedResources;
      if (userData.residencyDoc !== undefined) dbData.residency_doc = userData.residencyDoc;
      dbData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('profiles')
        .update(dbData)
        .eq('id', id)
        .select(PROFILE_COLUMNS)
        .single();

      if (error) throw error;
      return mapProfile(data);
    },
    // Borra la cuenta de Auth; el perfil y sus tickets caen en cascada
    delete: async (id) => {
      const { error } = await supabase.rpc('admin_delete_user', { p_user_id: id });
      if (error) throw error;
      return true;
    },
    // Activa/desactiva un recurso para un alumno de forma atómica
    setResourceAssignment: async (studentId, resourceId, enabled) => {
      const { data, error } = await supabase.rpc('set_resource_assignment', {
        p_student_id: studentId,
        p_resource_id: resourceId,
        p_enabled: enabled
      });
      if (error) throw error;
      return data || [];
    }
  },
  resources: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select(RESOURCE_COLUMNS)
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
          tags: parseTags(resourceData.tags),
          image_url: resourceData.imageUrl || null,
          storage_path: resourceData.storagePath || null
        })
        .select(RESOURCE_COLUMNS)
        .single();

      if (error) throw error;
      return data;
    },
    // Solo envía los campos definidos para no borrar datos por omisión
    update: async (id, resourceData) => {
      const dbData = {};
      if (resourceData.title !== undefined) dbData.title = resourceData.title;
      if (resourceData.type !== undefined) dbData.type = resourceData.type;
      if (resourceData.url !== undefined) dbData.url = resourceData.url;
      if (resourceData.description !== undefined) dbData.description = resourceData.description;
      if (resourceData.category !== undefined) dbData.category = resourceData.category;
      if (resourceData.tags !== undefined) dbData.tags = parseTags(resourceData.tags);
      if (resourceData.imageUrl !== undefined) dbData.image_url = resourceData.imageUrl || null;
      if (resourceData.storagePath !== undefined) dbData.storage_path = resourceData.storagePath || null;

      const { data, error } = await supabase
        .from('resources')
        .update(dbData)
        .eq('id', id)
        .select(RESOURCE_COLUMNS)
        .single();

      if (error) throw error;
      return data;
    },
    // El trigger on_resource_deleted limpia las asignaciones de los alumnos
    delete: async (resource) => {
      const { error: deleteError } = await supabase
        .from('resources')
        .delete()
        .eq('id', resource.id);

      if (deleteError) throw deleteError;
      await api.resources.removeFile(resource);
      return true;
    },
    removeFile: async (resource) => {
      if (!resource.storage_path) return;
      const { error } = await supabase.storage.from(resourceBucket(resource)).remove([resource.storage_path]);
      if (error) console.warn('No se pudo borrar el archivo del recurso:', error.message);
    },
    // Deja el recurso asignado exactamente a esos alumnos (operación atómica)
    setAssignments: async (resourceId, studentIds) => {
      const { error } = await supabase.rpc('set_resource_assignments', {
        p_resource_id: resourceId,
        p_student_ids: studentIds
      });
      if (error) throw error;
    },
    uploadCover: async (file) => {
      assertFile(file, IMAGE_TYPES, 5);
      const path = await uploadFile('course-covers', randomFileName(file), file);
      return supabase.storage.from('course-covers').getPublicUrl(path).data.publicUrl;
    },
    uploadDocument: async (file) => {
      assertFile(file, ['application/pdf'], 20);
      return uploadFile('academy-resources', `documents/${randomFileName(file)}`, file);
    },
    // URL utilizable para mostrar el recurso (firmada si está en Storage)
    getFileUrl: async (resource) => {
      if (!resource.storage_path) return resource.url;
      return createSignedUrl(resourceBucket(resource), resource.storage_path);
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
    // Ticket + primer mensaje en una única transacción (RPC)
    create: async (ticketData) => {
      const { data, error } = await supabase.rpc('create_ticket', {
        p_title: ticketData.title,
        p_content: ticketData.content,
        p_attachment_url: ticketData.attachment_url,
        p_attachment_name: ticketData.attachment_name,
        p_attachment_type: ticketData.attachment_type
      });

      if (error) throw error;
      return data;
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
        .select(TICKET_MESSAGE_SELECT)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return withSignedAttachments(data.map(mapTicketMessage));
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
        .select(TICKET_MESSAGE_SELECT)
        .single();

      if (error) throw error;
      const [message] = await withSignedAttachments([mapTicketMessage(data)]);
      return message;
    },
    // Sube a la carpeta del usuario; devuelve la ruta para guardarla en el mensaje
    uploadAttachment: async (file, userId) => {
      assertFile(file, DOCUMENT_TYPES.concat('image/gif'), 10);
      const path = await uploadFile(SUPPORT_BUCKET, `ticket-uploads/${userId}/${randomFileName(file)}`, file);
      return {
        url: path,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document'
      };
    }
  },
  residencyDocs: {
    upload: async (file, userId) => {
      assertFile(file, DOCUMENT_TYPES, 5);
      const path = await uploadFile('residency-docs', `${userId}/${randomFileName(file)}`, file);
      return {
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        uploadedAt: new Date().toISOString(),
        path
      };
    },
    getUrl: async (doc) => {
      if (!doc?.path) throw new Error('Este documento se registró antes de habilitar la subida real y no tiene archivo asociado.');
      return createSignedUrl('residency-docs', doc.path);
    },
    remove: async (doc) => {
      if (!doc?.path) return;
      const { error } = await supabase.storage.from('residency-docs').remove([doc.path]);
      if (error) console.warn('No se pudo borrar el documento anterior:', error.message);
    }
  }
};
