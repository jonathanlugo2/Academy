// Capa de acceso a datos (Supabase). La autorización real la imponen las
// políticas RLS y las funciones RPC de la base de datos; aquí solo se mapean
// datos y se orquestan las llamadas.
import { supabase } from '../utils/supabaseClient';
import { attachmentStoragePath } from '../lib/storagePaths';
import { mapCourse, mapLesson, mapMaterial, mapProgress } from '../lib/courses';

export const PROFILE_COLUMNS = 'id, name, role, passport, nie, address, postal_code, arrival_date, aeat_date, ss_date, residency_doc, email, active, must_change_password, deactivated_at, absence_periods!absence_periods_student_id_fkey(id, start_date, end_date, note)';

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const MB = 1024 * 1024;

const EXTENSION_BY_MIME = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/zip': 'zip',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
};

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const DOCUMENT_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
// Coincide con allowed_mime_types del bucket academy-resources
const MATERIAL_TYPES = Object.keys(EXTENSION_BY_MIME);
export const MATERIAL_ACCEPT = MATERIAL_TYPES.join(',');
const MATERIAL_MAX_MB = 50;

const mapAbsence = (a) => ({ id: a.id, startDate: a.start_date, endDate: a.end_date, note: a.note });

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
    absencePeriods: (p.absence_periods || []).map(mapAbsence).sort((a, b) => a.startDate.localeCompare(b.startDate)),
    aeatDate: p.aeat_date,
    ssDate: p.ss_date,
    residencyDoc: p.residency_doc,
    email: p.email,
    active: p.active !== false,
    mustChangePassword: Boolean(p.must_change_password),
    deactivatedAt: p.deactivated_at ?? null
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

async function createSignedUrl(bucket, path, options) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL_SECONDS, options);
  if (error) throw new Error(`No se pudo acceder al archivo: ${error.message}`);
  return data.signedUrl;
}

// --- Formaciones -------------------------------------------------------------

const COURSE_BUCKET = 'academy-resources';
const LESSON_COLUMNS = 'id, course_id, section_id, title, description, type, url, storage_path, duration_seconds, position, created_at';
const MATERIAL_COLUMNS = 'id, course_id, lesson_id, title, url, storage_path, file_name, mime_type, size_bytes, position, created_at';
const COURSE_SELECT = `id, title, description, category, tags, image_url, is_published, created_at, updated_at,
  course_sections(id, title, position, created_at, lessons(${LESSON_COLUMNS})),
  course_materials(${MATERIAL_COLUMNS}),
  course_enrollments(student_id)`;

function courseRow(courseData) {
  const row = {};
  if (courseData.title !== undefined) row.title = courseData.title.trim();
  if (courseData.description !== undefined) row.description = courseData.description.trim() || null;
  if (courseData.category !== undefined) row.category = courseData.category || null;
  if (courseData.tags !== undefined) row.tags = parseTags(courseData.tags);
  if (courseData.imageUrl !== undefined) row.image_url = courseData.imageUrl || null;
  if (courseData.isPublished !== undefined) row.is_published = courseData.isPublished;
  return row;
}

function lessonRow(lessonData) {
  const row = {};
  if (lessonData.sectionId !== undefined) row.section_id = lessonData.sectionId;
  if (lessonData.title !== undefined) row.title = lessonData.title.trim();
  if (lessonData.description !== undefined) row.description = lessonData.description.trim() || null;
  if (lessonData.type !== undefined) row.type = lessonData.type;
  if (lessonData.url !== undefined) row.url = lessonData.url.trim() || null;
  if (lessonData.storagePath !== undefined) row.storage_path = lessonData.storagePath || null;
  if (lessonData.durationSeconds !== undefined) row.duration_seconds = lessonData.durationSeconds;
  return row;
}

async function removeCourseFiles(paths) {
  const list = paths.filter(Boolean);
  if (list.length === 0) return;
  const { error } = await supabase.storage.from(COURSE_BUCKET).remove(list);
  if (error) console.warn('No se pudieron borrar ficheros de la formación:', error.message);
}

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

function absenceErrorMessage(error) {
  if (error.code === '23P01') return 'La ausencia se solapa con otra ya registrada.';
  if (error.message?.includes('absence_periods_min_length')) return 'Solo se registran ausencias de 30 días o más.';
  if (error.message?.includes('absence_periods_order')) return 'La fecha de regreso no puede ser anterior a la de salida.';
  return error.message;
}

