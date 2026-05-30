import { ArrowUpRight, Calendar, Clock } from 'lucide-react';

export default function AcademyCard({ title, category, status, date, tags, duration, isNew }) {
  const statusColors = {
    'En Progreso': 'bg-indigo-950/40 text-indigo-400 border-indigo-500/20 shadow-[0_0_8px_rgba(0,242,254,0.06)]',
    'Completado': 'bg-emerald-950/40 text-emerald-450 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.06)]',
    'Planificado': 'bg-zinc-950 text-zinc-550 border-zinc-805',
  };

  return (
    <div className="academy-card group relative overflow-hidden">
      {isNew && (
        <div className="absolute top-0 right-0 -mr-8 -mt-2 w-24 h-8 bg-indigo-500 rotate-45 transform flex items-end justify-center pb-1 text-[9px] font-bold text-zinc-950 uppercase tracking-widest font-mono shadow-[0_0_8px_rgba(0,242,254,0.3)] z-10">
          Nuevo
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4 font-mono">
        <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest">{category}</span>
        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border ${statusColors[status] || statusColors['Planificado']}`}>
          {status}
        </span>
      </div>
      
      <h3 className="text-sm font-bold text-zinc-200 mb-2 leading-tight group-hover:text-indigo-400 group-hover:shadow-[0_0_8px_rgba(0,242,254,0.1)] transition-colors font-mono">
        {title}
      </h3>
      
      <div className="flex items-center space-x-4 mb-6 text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
        <div className="flex items-center">
          <Calendar className="w-3.5 h-3.5 mr-1.5 text-zinc-550" />
          {date}
        </div>
        {duration && (
          <div className="flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-zinc-550" />
            {duration}
          </div>
        )}
      </div>
      
      <div className="mt-auto font-mono">
        <div className="flex flex-wrap gap-1.5 mb-5">
          {tags.map((tag, idx) => (
            <span key={idx} className="px-2.5 py-0.5 bg-zinc-950 border border-zinc-850 text-zinc-500 text-[9px] font-bold rounded-lg uppercase tracking-wide">
              {tag}
            </span>
          ))}
        </div>
        
        <div className="pt-4 border-t border-zinc-800/80 flex justify-end">
          <button className="flex items-center text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-indigo-400 transition-colors cursor-pointer">
            Ver detalles
            <ArrowUpRight className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-indigo-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
