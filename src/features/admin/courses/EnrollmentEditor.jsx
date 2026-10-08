import { useMemo, useState } from 'react';
import { Save, Search, Users } from 'lucide-react';
import { api } from '../../../services/api';
import { LEARNER_ROLES, roleLabel } from '../../../lib/roles';
import { Panel, Spinner, primaryButton, secondaryButton, smallInputClass } from './ui';

// Alumnos y asesores con acceso a la formación. Se guarda de una vez (RPC atómica).
// Los usuarios dados de baja no aparecen, pero conservan su inscripción.
export default function EnrollmentEditor({ course, users, onChanged, onError }) {
  const [selected, setSelected] = useState(() => new Set(course.studentIds));
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const students = useMemo(() => users.filter(u => LEARNER_ROLES.includes(u.role) && u.active), [users]);
  const visible = students.filter(s =>
    `${s.name || ''} ${s.email || ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  const dirty = selected.size !== course.studentIds.length || course.studentIds.some(id => !selected.has(id));

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.courses.setEnrollments(course.id, [...selected]);
      await onChanged();
    } catch (err) {
      onError('No se pudieron guardar los accesos: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel
      title={`Alumnos y asesores con acceso · ${students.filter(s => selected.has(s.id)).length} de ${students.length}`}
      icon={Users}
      actions={(
        <div className="flex gap-2">
          <button type="button" onClick={() => setSelected(new Set(students.map(s => s.id)))} className={secondaryButton}>Todos</button>
          <button type="button" onClick={() => setSelected(new Set())} className={secondaryButton}>Ninguno</button>
        </div>
      )}
    >
      {!course.isPublished && (
        <p className="text-[10px] text-amber-500 font-mono uppercase">
          La formación está en borrador: los alumnos asignados no la verán hasta publicarla.
        </p>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre o correo" className={`${smallInputClass} pl-9`} />
      </div>
      <ul className="max-h-80 overflow-y-auto custom-scrollbar space-y-1.5">
        {visible.map(s => (
          <li key={s.id}>
            <label className="flex items-center gap-3 px-3 py-2 bg-bg-input/40 border border-border-main rounded-xl cursor-pointer hover:border-border-hover">
              <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} className="accent-indigo-600 w-4 h-4" />
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-bold text-text-main truncate">{s.name}</span>
                <span className="block text-[9px] text-text-muted font-mono truncate">{s.email}</span>
              </span>
              <span className="text-[8px] font-bold text-text-muted font-mono uppercase border border-border-main rounded px-1.5 py-0.5">{roleLabel(s.role)}</span>
            </label>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="text-[10px] text-text-muted font-mono uppercase text-center py-4">No hay usuarios que coincidan</li>
        )}
      </ul>
      <div className="flex justify-end">
        <button type="button" onClick={handleSave} disabled={saving || !dirty} className={primaryButton}>
          {saving ? <Spinner /> : <Save className="w-4 h-4" />}
          Guardar accesos
        </button>
      </div>
    </Panel>
  );
}
