/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { mockDb } from '../utils/mockDb';
import { 
  BookOpen, MessageSquare, LogOut, Compass, FileText, 
  Video, Presentation, Search, Tag, ExternalLink, Calendar, 
  Send, HelpCircle, CheckCircle2, Clock, AlertCircle, ArrowRight,
  User, MapPin, Upload, Shield, Plane, Download, Scale, ChevronLeft, ChevronRight,
  Code
} from 'lucide-react';

// New Features Imports
import StudentSidebar from '../features/student/StudentSidebar';
import CourseDirectory from '../features/student/CourseDirectory';
import ResourceViewerModal from '../features/student/ResourceViewerModal';
import CommunicationPanel from '../features/student/CommunicationPanel';

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

  const RESOURCES_PER_PAGE = 6;
  
  // Database lists
  const [resources, setResources] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loading, setLoading] = useState(true);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Support message form states
  const [newMessage, setNewMessage] = useState('');
  const [newTicketTitle, setNewTicketTitle] = useState('');
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
        (res.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (res.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (res.tags && res.tags.some(t => (t || '').toLowerCase().includes(searchQuery.toLowerCase())));
        
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
      const ticketsList = await mockDb.tickets.getAll();
      
      setResources(resList.filter(res => allowedIds.includes(res.id)));
      setTickets(ticketsList.filter(t => t.student_id === user.id));
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

  // Cargar mensajes del ticket seleccionado
  useEffect(() => {
    const fetchTicketMessages = async () => {
      if (!selectedTicketId) {
        setTicketMessages([]);
        return;
      }
      setLoadingMessages(true);
      try {
        const msgs = await mockDb.tickets.getMessages(selectedTicketId);
        setTicketMessages(msgs);
      } catch (err) {
        console.error("Error al cargar mensajes del ticket:", err);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchTicketMessages();
  }, [selectedTicketId]);

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

  // Handler for creating a new ticket
  const handleCreateTicket = async (e, attachment = null) => {
    e.preventDefault();
    if (!newTicketTitle.trim() || !newMessage.trim()) return;

    setSendingMessage(true);
    setSuccessMsg('');
    try {
      const res = await mockDb.tickets.create({
        student_id: user.id,
        title: newTicketTitle.trim(),
        content: newMessage.trim(),
        attachment_url: attachment?.url || null,
        attachment_name: attachment?.name || null,
        attachment_type: attachment?.type || null
      });

      setNewTicketTitle('');
      setNewMessage('');
      setSuccessMsg('Tu ticket de soporte ha sido creado con éxito.');
      
      const ticketsList = await mockDb.tickets.getAll();
      setTickets(ticketsList.filter(t => t.student_id === user.id));
      if (res && res.id) {
        setSelectedTicketId(res.id);
      }
    } catch (err) {
      alert('Error al crear el ticket: ' + err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  // Handler for sending a message in a ticket
  const handleSendTicketMessage = async (e, attachment = null) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicketId) return;

    setSendingMessage(true);
    try {
      const newMsg = await mockDb.tickets.createMessage({
        ticket_id: selectedTicketId,
        sender_id: user.id,
        content: newMessage.trim(),
        attachment_url: attachment?.url || null,
        attachment_name: attachment?.name || null,
        attachment_type: attachment?.type || null
      });

      setNewMessage('');
      setTicketMessages(prev => [...prev, newMsg]);

      // Refresh tickets to update updated_at timestamp
      const ticketsList = await mockDb.tickets.getAll();
      setTickets(ticketsList.filter(t => t.student_id === user.id));
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
      case 'video': return <Video className="w-5 h-5 text-rose-450" />;
      case 'presentation': return <Presentation className="w-5 h-5 text-amber-400" />;
      case 'document': return <FileText className="w-5 h-5 text-sky-400" />;
      case 'html_video': return <Code className="w-5 h-5 text-emerald-450" />;
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


  if (!user) return null;

  return (
    <div className="h-screen overflow-hidden bg-zinc-950 flex flex-col md:flex-row text-zinc-100 font-sans cyber-grid">
      
      {/* SIDEBAR */}
      <StudentSidebar 
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        logout={logout}
      />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-100 font-mono">
            {activeTab === 'resources' && 'RECURSOS DEL SISTEMA // FORMACIONES'}
            {activeTab === 'fiscal' && 'DOSSIER FISCAL // ESTADO'}
            {activeTab === 'support' && 'COMUNICACIÓN DIRECTA // SOPORTE'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-[10px] text-indigo-400 bg-indigo-950/40 border border-indigo-500/25 px-3 py-1.5 rounded-xl font-bold font-mono uppercase tracking-wider hidden sm:inline-block shadow-[0_0_10px_rgba(0,242,254,0.05)]">
              Nómada Activo
            </div>
            <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-805">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-indigo-400 text-xs font-mono shadow-sm">
                {user?.name?.charAt(0) || 'N'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-zinc-200 leading-none">{user?.name}</p>
                <p className="text-[9px] text-zinc-550 mt-1 uppercase tracking-wider font-bold font-mono leading-none">Estudiante</p>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-zinc-950">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-xs text-zinc-500 font-mono uppercase tracking-wider">Loading System Data...</p>
            </div>
          </div>
        ) : (
          <div className={`flex-1 ${selectedResource && activeTab === 'resources' ? 'p-0 h-full overflow-hidden bg-zinc-950' : 'p-6 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto no-scrollbar'}`}>
            
            {activeTab === 'resources' && (
              selectedResource ? (
                <ResourceViewerModal 
                  selectedResource={selectedResource}
                  setSelectedResource={setSelectedResource}
                  resources={resources}
                  user={user}
                  handleToggleCompleted={handleToggleCompleted}
                  getResourceIcon={getResourceIcon}
                />
              ) : (
                <CourseDirectory 
                  user={user}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedType={selectedType}
                  setSelectedType={setSelectedType}
                  types={types}
                  categories={categories}
                  filteredResources={filteredResources}
                  paginatedResources={paginatedResources}
                  resourcesPage={resourcesPage}
                  setResourcesPage={setResourcesPage}
                  totalResourcesPages={totalResourcesPages}
                  currentResourcesPage={currentResourcesPage}
                  setSelectedResource={setSelectedResource}
                  getResourceIcon={getResourceIcon}
                  getActionButtonText={getActionButtonText}
                />
              )
            )}

            {activeTab === 'fiscal' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Panel Lateral: Perfil e Hitos */}
                <div className="space-y-6">
                  {/* Datos Personales */}
                  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md shadow-sm">
                    <h3 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2 font-mono uppercase tracking-wider">
                      <User className="w-5 h-5 text-indigo-400" />
                      DATOS PERSONALES
                    </h3>
                    
                    <div className="space-y-3.5 text-xs font-mono">
                      <div>
                        <span className="text-zinc-550 block text-[9px] uppercase tracking-widest font-bold">PASAPORTE</span>
                        <p className="text-zinc-250 font-medium mt-0.5">{user.passport || 'NO REGISTRADO'}</p>
                      </div>
                      <div className="pt-2.5 border-t border-zinc-800/80">
                        <span className="text-zinc-550 block text-[9px] uppercase tracking-widest font-bold">NIE</span>
                        <p className="text-zinc-250 font-medium mt-0.5">{user.nie || 'NO REGISTRADO'}</p>
                      </div>
                      <div className="pt-2.5 border-t border-zinc-800/80">
                        <span className="text-zinc-550 block text-[9px] uppercase tracking-widest font-bold">DIRECCIÓN FISCAL (ESPAÑA)</span>
                        {user.address ? (
                          <div className="flex items-start gap-1.5 text-zinc-300 mt-1 font-sans text-xs">
                            <MapPin className="w-4 h-4 text-zinc-550 shrink-0 mt-0.5" />
                            <p>{user.address} (C.P. {user.postalCode})</p>
                          </div>
                        ) : (
                          <p className="text-zinc-550 italic mt-0.5">SIN DIRECCIÓN GUARDADA</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hitos Autónomo */}
                  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 text-xs space-y-4 backdrop-blur-md shadow-sm font-mono">
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 uppercase tracking-wider">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      HITOS ADMINISTRATIVOS
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl">
                        <div>
                          <p className="font-bold text-zinc-300 text-[10px] uppercase tracking-wider">Alta en la AEAT</p>
                          <p className="text-[9px] text-zinc-550 mt-0.5 uppercase">Modelo 036 / 037 Hacienda</p>
                        </div>
                        {user.aeatDate ? (
                          <span className="text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold">
                            {new Date(user.aeatDate).toLocaleDateString('es-ES')}
                          </span>
                        ) : (
                          <span className="text-[9px] bg-zinc-900 text-zinc-550 border border-zinc-805 px-2 py-0.5 rounded-md uppercase font-bold">
                            PENDIENTE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl">
                        <div>
                          <p className="font-bold text-zinc-300 text-[10px] uppercase tracking-wider">Alta Seguridad Social</p>
                          <p className="text-[9px] text-zinc-550 mt-0.5 uppercase">Régimen Especial RETA</p>
                        </div>
                        {user.ssDate ? (
                          <span className="text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold">
                            {new Date(user.ssDate).toLocaleDateString('es-ES')}
                          </span>
                        ) : (
                          <span className="text-[9px] bg-zinc-900 text-zinc-550 border border-zinc-805 px-2 py-0.5 rounded-md uppercase font-bold">
                            PENDIENTE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Área de Calculadora Fiscal y Gestor Documental (2 Columnas) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Calculadora Fiscal */}
                  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 space-y-5 backdrop-blur-md shadow-sm">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 font-mono uppercase tracking-wider">
                        <Compass className="w-5 h-5 text-indigo-400" />
                        CÓMPUTO DE RESIDENCIA FISCAL (183 DÍAS)
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        En España se considera que eres Residente Fiscal si pasas más de 183 días en el territorio durante el año natural. Controla tus días efectivos de estancia.
                      </p>
                    </div>

                    {user.arrivalDate ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                          <div className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-xl text-center shadow-inner">
                            <span className="text-[9px] font-bold text-zinc-500 block uppercase tracking-wider">Entrada a España</span>
                            <p className="text-xs font-bold text-zinc-200 mt-1.5">{new Date(user.arrivalDate).toLocaleDateString('es-ES')}</p>
                          </div>
                          
                          <div className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-xl text-center shadow-inner">
                            <span className="text-[9px] font-bold text-zinc-500 block uppercase tracking-wider">Ausencias / Viajes</span>
                            <p className="text-xs font-bold text-zinc-200 mt-1.5">{user.absences || 0} DÍAS</p>
                          </div>

                          <div className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-xl text-center shadow-inner">
                            <span className="text-[9px] font-bold text-zinc-500 block uppercase tracking-wider">Estancia Efectiva</span>
                            <p className="text-xs font-bold text-indigo-400 mt-1.5 shadow-[0_0_8px_rgba(0,242,254,0.05)]">{effectiveDays} DÍAS</p>
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="space-y-2 font-mono">
                          <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider">
                            <span className="text-zinc-450">Progreso Residencia Fiscal</span>
                            <span className="text-zinc-200">{effectiveDays} / 183 DÍAS ({progressPercent.toFixed(0)}%)</span>
                          </div>
                          
                          <div className="w-full h-3.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80 p-0.5">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                effectiveDays >= 183
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                                  : 'bg-indigo-500 shadow-[0_0_10px_rgba(0,242,254,0.25)]'
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
                          <div className="text-xs font-mono">
                            <p className="font-bold uppercase tracking-wider text-zinc-200">
                              {effectiveDays >= 183 
                                ? 'UMBRAL DE 183 DÍAS ALCANZADO' 
                                : `FALTAN ${183 - effectiveDays} DÍAS PARA RESIDENCIA FISCAL`}
                            </p>
                            <p className="text-zinc-400 mt-1 font-sans text-xs leading-relaxed">
                              {effectiveDays >= 183 
                                ? 'A partir de este momento eres considerado residente fiscal en España para el ejercicio tributario correspondiente.'
                                : 'Si continúas en España, superarás el umbral. Registra tus viajes fuera de España en el formulario inferior para que se descuenten del cómputo.'}
                            </p>
                          </div>
                        </div>

                        {/* Formulario para guardar ausencias */}
                        <form onSubmit={handleSaveAbsences} className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-end gap-4 font-mono">
                          <div className="w-full sm:max-w-xs">
                            <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <Plane className="w-4 h-4 text-indigo-400" /> REGISTRAR AUSENCIAS (VIAJES)
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
                              className="w-full bg-zinc-950 border border-zinc-800/80 focus:border-indigo-400/85 focus:shadow-[0_0_12px_rgba(0,242,254,0.12)] rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none transition-all duration-200"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={savingAbsences}
                            className="bg-indigo-650 hover:bg-indigo-600 text-zinc-950 border border-indigo-500/20 rounded-xl py-3 px-5 text-[10px] font-bold uppercase tracking-widest shrink-0 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-[0_0_10px_rgba(0,242,254,0.15)]"
                          >
                            {savingAbsences ? 'GUARDANDO...' : 'ACTUALIZAR DATOS'}
                          </button>

                          {absencesSuccess && (
                            <span className="text-[10px] text-emerald-400 font-bold mb-3.5 animate-pulse uppercase tracking-wider">
                              ¡Guardado con éxito!
                            </span>
                          )}
                        </form>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500 font-mono uppercase text-center py-8 border border-dashed border-zinc-800 rounded-xl">
                        <AlertCircle className="w-8 h-8 text-zinc-700 mb-2 mx-auto" />
                        No tienes una fecha de entrada asignada por administración para calcular tu residencia.
                      </div>
                    )}
                  </div>

                  {/* Gestor Documental Extranjería */}
                  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-sm">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 font-mono uppercase tracking-wider">
                        <Upload className="w-5 h-5 text-indigo-400" />
                        EXPEDIENTE DE EXTRANJERÍA (RESOLUCIÓN)
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Sube tu resolución aprobada de residencia para tenerla disponible de consulta y permitir que el equipo de soporte administrativo la verifique.
                      </p>
                    </div>

                    {user.residencyDoc ? (
                      <div className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-4 font-mono">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-indigo-400 shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-200 truncate uppercase tracking-wide">{user.residencyDoc.name}</p>
                            <p className="text-[9px] text-zinc-550 mt-1 uppercase tracking-wider">
                              TAMAÑO: {user.residencyDoc.size} • SUBIDO: {new Date(user.residencyDoc.uploadedAt).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => alert('[MVP SIMULACIÓN] Descargando tu documento de extranjería.')}
                            className="p-2.5 text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-all cursor-pointer"
                            title="Descargar"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          
                          {/* Re-subir */}
                          <label className="p-2.5 text-indigo-400 hover:text-indigo-300 bg-indigo-950/20 border border-indigo-900/30 hover:border-indigo-500/30 rounded-lg cursor-pointer hover:scale-105 transition-all text-center border">
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
                      <div className="border border-dashed border-zinc-805 rounded-2xl p-8 text-center flex flex-col items-center justify-center bg-zinc-950/40 relative overflow-hidden group hover:border-indigo-500/20 transition-all duration-300">
                        <Upload className="w-8 h-8 text-zinc-600 group-hover:text-indigo-400 transition-colors mb-3" />
                        <p className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">Selecciona el archivo de tu resolución</p>
                        <p className="text-[9px] text-zinc-550 font-mono uppercase tracking-widest mt-1">Formatos PDF, PNG, JPG (Máx. 5MB)</p>
                        
                        <label className="mt-4 px-4 py-2.5 bg-zinc-950 hover:bg-indigo-950/45 text-zinc-400 hover:text-indigo-400 border border-zinc-800 hover:border-indigo-500/30 rounded-xl text-[10px] font-bold font-mono uppercase tracking-widest cursor-pointer transition-colors block">
                          {uploadingDoc ? (
                            <span className="flex items-center gap-1.5">
                              <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                              Subiendo...
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
                      <div className="p-3 bg-emerald-950/30 border border-emerald-900/20 text-emerald-450 text-xs rounded-xl flex items-center gap-2 font-mono">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="uppercase text-[9px] font-bold tracking-wider">Documento registrado en tu expediente digital local.</span>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

            {activeTab === 'support' && (
              <CommunicationPanel 
                successMsg={successMsg}
                setSuccessMsg={setSuccessMsg}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                newTicketTitle={newTicketTitle}
                setNewTicketTitle={setNewTicketTitle}
                sendingMessage={sendingMessage}
                handleCreateTicket={handleCreateTicket}
                handleSendTicketMessage={handleSendTicketMessage}
                handleUploadAttachment={mockDb.tickets.uploadAttachment}
                tickets={tickets}
                selectedTicketId={selectedTicketId}
                setSelectedTicketId={setSelectedTicketId}
                ticketMessages={ticketMessages}
                loadingMessages={loadingMessages}
              />
            )}

          </div>
        )}
      </main>
    </div>
  );
}
