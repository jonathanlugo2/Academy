import React from 'react';
import { 
  Compass, Search, Tag, ArrowRight 
} from 'lucide-react';

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
  resourcesPage,
  setResourcesPage,
  totalResourcesPages,
  currentResourcesPage,
  setSelectedResource,
  getResourceIcon,
  getActionButtonText
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
                  : 'bg-zinc-950 text-zinc-550 border-zinc-800 hover:border-zinc-700 hover:text-zinc-350'
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
          <p className="text-xs font-mono uppercase tracking-wider">No trainings found matching current node filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedResources.map(resource => (
              <div 
                key={resource.id} 
                className="bg-zinc-900/60 border border-zinc-800/85 hover:border-indigo-500/25 rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1 hover:bg-zinc-900/80 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(0,242,254,0.1)]"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-zinc-450 font-mono shadow-sm">
                      {getResourceIcon(resource.type)}
                    </span>
                    <span className="text-[9px] bg-zinc-950 border border-zinc-800 text-zinc-500 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider font-mono">
                      {resource.category}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-zinc-150 leading-snug group-hover:text-indigo-400 group-hover:shadow-[0_0_8px_rgba(0,242,254,0.15)] transition-colors duration-200">
                      {resource.title}
                    </h4>
                    <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                      {resource.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {resource.tags && resource.tags.map((tag, idx) => (
                      <span key={idx} className="text-[9px] text-zinc-550 bg-zinc-950/60 border border-zinc-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono uppercase">
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/20">
                  <button 
                    onClick={() => setSelectedResource(resource)}
                    className="w-full py-3 px-4 bg-zinc-950/80 hover:bg-indigo-950/45 text-zinc-400 hover:text-indigo-400 font-bold border-t border-zinc-800/80 transition-all text-[10px] uppercase font-mono tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-inner hover:shadow-[0_0_15px_rgba(0,242,254,0.1)]"
                  >
                    {getActionButtonText(resource.type)}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Controles de paginación para recursos */}
          {totalResourcesPages > 1 && (
            <div className="px-6 py-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl flex items-center justify-between text-xs backdrop-blur-md shadow-sm font-mono">
              <button
                onClick={() => setResourcesPage(prev => Math.max(1, prev - 1))}
                disabled={currentResourcesPage === 1}
                className="px-3 py-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-450 hover:text-zinc-300 border border-zinc-805 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-all cursor-pointer uppercase text-[10px] font-bold"
              >
                Anterior
              </button>
              <span className="text-zinc-500 uppercase text-[10px] tracking-wider font-bold">
                Página <span className="text-indigo-400 font-bold">{currentResourcesPage}</span> de <span className="text-zinc-300 font-bold">{totalResourcesPages}</span>
              </span>
              <button
                onClick={() => setResourcesPage(prev => Math.min(totalResourcesPages, prev + 1))}
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
