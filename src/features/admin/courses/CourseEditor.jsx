import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Trash2 } from 'lucide-react';
import { api } from '../../../services/api';
import { formatTotal, plural } from '../../../lib/courses';
import ErrorBanner from '../../../components/ErrorBanner';
import ResourcePlayer from '../../resources/ResourcePlayer';
import CourseInfoForm from './CourseInfoForm';
import CurriculumEditor from './CurriculumEditor';
import MaterialsEditor from './MaterialsEditor';
import EnrollmentEditor from './EnrollmentEditor';
import { Modal, Spinner, primaryButton, secondaryButton } from './ui';

const TABS = [
  { id: 'curriculum', label: 'Temario' },
  { id: 'info', label: 'Información' },
  { id: 'materials', label: 'Materiales' },
  { id: 'students', label: 'Alumnos' },
];

export default function CourseEditor({ course, users, userEmail, onBack, onCourseChange, onDelete }) {
  const [tab, setTab] = useState('curriculum');
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [previewLesson, setPreviewLesson] = useState(null);

  const reload = async () => {
    const fresh = await api.courses.getById(course.id);
    if (fresh) onCourseChange(fresh);
  };

  const togglePublished = async () => {
    if (!course.isPublished && course.lessons.length === 0) {
      setError('Añade al menos una lección antes de publicar la formación.');
      return;
    }
    setPublishing(true);
    try {
      onCourseChange(await api.courses.update(course.id, { isPublished: !course.isPublished }));
    } catch (err) {
      setError('No se pudo cambiar el estado: ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = () => {
    if (!confirm(`¿Eliminar la formación "${course.title}" con todas sus lecciones, materiales y el progreso de los alumnos? Esta acción es irreversible.`)) return;
    onDelete(course);
  };

  const summary = [
    plural(course.sections.length, 'capítulo', 'capítulos'),
    plural(course.lessons.length, 'lección', 'lecciones'),
    formatTotal(course.totalSeconds),
    plural(course.studentIds.length, 'alumno', 'alumnos')
  ].filter(Boolean).join(' · ');

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-bg-card/40 p-4 rounded-2xl border border-border-main/80">
        <div className="flex items-start gap-3 min-w-0">
          <button onClick={onBack} className={`${secondaryButton} shrink-0`} title="Volver al listado">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-text-title font-mono uppercase tracking-tight truncate">{course.title}</h3>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border font-mono uppercase shrink-0 ${
                course.isPublished ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-500 border-amber-500/30 bg-amber-500/10'
              }`}>
                {course.isPublished ? 'Publicada' : 'Borrador'}
              </span>
            </div>
            <p className="text-[10px] text-text-muted font-mono uppercase mt-1">{summary}</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={togglePublished} disabled={publishing} className={course.isPublished ? secondaryButton : primaryButton}>
            {publishing ? <Spinner /> : course.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {course.isPublished ? 'Pasar a borrador' : 'Publicar'}
          </button>
          <button onClick={handleDelete} className={`${secondaryButton} text-red-400!`} title="Eliminar formación">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      <div role="tablist" className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-bg-input p-1.5 rounded-2xl border border-border-main">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`py-2.5 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              tab === t.id ? 'bg-bg-active text-text-active border border-border-active' : 'text-text-muted hover:text-text-main'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'curriculum' && (
        <CurriculumEditor course={course} onChanged={reload} onError={setError} onPreview={setPreviewLesson} />
      )}
      {tab === 'info' && (
        <CourseInfoForm key={course.id} course={course} onSaved={onCourseChange} onError={setError} />
      )}
      {tab === 'materials' && <MaterialsEditor course={course} onChanged={reload} onError={setError} />}
      {tab === 'students' && (
        <EnrollmentEditor key={course.studentIds.join()} course={course} users={users} onChanged={reload} onError={setError} />
      )}

      {previewLesson && (
        <Modal title={`Vista previa · ${previewLesson.title}`} onClose={() => setPreviewLesson(null)}>
          <div className={`bg-black rounded-2xl overflow-hidden ${previewLesson.type === 'test' ? 'h-[60vh]' : 'aspect-video'}`}>
            <ResourcePlayer resource={previewLesson} userEmail={userEmail} getFileUrl={api.lessons.getFileUrl} />
          </div>
        </Modal>
      )}
    </div>
  );
}
