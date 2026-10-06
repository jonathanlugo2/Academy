import { useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { api } from '../../../services/api';
import { formatClock, nextPosition, parseDuration } from '../../../lib/courses';
import { LESSON_TYPES } from '../../resources/resourceMeta';
import ErrorBanner from '../../../components/ErrorBanner';
import { Field, Modal, Spinner, inputClass, primaryButton, secondaryButton } from './ui';

// Alta o edición de una lección. Un PDF subido y luego descartado se borra de
// Storage; al sustituir el PDF de una lección se borra el anterior.
export default function LessonFormModal({ course, sectionId, lesson, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    title: lesson?.title || '',
    type: lesson?.type || 'video',
    url: lesson?.url || '',
    description: lesson?.description || '',
    duration: lesson?.durationSeconds != null ? formatClock(lesson.durationSeconds) : '',
    sectionId: lesson?.sectionId || sectionId
  }));
  const [storagePath, setStoragePath] = useState(lesson?.storagePath || null);
  const [uploadedPath, setUploadedPath] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const isDocument = form.type === 'document';

  const handlePdf = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const path = await api.lessons.uploadDocument(course.id, file);
      if (uploadedPath) await api.lessons.removeFile(uploadedPath);
      setUploadedPath(path);
      setStoragePath(path);
      if (!form.title.trim()) setForm(prev => ({ ...prev, title: file.name.replace(/\.pdf$/i, '') }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = async () => {
    if (uploadedPath) await api.lessons.removeFile(uploadedPath);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const durationSeconds = parseDuration(form.duration);
    const finalPath = isDocument ? storagePath : null;
    if (!form.title.trim()) return setError('El título es obligatorio.');
    if (Number.isNaN(durationSeconds)) return setError('Duración no válida: usa minutos (12) o mm:ss (4:30).');
    if (!finalPath && !form.url.trim()) {
      return setError(isDocument ? 'Sube el PDF de la lección.' : 'Indica el enlace o el código de la lección.');
    }

    const data = {
      title: form.title,
      type: form.type,
      description: form.description,
      durationSeconds,
      url: finalPath ? '' : form.url,
      storagePath: finalPath
    };

    setSaving(true);
    try {
      if (lesson) {
        await api.lessons.update(lesson.id, data);
        // Cambio de capítulo: se coloca al final del capítulo de destino
        if (form.sectionId !== lesson.sectionId) {
          const target = course.sections.find(s => s.id === form.sectionId);
          await api.lessons.reorder(form.sectionId, [...target.lessons.map(l => l.id), lesson.id]);
        }
        if (lesson.storagePath && lesson.storagePath !== finalPath) await api.lessons.removeFile(lesson.storagePath);
      } else {
        const section = course.sections.find(s => s.id === form.sectionId);
        await api.lessons.create(course.id, { ...data, sectionId: form.sectionId }, nextPosition(section.lessons));
      }
      // Un PDF subido que no se ha usado (se cambió el tipo) no debe quedar huérfano
      if (uploadedPath && uploadedPath !== finalPath) await api.lessons.removeFile(uploadedPath);
      onSaved();
    } catch (err) {
      setError('No se pudo guardar la lección: ' + err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={lesson ? 'Editar lección' : 'Nueva lección'}
      onClose={handleClose}
      footer={(
        <>
          <button type="button" onClick={handleClose} className={secondaryButton}>Cancelar</button>
          <button type="submit" form="lesson-form" disabled={saving || uploading} className={primaryButton}>
            {saving && <Spinner />}
            {lesson ? 'Guardar lección' : 'Añadir lección'}
          </button>
        </>
      )}
    >
      <ErrorBanner message={error} onClose={() => setError('')} />
      <form id="lesson-form" onSubmit={handleSubmit} className="space-y-5">
        <Field label="Título *">
          <input type="text" value={form.title} onChange={set('title')} maxLength={200} className={inputClass} autoFocus />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Tipo">
            <select value={form.type} onChange={set('type')} className={`${inputClass} cursor-pointer`}>
              {LESSON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Capítulo">
            <select value={form.sectionId} onChange={set('sectionId')} className={`${inputClass} cursor-pointer`}>
              {course.sections.map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {s.title}</option>)}
            </select>
          </Field>
        </div>

        {isDocument ? (
          <Field label="Documento PDF *">
            <label className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border-main hover:border-border-hover bg-bg-input/40 rounded-2xl py-6 transition-all cursor-pointer group">
              <input type="file" accept="application/pdf" onChange={handlePdf} disabled={uploading} className="hidden" />
              {storagePath ? <FileText className="w-6 h-6 text-text-active" /> : <Upload className="w-6 h-6 text-text-muted group-hover:text-text-active" />}
              <span className="text-[10px] font-bold text-text-muted font-mono uppercase tracking-widest group-hover:text-text-main">
                {uploading ? 'Subiendo PDF...' : storagePath ? 'PDF cargado (pulsa para sustituirlo)' : 'Selecciona el PDF (máx. 20 MB)'}
              </span>
            </label>
          </Field>
        ) : form.type === 'test' ? (
          <Field label="Código HTML del test *">
            <textarea rows="8" value={form.url} onChange={set('url')} placeholder="Pega aquí el HTML del test..." className={`${inputClass} resize-y`} />
          </Field>
        ) : (
          <Field
            label={form.type === 'html_video' ? 'Código de inserción o URL MP4 *' : 'Enlace *'}
            hint={form.type === 'video' ? 'Enlace de YouTube (puede ser no listado) o de Vimeo' : undefined}
          >
            <input type="text" value={form.url} onChange={set('url')} placeholder="https://..." className={inputClass} />
          </Field>
        )}

        <Field label="Duración" hint="Minutos (12) o mm:ss (4:30). Se muestra en el temario">
          <input type="text" value={form.duration} onChange={set('duration')} placeholder="4:30" className={`${inputClass} max-w-40`} />
        </Field>
        <Field label="Descripción de la lección">
          <textarea rows="3" value={form.description} onChange={set('description')} maxLength={5000} className={`${inputClass} resize-y`} />
        </Field>
      </form>
    </Modal>
  );
}
