import { useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '../../../services/api';
import { RESOURCE_CATEGORIES } from '../../resources/resourceMeta';
import CoverPicker from './CoverPicker';
import { Field, Panel, Spinner, inputClass, primaryButton } from './ui';

export default function CourseInfoForm({ course, onSaved, onError }) {
  const [form, setForm] = useState(() => ({
    title: course.title,
    description: course.description,
    category: course.category,
    tags: course.tags.join(', '),
    imageUrl: course.imageUrl || ''
  }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Categorías antiguas que ya no están en la lista siguen siendo seleccionables
  const categories = RESOURCE_CATEGORIES.includes(course.category) || !course.category
    ? RESOURCE_CATEGORIES
    : [...RESOURCE_CATEGORIES, course.category];

  const set = (field) => (e) => {
    setSaved(false);
    setForm(prev => ({ ...prev, [field]: e?.target ? e.target.value : e }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      onError('El título es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      onSaved(await api.courses.update(course.id, form));
      setSaved(true);
    } catch (err) {
      onError('No se pudo guardar la formación: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Información de la formación">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Título *">
          <input type="text" value={form.title} onChange={set('title')} maxLength={200} className={inputClass} />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Categoría">
            <select value={form.category} onChange={set('category')} className={`${inputClass} cursor-pointer`}>
              <option value="">Sin categoría</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Etiquetas" hint="Separadas por comas">
            <input type="text" value={form.tags} onChange={set('tags')} placeholder="Fiscal, Hacienda" className={inputClass} />
          </Field>
        </div>
        <Field label="Descripción" hint="Qué aprenderá el alumno; se muestra en la pestaña Descripción">
          <textarea rows="5" value={form.description} onChange={set('description')} maxLength={5000} className={`${inputClass} resize-y`} />
        </Field>
        <CoverPicker value={form.imageUrl} onChange={set('imageUrl')} onError={onError} />
        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-[10px] text-emerald-500 font-mono uppercase">Cambios guardados</span>}
          <button type="submit" disabled={saving} className={primaryButton}>
            {saving ? <Spinner /> : <Save className="w-4 h-4" />}
            Guardar información
          </button>
        </div>
      </form>
    </Panel>
  );
}
