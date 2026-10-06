// Lógica de formaciones independiente de Supabase: monta el temario a partir
// de las filas de la BD y calcula progreso, navegación y duraciones.

const byPosition = (a, b) => a.position - b.position || String(a.createdAt).localeCompare(String(b.createdAt));

export function mapLesson(l) {
  return {
    id: l.id,
    courseId: l.course_id,
    sectionId: l.section_id,
    title: l.title,
    description: l.description || '',
    type: l.type,
    url: l.url || '',
    storagePath: l.storage_path || null,
    durationSeconds: l.duration_seconds ?? null,
    position: l.position,
    createdAt: l.created_at
  };
}

export function mapMaterial(m) {
  return {
    id: m.id,
    courseId: m.course_id,
    lessonId: m.lesson_id || null,
    title: m.title,
    url: m.url || null,
    storagePath: m.storage_path || null,
    fileName: m.file_name || null,
    mimeType: m.mime_type || null,
    sizeBytes: m.size_bytes ?? null,
    position: m.position,
    createdAt: m.created_at
  };
}

// Fila de courses con sus relaciones anidadas → formación con temario ordenado
export function mapCourse(c) {
  const sections = (c.course_sections || [])
    .map(s => ({
      id: s.id,
      title: s.title,
      position: s.position,
      createdAt: s.created_at,
      lessons: (s.lessons || []).map(mapLesson).sort(byPosition)
    }))
    .sort(byPosition);
  const lessons = sections.flatMap(s => s.lessons);

  return {
    id: c.id,
    title: c.title,
    description: c.description || '',
    category: c.category || '',
    tags: c.tags || [],
    imageUrl: c.image_url || null,
    isPublished: c.is_published,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    sections,
    lessons,
    materials: (c.course_materials || []).map(mapMaterial).sort(byPosition),
    studentIds: (c.course_enrollments || []).map(e => e.student_id),
    totalSeconds: lessons.reduce((sum, l) => sum + (l.durationSeconds || 0), 0)
  };
}

export function mapProgress(p) {
  return {
    lessonId: p.lesson_id,
    courseId: p.course_id,
    completedAt: p.completed_at,
    positionSeconds: p.last_position_seconds ?? null,
    updatedAt: p.updated_at
  };
}

// Mapa lessonId → progreso, para consultas rápidas desde la vista
export function indexProgress(progressList) {
  return new Map((progressList || []).map(p => [p.lessonId, p]));
}

export function isLessonCompleted(progressByLesson, lessonId) {
  return Boolean(progressByLesson.get(lessonId)?.completedAt);
}

export function courseProgress(course, progressByLesson) {
  const total = course.lessons.length;
  const completed = course.lessons.filter(l => isLessonCompleted(progressByLesson, l.id)).length;
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
}

// Lección por la que reanudar: la última abierta; si no hay, la primera.
export function resumeLesson(course, progressByLesson) {
  let latest = null;
  for (const lesson of course.lessons) {
    const p = progressByLesson.get(lesson.id);
    if (p && (!latest || p.updatedAt > latest.updatedAt)) latest = { lesson, updatedAt: p.updatedAt };
  }
  return latest?.lesson || course.lessons[0] || null;
}

export function adjacentLessons(course, lessonId) {
  const index = course.lessons.findIndex(l => l.id === lessonId);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: course.lessons[index - 1] || null,
    next: course.lessons[index + 1] || null
  };
}

export function lessonMaterials(course, lessonId) {
  return course.materials.filter(m => m.lessonId === lessonId);
}

export function courseLevelMaterials(course) {
  return course.materials.filter(m => !m.lessonId);
}

// 75 → "1:15"; 3725 → "1:02:05"
export function formatClock(seconds) {
  if (seconds == null) return '';
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${rest}` : `${m}:${rest}`;
}

// Duración total legible: "45 min", "1 h 5 min", "" si no se conoce
export function formatTotal(seconds) {
  if (!seconds) return '';
  const minutes = Math.max(1, Math.round(seconds / 60));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// Entrada del admin: "12" (minutos), "4:30" o "1:02:05" → segundos; vacío → null
export function parseDuration(value) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (/^\d+$/.test(text)) return Number(text) * 60;
  if (!/^\d+(:[0-5]\d){1,2}$/.test(text)) return NaN;
  return text.split(':').map(Number).reduce((total, part) => total * 60 + part, 0);
}

// Mueve un id una posición arriba (-1) o abajo (+1); devuelve un array nuevo
export function moveItem(ids, id, delta) {
  const from = ids.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= ids.length) return ids;
  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export function formatFileSize(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`;
}

// "1 lección", "3 lecciones"
export function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

// Siguiente posición libre al final de una lista de capítulos, lecciones o materiales
export function nextPosition(items) {
  return (items || []).reduce((max, i) => Math.max(max, i.position), 0) + 1;
}
