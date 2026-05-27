import { ArrowUpRight, Calendar, Clock } from 'lucide-react';

export default function AcademyCard({ title, category, status, date, tags, duration, isNew }) {
  const statusColors = {
    'En Progreso': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Completado': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Planificado': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  return (
    <div className="academy-card group relative overflow-hidden">
      {isNew && (
        <div className="absolute top-0 right-0 -mr-8 -mt-2 w-24 h-8 bg-red-500 rotate-45 transform flex items-end justify-center pb-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm z-10">
          Nuevo
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-mono text-slate-400">{category}</span>
        <span className={`px-2 py-1 text-[10px] font-medium uppercase tracking-wider rounded-sm border ${statusColors[status] || statusColors['Planificado']}`}>
          {status}
        </span>
      </div>
      
      <h3 className="text-lg font-semibold text-slate-100 mb-2 leading-tight group-hover:text-blue-400 transition-colors">
        {title}
      </h3>
      
      <div className="flex items-center space-x-4 mb-6 text-xs text-slate-500 font-medium">
        <div className="flex items-center">
          <Calendar className="w-3.5 h-3.5 mr-1.5" />
          {date}
        </div>
        {duration && (
          <div className="flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            {duration}
          </div>
        )}
      </div>
      
      <div className="mt-auto">
        <div className="flex flex-wrap gap-2 mb-5">
          {tags.map((tag, idx) => (
            <span key={idx} className="px-2 py-1 bg-slate-800 text-slate-300 text-[11px] font-mono rounded">
              {tag}
            </span>
          ))}
        </div>
        
        <div className="pt-4 border-t border-slate-700/50 flex justify-end">
          <button className="flex items-center text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Ver detalles
            <ArrowUpRight className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
}
