import React from 'react';
import { 
  ArrowRight, CheckCircle2, ExternalLink 
} from 'lucide-react';

export default function ResourceViewerModal({
  selectedResource,
  setSelectedResource,
  resources,
  user,
  handleToggleCompleted,
  getResourceIcon
}) {
  if (!selectedResource) return null;

  let embedUrl = selectedResource.url || '';
  let isEmbeddable = false;
  let isVideoTag = false;

  // Detect YouTube
  if (embedUrl.includes('youtube.com/watch?v=')) {
    const videoId = embedUrl.split('v=')[1]?.split('&')[0];
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
      isEmbeddable = true;
    }
  } else if (embedUrl.includes('youtu.be/')) {
    const videoId = embedUrl.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
      isEmbeddable = true;
    }
  }
  // Detect Vimeo
  else if (embedUrl.includes('vimeo.com/')) {
    const videoId = embedUrl.split('vimeo.com/')[1]?.split('?')[0]?.split('#')[0];
    if (videoId) {
      embedUrl = `https://player.vimeo.com/video/${videoId}`;
      isEmbeddable = true;
    }
  }
  // Detect Google Slides
  else if (embedUrl.includes('docs.google.com/presentation/d/')) {
    const base = embedUrl.split('/edit')[0].split('/pub')[0];
    embedUrl = `${base}/embed?start=false&loop=false&delayms=3000`;
    isEmbeddable = true;
  }
  // Detect PDF
  else if (selectedResource.type === 'document' || embedUrl.toLowerCase().endsWith('.pdf') || embedUrl.toLowerCase().includes('.pdf?')) {
    isEmbeddable = true;
  }
  // Detect direct video
  else if (embedUrl.toLowerCase().endsWith('.mp4') || embedUrl.toLowerCase().endsWith('.webm') || embedUrl.toLowerCase().endsWith('.ogg')) {
    isVideoTag = true;
  }

  // Extract iframe src if raw HTML is pasted (Security XSS fix preserved)
  if (selectedResource.type === 'html_video' || (typeof embedUrl === 'string' && embedUrl.trim().startsWith('<'))) {
    const srcMatch = embedUrl.match(/src=["'](.*?)["']/);
    if (srcMatch && srcMatch[1]) {
      embedUrl = srcMatch[1];
      isEmbeddable = true;
    }
  }

  // Progression values
  const totalCount = resources.length;
  const completedCount = resources.filter(r => (user.completedResources || []).includes(r.id)).length;
  const progressPercent = Math.round((completedCount / totalCount) * 100) || 0;

  const isCurrentCompleted = (user.completedResources || []).includes(selectedResource.id);
  
  // Sequential Navigation
  const currentIndex = resources.findIndex(r => r.id === selectedResource.id);
  const prevResource = currentIndex > 0 ? resources[currentIndex - 1] : null;
  const nextResource = currentIndex < resources.length - 1 ? resources[currentIndex + 1] : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* Navigation/Header for player */}
      <div className="h-14 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
        <button
          onClick={() => setSelectedResource(null)}
          className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer font-mono uppercase tracking-wider"
        >
          <ArrowRight className="w-4 h-4 rotate-180 shrink-0" />
          Volver
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[9px] bg-zinc-950 border border-zinc-850 text-zinc-550 px-2.5 py-1 rounded font-bold uppercase font-mono tracking-wider">
            {selectedResource.category}
          </span>
          <span className="text-[9px] bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded font-bold uppercase font-mono tracking-wider">
            {selectedResource.type === 'html_video' ? 'código/html' : selectedResource.type}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Navigator Sidebar (Lista de Lecciones) */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-r border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md flex flex-col justify-between shrink-0 overflow-hidden order-2 lg:order-1">
          
          {/* Progress stats */}
          <div className="p-4 border-b border-zinc-800/80 space-y-3 bg-zinc-950/40 font-mono">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
              <span className="text-zinc-400">Progreso General</span>
              <span className="text-indigo-400">{completedCount} de {totalCount} ({progressPercent}%)</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 border border-zinc-800/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(0,242,254,0.3)]" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* List of lessons */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
            {resources.map(res => {
              const isItemCompleted = (user.completedResources || []).includes(res.id);
              const isItemActive = selectedResource.id === res.id;
              return (
                <div
                  key={res.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer font-mono ${
                    isItemActive 
                      ? 'bg-indigo-950/50 border-indigo-500/35 text-white shadow-[0_0_12px_rgba(0,242,254,0.06)]' 
                      : 'bg-zinc-900/20 border-zinc-800/60 text-zinc-500 hover:bg-zinc-850/30 hover:border-zinc-700/60 hover:text-zinc-350'
                  }`}
                  onClick={() => setSelectedResource(res)}
                >
                  {/* Checkbox circle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Evitar que el clic en el botón active el recurso
                      handleToggleCompleted(res.id);
                    }}
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                      isItemCompleted 
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-450 shadow-[0_0_8px_rgba(16,185,129,0.2)]' 
                        : 'border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-950'
                    }`}
                    title={isItemCompleted ? "Marcar como pendiente" : "Marcar como completado"}
                  >
                    {isItemCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  
                  {/* Icon & Title */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${isItemActive ? 'text-indigo-400' : 'text-zinc-300'}`}>
                      {res.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="p-0.5 rounded bg-zinc-950 border border-zinc-850 text-[9px] scale-90 origin-left text-zinc-500 flex items-center gap-1 uppercase font-bold">
                        {getResourceIcon(res.type)}
                        <span>{res.type === 'html_video' ? 'código/html' : res.type}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Context Info Box */}
          <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/40 text-[9px] text-zinc-550 space-y-1 font-mono uppercase tracking-wider">
            <p>Entrenamiento Autorizado por ExpatFiscal</p>
            <p>Código de nómada: EF-{user.id.slice(-4)}</p>
          </div>
        </div>

        {/* Central Area: Media viewer & details */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950/80 p-4 lg:p-6 space-y-4 order-1 lg:order-2">
          
          {/* Multimedia Frame */}
          <div className="flex-1 bg-black rounded-2xl border border-zinc-800/80 overflow-hidden relative shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(0,242,254,0.05)] min-h-[300px]">
            {isEmbeddable ? (
              <iframe 
                src={embedUrl}
                title={selectedResource.title}
                className="w-full h-full border-none bg-black"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              ></iframe>
            ) : isVideoTag ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                <video 
                  src={embedUrl} 
                  controls 
                  className="w-full max-h-full rounded-xl border border-zinc-800/80 shadow-2xl bg-black"
                ></video>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 text-center space-y-5 backdrop-blur-md">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-950/60 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(0,242,254,0.15)]">
                    <ExternalLink className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-zinc-200 uppercase font-mono tracking-wider">Enlace Externo Recomendado</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      Este portal o herramienta externa ({selectedResource.category}) requiere acceso fuera de la academia por políticas de seguridad o restricciones del portal.
                    </p>
                  </div>
                  <a 
                    href={selectedResource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 py-2.5 px-6 bg-indigo-655 hover:bg-indigo-600 text-zinc-950 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(0,242,254,0.2)] hover:shadow-[0_0_18px_rgba(0,242,254,0.35)]"
                  >
                    Visitar Portal Oficial
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Description & Action Footer */}
          <div className="bg-zinc-900/60 border border-zinc-800/85 rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-6 backdrop-blur-md shadow-sm">
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] bg-zinc-950 border border-zinc-850 text-zinc-550 px-2.5 py-1 rounded font-bold uppercase font-mono tracking-wider">
                  {selectedResource.type === 'html_video' ? 'código/html' : selectedResource.type}
                </span>
                <span className="text-[9px] bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded font-bold uppercase font-mono tracking-wider">
                  {selectedResource.category}
                </span>
              </div>
              <h3 className="text-base font-bold text-white leading-snug">{selectedResource.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{selectedResource.description}</p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col justify-end gap-3 shrink-0 sm:w-auto md:w-56">
              
              {/* Complete Button */}
              <button
                onClick={() => handleToggleCompleted(selectedResource.id)}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  isCurrentCompleted 
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-450 hover:bg-emerald-900/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-zinc-950 border-indigo-500/30 shadow-[0_0_15px_rgba(0,242,254,0.25)] hover:shadow-[0_0_20px_rgba(0,242,254,0.4)]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isCurrentCompleted ? '¡Completado ✓!' : 'Marcar como Completado'}
              </button>

              {/* Nav buttons */}
              <div className="flex gap-2 w-full">
                <button
                  disabled={!prevResource}
                  onClick={() => prevResource && setSelectedResource(prevResource)}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-zinc-950/80 border border-zinc-805 hover:border-zinc-700 disabled:opacity-40 disabled:pointer-events-none text-zinc-550 hover:text-zinc-350 text-[10px] font-bold font-mono uppercase tracking-widest transition-all cursor-pointer"
                >
                  Anterior
                </button>
                <button
                  disabled={!nextResource}
                  onClick={() => nextResource && setSelectedResource(nextResource)}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-zinc-950/80 border border-zinc-805 hover:border-zinc-700 disabled:opacity-40 disabled:pointer-events-none text-zinc-550 hover:text-zinc-350 text-[10px] font-bold font-mono uppercase tracking-widest transition-all cursor-pointer"
                >
                  Siguiente
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
