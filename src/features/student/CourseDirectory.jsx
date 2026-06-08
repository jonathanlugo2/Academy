import React from 'react';
import { 
  Compass, Search, Award, ExternalLink, FileText, Video, Presentation, Code, HelpCircle 
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

const getCourseImage = (resource) => {
  if (resource.image_url) return resource.image_url;
  
  // Preset images in public folder
  switch (resource.category) {
    case 'Trámites y Visados':
      return '/preset_tramites.png';
    case 'Impuestos y Autónomos':
    case 'Autónomos y Hacienda':
    case 'Impuestos e IRPF':
      return '/preset_impuestos.png';
    case 'Coworkings y Colivings':
      return '/preset_coworking.png';
    case 'Herramientas Digitales':
      return '/preset_herramientas.png';
    default:
      return '/preset_tramites.png';
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
      {/* Banner de Bienvenida */}
      <div className="bg-gradient-to-r from-bg-card via-indigo-950/5 to-bg-card border border-border-main rounded-3xl p-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-1/2 right-10 -translate-y-1/2 text-indigo-550/5 hidden md:block">
          <Compass className="w-40 h-40" />
        </div>
        <h3 className="text-xl font-bold text-text-title mb-2 font-mono uppercase tracking-tight">Centro de Formación // {user.name}</h3>
        <p className="text-text-muted text-xs max-w-2xl leading-relaxed">
          Accede a tu material formativo asignado. Explora tutoriales paso a paso, guías de aterrizaje y visados, y computación fiscal simplificada para tu estancia en España.
        </p>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-bg-card border border-border-main rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          
          {/* Campo de Búsqueda */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar curso, trámites, autónomos..." 
              className="w-full bg-bg-input border border-border-main focus:border-border-hover focus:shadow-[0_0_12px_rgba(15,117,188,0.1)] rounded-xl pl-11 pr-4 py-3 text-xs text-text-main placeholder-text-muted focus:outline-none transition-all duration-200"
            />
          </div>

          {/* Selector de Tipo */}
          <div className="hidden md:flex items-center gap-1.5 bg-bg-input p-1.5 rounded-2xl border border-border-main overflow-x-auto w-full md:w-auto no-scrollbar">
            {types.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider cursor-pointer transition-all whitespace-nowrap border ${
                  selectedType === type.id
                    ? 'bg-bg-active text-text-active border-border-active shadow-[0_0_10px_rgba(15,117,188,0.06)]'
                    : 'text-text-muted border-transparent hover:text-text-main'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

        </div>

        {/* Categorías (Badges) */}
        <div className="hidden md:flex flex-wrap gap-2 border-t border-border-main pt-4">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold border font-mono uppercase tracking-wider transition-all cursor-pointer ${
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
        <div className="space-y-6">
          {/* Grid de Tarjetas Edutin Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedResources.map(resource => {
              const theme = getCategoryTheme(resource.category);
              const cardImage = getCourseImage(resource);
              
              return (
                <div 
                  key={resource.id} 
                  onClick={() => setSelectedResource(resource)}
                  className="bg-bg-card border border-border-main hover:border-border-hover rounded-3xl overflow-hidden flex flex-col group transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-md cursor-pointer select-none relative"
                >
                  {/* Imagen del Curso */}
                  <div className="h-40 w-full relative overflow-hidden bg-bg-input">
                    <img 
                      src={cardImage} 
                      alt={resource.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Badge de Categoría */}
                    <span className={`absolute top-3.5 left-3.5 text-[8px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider font-mono backdrop-blur-md shadow-sm ${theme.badge}`}>
                      {resource.category}
                    </span>

                    {/* Badge de Formato de Recurso */}
                    <span className="absolute bottom-3.5 right-3.5 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white/90 text-xs shadow-sm">
                      {getResourceIcon(resource.type)}
                    </span>
                  </div>

                  {/* Cuerpo de la Tarjeta */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2 text-left">
                      <h4 className="text-xs font-extrabold text-text-title leading-snug group-hover:text-indigo-500 transition-colors duration-200 uppercase font-mono tracking-tight line-clamp-2">
                        {resource.title}
                      </h4>
                      <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed font-sans font-medium">
                        {resource.description}
                      </p>
                    </div>

                    {/* Stats de Edutin (Rating y Alumnos) */}
                    <div className="space-y-3 pt-3 border-t border-border-main">
                      {/* Certificación Row */}
                      <div className="flex items-center gap-1.5 text-[9px] text-text-muted font-mono uppercase tracking-wide bg-bg-input px-2.5 py-1.5 rounded-lg border border-border-main">
                        <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{resource.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controles de Paginación */}
          {totalResourcesPages > 1 && (
            <div className="px-6 py-4 bg-bg-card border border-border-main rounded-3xl flex items-center justify-between text-xs shadow-sm font-mono">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setResourcesPage(prev => Math.max(1, prev - 1));
                }}
                disabled={currentResourcesPage === 1}
                className="px-3 py-2 bg-bg-input hover:bg-bg-card text-text-muted hover:text-text-main border border-border-main disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-all cursor-pointer uppercase text-[10px] font-bold"
              >
                Anterior
              </button>
              <span className="text-text-muted uppercase text-[10px] tracking-wider font-bold">
                Página <span className="text-indigo-400 font-bold">{currentResourcesPage}</span> de <span className="text-text-title font-bold">{totalResourcesPages}</span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setResourcesPage(prev => Math.min(totalResourcesPages, prev + 1));
                }}
                disabled={currentResourcesPage === totalResourcesPages}
                className="px-3 py-2 bg-bg-input hover:bg-bg-card text-text-muted hover:text-text-main border border-border-main disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-all cursor-pointer uppercase text-[10px] font-bold"
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
