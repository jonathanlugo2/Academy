import { Plane, Trash2 } from 'lucide-react';
import { formatDate } from '../../lib/dates';
import { absenceDaysInYear, absenceLengthDays, absencesInYear } from '../../lib/residency';

// Ausencias largas que tocan el año indicado. Con `onRemove` muestra el botón
// de borrar (solo administración).
export default function AbsenceList({ periods, year, onRemove, removingId }) {
  const list = absencesInYear(periods, year);

  if (list.length === 0) {
    return (
      <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest text-center py-4 border border-dashed border-border-main rounded-xl">
        Sin ausencias largas en {year}
      </p>
    );
  }

  return (
    <ul className="space-y-2 font-mono">
      {list.map(p => {
        const total = absenceLengthDays(p);
        const inYear = absenceDaysInYear([p], year);
        return (
          <li key={p.id} className="flex items-center justify-between gap-3 p-3 bg-bg-input border border-border-main rounded-xl">
            <div className="flex items-start gap-2 min-w-0">
              <Plane className="w-4 h-4 text-text-active shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-text-main">
                  {formatDate(p.startDate)} → {formatDate(p.endDate)}
                </p>
                {p.note && <p className="text-[10px] text-text-muted truncate font-sans">{p.note}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-text-title uppercase">
                {inYear} días{inYear !== total && <span className="text-text-muted font-normal"> de {total}</span>}
              </span>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(p)}
                  disabled={removingId === p.id}
                  className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                  title="Eliminar ausencia"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
