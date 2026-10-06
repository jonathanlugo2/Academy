import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Edit2, LayoutGrid, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '../../../services/api';
import { formatTotal, plural } from '../../../lib/courses';
import ErrorBanner from '../../../components/ErrorBanner';
import { RESOURCE_CATEGORIES, getCourseImage } from '../../resources/resourceMeta';
import CourseEditor from './CourseEditor';
import { Field, Modal, Spinner, dangerIconButton, iconButton, inputClass, primaryButton, secondaryButton } from './ui';

const PAGE_SIZE = 8;

// Pestaña de contenido del panel de admin: listado de formaciones y editor
export default function CourseManager({ courses, setCourses, users, userEmail }) {
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(null); // { title, category } mientras el modal está abierto
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const categories = useMemo(
    () => [...new Set([...RESOURCE_CATEGORIES, ...courses.map(c => c.category).filter(Boolean)])],
    [courses]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter(c =>
      (!q || `${c.title} ${c.description}`.toLowerCase().includes(q))
      && (category === 'all' || c.category === category)
      && (status === 'all' || (status === 'published') === c.isPublished));
  }, [courses, query, category, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const editing = courses.find(c => c.id === editingId);

  const replaceCourse = (course) => setCourses(prev => prev.map(c => (c.id === course.id ? course : c)));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!creating.title.trim()) return;
    setSaving(true);
    try {
      // Nace en borrador con un primer capítulo para poder añadir lecciones
      const course = await api.courses.create({ title: creating.title, category: creating.category, isPublished: false });
      await api.sections.create(course.id, 'Introducción', 1);
      const fresh = await api.courses.getById(course.id);
      setCourses(prev => [fresh, ...prev]);
      setCreating(null);
      setEditingId(fresh.id);
    } catch (err) {
      setError('No se pudo crear la formación: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (course) => {
    try {
      await api.courses.delete(course);
      setCourses(prev => prev.filter(c => c.id !== course.id));
      setEditingId(null);
    } catch (err) {
      setError('No se pudo eliminar la formación: ' + err.message);
    }
  };

  if (editing) {
    return (
      <CourseEditor
        course={editing}
        users={users}
        userEmail={userEmail}
        onBack={() => setEditingId(null)}
        onCourseChange={replaceCourse}
        onDelete={handleDelete}
      />
    );
  }

  const selectClass = 'w-full bg-bg-input border border-border-main rounded-xl px-4 py-2.5 text-xs text-text-main outline-none font-mono cursor-pointer';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-card/40 p-4 rounded-2xl border border-border-main/80">
        <div>
          <h3 className="text-lg font-bold text-text-title flex items-center gap-2 font-mono uppercase tracking-tight">
            <LayoutGrid className="w-5 h-5 text-text-active" />
            Formaciones
          </h3>
          <p className="text-xs text-text-muted font-mono mt-0.5">Cada formación agrupa capítulos, lecciones y materiales de apoyo.</p>
        </div>
        <button onClick={() => setCreating({ title: '', category: RESOURCE_CATEGORIES[0] })} className={primaryButton}>
          <Plus className="w-4 h-4" />
          Nueva formación
        </button>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-bg-input/20 p-3 rounded-2xl border border-border-main/40">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Buscar por título o descripción"
            className="w-full bg-bg-input border border-border-main rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-main outline-none font-mono"
          />
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className={selectClass}>
          <option value="all">Todas las categorías</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectClass}>
          <option value="all">Publicadas y borradores</option>
          <option value="published">Publicadas</option>
          <option value="draft">Borradores</option>
        </select>
      </div>

      <div className="bg-bg-card border border-border-main rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-main bg-bg-input/40 text-[10px] text-text-muted font-mono uppercase tracking-widest">
                <th className="px-6 py-4 font-bold">Formación</th>
                <th className="px-6 py-4 font-bold">Contenido</th>
                <th className="px-6 py-4 font-bold">Alumnos</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/40">
              {pageItems.map(course => (
                <tr key={course.id} className="group hover:bg-bg-input/10 transition-colors">
                  <td className="px-6 py-4">
                    <button onClick={() => setEditingId(course.id)} className="flex items-center gap-3 text-left cursor-pointer min-w-0">
                      <img src={getCourseImage(course)} alt="" className="w-16 h-10 rounded-lg object-cover border border-border-main shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-text-main truncate group-hover:text-text-title">{course.title}</span>
                        <span className="block text-[10px] text-text-muted font-mono uppercase truncate">{course.category || 'Sin categoría'}</span>
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-[10px] text-text-muted font-mono uppercase whitespace-nowrap">
                    {plural(course.lessons.length, 'lección', 'lecciones')}
                    {course.materials.length > 0 && ` · ${plural(course.materials.length, 'material', 'materiales')}`}
                    {course.totalSeconds > 0 && <span className="block">{formatTotal(course.totalSeconds)}</span>}
                  </td>
                  <td className="px-6 py-4 text-xs text-text-main font-mono">{course.studentIds.length}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-lg border font-mono uppercase ${
                      course.isPublished ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-500 border-amber-500/30 bg-amber-500/10'
                    }`}>
                      {course.isPublished ? 'Publicada' : 'Borrador'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingId(course.id)} className={iconButton} title="Editar"><Edit2 className="w-4 h-4" /></button>
                      <button
                        onClick={() => confirm(`¿Eliminar la formación "${course.title}" con todas sus lecciones, materiales y el progreso de los alumnos?`) && handleDelete(course)}
                        className={dangerIconButton}
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-text-muted font-mono text-xs uppercase tracking-widest">
                    {courses.length === 0 ? 'Todavía no hay formaciones' : 'No hay formaciones con esos filtros'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-bg-input/25 border-t border-border-main flex items-center justify-between">
            <p className="text-[10px] text-text-muted font-mono uppercase">
              {filtered.length} formaciones · página {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className={iconButton} title="Anterior"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages} className={iconButton} title="Siguiente"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {creating && (
        <Modal
          title="Nueva formación"
          onClose={() => setCreating(null)}
          footer={(
            <>
              <button type="button" onClick={() => setCreating(null)} className={secondaryButton}>Cancelar</button>
              <button type="submit" form="new-course-form" disabled={saving || !creating.title.trim()} className={primaryButton}>
                {saving && <Spinner />}
                Crear y editar temario
              </button>
            </>
          )}
        >
          <form id="new-course-form" onSubmit={handleCreate} className="space-y-5">
            <Field label="Título *">
              <input
                value={creating.title}
                onChange={(e) => setCreating(prev => ({ ...prev, title: e.target.value }))}
                maxLength={200}
                className={inputClass}
                autoFocus
              />
            </Field>
            <Field label="Categoría">
              <select
                value={creating.category}
                onChange={(e) => setCreating(prev => ({ ...prev, category: e.target.value }))}
                className={`${inputClass} cursor-pointer`}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <p className="text-[10px] text-text-muted font-mono uppercase">
              Se crea en borrador con un primer capítulo. Los alumnos no la verán hasta que la publiques.
            </p>
          </form>
        </Modal>
      )}
    </div>
  );
}
