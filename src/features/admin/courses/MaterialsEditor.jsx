import { useState } from 'react';
import { Download, ExternalLink, FileText, Paperclip, Plus, Trash2, Upload } from 'lucide-react';
import { MATERIAL_ACCEPT, api } from '../../../services/api';
import { formatFileSize, nextPosition } from '../../../lib/courses';
import { Field, Panel, Spinner, dangerIconButton, iconButton, primaryButton, smallInputClass } from './ui';

const EMPTY_FORM = { target: '', mode: 'file', title: '', url: '', file: null };

// Materiales descargables de la formación o de una lección concreta
export default function MaterialsEditor({ course, onChanged, onError }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const lessonTitle = new Map(course.lessons.map((l, i) => [l.id, `${i + 1}. ${l.title}`]));
  const groups = [
    { key: '', title: 'De la formación', items: course.materials.filter(m => !m.lessonId) },
    ...course.lessons
      .map(l => ({ key: l.id, title: `Lección ${lessonTitle.get(l.id)}`, items: course.materials.filter(m => m.lessonId === l.id) }))
      .filter(g => g.items.length > 0)
  ];

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const base = { courseId: course.id, lessonId: form.target || null, position: nextPosition(course.materials) };
    if (form.mode === 'file' && !form.file) return onError('Selecciona el archivo.');
    if (form.mode === 'link' && (!form.title.trim() || !/^https:\/\//i.test(form.url.trim()))) {
      return onError('El enlace necesita título y una URL que empiece por https://');
    }

    setSaving(true);
    try {
      if (form.mode === 'file') {
        await api.materials.upload({ ...base, title: form.title }, form.file);
      } else {
        await api.materials.createLink({ ...base, title: form.title, url: form.url });
      }
      setForm(prev => ({ ...EMPTY_FORM, target: prev.target, mode: prev.mode }));
      setFileInputKey(k => k + 1);
      await onChanged();
    } catch (err) {
      onError('No se pudo añadir el material: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (material) => {
    if (!confirm(`¿Eliminar el material "${material.title}"?`)) return;
    try {
      await api.materials.delete(material);
      await onChanged();
    } catch (err) {
      onError('No se pudo eliminar el material: ' + err.message);
    }
  };

  const handleOpen = async (material) => {
    try {
      window.open(await api.materials.getDownloadUrl(material), '_blank', 'noopener,noreferrer');
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <Panel title={`Materiales de apoyo · ${course.materials.length}`} icon={Paperclip}>
      <div className="space-y-4">
        {groups.map(group => (
          <div key={group.key || 'course'} className="space-y-2">
            <h5 className="text-[10px] font-extrabold text-text-muted font-mono uppercase tracking-wider truncate">{group.title}</h5>
            {group.items.length === 0 ? (
              <p className="text-[10px] text-text-muted font-mono italic">Sin materiales</p>
            ) : (
              <ul className="space-y-1.5">
                {group.items.map(m => (
                  <li key={m.id} className="flex items-center gap-3 px-3 py-2 bg-bg-input/40 border border-border-main rounded-xl">
                    {m.storagePath ? <FileText className="w-4 h-4 text-text-active shrink-0" /> : <ExternalLink className="w-4 h-4 text-text-active shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-main truncate">{m.title}</p>
                      <p className="text-[9px] text-text-muted font-mono truncate">
                        {m.storagePath ? [m.fileName, formatFileSize(m.sizeBytes)].filter(Boolean).join(' · ') : m.url}
                      </p>
                    </div>
                    <button onClick={() => handleOpen(m)} className={iconButton} title={m.storagePath ? 'Descargar' : 'Abrir'}>
                      {m.storagePath ? <Download className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(m)} className={dangerIconButton} title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border-main pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Asociar a">
          <select value={form.target} onChange={set('target')} className={`${smallInputClass} cursor-pointer`}>
            <option value="">Toda la formación</option>
            {course.lessons.map(l => <option key={l.id} value={l.id}>Lección {lessonTitle.get(l.id)}</option>)}
          </select>
        </Field>
        <Field label="Tipo">
          <div className="flex gap-2">
            {[['file', 'Archivo'], ['link', 'Enlace']].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, mode }))}
                className={`flex-1 py-2 rounded-xl text-[10px] font-bold font-mono uppercase border cursor-pointer ${
                  form.mode === mode ? 'bg-bg-active text-text-active border-border-active' : 'bg-bg-input text-text-muted border-border-main'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>
        <Field label={form.mode === 'file' ? 'Título (opcional)' : 'Título *'}>
          <input value={form.title} onChange={set('title')} maxLength={200} placeholder={form.mode === 'file' ? 'Por defecto, el nombre del archivo' : 'Plantilla de gastos'} className={smallInputClass} />
        </Field>
        {form.mode === 'file' ? (
          <Field label="Archivo * (PDF, Office, imagen, zip, txt o csv · máx. 50 MB)">
            <label className="flex items-center gap-2 border border-dashed border-border-main hover:border-border-hover bg-bg-input/40 rounded-xl px-3 py-2 cursor-pointer group">
              <input
                key={fileInputKey}
                type="file"
                accept={MATERIAL_ACCEPT}
                onChange={(e) => setForm(prev => ({ ...prev, file: e.target.files[0] || null }))}
                className="hidden"
              />
              <Upload className="w-4 h-4 text-text-muted group-hover:text-text-active shrink-0" />
              <span className="text-[10px] text-text-muted font-mono truncate">{form.file ? form.file.name : 'Seleccionar archivo'}</span>
            </label>
          </Field>
        ) : (
          <Field label="URL *">
            <input value={form.url} onChange={set('url')} placeholder="https://..." className={smallInputClass} />
          </Field>
        )}
        <div className="md:col-span-2 flex justify-end">
          <button type="submit" disabled={saving} className={primaryButton}>
            {saving ? <Spinner /> : <Plus className="w-4 h-4" />}
            Añadir material
          </button>
        </div>
      </form>
    </Panel>
  );
}
