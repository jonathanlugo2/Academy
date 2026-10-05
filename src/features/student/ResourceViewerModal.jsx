import { useState, useMemo } from 'react';
import { ArrowLeft, CheckCircle2, BookOpen } from 'lucide-react';
import ResourcePlayer from '../resources/ResourcePlayer';
import { ResourceIcon, getCourseImage, resourceTypeLabel } from '../resources/resourceMeta';

export default function ResourceViewerModal({
  selectedResource,
  setSelectedResource,
  resources,
  user,
  handleToggleCompleted
}) {
  const [mobileTab, setMobileTab] = useState('lessons'); // 'lessons' or 'details'

  // Group resources by category for sections
  const groupedResources = useMemo(() => {
    const groups = {};
    resources.forEach(res => {
      if (!groups[res.category]) {
        groups[res.category] = [];
      }
      groups[res.category].push(res);
    });
    return groups;
  }, [resources]);

  if (!selectedResource) return null;

  const totalCount = resources.length;
  const completedCount = resources.filter(r => (user.completedResources || []).includes(r.id)).length;
  const progressPercent = Math.round((completedCount / totalCount) * 100) || 0;
  const isCurrentCompleted = (user.completedResources || []).includes(selectedResource.id);
  
  // Sequential Navigation
  const currentIndex = resources.findIndex(r => r.id === selectedResource.id);
  const prevResource = currentIndex > 0 ? resources[currentIndex - 1] : null;
  const nextResource = currentIndex < resources.length - 1 ? resources[currentIndex + 1] : null;

  // Reusable Lessons List Component
  const renderLessonsList = () => {
    return (
      <div className="space-y-6 flex-1 text-left">
        {/* Barra de progreso global */}
        <div className="bg-bg-card border border-border-main p-3.5 rounded-2xl space-y-2.5 font-mono">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wide">
            <span className="text-text-muted">Progreso</span>
            <span className="text-indigo-400">{completedCount}/{totalCount} ({progressPercent}%)</span>
          </div>
          <div className="w-full h-1.5 bg-bg-input rounded-full overflow-hidden border border-border-main/50">
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(15,117,188,0.25)]" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Lista agrupada */}
        <div className="space-y-5">
          {Object.keys(groupedResources).map((categoryName, groupIdx) => {
            const items = groupedResources[categoryName];
            return (
              <div key={categoryName} className="space-y-2">
                {/* Cabecera de la sección */}
                <h4 className="text-[10px] font-extrabold text-text-title font-mono uppercase tracking-wider border-b border-border-main pb-2 flex items-center justify-between">
                  <span>Sección {groupIdx + 1}: {categoryName}</span>
                  <span className="text-text-muted font-normal">({items.length})</span>
                </h4>

                {/* Lista de lecciones dentro de la sección */}
                <div className="space-y-1.5">
                  {items.map(res => {
                    const isItemCompleted = (user.completedResources || []).includes(res.id);
                    const isItemActive = selectedResource.id === res.id;
                    const thumb = getCourseImage(res);

                    return (
                      <div
                        key={res.id}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer font-mono ${
                          isItemActive 
                            ? 'bg-bg-active border-border-active text-text-title' 
                            : 'bg-bg-card/40 border-border-main text-text-muted hover:bg-bg-input hover:text-text-main'
                        }`}
                        onClick={() => setSelectedResource(res)}
                      >
                        <div className="w-16 h-10 rounded-lg overflow-hidden shrink-0 relative bg-bg-input border border-border-main">
                          <img src={thumb} alt={res.title} className="w-full h-full object-cover" />
                        </div>

                        {/* Detalles */}
                        <div className="flex-1 min-w-0 text-left">
                          <p className={`text-[10px] font-extrabold truncate ${isItemActive ? 'text-indigo-400' : 'text-text-main'}`}>
                            {res.title}
                          </p>
                          <span className="inline-flex items-center gap-1 mt-0.5 text-[8px] text-text-muted scale-95 origin-left font-bold uppercase">
                            <ResourceIcon type={res.type} />
                            <span>{resourceTypeLabel(res.type)}</span>
                          </span>
                        </div>

                        {/* Botón de completado circular */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCompleted(res.id);
                          }}
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                            isItemCompleted 
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500' 
                              : 'border-border-main hover:border-indigo-500/40 hover:bg-bg-input'
                          }`}
                          title={isItemCompleted ? "Marcar pendiente" : "Marcar completado"}
                        >
                          {isItemCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-bg-main relative">
      
      {/* COLUMNA IZQUIERDA: Reproductor y Detalles / Pestañas móviles */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 lg:p-6 space-y-6">
        
        {/* Header de navegación superior (Se desplaza en móvil) */}
        <div className="flex items-center justify-between shrink-0">
          <button
            onClick={() => setSelectedResource(null)}
            className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-main transition-colors cursor-pointer font-mono uppercase"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Volver al Directorio
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-bg-card border border-border-main text-text-muted px-2.5 py-1 rounded-lg font-bold uppercase font-mono">
              {selectedResource.category}
            </span>
            <span className="text-[9px] bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-lg font-bold uppercase font-mono">
              {resourceTypeLabel(selectedResource.type)}
            </span>
          </div>
        </div>

        {/* Reproductor Principal: Sticky en móvil, normal en desktop */}
        <div className={`sticky top-0 z-20 bg-bg-main -mx-4 px-4 py-2 lg:mx-0 lg:px-0 lg:py-0 lg:relative bg-black rounded-none lg:rounded-3xl border-b lg:border border-border-main overflow-hidden shadow-md shrink-0 ${
          selectedResource.type === 'test' ? 'h-[500px] sm:h-[550px] lg:h-[620px] aspect-auto' : 'aspect-video'
        }`}>
          <ResourcePlayer resource={selectedResource} userEmail={user?.email || ''} />
        </div>

        {/* Selector de Pestañas (Solo en Móviles) */}
        <div className="flex bg-bg-input p-1.5 rounded-2xl border border-border-main lg:hidden shrink-0">
          <button
            onClick={() => setMobileTab('lessons')}
            className={`flex-1 py-3 text-center text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              mobileTab === 'lessons'
                ? 'bg-bg-active text-text-active border border-border-active'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            Lecciones ({resources.length})
          </button>
          <button
            onClick={() => setMobileTab('details')}
            className={`flex-1 py-3 text-center text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              mobileTab === 'details'
                ? 'bg-bg-active text-text-active border border-border-active'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            Información
          </button>
        </div>

        {/* Contenido Responsivo: Muestra temario o detalles según pestaña activa en móvil */}
        <div className="flex-1 flex flex-col space-y-6">
          
          {/* Fila de Detalles & Acciones (Siempre visible en desktop, condicional en móvil) */}
          <div className={`${mobileTab === 'details' ? 'block' : 'hidden'} lg:block space-y-6`}>
            
            {/* Detalles de la Lección & Panel de Acciones */}
            <div className="bg-bg-card border border-border-main rounded-3xl p-6 space-y-5 shadow-sm text-left">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-text-title uppercase font-mono tracking-tight leading-snug">
                    {selectedResource.title}
                  </h3>
                  <p className="text-xs text-text-muted">{selectedResource.description}</p>
                </div>

                {/* Check de Completado */}
                <button
                  onClick={() => handleToggleCompleted(selectedResource.id)}
                  className={`py-3 px-5 rounded-2xl text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border shrink-0 ${
                    isCurrentCompleted 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20' 
                      : 'bg-indigo-650 hover:bg-indigo-600 text-white border-indigo-500/30'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isCurrentCompleted ? '¡Lección Completada ✓!' : 'Marcar Completado'}
                </button>
              </div>
            </div>

            {/* Navegación Secuencial (Anterior / Siguiente) */}
            <div className="flex justify-between items-center gap-4">
              <button
                disabled={!prevResource}
                onClick={() => prevResource && setSelectedResource(prevResource)}
                className="flex-1 py-3 px-4 rounded-2xl bg-bg-card border border-border-main hover:border-border-hover hover:bg-bg-input disabled:opacity-40 disabled:pointer-events-none text-text-muted hover:text-text-main text-[10px] font-bold font-mono uppercase tracking-widest transition-all cursor-pointer text-center"
              >
                ← Anterior Lección
              </button>
              <button
                disabled={!nextResource}
                onClick={() => nextResource && setSelectedResource(nextResource)}
                className="flex-1 py-3 px-4 rounded-2xl bg-bg-card border border-border-main hover:border-border-hover hover:bg-bg-input disabled:opacity-40 disabled:pointer-events-none text-text-muted hover:text-text-main text-[10px] font-bold font-mono uppercase tracking-widest transition-all cursor-pointer text-center"
              >
                Siguiente Lección →
              </button>
            </div>

          </div>

          {/* Temario en Móvil (Visible bajo la pestaña 'lessons' en móvil, oculto en desktop) */}
          <div className={`${mobileTab === 'lessons' ? 'block' : 'hidden'} lg:hidden`}>
            {renderLessonsList()}
          </div>

        </div>

      </div>

      {/* COLUMNA DERECHA: Sidebar Classroom (Contenido) - Solo visible en Desktop */}
      <div className="hidden lg:flex w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-border-main bg-bg-sidebar flex-col h-full shrink-0 overflow-hidden">
        
        {/* Cabecera del Sidebar */}
        <div className="flex items-center border-b border-border-main bg-bg-input shrink-0 px-6 py-4.5">
          <span className="text-[10px] font-bold text-text-title uppercase tracking-widest flex items-center gap-2 font-mono">
            <BookOpen className="w-4 h-4 text-text-active" />
            Formaciones propuestas
          </span>
        </div>

        {/* Cuerpo del Sidebar */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col">
          {renderLessonsList()}
        </div>
        
        {/* Footer del Sidebar */}
        <div className="p-4.5 border-t border-border-main bg-bg-input text-[9px] text-text-muted space-y-1 font-mono uppercase tracking-wider text-left">
          <p>Aula Virtual ExpatFiscal Academy</p>
          <p>Código nómada: EF-{user.id.slice(-4)}</p>
        </div>

      </div>

    </div>
  );
}
