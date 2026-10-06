import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Edit2, Eye, ListTree, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../../services/api';
import { formatClock, moveItem, nextPosition, plural } from '../../../lib/courses';
import { ResourceIcon, resourceTypeLabel } from '../../resources/resourceMeta';
import LessonFormModal from './LessonFormModal';
import { Panel, dangerIconButton, iconButton, primaryButton, smallInputClass } from './ui';

// Temario: capítulos y lecciones. Cada cambio se guarda al momento y se
// recarga la formación (onChanged).
export default function CurriculumEditor({ course, onChanged, onError, onPreview }) {
  const [busy, setBusy] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [renaming, setRenaming] = useState({ id: null, title: '' });
  const [lessonModal, setLessonModal] = useState(null); // { sectionId, lesson? }

  const run = async (action, errorMessage) => {
    setBusy(true);
    try {
      await action();
      await onChanged();
    } catch (err) {
      onError(`${errorMessage}: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const addSection = (e) => {
    e.preventDefault();
    const title = newSectionTitle.trim();
    if (!title) return;
    run(async () => {
      await api.sections.create(course.id, title, nextPosition(course.sections));
      setNewSectionTitle('');
    }, 'No se pudo crear el capítulo');
  };

  const saveRename = (e) => {
    e.preventDefault();
    if (!renaming.title.trim()) return;
    run(async () => {
      await api.sections.rename(renaming.id, renaming.title);
      setRenaming({ id: null, title: '' });
    }, 'No se pudo renombrar el capítulo');
  };

  const deleteSection = (section) => {
    const detail = section.lessons.length ? ` y sus ${section.lessons.length} lecciones (con sus materiales)` : '';
    if (!confirm(`¿Eliminar el capítulo "${section.title}"${detail}?`)) return;
    run(() => api.sections.delete(section, course), 'No se pudo eliminar el capítulo');
  };

  const moveSection = (section, delta) => {
    const ids = moveItem(course.sections.map(s => s.id), section.id, delta);
    run(() => api.sections.reorder(course.id, ids), 'No se pudo mover el capítulo');
  };

  const moveLesson = (section, lesson, delta) => {
    const ids = moveItem(section.lessons.map(l => l.id), lesson.id, delta);
    run(() => api.lessons.reorder(section.id, ids), 'No se pudo mover la lección');
  };

  const deleteLesson = (lesson) => {
    if (!confirm(`¿Eliminar la lección "${lesson.title}"? También se borrarán sus materiales.`)) return;
    run(() => api.lessons.delete(lesson, course), 'No se pudo eliminar la lección');
  };

  // Numeración continua de lecciones a lo largo de los capítulos
  const firstNumber = course.sections.map((_, i) =>
    course.sections.slice(0, i).reduce((n, s) => n + s.lessons.length, 1));

  return (
    <Panel title={`Temario · ${plural(course.lessons.length, 'lección', 'lecciones')}`} icon={ListTree}>
      {course.sections.length === 0 && (
        <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest text-center py-6">
          Empieza creando el primer capítulo
        </p>
      )}

      <div className="space-y-4">
        {course.sections.map((section, sectionIndex) => (
          <div key={section.id} className="border border-border-main rounded-2xl overflow-hidden">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 px-4 py-3 bg-bg-input/50 border-b border-border-main">
              {renaming.id === section.id ? (
                <form onSubmit={saveRename} className="flex-1 flex items-center gap-2">
                  <input
                    value={renaming.title}
                    onChange={(e) => setRenaming(prev => ({ ...prev, title: e.target.value }))}
                    maxLength={200}
                    className={smallInputClass}
                    autoFocus
                  />
                  <button type="submit" className={iconButton} title="Guardar"><Check className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setRenaming({ id: null, title: '' })} className={iconButton} title="Cancelar"><X className="w-4 h-4" /></button>
                </form>
              ) : (
                <>
                  <h5 className="flex-1 min-w-[70%] sm:min-w-0 text-[11px] font-extrabold text-text-title font-mono uppercase tracking-wider truncate">
                    Capítulo {sectionIndex + 1}: {section.title}
                  </h5>
                  <div className="flex items-center ml-auto">
                  <button onClick={() => moveSection(section, -1)} disabled={busy || sectionIndex === 0} className={iconButton} title="Subir capítulo"><ArrowUp className="w-4 h-4" /></button>
                  <button onClick={() => moveSection(section, 1)} disabled={busy || sectionIndex === course.sections.length - 1} className={iconButton} title="Bajar capítulo"><ArrowDown className="w-4 h-4" /></button>
                  <button onClick={() => setRenaming({ id: section.id, title: section.title })} disabled={busy} className={iconButton} title="Renombrar"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => deleteSection(section)} disabled={busy} className={dangerIconButton} title="Eliminar capítulo"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </>
              )}
            </div>

            <ul className="divide-y divide-border-main/50">
              {section.lessons.map((lesson, lessonIndex) => (
                  <li key={lesson.id} className="flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1 px-4 py-2.5 group hover:bg-bg-input/20">
                    <span className="w-6 text-[10px] text-text-muted font-mono text-right shrink-0">{firstNumber[sectionIndex] + lessonIndex}</span>
                    <ResourceIcon type={lesson.type} size="w-4 h-4" />
                    <div className="flex-1 min-w-[70%] sm:min-w-0">
                      <p className="text-xs font-bold text-text-main truncate">{lesson.title}</p>
                      <p className="text-[9px] text-text-muted font-mono uppercase">
                        {resourceTypeLabel(lesson.type)}
                        {lesson.durationSeconds != null && ` · ${formatClock(lesson.durationSeconds)}`}
                      </p>
                    </div>
                    <div className="flex items-center ml-auto sm:opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onPreview(lesson)} className={iconButton} title="Vista previa"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => moveLesson(section, lesson, -1)} disabled={busy || lessonIndex === 0} className={iconButton} title="Subir"><ArrowUp className="w-4 h-4" /></button>
                      <button onClick={() => moveLesson(section, lesson, 1)} disabled={busy || lessonIndex === section.lessons.length - 1} className={iconButton} title="Bajar"><ArrowDown className="w-4 h-4" /></button>
                      <button onClick={() => setLessonModal({ sectionId: section.id, lesson })} disabled={busy} className={iconButton} title="Editar"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteLesson(lesson)} disabled={busy} className={dangerIconButton} title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </li>
              ))}
              <li className="px-4 py-2.5">
                <button
                  onClick={() => setLessonModal({ sectionId: section.id })}
                  disabled={busy}
                  className="text-[10px] font-bold text-text-active font-mono uppercase tracking-widest flex items-center gap-1.5 cursor-pointer hover:underline disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir lección
                </button>
              </li>
            </ul>
          </div>
        ))}
      </div>

      <form onSubmit={addSection} className="flex gap-2">
        <input
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          placeholder="Título del nuevo capítulo"
          maxLength={200}
          className={smallInputClass}
        />
        <button type="submit" disabled={busy || !newSectionTitle.trim()} className={`${primaryButton} shrink-0`}>
          <Plus className="w-4 h-4" /> Capítulo
        </button>
      </form>

      {lessonModal && (
        <LessonFormModal
          course={course}
          sectionId={lessonModal.sectionId}
          lesson={lessonModal.lesson}
          onClose={() => setLessonModal(null)}
          onSaved={async () => {
            setLessonModal(null);
            await onChanged();
          }}
        />
      )}
    </Panel>
  );
}