// Gestión de cuentas mediante la Edge Function (requiere service role en el servidor)
async function adminUsers(action, body = {}) {
  const { data, error } = await supabase.functions.invoke('admin-users', { body: { action, ...body } });
  if (error) {
    const payload = await error.context?.json?.().catch(() => null);
    throw new Error(payload?.error || 'No se pudo completar la operación.');
  }
  return data;
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
    // Alta con invitación por correo o contraseña temporal (access: 'invite' | 'password').
    // tempPassword solo llega en el modo 'password' y se muestra una única vez.
    create: async (userData) => {
      const data = await adminUsers('create', userData);
      return { tempPassword: data.tempPassword, recovered: data.recovered };
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
      if (userData.aeatDate !== undefined) dbData.aeat_date = userData.aeatDate;
      if (userData.ssDate !== undefined) dbData.ss_date = userData.ssDate;
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
    // Baja reversible: bloquea el acceso y conserva sus datos
    deactivate: (id) => adminUsers('deactivate', { userId: id }),
    reactivate: (id) => adminUsers('reactivate', { userId: id }),
    // Solo usuarios dados de baja: borra la cuenta y, en cascada, todos sus datos
    delete: (id) => adminUsers('delete', { userId: id }),
    // Reenvía la invitación o, si ya la aceptó, un enlace para crear contraseña nueva
    sendAccessLink: (id) => adminUsers('send-access-link', { userId: id }),
    resetPassword: async (id) => (await adminUsers('reset-password', { userId: id })).tempPassword
  },
  // Cuenta del usuario en sesión
  account: {
    // Fija la contraseña de la sesión actual y quita el cambio obligatorio
    setPassword: async (password) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      const { error: rpcError } = await supabase.rpc('complete_password_change');
      if (rpcError) throw rpcError;
    },
    // Comprueba la contraseña actual antes de cambiarla
    changePassword: async (email, currentPassword, newPassword) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (error) throw new Error('La contraseña actual no es correcta.');
      await api.account.setPassword(newPassword);
    },
    sendRecoveryEmail: async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/restablecer-contrasena`
      });
      if (error) throw error;
    }
  },
  // Ausencias largas (solo administración; la BD exige >= 30 días y sin solapes)
  absences: {
    create: async (studentId, { startDate, endDate, note }) => {
      const { data, error } = await supabase
        .from('absence_periods')
        .insert({ student_id: studentId, start_date: startDate, end_date: endDate, note: note?.trim() || null })
        .select('id, start_date, end_date, note')
        .single();

      if (error) throw new Error(absenceErrorMessage(error));
      return mapAbsence(data);
    },
    remove: async (id) => {
      const { error } = await supabase.from('absence_periods').delete().eq('id', id);
      if (error) throw error;
    }
  },
  // Formaciones: la RLS devuelve al alumno solo las publicadas en las que está
  // inscrito; al admin, todas (también borradores).
  courses: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(COURSE_SELECT)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(mapCourse);
    },
    getById: async (id) => {
      const { data, error } = await supabase
        .from('courses')
        .select(COURSE_SELECT)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data ? mapCourse(data) : null;
    },
    create: async (courseData) => {
      const { data, error } = await supabase
        .from('courses')
        .insert(courseRow(courseData))
        .select(COURSE_SELECT)
        .single();

      if (error) throw error;
      return mapCourse(data);
    },
    // Solo envía los campos definidos para no borrar datos por omisión
    update: async (id, courseData) => {
      const { data, error } = await supabase
        .from('courses')
        .update(courseRow(courseData))
        .eq('id', id)
        .select(COURSE_SELECT)
        .single();

      if (error) throw error;
      return mapCourse(data);
    },
    // Capítulos, lecciones, materiales, inscripciones y progreso caen en cascada
    delete: async (course) => {
      const { error } = await supabase.from('courses').delete().eq('id', course.id);
      if (error) throw error;
      await removeCourseFiles([
        ...course.lessons.map(l => l.storagePath),
        ...course.materials.map(m => m.storagePath)
      ]);
    },
    uploadCover: async (file) => {
      assertFile(file, IMAGE_TYPES, 5);
      const path = await uploadFile('course-covers', randomFileName(file), file);
      return supabase.storage.from('course-covers').getPublicUrl(path).data.publicUrl;
    },
    // Deja la formación asignada exactamente a esos alumnos (operación atómica)
    setEnrollments: async (courseId, studentIds) => {
      const { error } = await supabase.rpc('set_course_enrollments', {
        p_course_id: courseId,
        p_student_ids: studentIds
      });
      if (error) throw error;
    },
    // Activa/desactiva una formación a un alumno desde su ficha
    setEnrollment: async (studentId, courseId, enabled) => {
      const { error } = await supabase.rpc('set_course_enrollment', {
        p_student_id: studentId,
        p_course_id: courseId,
        p_enabled: enabled
      });
      if (error) throw error;
    }
  },
  sections: {
    create: async (courseId, title, position) => {
      const { data, error } = await supabase
        .from('course_sections')
        .insert({ course_id: courseId, title: title.trim(), position })
        .select('id, title, position, created_at')
        .single();

      if (error) throw error;
      return { id: data.id, title: data.title, position: data.position, createdAt: data.created_at, lessons: [] };
    },
    rename: async (id, title) => {
      const { error } = await supabase.from('course_sections').update({ title: title.trim() }).eq('id', id);
      if (error) throw error;
    },
    // Sus lecciones y los materiales de esas lecciones caen en cascada
    delete: async (section, course) => {
      const lessonIds = new Set(section.lessons.map(l => l.id));
      const { error } = await supabase.from('course_sections').delete().eq('id', section.id);
      if (error) throw error;
      await removeCourseFiles([
        ...section.lessons.map(l => l.storagePath),
        ...course.materials.filter(m => lessonIds.has(m.lessonId)).map(m => m.storagePath)
      ]);
    },
    reorder: async (courseId, sectionIds) => {
      const { error } = await supabase.rpc('reorder_course_sections', {
        p_course_id: courseId,
        p_section_ids: sectionIds
      });
      if (error) throw error;
    }
  },
  lessons: {
    create: async (courseId, lessonData, position) => {
      const { data, error } = await supabase
        .from('lessons')
        .insert({ ...lessonRow(lessonData), course_id: courseId, position })
        .select(LESSON_COLUMNS)
        .single();

      if (error) throw error;
      return mapLesson(data);
    },
    update: async (id, lessonData) => {
      const { data, error } = await supabase
        .from('lessons')
        .update(lessonRow(lessonData))
        .eq('id', id)
        .select(LESSON_COLUMNS)
        .single();

      if (error) throw error;
      return mapLesson(data);
    },
    delete: async (lesson, course) => {
      const { error } = await supabase.from('lessons').delete().eq('id', lesson.id);
      if (error) throw error;
      await removeCourseFiles([
        lesson.storagePath,
        ...course.materials.filter(m => m.lessonId === lesson.id).map(m => m.storagePath)
      ]);
    },
    // Ordena las lecciones de un capítulo; también mueve lecciones a él
    reorder: async (sectionId, lessonIds) => {
      const { error } = await supabase.rpc('reorder_section_lessons', {
        p_section_id: sectionId,
        p_lesson_ids: lessonIds
      });
      if (error) throw error;
    },
    // PDF de una lección; devuelve la ruta para guardarla en la lección
    uploadDocument: async (courseId, file) => {
      assertFile(file, ['application/pdf'], 20);
      return uploadFile(COURSE_BUCKET, `courses/${courseId}/${randomFileName(file)}`, file);
    },
    removeFile: async (path) => removeCourseFiles([path]),
    // URL utilizable para mostrar la lección (firmada si está en Storage)
    getFileUrl: async (lesson) => {
      if (!lesson.storagePath) return lesson.url;
      return createSignedUrl(COURSE_BUCKET, lesson.storagePath);
    }
  },
  materials: {
    // Sube el fichero y crea el material; si falla el alta, borra el fichero
    upload: async ({ courseId, lessonId = null, title, position }, file) => {
      assertFile(file, MATERIAL_TYPES, MATERIAL_MAX_MB);
      const path = await uploadFile(COURSE_BUCKET, `courses/${courseId}/materials/${randomFileName(file)}`, file);

      const { data, error } = await supabase
        .from('course_materials')
        .insert({
          course_id: courseId,
          lesson_id: lessonId,
          title: (title || file.name).trim(),
          storage_path: path,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          position
        })
        .select(MATERIAL_COLUMNS)
        .single();

      if (error) {
        await removeCourseFiles([path]);
        throw error;
      }
      return mapMaterial(data);
    },
    // Material como enlace externo (p. ej. una hoja de cálculo compartida)
    createLink: async ({ courseId, lessonId = null, title, url, position }) => {
      const { data, error } = await supabase
        .from('course_materials')
        .insert({ course_id: courseId, lesson_id: lessonId, title: title.trim(), url: url.trim(), position })
        .select(MATERIAL_COLUMNS)
        .single();

      if (error) throw error;
      return mapMaterial(data);
    },
    rename: async (id, title) => {
      const { error } = await supabase.from('course_materials').update({ title: title.trim() }).eq('id', id);
      if (error) throw error;
    },
    delete: async (material) => {
      const { error } = await supabase.from('course_materials').delete().eq('id', material.id);
      if (error) throw error;
      await removeCourseFiles([material.storagePath]);
    },
    // Enlace de descarga con el nombre original del fichero
    getDownloadUrl: async (material) => {
      if (!material.storagePath) return material.url;
      return createSignedUrl(COURSE_BUCKET, material.storagePath, { download: material.fileName || true });
    }
  },
  progress: {
    getMine: async (studentId) => {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('lesson_id, course_id, completed_at, last_position_seconds, updated_at')
        .eq('student_id', studentId);

      if (error) throw error;
      return data.map(mapProgress);
    },
    // completed: true/false marca o desmarca; null solo registra la visita
    set: async (lessonId, { completed = null, positionSeconds = null } = {}) => {
      const { data, error } = await supabase.rpc('set_lesson_progress', {
        p_lesson_id: lessonId,
        p_completed: completed,
        p_position_seconds: positionSeconds
      });
      if (error) throw error;
      return mapProgress(data);
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
