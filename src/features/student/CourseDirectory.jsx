import { ChevronLeft, ChevronRight, Compass, Search } from 'lucide-react';
import { ResourceIcon, getCourseImage } from '../resources/resourceMeta';

const getCategoryTheme = (category) => {
  switch (category) {
    case 'Trámites y Visados':
      return {
        border: 'border-t-4 border-t-cyan-500',
        badge: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
      };
    case 'Autónomos y Hacienda':
    case 'Impuestos e IRPF':
    case 'Impuestos y Autónomos':
      return {
        border: 'border-t-4 border-t-purple-500',
        badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
      };
    case 'Seguridad Social':
      return {
        border: 'border-t-4 border-t-emerald-500',
        badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      };
    case 'Coworkings y Colivings':
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
  categories,
  filteredResources,
  paginatedResources,
  setResourcesPage,
  totalResourcesPages,
  currentResourcesPage,
  setSelectedResource
}) {
  return (
    // En escritorio cada fila mide como máximo 300px y se reduce en pantallas
    // bajas para que las 2 filas y la paginación quepan sin scroll
    <div className="flex flex-col gap-4">
      {/* Bienvenida, buscador y filtros */}
      <div className="bg-bg-card border border-border-main rounded-3xl p-4 shadow-sm shrink-0 relative overflow-hidden">
        <div className="absolute top-1/2 right-6 -translate-y-1/2 text-indigo-550/5 hidden xl:block pointer-events-none">
          <Compass className="w-28 h-28" />
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 relative">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-text-title font-mono uppercase tracking-tight lg:truncate">Centro de Formación // {user.name}</h3>
            <p className="text-text-muted text-[11px] leading-relaxed">
              Tu material formativo asignado: tutoriales paso a paso y guías para tu estancia en España.
            </p>
          </div>

          <div className="relative w-full lg:max-w-xs shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar curso, trámites, autónomos..."
              className="w-full bg-bg-input border border-border-main focus:border-border-hover focus:shadow-[0_0_12px_rgba(15,117,188,0.1)] rounded-xl pl-11 pr-4 py-2.5 text-xs text-text-main placeholder-text-muted focus:outline-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Categorías en una sola línea */}
        <div className="flex items-center gap-2 overflow-x-auto w-full no-scrollbar pt-3 relative">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold border font-mono uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-bg-active text-text-active border-border-active'
                  : 'bg-bg-input text-text-muted border-border-main hover:border-border-hover hover:text-text-main'
              }`}
            >
              {category === 'all' ? 'Ver Todos' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Resultados de la Búsqueda */}
      {filteredResources.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-text-muted bg-bg-card border border-border-main rounded-3xl">
          <Search className="w-12 h-12 text-text-muted/40 mb-3" />
          <p className="text-xs font-mono uppercase tracking-wider">No se encontraron formaciones asignadas.</p>
        </div>
      ) : (
        <>
          {/* Cuadrícula: 4 columnas x 2 filas en escritorio. 330px = cabecera de la
              app, márgenes, filtros, paginación y huecos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:auto-rows-[min(300px,calc((100dvh_-_330px)/2))]">
            {paginatedResources.map(resource => {
              const theme = getCategoryTheme(resource.category);
              const cardImage = getCourseImage(resource);

              return (
                <button
                  type="button"
                  key={resource.id}
                  onClick={() => setSelectedResource(resource)}
                  className={`bg-bg-card border border-border-main hover:border-border-hover rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md cursor-pointer select-none text-left`}
                >
                  {/* Imagen del Curso */}
                  <div className="h-28 lg:h-auto lg:flex-1 lg:min-h-0 w-full relative overflow-hidden bg-bg-input">
                    <img
                      src={cardImage}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badge de Categoría */}
                    <span className={`absolute top-2.5 left-2.5 text-[8px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider font-mono backdrop-blur-md shadow-sm ${theme.badge}`}>
                      {resource.category}
                    </span>

                    {/* Badge de Formato de Recurso */}
                    <span className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white/90 text-xs shadow-sm">
                      <ResourceIcon type={resource.type} />
                    </span>
                  </div>

                  {/* Cuerpo de la Tarjeta */}
                  <div className="p-3.5 space-y-1 shrink-0">
                    <h4 className="text-xs font-extrabold text-text-title leading-snug group-hover:text-indigo-500 transition-colors duration-200 uppercase font-mono tracking-tight line-clamp-2 min-h-[2.75em]">
                      {resource.title}
                    </h4>
                    <p className="text-[11px] text-text-muted line-clamp-1 leading-relaxed font-sans font-medium">
                      {resource.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Controles de Paginación (siempre visibles) */}
          <div className="px-4 py-2.5 bg-bg-card border border-border-main rounded-2xl flex items-center justify-between text-xs shadow-sm font-mono shrink-0">
            <button
              onClick={() => setResourcesPage(prev => Math.max(1, prev - 1))}
              disabled={currentResourcesPage === 1}
              className="px-3 py-1.5 bg-bg-input hover:bg-bg-card text-text-muted hover:text-text-main border border-border-main disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-all cursor-pointer uppercase text-[10px] font-bold flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Anterior
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalResourcesPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setResourcesPage(page)}
                  aria-label={`Página ${page}`}
                  aria-current={page === currentResourcesPage ? 'page' : undefined}
                  className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    page === currentResourcesPage
                      ? 'bg-indigo-600 text-white border border-indigo-500'
                      : 'bg-bg-input text-text-muted border border-border-main hover:text-text-main'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setResourcesPage(prev => Math.min(totalResourcesPages, prev + 1))}
              disabled={currentResourcesPage === totalResourcesPages}
              className="px-3 py-1.5 bg-bg-input hover:bg-bg-card text-text-muted hover:text-text-main border border-border-main disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-all cursor-pointer uppercase text-[10px] font-bold flex items-center gap-1"
            >
              Siguiente <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
