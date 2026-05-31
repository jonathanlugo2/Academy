import React from 'react';
import { 
  Compass, Search, Tag
} from 'lucide-react';

const getCategoryTheme = (category) => {
  switch (category) {
    case 'Trámites y Visados':
      return {
        border: 'border-t-4 border-t-cyan-500',
        badge: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
      };
    case 'Autónomos y Hacienda':
    case 'Impuestos e IRPF':
      return {
        border: 'border-t-4 border-t-purple-500',
        badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
      };
    case 'Seguridad Social':
      return {
        border: 'border-t-4 border-t-emerald-500',
        badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      };
    case 'Calculadoras':
      return {
        border: 'border-t-4 border-t-amber-500',
        badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      };
    default:
      return {
        border: 'border-t-4 border-t-indigo-500',
        badge: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
      };
  }
};

export default function CourseDirectory({
  user,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedType,
  setSelectedType,
  types,
  categories,
  filteredResources,
  paginatedResources,
  setResourcesPage,
  totalResourcesPages,
  currentResourcesPage,
  setSelectedResource,
  getResourceIcon
}) {
  return (
    <>
      <div className="bg-gradient-to-r from-zinc-900/80 via-indigo-950/10 to-zinc-900/80 border border-indigo-500/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <div className="absolute top-1/2 right-10 -translate-y-1/2 text-indigo-500/5 hidden md:block">
          <Compass className="w-48 h-48" />
        </div>
        <h3 className="text-lg font-black text-white mb-2 font-mono uppercase tracking-wider">Centro de Control Informativo // {user.name}</h3>
        <p className="text-zinc-400 text-xs max-w-2xl leading-relaxed">
          Aquí encontrarás documentación oficial, guías simplificadas y videotutoriales sobre plataformas digitales para facilitarte el aterrizaje y la vida fiscal en España.
        </p>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-md shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="BUSCAR TRÁMITES, AUTÓNOMOS, IRPF..." 
              className="w-full bg-zinc-950/90 border border-zinc-800/80 focus:border-indigo-400/80 focus:shadow-[0_0_12px_rgba(0,242,254,0.15)] rounded-xl pl-11 pr-4 py-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none font-mono uppercase transition-all duration-200"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80 overflow-x-auto w-full md:w-auto">
            {types.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-3.5 py-2 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider cursor-pointer transition-all whitespace-nowrap border ${
                  selectedType === type.id
                    ? 'bg-indigo-950/45 text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(0,242,254,0.12)]'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

        </div>

        <div className="flex flex-wrap gap-2 border-t border-zinc-800/80 pt-4">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border font-mono uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === category
                  ? 'bg-indigo-950/45 text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(0,242,254,0.08)]'
                  : 'bg-zinc-950 text-zinc-555 border-zinc-800 hover:border-zinc-700 hover:text-zinc-350'
              }`}
            >
              {category === 'all' ? 'Ver Todas' : category}
            </button>
          ))}
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-zinc-550 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl backdrop-blur-md">
          <Search className="w-10 h-10 text-zinc-700 mb-3" />
          <p className="text-xs font-mono uppercase tracking-wider">No se encontraron formaciones con los filtros aplicados.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedResources.map(resource => {
              const theme = getCategoryTheme(resource.category);
              return (
                <div 
                  key={resource.id} 
                  onClick={() => setSelectedResource(resource)}
                  className={`bg-zinc-900/50 border border-zinc-800 hover:border-indigo-500/30 rounded-2xl p-5 flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1 hover:bg-zinc-900/80 backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_25px_rgba(0,0,0,0.5),0_0_15px_rgba(0,242,254,0.08)] cursor-pointer select-none relative overflow-hidden ${theme.border}`}
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono ${theme.badge}`}>
                        {resource.category}
                      </span>
                      <span className="p-1.5 rounded-lg bg-zinc-950/80 border border-zinc-850 text-zinc-500 group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all font-mono shadow-inner">
                        {getResourceIcon(resource.type)}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <h4 className="text-xs font-bold text-zinc-200 leading-snug group-hover:text-indigo-300 transition-colors duration-200 font-mono uppercase">
                        {resource.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed font-sans font-medium">
                        {resource.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t border-zinc-800/40">
                    {resource.tags && resource.tags.map((tag, idx) => (
                      <span key={idx} className="text-[8px] text-zinc-400 bg-zinc-950/50 border border-zinc-850 px-2 py-0.5 rounded-md font-mono uppercase">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controles de paginación para recursos */}
          {totalResourcesPages > 1 && (
            <div className="px-6 py-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl flex items-center justify-between text-xs backdrop-blur-md shadow-sm font-mono">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setResourcesPage(prev => Math.max(1, prev - 1));
                }}
                disabled={currentResourcesPage === 1}
                className="px-3 py-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-450 hover:text-zinc-300 border border-zinc-805 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-all cursor-pointer uppercase text-[10px] font-bold"
              >
                Anterior
              </button>
              <span className="text-zinc-500 uppercase text-[10px] tracking-wider font-bold">
                Página <span className="text-indigo-400 font-bold">{currentResourcesPage}</span> de <span className="text-zinc-300 font-bold">{totalResourcesPages}</span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setResourcesPage(prev => Math.min(totalResourcesPages, prev + 1));
                }}
                disabled={currentResourcesPage === totalResourcesPages}
                className="px-3 py-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-450 hover:text-zinc-300 border border-zinc-805 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-all cursor-pointer uppercase text-[10px] font-bold"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
