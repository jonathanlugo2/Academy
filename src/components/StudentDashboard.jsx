/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { mockDb } from '../utils/mockDb';
import { 
  BookOpen, MessageSquare, LogOut, Compass, FileText, 
  Video, Presentation, Search, Tag, ExternalLink, Calendar, 
  Send, HelpCircle, CheckCircle2, Clock, AlertCircle, ArrowRight,
  User, MapPin, Upload, Shield, Plane, Download, Scale, ChevronLeft, ChevronRight,
  Code, Play
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, logout, refreshUser } = useAuth();
  
  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('resources'); // 'resources', 'fiscal', 'support'

  // Selected resource for embedded player
  const [selectedResource, setSelectedResource] = useState(null);

  // Pagination states
  const [resourcesPage, setResourcesPage] = useState(1);
  const [messagesPage, setMessagesPage] = useState(1);

  const RESOURCES_PER_PAGE = 6;
  const MESSAGES_PER_PAGE = 4;
  
  // Database lists
  const [resources, setResources] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Support message form states
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Fiscal calculations & uploads
  const [absencesInput, setAbsencesInput] = useState(user?.absences || 0);
  const [savingAbsences, setSavingAbsences] = useState(false);
  const [absencesSuccess, setAbsencesSuccess] = useState(false);

  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Categorías y tipos para filtros
  const categories = ['all', 'Trámites y Visados', 'Impuestos y Autónomos', 'Coworkings y Colivings', 'Herramientas Digitales'];
  const types = [
    { id: 'all', label: 'Todos' },
    { id: 'document', label: 'Documentos PDF', icon: FileText },
    { id: 'video', label: 'Videos', icon: Video },
    { id: 'presentation', label: 'Presentaciones', icon: Presentation },
    { id: 'html_video', label: 'Código / HTML', icon: Code },
    { id: 'link', label: 'Enlaces', icon: ExternalLink }
  ];

  // Filter Logic
  const filteredResources = useMemo(() => {
    return resources.filter(res => {
      const matchesSearch = 
        res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        res.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (res.tags && res.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
        
      const matchesCategory = selectedCategory === 'all' || res.category === selectedCategory;
      const matchesType = selectedType === 'all' || res.type === selectedType;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [resources, searchQuery, selectedCategory, selectedType]);

  // Cargar datos
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const usersList = await mockDb.users.getAll();
      const dbUser = usersList.find(u => u.id === user.id);
      const allowedIds = dbUser?.allowedResources || [];

      const resList = await mockDb.resources.getAll();
      const msgList = await mockDb.messages.getAll();
      
      setResources(resList.filter(res => allowedIds.includes(res.id)));
      setMessages(msgList.filter(m => m.sender_id === user.id));
    } catch (e) {
      console.error("Error al cargar datos:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    // Actualizar input de ausencias al cambiar de usuario
    setAbsencesInput(user?.absences || 0);
  }, [loadData, user?.absences]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setResourcesPage(1);
  }, [searchQuery, selectedCategory, selectedType]);

  // Reset player on tab change
  useEffect(() => {
    setSelectedResource(null);
  }, [activeTab]);

  // Adjust page variables when list sizes change
  useEffect(() => {
    const totalPages = Math.ceil(filteredResources.length / RESOURCES_PER_PAGE) || 1;
    if (resourcesPage > totalPages) {
      setResourcesPage(totalPages);
    }
  }, [filteredResources.length, resourcesPage]);

  useEffect(() => {
    const totalPages = Math.ceil(messages.length / MESSAGES_PER_PAGE) || 1;
    if (messagesPage > totalPages) {
      setMessagesPage(totalPages);
    }
  }, [messages, messagesPage]);

  // Handler for sending a question
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    setSuccessMsg('');
    try {
      await mockDb.messages.create({
        sender_id: user.id,
        sender_name: `${user.name} (Nómada)`,
        sender_role: 'student',
        content: newMessage.trim()
      });

      setNewMessage('');
      setSuccessMsg('Tu pregunta ha sido enviada al equipo de administración. Recibirás respuesta pronto.');
      
      const msgList = await mockDb.messages.getAll();
      setMessages(msgList.filter(m => m.sender_id === user.id));
    } catch (err) {
      alert('Error al enviar el mensaje: ' + err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  // Handler for saving absences
  const handleSaveAbsences = async (e) => {
    e.preventDefault();
    setSavingAbsences(true);
    setAbsencesSuccess(false);

    try {
      await mockDb.users.update(user.id, { absences: Number(absencesInput) });
      await refreshUser(); // Actualizar sesión local
      setAbsencesSuccess(true);
      setTimeout(() => setAbsencesSuccess(false), 3000);
    } catch (err) {
      alert('Error al actualizar ausencias: ' + err.message);
    } finally {
      setSavingAbsences(false);
    }
  };

  // Handler for simulated document upload
  const handleSimulatedUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingDoc(true);
    setUploadSuccess(false);

    // Simular un delay de subida de archivo
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockFileObject = {
      name: file.name,
      size: (file.size / 1024).toFixed(0) + ' KB',
      uploadedAt: new Date().toISOString(),
      url: '#'
    };

    try {
      await mockDb.users.update(user.id, { residencyDoc: mockFileObject });
      await refreshUser(); // Sincronizar sesión
      setUploadSuccess(true);
    } catch (err) {
      alert('Error al subir el documento: ' + err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  // Toggle resource completion
  const handleToggleCompleted = async (resourceId) => {
    if (!user) return;
    const completed = user.completedResources || [];
    let newCompleted;
    if (completed.includes(resourceId)) {
      newCompleted = completed.filter(id => id !== resourceId);
    } else {
      newCompleted = [...completed, resourceId];
    }
    
    try {
      await mockDb.users.update(user.id, { completedResources: newCompleted });
      await refreshUser();
    } catch (err) {
      console.error("Error al actualizar progreso:", err);
    }
  };

  // Lógica de cálculo fiscal
  const calculateEstanciaDays = (arrivalDate) => {
    if (!arrivalDate) return 0;
    const start = new Date(arrivalDate);
    const today = new Date();
    if (start > today) return 0;

    const diffTime = Math.max(0, today - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const elapsedDays = calculateEstanciaDays(user?.arrivalDate);
  const effectiveDays = Math.max(0, elapsedDays - (user?.absences || 0));
  const progressPercent = Math.min(100, (effectiveDays / 183) * 100);

  const getResourceIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5 text-rose-400" />;
      case 'presentation': return <Presentation className="w-5 h-5 text-amber-400" />;
      case 'document': return <FileText className="w-5 h-5 text-sky-400" />;
      case 'html_video': return <Code className="w-5 h-5 text-emerald-400" />;
      case 'link': return <ExternalLink className="w-5 h-5 text-indigo-400" />;
      default: return <FileText className="w-5 h-5 text-zinc-400" />;
    }
  };

  const getActionButtonText = (type) => {
    switch (type) {
      case 'video': return 'Ver Video Tutorial';
      case 'presentation': return 'Ver Diapositivas';
      case 'document': return 'Abrir Documento PDF';
      case 'html_video': return 'Reproducir Contenido';
      case 'link': return 'Ver Enlace Externo';
      default: return 'Abrir Recurso';
    }
  };

  const totalResourcesPages = Math.ceil(filteredResources.length / RESOURCES_PER_PAGE) || 1;
  const currentResourcesPage = Math.min(resourcesPage, totalResourcesPages);
  const paginatedResources = filteredResources.slice((currentResourcesPage - 1) * RESOURCES_PER_PAGE, currentResourcesPage * RESOURCES_PER_PAGE);

  const totalMessagesPages = Math.ceil(messages.length / MESSAGES_PER_PAGE) || 1;
  const currentMessagesPage = Math.min(messagesPage, totalMessagesPages);
  const paginatedMessages = messages.slice((currentMessagesPage - 1) * MESSAGES_PER_PAGE, currentMessagesPage * MESSAGES_PER_PAGE);

  const renderResourcePlayer = () => {
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

    // Detect Raw HTML Embed Code
    let isHtmlCode = false;
    if (selectedResource.type === 'html_video' || (embedUrl.trim().startsWith('<') && embedUrl.trim().endsWith('>'))) {
      isHtmlCode = true;
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
        <div className="h-14 border-b border-zinc-800/60 bg-zinc-900/40 px-6 flex items-center justify-between shrink-0">
          <button 
            onClick={() => setSelectedResource(null)}
            className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 rotate-180 shrink-0" />
            Volver a la Misión
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-zinc-900 border border-zinc-800/60 text-zinc-400 px-2 py-0.5 rounded font-semibold">
              {selectedResource.category}
            </span>
            <span className="text-[10px] bg-indigo-950/40 border border-indigo-900/30 text-indigo-400 px-2 py-0.5 rounded font-bold capitalize">
              {selectedResource.type}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Navigator Sidebar (Lista de Lecciones) */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-r border-zinc-800/60 bg-zinc-900/50 flex flex-col justify-between shrink-0 overflow-hidden order-2 lg:order-1">
            
            {/* Progress stats */}
            <div className="p-4 border-b border-zinc-800/60 space-y-3 bg-zinc-950/20">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-zinc-300">Progreso del Curso</span>
                <span className="font-bold text-indigo-400">{completedCount} de {totalCount} ({progressPercent}%)</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* List of lessons */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1.5">
              {resources.map(res => {
                const isItemCompleted = (user.completedResources || []).includes(res.id);
                const isItemActive = selectedResource.id === res.id;
                return (
                  <div
                    key={res.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isItemActive 
                        ? 'bg-indigo-600/10 border-indigo-500/30 text-white' 
                        : 'bg-zinc-900/40 border-zinc-850/30 text-zinc-400 hover:bg-zinc-850/30 hover:border-zinc-700/60 hover:text-zinc-200'
                    }`}
                    onClick={() => setSelectedResource(res)}
                  >
                    {/* Checkbox circle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Evitar que el clic en el botón active el recurso
                        handleToggleCompleted(res.id);
                      }}
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                        isItemCompleted 
                          ? 'bg-emerald-500/15 border-emerald-500/80 text-emerald-450' 
                          : 'border-zinc-700 hover:border-indigo-500 hover:bg-zinc-950'
                      }`}
                      title={isItemCompleted ? "Marcar como pendiente" : "Marcar como completado"}
                    >
                      {isItemCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                    
                    {/* Icon & Title */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${isItemActive ? 'text-indigo-400' : ''}`}>
                        {res.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="p-0.5 rounded bg-zinc-950 border border-zinc-800 text-[9px] scale-90 origin-left text-zinc-500 flex items-center gap-1">
                          {getResourceIcon(res.type)}
                          <span className="capitalize">{res.type === 'html_video' ? 'código/html' : res.type}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Context Info Box */}
            <div className="p-4 border-t border-zinc-800/60 bg-zinc-950/20 text-[10px] text-zinc-500 space-y-1">
              <p>Entrenamiento Autorizado por ExpatFiscal</p>
              <p>Código de nómada: EF-{user.id.slice(-4)}</p>
            </div>
          </div>

          {/* Central Area: Media viewer & details */}
          <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950/80 p-4 lg:p-6 space-y-4 order-1 lg:order-2">
            
            {/* Multimedia Frame */}
            <div className="flex-1 bg-black rounded-2xl border border-zinc-800/60 overflow-hidden relative shadow-2xl min-h-[300px]">
              {isHtmlCode ? (
                <iframe
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="utf-8">
                      <style>
                        body { 
                          margin: 0; 
                          padding: 16px;
                          background-color: #0c0c0e; 
                          display: flex; 
                          justify-content: center; 
                          align-items: center; 
                          min-height: calc(100vh - 32px);
                          color: #d4d4d8;
                          font-family: system-ui, -apple-system, sans-serif;
                          overflow-x: hidden;
                        }
                        video {
                          width: 100%;
                          height: 100%;
                          max-height: 90vh;
                          border-radius: 12px;
                          background: #000;
                          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                        }
                        iframe {
                          width: 100%;
                          height: 100%;
                          min-height: 80vh;
                          border: none;
                          border-radius: 12px;
                          background: #000;
                        }
                      </style>
                    </head>
                    <body>
                      ${embedUrl.trim().startsWith('<') ? embedUrl : `<video src="${embedUrl}" controls autoplay></video>`}
                    </body>
                    </html>
                  `}
                  title={selectedResource.title}
                  className="w-full h-full border-none"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                ></iframe>
              ) : isEmbeddable ? (
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
                    className="w-full max-h-full rounded-xl border border-zinc-800/60 shadow-2xl bg-black"
                  ></video>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center p-6">
                  <div className="max-w-md w-full bg-zinc-900 border border-zinc-800/60 rounded-2xl p-8 text-center space-y-5">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                      <ExternalLink className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base font-bold text-zinc-200">Enlace Externo Recomendado</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Este portal o herramienta externa ({selectedResource.category}) requiere acceso fuera de la academia por políticas de seguridad o restricciones del portal.
                      </p>
                    </div>
                    <a 
                      href={selectedResource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 py-2.5 px-6 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Visitar Portal Oficial
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Description & Action Footer */}
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] bg-zinc-955 border border-zinc-800/60 text-zinc-450 px-2 py-0.5 rounded font-bold capitalize">
                    {selectedResource.type}
                  </span>
                  <span className="text-[10px] bg-indigo-950/40 border border-indigo-900/30 text-indigo-400 px-2 py-0.5 rounded font-bold">
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
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                    isCurrentCompleted 
                      ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-450 hover:bg-emerald-600/20' 
                      : 'bg-indigo-600 hover:bg-indigo-550 text-white border-indigo-500/20 shadow-md shadow-indigo-600/10'
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
                    className="flex-1 py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-850 hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none text-zinc-450 hover:text-zinc-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={!nextResource}
                    onClick={() => nextResource && setSelectedResource(nextResource)}
                    className="flex-1 py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-850 hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none text-zinc-450 hover:text-zinc-200 text-xs font-bold transition-all cursor-pointer"
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
  };

  if (!user) return null;

  return (
    <div className="h-screen overflow-hidden bg-zinc-950 flex flex-col md:flex-row text-zinc-100 font-sans">
      
      {/* SIDEBAR */}
      <aside className={`w-full ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'} bg-zinc-900 border-r border-zinc-800/60 flex flex-col shrink-0 h-auto md:h-full transition-all duration-300 ease-in-out`}>
        <div className="h-16 flex items-center px-6 border-b border-zinc-800/60 justify-between">
          <div className="flex items-center overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center mr-3 text-white shadow-sm shadow-indigo-500/10 shrink-0">
              <Scale className="w-4.5 h-4.5" />
            </div>
            {!isSidebarCollapsed && (
              <span className="font-extrabold text-zinc-100 tracking-tight text-lg whitespace-nowrap transition-opacity duration-300">
                ExpatFiscal
              </span>
            )}
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-250 hover:bg-zinc-800/60 transition-colors hidden md:block shrink-0"
            title={isSidebarCollapsed ? "Expandir menú" : "Contraer menú"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Links de Navegación */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('resources')}
            className={`w-full flex items-center py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
              isSidebarCollapsed ? 'justify-center px-0' : 'px-3'
            } ${
              activeTab === 'resources' 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
            }`}
            title={isSidebarCollapsed ? "Material Formativo" : undefined}
          >
            <BookOpen className={`${isSidebarCollapsed ? 'm-0' : 'mr-3'} h-5 w-5 shrink-0`} />
            {!isSidebarCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">Material Formativo</span>}
          </button>

          <button
            onClick={() => setActiveTab('fiscal')}
            className={`w-full flex items-center py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
              isSidebarCollapsed ? 'justify-center px-0' : 'px-3'
            } ${
              activeTab === 'fiscal' 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
            }`}
            title={isSidebarCollapsed ? "Mi Perfil Fiscal" : undefined}
          >
            <Shield className={`${isSidebarCollapsed ? 'm-0' : 'mr-3'} h-5 w-5 shrink-0`} />
            {!isSidebarCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">Mi Perfil Fiscal</span>}
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`w-full flex items-center py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
              isSidebarCollapsed ? 'justify-center px-0' : 'px-3'
            } ${
              activeTab === 'support' 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
            }`}
            title={isSidebarCollapsed ? "Canal de Soporte" : undefined}
          >
            <MessageSquare className={`${isSidebarCollapsed ? 'm-0' : 'mr-3'} h-5 w-5 shrink-0`} />
            {!isSidebarCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">Canal de Soporte</span>}
          </button>
        </nav>

        {/* Cerrar Sesión */}
        <div className="p-4 border-t border-zinc-800/60 mt-auto">
          <button
            onClick={logout}
            className={`w-full flex items-center py-2.5 text-sm font-medium text-red-400 rounded-xl hover:bg-red-950/20 hover:text-red-300 transition-colors cursor-pointer ${
              isSidebarCollapsed ? 'justify-center px-0' : 'px-3'
            }`}
            title={isSidebarCollapsed ? "Cerrar Sesión" : undefined}
          >
            <LogOut className={`${isSidebarCollapsed ? 'm-0' : 'mr-3'} h-5 w-5 shrink-0`} />
            {!isSidebarCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 border-b border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
          <h2 className="text-lg font-bold text-zinc-200">
            {activeTab === 'resources' && 'Recursos y Consulta'}
            {activeTab === 'fiscal' && 'Mi Estado Fiscal y Expediente'}
            {activeTab === 'support' && 'Canal de Soporte Directo'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-xs text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 px-3 py-1 rounded-full font-semibold hidden sm:inline-block">
              Nómada Activo
            </div>
            <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-800/60">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center font-bold text-indigo-400 text-sm">
                {user?.name?.charAt(0) || 'N'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-zinc-200 leading-none">{user?.name}</p>
                <p className="text-[10px] text-zinc-500 mt-1 leading-none">Estudiante</p>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-zinc-950">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-sm text-zinc-500">Cargando...</p>
            </div>
          </div>
        ) : (
          <div className={`flex-1 ${selectedResource && activeTab === 'resources' ? 'p-0 h-full overflow-hidden bg-zinc-950' : 'p-6 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto no-scrollbar'}`}>
            
            {activeTab === 'resources' && (
              selectedResource ? (
                renderResourcePlayer()
              ) : (
                <>
                  <div className="bg-gradient-to-r from-zinc-900 via-indigo-950/20 to-zinc-900 border border-zinc-800/60 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-1/2 right-10 -translate-y-1/2 text-indigo-500/5 hidden md:block">
                    <Compass className="w-48 h-48" />
                  </div>
                  <h3 className="text-xl font-extrabold text-white mb-2">Bienvenido a tu Mission Control, {user.name}</h3>
                  <p className="text-zinc-400 text-xs max-w-2xl leading-relaxed">
                    Aquí encontrarás documentación oficial, guías simplificadas y videotutoriales sobre plataformas digitales para facilitarte el aterrizaje y la vida fiscal en España.
                  </p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    
                    <div className="relative w-full max-w-md">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar trámites, autónomos, IRPF..." 
                        className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl pl-11 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/60 overflow-x-auto w-full md:w-auto">
                      {types.map(type => (
                        <button
                          key={type.id}
                          onClick={() => setSelectedType(type.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                            selectedType === type.id
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>

                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-zinc-800/60 pt-4">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          selectedCategory === category
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/40'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800/60 hover:border-zinc-700/80 hover:text-zinc-300'
                        }`}
                      >
                        {category === 'all' ? 'Ver Todas' : category}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredResources.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-zinc-500 bg-zinc-900 border border-zinc-800/60 rounded-2xl">
                    <Search className="w-10 h-10 text-zinc-700 mb-3" />
                    <p className="text-sm font-medium">No se encontraron formaciones con esos filtros.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {paginatedResources.map(resource => (
                        <div 
                          key={resource.id} 
                          className="bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:shadow-lg hover:shadow-indigo-950/10"
                        >
                          <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/60 text-zinc-400">
                                {getResourceIcon(resource.type)}
                              </span>
                              <span className="text-[10px] bg-zinc-950 border border-zinc-800/60 text-zinc-400 px-2 py-0.5 rounded-md font-semibold">
                                {resource.category}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-base font-bold text-zinc-200 leading-snug group-hover:text-white transition-colors">
                                {resource.title}
                              </h4>
                              <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                                {resource.description}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {resource.tags && resource.tags.map((tag, idx) => (
                                <span key={idx} className="text-[9px] text-zinc-500 bg-zinc-950 border border-zinc-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <Tag className="w-2.5 h-2.5" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="px-6 py-4 border-t border-zinc-800/60 bg-zinc-900/40">
                            <button 
                              onClick={() => setSelectedResource(resource)}
                              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-zinc-950 border border-zinc-800/60 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white text-xs font-bold text-zinc-300 transition-all cursor-pointer"
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
                      <div className="px-6 py-4 bg-zinc-900 border border-zinc-800/60 rounded-2xl flex items-center justify-between text-xs">
                        <button
                          onClick={() => setResourcesPage(prev => Math.max(1, prev - 1))}
                          disabled={currentResourcesPage === 1}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                        >
                          Anterior
                        </button>
                        <span className="text-zinc-400">
                          Página <span className="text-zinc-200 font-semibold">{currentResourcesPage}</span> de <span className="text-zinc-200 font-semibold">{totalResourcesPages}</span>
                        </span>
                        <button
                          onClick={() => setResourcesPage(prev => Math.min(totalResourcesPages, prev + 1))}
                          disabled={currentResourcesPage === totalResourcesPages}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
             )
            )}

            {activeTab === 'fiscal' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Panel Lateral: Perfil e Hitos */}
                <div className="space-y-6">
                  {/* Datos Personales */}
                  <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-6">
                    <h3 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-400" />
                      Datos Personales Registrados
                    </h3>
                    
                    <div className="space-y-3.5 text-xs">
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase tracking-wider font-bold">Pasaporte</span>
                        <p className="text-zinc-200 font-medium mt-0.5">{user.passport || 'No registrado'}</p>
                      </div>
                      <div className="pt-2.5 border-t border-zinc-800/60">
                        <span className="text-zinc-500 block text-[9px] uppercase tracking-wider font-bold">NIE</span>
                        <p className="text-zinc-200 font-medium mt-0.5">{user.nie || 'No registrado'}</p>
                      </div>
                      <div className="pt-2.5 border-t border-zinc-800/60">
                        <span className="text-zinc-500 block text-[9px] uppercase tracking-wider font-bold">Dirección Fiscal en España</span>
                        {user.address ? (
                          <div className="flex items-start gap-1.5 text-zinc-300 mt-1">
                            <MapPin className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                            <p>{user.address} (C.P. {user.postalCode})</p>
                          </div>
                        ) : (
                          <p className="text-zinc-500 italic mt-0.5">Sin dirección fiscal guardada</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hitos Autónomo */}
                  <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-6 text-xs space-y-4">
                    <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      Hitos Administrativos Autónomo
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800/60 rounded-xl">
                        <div>
                          <p className="font-bold text-zinc-300">Alta en la AEAT</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">Modelo 036 / 037 Hacienda</p>
                        </div>
                        {user.aeatDate ? (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900/30 px-2 py-0.5 rounded-full font-bold">
                            {new Date(user.aeatDate).toLocaleDateString('es-ES')}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-zinc-900 text-zinc-500 border border-zinc-800/60 px-2.5 py-0.5 rounded-full">
                            Pendiente
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800/60 rounded-xl">
                        <div>
                          <p className="font-bold text-zinc-300">Alta Seguridad Social</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">Régimen Especial RETA</p>
                        </div>
                        {user.ssDate ? (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900/30 px-2 py-0.5 rounded-full font-bold">
                            {new Date(user.ssDate).toLocaleDateString('es-ES')}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-zinc-900 text-zinc-500 border border-zinc-800/60 px-2.5 py-0.5 rounded-full">
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Área de Calculadora Fiscal y Gestor Documental (2 Columnas) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Calculadora Fiscal */}
                  <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-6 space-y-5">
                    <div>
                      <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                        <Compass className="w-5 h-5 text-indigo-400" />
                        Calculadora Fiscal de 183 Días
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        En España se considera que eres Residente Fiscal si pasas más de 183 días en el territorio durante el año natural. Controla tus días efectivos de estancia.
                      </p>
                    </div>

                    {user.arrivalDate ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-4 bg-zinc-950 border border-zinc-800/60 rounded-xl text-center">
                            <span className="text-[10px] font-semibold text-zinc-500 block">Entrada a España</span>
                            <p className="text-sm font-bold text-white mt-1.5">{new Date(user.arrivalDate).toLocaleDateString('es-ES')}</p>
                          </div>
                          
                          <div className="p-4 bg-zinc-950 border border-zinc-800/60 rounded-xl text-center">
                            <span className="text-[10px] font-semibold text-zinc-500 block">Ausencias / Viajes</span>
                            <p className="text-sm font-bold text-white mt-1.5">{user.absences || 0} días</p>
                          </div>

                          <div className="p-4 bg-zinc-950 border border-zinc-800/60 rounded-xl text-center">
                            <span className="text-[10px] font-semibold text-zinc-500 block">Estancia Efectiva</span>
                            <p className="text-sm font-bold text-white mt-1.5">{effectiveDays} días</p>
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-zinc-400">Progreso Residencia Fiscal</span>
                            <span className="text-white">{effectiveDays} / 183 días ({progressPercent.toFixed(0)}%)</span>
                          </div>
                          
                          <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/60">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                effectiveDays >= 183
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                  : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700'
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Status Message */}
                        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                          effectiveDays >= 183
                            ? 'bg-emerald-950/20 text-emerald-350 border-emerald-900/30'
                            : 'bg-indigo-950/20 text-indigo-350 border-indigo-900/30'
                        }`}>
                          <div className="mt-0.5">
                            {effectiveDays >= 183 ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Clock className="w-5 h-5 text-indigo-400" />
                            )}
                          </div>
                          <div className="text-xs">
                            <p className="font-bold">
                              {effectiveDays >= 183 
                                ? 'Has alcanzado los 183 días' 
                                : `Te faltan ${183 - effectiveDays} días para ser considerado Residente Fiscal`}
                            </p>
                            <p className="text-zinc-400 mt-1 leading-relaxed">
                              {effectiveDays >= 183 
                                ? 'A partir de este momento eres considerado residente fiscal en España para el ejercicio tributario correspondiente.'
                                : 'Si continúas en España, superarás el umbral. Registra tus viajes fuera de España en el formulario inferior para que se descuenten del cómputo.'}
                            </p>
                          </div>
                        </div>

                        {/* Formulario para guardar ausencias */}
                        <form onSubmit={handleSaveAbsences} className="pt-4 border-t border-zinc-800/60 flex flex-col sm:flex-row items-end gap-4">
                          <div className="w-full sm:max-w-xs">
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Plane className="w-4 h-4 text-indigo-400" /> Registrar Ausencias (Días fuera de España)
                            </label>
                            <input 
                              type="number" 
                              min="0"
                              max="365"
                              value={absencesInput}
                              onChange={(e) => {
                                setAbsencesInput(e.target.value);
                                if (absencesSuccess) setAbsencesSuccess(false);
                              }}
                              className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={savingAbsences}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 px-4 text-xs font-bold shrink-0 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {savingAbsences ? 'Guardando...' : 'Actualizar Viajes'}
                          </button>

                          {absencesSuccess && (
                            <span className="text-xs text-emerald-400 font-semibold mb-2.5 animate-pulse">
                              ¡Guardado con éxito!
                            </span>
                          )}
                        </form>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500 text-center py-6 border border-dashed border-zinc-800 rounded-xl">
                        <AlertCircle className="w-8 h-8 text-zinc-650 mb-2 mx-auto" />
                        No tienes una fecha de entrada asignada por administración para calcular tu residencia.
                      </div>
                    )}
                  </div>

                  {/* Gestor Documental Extranjería */}
                  <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-indigo-400" />
                        Expediente de Extranjería (Resolución Residencia)
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Sube tu resolución aprobada de residencia para tenerla disponible de consulta y permitir que el equipo de soporte administrativo la verifique.
                      </p>
                    </div>

                    {user.residencyDoc ? (
                      <div className="p-4 bg-zinc-950 border border-zinc-800/60 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/60 text-indigo-400 shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-200 truncate">{user.residencyDoc.name}</p>
                            <p className="text-[10px] text-zinc-500 mt-1">
                              Tamaño: {user.residencyDoc.size} • Subido el {new Date(user.residencyDoc.uploadedAt).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => alert('[MVP SIMULACIÓN] Descargando tu documento de extranjería.')}
                            className="p-2 text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800/60 rounded-xl transition-all cursor-pointer"
                            title="Descargar"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          
                          {/* Re-subir */}
                          <label className="p-2 text-indigo-400 hover:text-indigo-300 bg-indigo-950/20 border border-indigo-900/30 rounded-xl cursor-pointer hover:scale-105 transition-all text-center">
                            <Upload className="w-4 h-4 inline" />
                            <input 
                              type="file" 
                              accept=".pdf,image/*" 
                              onChange={handleSimulatedUpload}
                              className="hidden" 
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-zinc-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center bg-zinc-950/40 relative overflow-hidden group">
                        <Upload className="w-8 h-8 text-zinc-500 group-hover:text-indigo-400 transition-colors mb-3" />
                        <p className="text-xs font-bold text-zinc-300">Selecciona o arrastra el archivo de tu resolución</p>
                        <p className="text-[10px] text-zinc-500 mt-1">Soporta formatos PDF y PNG/JPG (Máx. 5MB)</p>
                        
                        <label className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors block">
                          {uploadingDoc ? (
                            <span className="flex items-center gap-1.5">
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Subiendo al MVP...
                            </span>
                          ) : (
                            'Examinar Archivo'
                          )}
                          <input 
                            type="file" 
                            accept=".pdf,image/*" 
                            disabled={uploadingDoc}
                            onChange={handleSimulatedUpload}
                            className="hidden" 
                          />
                        </label>
                      </div>
                    )}

                    {uploadSuccess && (
                      <div className="p-3 bg-emerald-950/30 border border-emerald-900/20 text-emerald-450 text-xs rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Documento subido y registrado en tu expediente digital local.</span>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

            {/* 3. SECCIÓN DE SOPORTE */}
            {activeTab === 'support' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-6 lg:sticky lg:top-24">
                  <h3 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-indigo-400" />
                    Enviar Consulta al Administrador
                  </h3>
                  
                  <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                    ¿Tienes dudas sobre los visados, los impuestos de autónomo o necesitas recomendación de zonas? Tu mensaje será enviado directamente al panel del administrador global.
                  </p>

                  {successMsg && (
                    <div className="mb-4 p-3 bg-indigo-950/40 border border-indigo-800/40 text-indigo-250 text-xs rounded-xl flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-400" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Mensaje / Pregunta</label>
                      <textarea 
                        rows="4"
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          if (successMsg) setSuccessMsg('');
                        }}
                        placeholder="Escribe tu consulta de forma detallada..."
                        required
                        className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {sendingMessage ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          Enviar Pregunta
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-800/60">
                      <h3 className="text-base font-bold text-zinc-100">Tus Consultas</h3>
                      <p className="text-xs text-zinc-500">Historial de dudas enviadas y sus respuestas oficiales.</p>
                    </div>

                    <div className="divide-y divide-zinc-800/60">
                      {messages.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 text-xs">
                          Aún no has enviado ninguna consulta. Usa el formulario de la izquierda.
                        </div>
                      ) : (
                        paginatedMessages.map(msg => {
                          if (msg.reply) {
                            localStorage.setItem(`read_reply_${msg.id}`, 'true');
                          }
                          
                          return (
                            <div key={msg.id} className="p-6 space-y-4 hover:bg-zinc-900/60 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  {msg.reply ? (
                                    <span className="p-1 rounded-full bg-emerald-950 text-emerald-450 border border-emerald-900/30 text-[10px] font-bold flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                      Respuesta Recibida
                                    </span>
                                  ) : (
                                    <span className="p-1 rounded-full bg-amber-950 text-amber-450 border border-amber-900/30 text-[10px] font-bold flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                      Esperando Respuesta
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-zinc-500">
                                  {new Date(msg.created_at).toLocaleString('es-ES')}
                                </span>
                              </div>

                              <div className="p-4 bg-zinc-950 border border-zinc-800/60 rounded-2xl">
                                <span className="text-[9px] font-bold text-zinc-500 block mb-1">Tu consulta original:</span>
                                <p className="text-xs text-zinc-300 font-medium">
                                  {msg.content}
                                </p>
                              </div>

                              {msg.reply && (
                                <div className="p-4 bg-indigo-950/20 border border-indigo-900/20 rounded-2xl space-y-2 ml-6">
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                                    <span>Respuesta del Administrador</span>
                                  </div>
                                  <p className="text-xs text-indigo-200/90 leading-relaxed font-medium">
                                    {msg.reply}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Controles de paginación para consultas */}
                  {totalMessagesPages > 1 && (
                    <div className="px-6 py-4 bg-zinc-900 border border-zinc-800/60 rounded-2xl flex items-center justify-between text-xs">
                      <button
                        onClick={() => setMessagesPage(prev => Math.max(1, prev - 1))}
                        disabled={currentMessagesPage === 1}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        Anterior
                      </button>
                      <span className="text-zinc-400">
                        Página <span className="text-zinc-200 font-semibold">{currentMessagesPage}</span> de <span className="text-zinc-200 font-semibold">{totalMessagesPages}</span>
                      </span>
                      <button
                        onClick={() => setMessagesPage(prev => Math.min(totalMessagesPages, prev + 1))}
                        disabled={currentMessagesPage === totalMessagesPages}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
