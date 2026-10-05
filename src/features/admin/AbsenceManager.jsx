import { useState } from 'react';
import { AlertCircle, Plane, Plus } from 'lucide-react';
import { api } from '../../services/api';
import AbsenceList from '../residency/AbsenceList';
import { MIN_LONG_ABSENCE_DAYS, absenceDaysInYear, absenceLengthDays } from '../../lib/residency';

// Registro de ausencias largas de un alumno (solo administración).
// `onChange` recibe la lista actualizada de ausencias.
export default function AbsenceManager({ student, year, onChange }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState('');

  const periods = student.absencePeriods || [];
  const draftDays = startDate && endDate ? absenceLengthDays({ startDate, endDate }) : 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!startDate || !endDate || endDate < startDate) {
      setError('La fecha de regreso no puede ser anterior a la de salida.');
      return;
    }
    if (draftDays < MIN_LONG_ABSENCE_DAYS) {
      setError(`Solo se registran ausencias de ${MIN_LONG_ABSENCE_DAYS} días o más.`);
      return;
    }

    setSaving(true);
    try {
      const created = await api.absences.create(student.id, { startDate, endDate, note });
      onChange([...periods, created].sort((a, b) => a.startDate.localeCompare(b.startDate)));
      setStartDate('');
      setEndDate('');
      setNote('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (period) => {
    setError('');
    setRemovingId(period.id);
    try {
      await api.absences.remove(period.id);
      onChange(periods.filter(p => p.id !== period.id));
    } catch (err) {
      setError('No se pudo eliminar la ausencia: ' + err.message);
    } finally {
      setRemovingId(null);
    }
  };

  const inputClass = 'w-full bg-bg-input border border-border-main rounded-xl px-3 py-2 text-[11px] text-text-main outline-none focus:border-border-hover transition-all font-mono';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold text-text-title uppercase tracking-widest flex items-center gap-2 font-mono">
          <Plane className="w-4 h-4 text-text-active" />
          Ausencias largas {year}
        </h4>
        <span className="text-[10px] font-bold text-text-muted font-mono uppercase">
          Total: {absenceDaysInYear(periods, year)} días
        </span>
      </div>

      <AbsenceList periods={periods} year={year} onRemove={handleRemove} removingId={removingId} />

      <form onSubmit={handleAdd} className="bg-bg-input/40 p-4 rounded-2xl border border-border-main/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1 font-mono">Salida</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1 font-mono">Regreso</label>
            <input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} required className={inputClass} />
          </div>
        </div>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Nota (opcional): destino, motivo…" className={inputClass} />

        {error && (
          <p className="text-[10px] text-red-500 font-mono flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}</p>
        )}

        <div className="flex items-center justify-between gap-3">
          <span className="text-[9px] text-text-muted font-mono uppercase tracking-wider">
            {draftDays > 0 ? `${draftDays} días` : `Mínimo ${MIN_LONG_ABSENCE_DAYS} días seguidos`}
          </span>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            {saving ? 'Guardando…' : 'Añadir ausencia'}
          </button>
        </div>
      </form>
    </div>
  );
}
