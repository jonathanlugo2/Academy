import { useState } from 'react';
import { Upload } from 'lucide-react';
import { api } from '../../../services/api';
import { COVER_PRESETS } from '../../resources/resourceMeta';
import { Field, inputClass } from './ui';

// Portada de la formación: ilustración predefinida, URL o imagen subida
export default function CoverPicker({ value, onChange, onError }) {
  const [uploading, setUploading] = useState(false);
  const isCustomUrl = value && !value.startsWith('/preset_');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      onChange(await api.courses.uploadCover(file));
    } catch (err) {
      onError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Field label="Imagen de portada" className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {COVER_PRESETS.map(preset => (
          <button
            key={preset.url}
            type="button"
            onClick={() => onChange(preset.url)}
            className={`px-3 py-2 rounded-xl text-[9px] font-bold font-mono uppercase border cursor-pointer transition-colors ${
              value === preset.url
                ? 'bg-bg-active text-text-active border-border-active'
                : 'bg-bg-input text-text-muted border-border-main hover:border-border-hover hover:text-text-main'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          value={isCustomUrl ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... (URL de imagen)"
          className={inputClass}
        />
        <label className="flex items-center justify-center gap-2 border border-dashed border-border-main hover:border-border-hover bg-bg-input/40 rounded-2xl py-3 transition-all cursor-pointer group">
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleUpload} disabled={uploading} className="hidden" />
          <Upload className="w-4 h-4 text-text-muted group-hover:text-text-active" />
          <span className="text-[9px] font-bold text-text-muted font-mono uppercase tracking-widest group-hover:text-text-main">
            {uploading ? 'Subiendo...' : 'Subir imagen (máx. 5 MB)'}
          </span>
        </label>
      </div>
      {value && (
        <div className="p-3 bg-bg-input/40 border border-border-main rounded-2xl flex items-center gap-3">
          <img src={value} alt="Portada" className="w-20 h-12 rounded-lg object-cover border border-border-main shrink-0" />
          <p className="text-[9px] text-text-muted truncate font-mono flex-1">{value}</p>
          <button type="button" onClick={() => onChange('')} className="text-[9px] text-red-500 font-bold font-mono px-3 py-1.5 border border-border-main rounded-xl cursor-pointer hover:bg-bg-input">
            Quitar
          </button>
        </div>
      )}
    </Field>
  );
}
