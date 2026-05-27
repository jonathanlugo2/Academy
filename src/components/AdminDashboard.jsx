/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { mockDb } from '../utils/mockDb';
import { 
  LayoutDashboard, BookOpen, MessageSquare, LogOut, Plus, 
  Trash2, Send, CheckCircle2, AlertCircle, Compass, FileText, 
  Video, Presentation, Tag, ExternalLink, Calendar, Users, 
  UserPlus, User, MapPin, Download, Sparkles, Scale, ChevronLeft, ChevronRight,
  Code, Edit2, Upload
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  
  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'content', 'messages', 'users'

  // Pagination states
  const [usersPage, setUsersPage] = useState(1);
  const [resourcesPage, setResourcesPage] = useState(1);
  const [messagesPage, setMessagesPage] = useState(1);

  const USERS_PER_PAGE = 5;
  const RESOURCES_PER_PAGE = 5;
  const MESSAGES_PER_PAGE = 4;
  
  // State for database lists
  const [resources, setResources] = useState([]);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states for creating new content
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('document');
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Trámites y Visados');
  const [newTags, setNewTags] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState(null);

  // States for replies
  const [replyText, setReplyText] = useState({});
  const [submittingReply, setSubmittingReply] = useState({});

  // States for User Management
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateUserForm, setShowCreateUserForm] = useState(true);
  
  // Form states for creating user
  const [uEmail, setUEmail] = useState('');
  const [uPassword, setUPassword] = useState('');
  const [uName, setUName] = useState('');
  const [uRole, setURole] = useState('student');
  const [uPassport, setUPassport] = useState('');
  const [uNie, setUNie] = useState('');
  const [uAddress, setUAddress] = useState('');
  const [uPostalCode, setUPostalCode] = useState('');
  const [uArrivalDate, setUArrivalDate] = useState('');
  const [uAeatDate, setUAeatDate] = useState('');
  const [uSsDate, setUSsDate] = useState('');
  
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  // Cargar datos
  const loadData = useCallback(async () => {
    try {
      const resList = await mockDb.resources.getAll();
      const msgList = await mockDb.messages.getAll();
      const usersList = await mockDb.users.getAll();
      setResources(resList);
      setMessages(msgList);
      setUsers(usersList);
    } catch (e) {
      console.error("Error al cargar datos:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Adjust pagination pages when lists change
  useEffect(() => {
    const totalPages = Math.ceil(users.length / USERS_PER_PAGE) || 1;
    if (usersPage > totalPages) {
      setUsersPage(totalPages);
    }
  }, [users, usersPage]);

  useEffect(() => {
    const totalPages = Math.ceil(resources.length / RESOURCES_PER_PAGE) || 1;
    if (resourcesPage > totalPages) {
      setResourcesPage(totalPages);
    }
  }, [resources, resourcesPage]);

  useEffect(() => {
    const totalPages = Math.ceil(messages.length / MESSAGES_PER_PAGE) || 1;
    if (messagesPage > totalPages) {
      setMessagesPage(totalPages);
    }
  }, [messages, messagesPage]);

  // Handler for adding/updating resource
  const handleAddResource = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newTitle.trim() || !newUrl.trim() || !newDesc.trim()) {
      setFormError('Por favor completa los campos requeridos (Título, URL y Descripción).');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingResourceId) {
        // Modo Edición
        await mockDb.resources.update(editingResourceId, {
          title: newTitle,
          type: newType,
          url: newUrl,
          description: newDesc,
          category: newCategory,
          tags: newTags
        });
        setFormSuccess('¡Recurso formativo actualizado con éxito!');
        setEditingResourceId(null);
      } else {
        // Modo Creación
        await mockDb.resources.create({
          title: newTitle,
          type: newType,
          url: newUrl,
          description: newDesc,
          category: newCategory,
          tags: newTags
        });
        setFormSuccess('¡Recurso formativo creado con éxito!');
      }

      setNewTitle('');
      setNewUrl('');
      setNewDesc('');
      setNewTags('');
      setNewType('document');
      setNewCategory('Trámites y Visados');
      
      const updated = await mockDb.resources.getAll();
      setResources(updated);
    } catch (err) {
      setFormError('Error al procesar el recurso: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for loading PDF files locally and converting to Base64 dataURL
  const handlePdfFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setFormError('Por favor selecciona únicamente archivos de tipo PDF.');
      return;
    }

    // Limit size to avoid local storage overflow (typically 5MB limit, let's allow up to 2.5MB)
    if (file.size > 2.5 * 1024 * 1024) {
      setFormError('El archivo PDF supera el límite recomendado de 2.5 MB para almacenamiento local.');
      return;
    }

    setFormError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewUrl(event.target.result); // Base64 Data URL
      setFormSuccess('¡Archivo PDF cargado en el formulario!');
      setTimeout(() => setFormSuccess(''), 3000);
    };
    reader.onerror = () => {
      setFormError('Error al leer el archivo PDF.');
    };
    reader.readAsDataURL(file);
  };

  // Handler to start editing a resource
  const handleStartEditResource = (resource) => {
    setEditingResourceId(resource.id);
    setNewTitle(resource.title);
    setNewType(resource.type || 'document');
    setNewUrl(resource.url);
    setNewDesc(resource.description);
    setNewCategory(resource.category || 'Trámites y Visados');
    setNewTags(resource.tags ? resource.tags.join(', ') : '');
    setFormError('');
    setFormSuccess('');
    
    // Desplazar suavemente el foco al formulario en móviles
    const formElement = document.getElementById('resource-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handler to cancel editing
  const handleCancelEdit = () => {
    setEditingResourceId(null);
    setNewTitle('');
    setNewUrl('');
    setNewDesc('');
    setNewTags('');
    setNewType('document');
    setNewCategory('Trámites y Visados');
    setFormError('');
    setFormSuccess('');
  };

  // Handler for deleting resource
  const handleDeleteResource = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este recurso formativo?')) return;
    try {
      await mockDb.resources.delete(id);
      const updated = await mockDb.resources.getAll();
      setResources(updated);
    } catch (e) {
      alert('Error al borrar el recurso: ' + e.message);
    }
  };

  // Handler for replying to message
  const handleSendReply = async (messageId) => {
    const text = replyText[messageId];
    if (!text || !text.trim()) return;

    setSubmittingReply(prev => ({ ...prev, [messageId]: true }));
    try {
      await mockDb.messages.reply(messageId, text.trim());
      setReplyText(prev => ({ ...prev, [messageId]: '' }));
      const updated = await mockDb.messages.getAll();
      setMessages(updated);
    } catch (e) {
      alert('Error al enviar la respuesta: ' + e.message);
    } finally {
      setSubmittingReply(prev => ({ ...prev, [messageId]: false }));
    }
  };

  const handleReplyChange = (id, value) => {
    setReplyText(prev => ({ ...prev, [id]: value }));
  };

  // Handler for creating a new user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!uEmail.trim() || !uPassword.trim() || !uName.trim()) {
      setUserError('Nombre, Correo y Contraseña son campos obligatorios.');
      return;
    }

    if (uPassword.length < 6) {
      setUserError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCreatingUser(true);
    try {
      await mockDb.users.create({
        email: uEmail,
        password: uPassword,
        name: uName,
        role: uRole,
        passport: uPassport.trim() || null,
        nie: uNie.trim() || null,
        address: uAddress.trim() || null,
        postalCode: uPostalCode.trim() || null,
        arrivalDate: uArrivalDate || null,
        aeatDate: uAeatDate || null,
        ssDate: uSsDate || null
      });

      // Limpiar formulario
      setUEmail('');
      setUPassword('');
      setUName('');
      setURole('student');
      setUPassport('');
      setUNie('');
      setUAddress('');
      setUPostalCode('');
      setUArrivalDate('');
      setUAeatDate('');
      setUSsDate('');

      setUserSuccess('¡Usuario registrado correctamente!');
      
      // Recargar lista de usuarios
      const updated = await mockDb.users.getAll();
      setUsers(updated);
    } catch (err) {
      setUserError(err.message);
    } finally {
      setCreatingUser(false);
    }
  };

  // Handler for deleting user
  const handleDeleteUser = async (id, name) => {
    if (id === user.id) {
      alert('No puedes eliminar tu propio usuario administrador en sesión.');
      return;
    }

    if (!confirm(`¿Estás seguro de que deseas eliminar el usuario "${name}"? Esta acción es irreversible.`)) return;

    try {
      await mockDb.users.delete(id);
      if (selectedUser?.id === id) {
        setSelectedUser(null);
        setShowCreateUserForm(true);
      }
      const updated = await mockDb.users.getAll();
      setUsers(updated);
    } catch (e) {
      alert('Error al eliminar el usuario: ' + e.message);
    }
  };

  // Lógica de cálculo fiscal de los 183 días
  const calculateResidencyDays = (arrivalDate, absences = 0) => {
    if (!arrivalDate) return 0;
    const start = new Date(arrivalDate);
    const today = new Date();
    
    // Si la fecha de entrada es futura por error, retornar 0
    if (start > today) return 0;
    
    const diffTime = Math.max(0, today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Restar las ausencias del total de días en España
    return Math.max(0, diffDays - absences);
  };

  // Descarga simulada de documentos de extranjeros
  const triggerDocDownload = (docName) => {
    alert(`[MVP SIMULACIÓN] Descargando resolución de extranjería: "${docName}" desde el servidor temporal.`);
  };

  // Métricas calculadas
  const totalResources = resources.length;
  const pendingMessages = messages.filter(m => !m.reply).length;
  
  const totalRegisteredUsers = users.length;
  const totalStudents = users.filter(u => u.role === 'student').length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;

  // Paginated elements
  const totalUsersPages = Math.ceil(users.length / USERS_PER_PAGE) || 1;
  const currentUsersPage = Math.min(usersPage, totalUsersPages);
  const paginatedUsers = users.slice((currentUsersPage - 1) * USERS_PER_PAGE, currentUsersPage * USERS_PER_PAGE);

  const totalResourcesPages = Math.ceil(resources.length / RESOURCES_PER_PAGE) || 1;
  const currentResourcesPage = Math.min(resourcesPage, totalResourcesPages);
  const paginatedResources = resources.slice((currentResourcesPage - 1) * RESOURCES_PER_PAGE, currentResourcesPage * RESOURCES_PER_PAGE);

  const totalMessagesPages = Math.ceil(messages.length / MESSAGES_PER_PAGE) || 1;
  const currentMessagesPage = Math.min(messagesPage, totalMessagesPages);
  const paginatedMessages = messages.slice((currentMessagesPage - 1) * MESSAGES_PER_PAGE, currentMessagesPage * MESSAGES_PER_PAGE);

  const resourceIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4 text-rose-400" />;
      case 'presentation': return <Presentation className="w-4 h-4 text-amber-400" />;
      case 'document': return <FileText className="w-4 h-4 text-sky-400" />;
      case 'html_video': return <Code className="w-4 h-4 text-emerald-400" />;
      case 'link': return <ExternalLink className="w-4 h-4 text-indigo-400" />;
      default: return <FileText className="w-4 h-4 text-zinc-400" />;
    }
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
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
              isSidebarCollapsed ? 'justify-center px-0' : 'px-3'
            } ${
              activeTab === 'overview' 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
            }`}
            title={isSidebarCollapsed ? "Resumen General" : undefined}
          >
            <LayoutDashboard className={`${isSidebarCollapsed ? 'm-0' : 'mr-3'} h-5 w-5 shrink-0`} />
            {!isSidebarCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">Resumen General</span>}
          </button>

          <button
            onClick={() => setActiveTab('content')}
            className={`w-full flex items-center py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
              isSidebarCollapsed ? 'justify-center px-0' : 'px-3'
            } ${
              activeTab === 'content' 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
            }`}
            title={isSidebarCollapsed ? "Gestión Contenidos" : undefined}
          >
            <BookOpen className={`${isSidebarCollapsed ? 'm-0' : 'mr-3'} h-5 w-5 shrink-0`} />
            {!isSidebarCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">Gestión Contenidos</span>}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
              isSidebarCollapsed ? 'justify-center px-0' : 'px-3'
            } ${
              activeTab === 'users' 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
            }`}
            title={isSidebarCollapsed ? "Gestión Usuarios" : undefined}
          >
            <Users className={`${isSidebarCollapsed ? 'm-0' : 'mr-3'} h-5 w-5 shrink-0`} />
            {!isSidebarCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">Gestión Usuarios</span>}
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer relative ${
              isSidebarCollapsed ? 'justify-center px-0' : 'px-3'
            } ${
              activeTab === 'messages' 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
            }`}
            title={isSidebarCollapsed ? "Bandeja Mensajes" : undefined}
          >
            <MessageSquare className={`${isSidebarCollapsed ? 'm-0' : 'mr-3'} h-5 w-5 shrink-0`} />
            {!isSidebarCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">Bandeja Mensajes</span>}
            {pendingMessages > 0 && !isSidebarCollapsed && (
              <span className="ml-auto bg-amber-500 text-zinc-950 font-extrabold text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-pulse shrink-0">
                {pendingMessages}
              </span>
            )}
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
            {activeTab === 'overview' && 'Vista General'}
            {activeTab === 'content' && 'Gestión de Contenidos Formativos'}
            {activeTab === 'messages' && 'Canal de Comunicación'}
            {activeTab === 'users' && 'Administración y Registro de Usuarios'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-xs text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 px-3 py-1 rounded-full font-semibold hidden sm:inline-block">
              Modo Administrador
            </div>
            <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-800/60">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center font-bold text-indigo-400 text-sm">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-zinc-200 leading-none">{user?.name}</p>
                <p className="text-[10px] text-zinc-500 mt-1 leading-none">Administrador</p>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-zinc-950">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-sm text-zinc-500">Cargando base de datos local...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto no-scrollbar">
            
            {/* 1. SECCIÓN DE RESUMEN (OVERVIEW) */}
            {activeTab === 'overview' && (
              <>
                {/* Cuadrícula de Métricas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div 
                    onClick={() => setActiveTab('users')}
                    className="bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 hover:bg-zinc-850/60 rounded-2xl p-5 relative overflow-hidden cursor-pointer transition-all duration-200 group"
                  >
                    <div className="absolute right-4 top-4 text-indigo-500/20 group-hover:scale-110 transition-transform"><Users className="w-10 h-10 text-indigo-450" /></div>
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Estudiantes Activos</span>
                    <h3 className="text-3xl font-extrabold text-white mt-2">{totalStudents}</h3>
                    <p className="text-xs text-zinc-500 mt-2">Nómadas registrados</p>
                  </div>

                  <div 
                    onClick={() => setActiveTab('content')}
                    className="bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 hover:bg-zinc-850/60 rounded-2xl p-5 relative overflow-hidden cursor-pointer transition-all duration-200 group"
                  >
                    <div className="absolute right-4 top-4 text-indigo-500/20 group-hover:scale-110 transition-transform"><BookOpen className="w-10 h-10 text-indigo-450" /></div>
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Formaciones creadas</span>
                    <h3 className="text-3xl font-extrabold text-white mt-2">{totalResources}</h3>
                    <p className="text-xs text-zinc-500 mt-2">PDFs, videos y guías</p>
                  </div>

                  <div 
                    onClick={() => setActiveTab('messages')}
                    className="bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 hover:bg-zinc-850/60 rounded-2xl p-5 relative overflow-hidden cursor-pointer transition-all duration-200 group"
                  >
                    <div className="absolute right-4 top-4 text-amber-500/20 group-hover:scale-110 transition-transform"><AlertCircle className="w-10 h-10 text-amber-500/60" /></div>
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Consultas Pendientes</span>
                    <h3 className="text-3xl font-extrabold text-white mt-2">{pendingMessages}</h3>
                    <p className="text-xs text-zinc-500 mt-2">Requieren respuesta</p>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute right-4 top-4 text-emerald-500/20"><CheckCircle2 className="w-10 h-10 text-emerald-450" /></div>
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Administradores</span>
                    <h3 className="text-3xl font-extrabold text-white mt-2">{totalAdmins}</h3>
                    <p className="text-xs text-zinc-500 mt-2">Control total del sistema</p>
                  </div>
                </div>

                {/* Acceso Rápido y Tips de Administración */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-6">
                    <h3 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
                      <Compass className="w-5 h-5 text-indigo-500" />
                      Estado del MVP y Próximos Pasos
                    </h3>
                    <div className="space-y-4 text-sm text-zinc-400">
                      <p>
                        Actualmente estás operando en <strong>Modo Local</strong>. Toda la información de cursos, nómadas y mensajes se persiste en tu navegador mediante `localStorage`.
                      </p>
                      <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/60 space-y-2">
                        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Para migrar a Supabase más adelante:</h4>
                        <ul className="list-disc pl-4 space-y-1 text-xs">
                          <li>Crear base de datos en Supabase y las tablas correspondientes (`resources`, `messages`, `profiles`).</li>
                          <li>Configurar políticas de seguridad RLS (Row Level Security) para que solo Administradores puedan insertar/eliminar.</li>
                          <li>Reemplazar las llamadas de `mockDb.js` con el cliente `@supabase/supabase-js`.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-zinc-100 mb-2">Mensajes Pendientes de Nómadas</h3>
                      <p className="text-xs text-zinc-500 mb-4">Preguntas urgentes enviadas por estudiantes.</p>
                      
                      {messages.filter(m => !m.reply).length === 0 ? (
                        <div className="py-6 flex flex-col items-center justify-center text-zinc-505 bg-zinc-950/40 rounded-xl border border-zinc-805">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mb-2" />
                          <p className="text-xs font-semibold">¡Bandeja al día! No hay consultas pendientes.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2">
                          {messages.filter(m => !m.reply).map(msg => (
                            <div key={msg.id} className="p-3 bg-zinc-950 border border-zinc-800/60 rounded-xl flex items-center justify-between gap-4">
                              <div className="truncate">
                                <p className="text-xs font-bold text-zinc-200 truncate">{msg.content}</p>
                                <p className="text-[10px] text-zinc-500 mt-1">Por {msg.sender_name}</p>
                              </div>
                              <button 
                                onClick={() => setActiveTab('messages')}
                                className="px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shrink-0 transition-colors"
                              >
                                Responder
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            {activeTab === 'content' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Formulario de Adición/Edición (1 Columna) */}
                <div id="resource-form" className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-6 lg:sticky lg:top-24">
                  <h3 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
                    {editingResourceId ? (
                      <>
                        <Edit2 className="w-5 h-5 text-indigo-500" />
                        Editar Recurso Formativo
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 text-indigo-500" />
                        Nuevo Recurso Formativo
                      </>
                    )}
                  </h3>

                  {formError && (
                    <div className="mb-4 p-3 bg-red-950/40 border border-red-800/40 text-red-200 text-xs rounded-xl flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-450" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {formSuccess && (
                    <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/40 text-emerald-250 text-xs rounded-xl flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-450" />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleAddResource} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Título *</label>
                      <input 
                        type="text" 
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Ej. Requisitos para Visado de Nómada"
                        className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Tipo de Recurso</label>
                        <select 
                          value={newType} 
                          onChange={(e) => setNewType(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none"
                        >
                          <option value="video">Video (YouTube/Vimeo)</option>
                          <option value="presentation">Google Slides</option>
                          <option value="document">Documento PDF</option>
                          <option value="html_video">Video HTML5 o Código HTML</option>
                          <option value="link">Enlace Web Externo</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Categoría</label>
                        <select 
                          value={newCategory} 
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none"
                        >
                          <option value="Trámites y Visados">Trámites y Visados</option>
                          <option value="Impuestos y Autónomos">Impuestos y Autónomos</option>
                          <option value="Coworkings y Colivings">Coworkings y Colivings</option>
                          <option value="Herramientas Digitales">Herramientas Digitales</option>
                        </select>
                      </div>
                    </div>

                     {newType === 'document' ? (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Subir Archivo PDF *</label>
                        <div className="flex flex-col gap-2">
                          <input 
                            type="file" 
                            accept=".pdf"
                            id="pdf-upload-input"
                            onChange={handlePdfFileChange}
                            className="hidden"
                          />
                          <label 
                            htmlFor="pdf-upload-input"
                            className="w-full flex items-center justify-center gap-2 border border-dashed border-zinc-800 hover:border-indigo-500/80 bg-zinc-950/40 hover:bg-zinc-950 text-xs font-semibold text-zinc-400 hover:text-zinc-200 rounded-xl py-3 px-4 transition-all cursor-pointer text-center"
                          >
                            <Upload className="w-4 h-4 text-indigo-400" />
                            {newUrl && newUrl.startsWith('data:application/pdf') 
                              ? 'Cambiar archivo PDF' 
                              : 'Seleccionar PDF (Máx. 2.5MB)'}
                          </label>
                          {newUrl && newUrl.startsWith('data:application/pdf') && (
                            <div className="flex items-center justify-between bg-zinc-950 border border-zinc-850/60 px-3 py-1.5 rounded-lg text-[10px] text-zinc-400">
                              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" /> PDF Almacenado en BD
                              </span>
                              <span className="text-zinc-500">
                                (~{Math.round(newUrl.length / 1333)} KB)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                          {newType === 'html_video' ? 'Enlace o Código Embebido (HTML) *' : 'Enlace / URL *'}
                        </label>
                        <input 
                          type="text" 
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          placeholder={
                            newType === 'html_video' 
                              ? "Ej. <iframe... o url directa .mp4" 
                              : newType === 'presentation'
                              ? "Ej. https://docs.google.com/presentation/d/..."
                              : "https://..."
                          }
                          className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none"
                        />
                        <span className="text-[10px] text-zinc-500 block mt-1.5 leading-tight">
                          {newType === 'html_video' 
                            ? "Pega código iframe, tag <video>, o una URL directa finalizando en .mp4/.webm."
                            : newType === 'presentation'
                            ? "Soporta enlaces normales y enlaces de inserción de Google Slides."
                            : "Coloca la URL completa para el recurso."}
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Descripción *</label>
                      <textarea 
                        rows="3"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="Explica qué contiene el recurso..."
                        className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Etiquetas (separadas por comas)</label>
                      <span className="text-[10px] text-zinc-500 block mb-2">Ej: Visado, Hacienda, Impuestos</span>
                      <input 
                        type="text" 
                        value={newTags}
                        onChange={(e) => setNewTags(e.target.value)}
                        placeholder="Visado, Trámites, España"
                        className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      {editingResourceId && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl py-2.5 px-4 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {isSubmitting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            {editingResourceId ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {editingResourceId ? 'Guardar Cambios' : 'Crear Contenido'}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Listado de Contenidos (2 Columnas) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-800/60">
                      <h3 className="text-base font-bold text-zinc-100">Directorio de Recursos</h3>
                      <p className="text-xs text-zinc-550">Listado completo de documentos, videos y guías.</p>
                    </div>

                    <div className="divide-y divide-zinc-800/60 bg-zinc-900">
                      {paginatedResources.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 text-xs">
                          No hay recursos formativos registrados en este momento.
                        </div>
                      ) : (
                        paginatedResources.map(resource => (
                          <div key={resource.id} className="p-5 flex items-start justify-between gap-4 hover:bg-zinc-850/30 transition-colors">
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-850 block">
                                  {resourceIcon(resource.type)}
                                </span>
                                <span className="text-xs font-medium text-zinc-405 bg-zinc-800/60 px-2 py-0.5 rounded-md border border-zinc-700/30">
                                  {resource.category}
                                </span>
                                <span className="text-[10px] text-zinc-505 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(resource.created_at).toLocaleDateString('es-ES')}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-zinc-200 truncate">{resource.title}</h4>
                              <p className="text-xs text-zinc-400 line-clamp-2">{resource.description}</p>
                              
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {resource.tags && resource.tags.map((tag, i) => (
                                  <span key={i} className="text-[10px] bg-zinc-950 text-zinc-500 border border-zinc-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Tag className="w-2.5 h-2.5" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <a 
                                href={resource.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="p-2 text-zinc-500 hover:text-zinc-350 bg-zinc-950 border border-zinc-800/60 hover:border-zinc-700 rounded-xl transition-all"
                                title="Abrir recurso"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleStartEditResource(resource)}
                                className="p-2 text-indigo-500 hover:text-indigo-450 bg-indigo-950/20 border border-indigo-900/20 hover:border-indigo-850/45 rounded-xl transition-all cursor-pointer"
                                title="Editar recurso"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteResource(resource.id)}
                                className="p-2 text-red-500 hover:text-red-400 bg-red-950/20 border border-red-900/20 hover:border-red-800/45 rounded-xl transition-all cursor-pointer"
                                title="Eliminar recurso"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Controles de paginación para recursos */}
                    {totalResourcesPages > 1 && (
                      <div className="px-6 py-4 bg-zinc-900/60 border-t border-zinc-800/60 flex items-center justify-between text-xs">
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
                </div>

              </div>
            )}

            {activeTab === 'users' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Formulario/Detalle Lateral (1 Columna) */}
                <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-6 lg:sticky lg:top-24">
                  {showCreateUserForm ? (
                    <div>
                      <h3 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-indigo-500" />
                        Registrar Nuevo Usuario
                      </h3>

                      {userError && (
                        <div className="mb-4 p-3 bg-red-950/40 border border-red-800/40 text-red-200 text-xs rounded-xl flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                          <span>{userError}</span>
                        </div>
                      )}

                      {userSuccess && (
                        <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/40 text-emerald-250 text-xs rounded-xl flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                          <span>{userSuccess}</span>
                        </div>
                      )}

                      <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Nombre Completo *</label>
                            <input 
                              type="text" 
                              value={uName}
                              onChange={(e) => setUName(e.target.value)}
                              placeholder="Ej. Sofía Laurent"
                              required
                              className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-4 py-2 text-xs text-zinc-100 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Correo Electrónico *</label>
                            <input 
                              type="email" 
                              value={uEmail}
                              onChange={(e) => setUEmail(e.target.value)}
                              placeholder="sofia@correo.com"
                              required
                              className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-4 py-2 text-xs text-zinc-100 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Contraseña *</label>
                            <input 
                              type="password" 
                              value={uPassword}
                              onChange={(e) => setUPassword(e.target.value)}
                              placeholder="Mín. 6 caracteres"
                              required
                              className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-4 py-2 text-xs text-zinc-100 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Rol</label>
                            <select 
                              value={uRole} 
                              onChange={(e) => setURole(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-xs text-zinc-250 focus:outline-none"
                            >
                              <option value="student">Nómada (Estudiante)</option>
                              <option value="admin">Administrador</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Pasaporte</label>
                            <input 
                              type="text" 
                              value={uPassport}
                              onChange={(e) => setUPassport(e.target.value)}
                              placeholder="PA000000"
                              className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-4 py-2 text-xs text-zinc-100 focus:outline-none"
                            />
                          </div>
                        </div>

                        {uRole === 'student' && (
                          <div className="space-y-4 border-t border-zinc-800/60 pt-4">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Datos de Residencia y Fiscalidad</span>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">NIE</label>
                                <input 
                                  type="text" 
                                  value={uNie}
                                  onChange={(e) => setUNie(e.target.value)}
                                  placeholder="Y1234567-X"
                                  className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-4 py-2 text-xs text-zinc-100 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Fecha Llegada España</label>
                                <input 
                                  type="date" 
                                  value={uArrivalDate}
                                  onChange={(e) => setUArrivalDate(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-3 py-1.5 text-xs text-zinc-250 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-2">
                                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Dirección en España</label>
                                  <input 
                                    type="text" 
                                    value={uAddress}
                                    onChange={(e) => setUAddress(e.target.value)}
                                    placeholder="Calle Mayor 45, 1A"
                                    className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-4 py-2 text-xs text-zinc-100 focus:outline-none"
                                  />
                              </div>

                              <div>
                                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">C. Postal</label>
                                  <input 
                                    type="text" 
                                    value={uPostalCode}
                                    onChange={(e) => setUPostalCode(e.target.value)}
                                    placeholder="28013"
                                    maxLength="5"
                                    className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-4 py-2 text-xs text-zinc-100 focus:outline-none"
                                  />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Alta en AEAT</label>
                                <input 
                                  type="date" 
                                  value={uAeatDate}
                                  onChange={(e) => setUAeatDate(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-3 py-1.5 text-xs text-zinc-250 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Alta Seg. Social</label>
                                <input 
                                  type="date" 
                                  value={uSsDate}
                                  onChange={(e) => setUSsDate(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-3 py-1.5 text-xs text-zinc-250 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={creatingUser}
                          className="w-full bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                        >
                          {creatingUser ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Registrar Usuario
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  ) : (
                    // PANEL DE DETALLES DEL USUARIO SELECCIONADO
                    selectedUser && (
                      <div className="space-y-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20`}>
                              {selectedUser.role === 'admin' ? 'Administrador' : 'Nómada'}
                            </span>
                            <h3 className="text-lg font-bold text-zinc-100 mt-1">{selectedUser.name}</h3>
                            <p className="text-xs text-zinc-500 truncate">{selectedUser.email}</p>
                          </div>
                          
                          <button
                            onClick={() => {
                              setSelectedUser(null);
                              setShowCreateUserForm(true);
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                          >
                            Volver a Crear
                          </button>
                        </div>

                        {/* Datos Físicos de Identidad */}
                        <div className="p-4 bg-zinc-950 border border-zinc-800/60 rounded-xl space-y-2 text-xs">
                          <h4 className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" /> Documentos de Identidad
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-zinc-300">
                            <div><span className="text-zinc-550 block text-[9px]">Pasaporte:</span> {selectedUser.passport || 'No registrado'}</div>
                            <div><span className="text-zinc-550 block text-[9px]">NIE:</span> {selectedUser.nie || 'No registrado'}</div>
                          </div>
                          {selectedUser.address && (
                            <div className="pt-2 border-t border-zinc-800/60 flex items-start gap-1 text-zinc-350">
                              <MapPin className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-zinc-550 block text-[9px]">Dirección Fiscal:</span>
                                {selectedUser.address} (C.P. {selectedUser.postalCode})
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Calculadora Fiscal del Nómada */}
                        {selectedUser.role === 'student' && (
                          <>
                            <div className="p-4 bg-zinc-950 border border-zinc-800/60 rounded-xl space-y-3">
                              <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center justify-between">
                                <span>Control Residencia Fiscal</span>
                                <span className="text-[9px] text-zinc-500 capitalize">Regla 183 días</span>
                              </h4>

                              {selectedUser.arrivalDate ? (
                                <div>
                                  <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-zinc-400">Días Efectivos en España</span>
                                    <span className="text-white">
                                      {calculateResidencyDays(selectedUser.arrivalDate, selectedUser.absences)} / 183 días
                                    </span>
                                  </div>
                                  
                                  {/* Progress bar */}
                                  <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/60">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        calculateResidencyDays(selectedUser.arrivalDate, selectedUser.absences) >= 183
                                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                          : 'bg-gradient-to-r from-indigo-500 to-indigo-650'
                                      }`}
                                      style={{ width: `${Math.min(100, (calculateResidencyDays(selectedUser.arrivalDate, selectedUser.absences) / 183) * 100)}%` }}
                                    ></div>
                                  </div>

                                  <div className="flex justify-between text-[10px] text-zinc-500 mt-2">
                                    <span>Llegada: {new Date(selectedUser.arrivalDate).toLocaleDateString('es-ES')}</span>
                                    <span>Ausencias: {selectedUser.absences || 0} días</span>
                                  </div>

                                  {/* Resident state banner */}
                                  <div className={`mt-3 p-2.5 rounded-xl border text-center font-bold text-xs ${
                                    calculateResidencyDays(selectedUser.arrivalDate, selectedUser.absences) >= 183
                                      ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30'
                                      : 'bg-indigo-950/20 text-indigo-405 border-indigo-900/30'
                                  }`}>
                                    {calculateResidencyDays(selectedUser.arrivalDate, selectedUser.absences) >= 183
                                      ? 'Residente Fiscal en España'
                                      : 'No Residente Fiscal (aún)'}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-zinc-500 text-center py-2">
                                  Sin fecha de llegada registrada para calcular la residencia.
                                </div>
                              )}
                            </div>

                            {/* Hitos Administrativos */}
                            <div className="p-4 bg-zinc-950 border border-zinc-800/60 rounded-xl space-y-3 text-xs">
                              <h4 className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest mb-1">Hitos de Autónomo</h4>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between items-center py-1 border-b border-zinc-900">
                                  <span className="text-zinc-400">Alta en AEAT (Hacienda):</span>
                                  {selectedUser.aeatDate ? (
                                    <span className="text-emerald-400 font-semibold">{new Date(selectedUser.aeatDate).toLocaleDateString('es-ES')}</span>
                                  ) : (
                                    <span className="text-zinc-550 font-medium">Pendiente</span>
                                  )}
                                </div>
                                <div className="flex justify-between items-center py-1">
                                  <span className="text-zinc-400">Alta Seguridad Social:</span>
                                  {selectedUser.ssDate ? (
                                    <span className="text-emerald-400 font-semibold">{new Date(selectedUser.ssDate).toLocaleDateString('es-ES')}</span>
                                  ) : (
                                    <span className="text-zinc-550 font-medium">Pendiente</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Descargador de Documentos Extranjería */}
                            <div className="p-4 bg-zinc-950 border border-zinc-800/60 rounded-xl text-xs space-y-2">
                              <h4 className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest mb-1">Expediente Extranjería</h4>
                              {selectedUser.residencyDoc ? (
                                <div className="flex items-center justify-between p-2.5 bg-zinc-900 border border-zinc-850 rounded-xl">
                                  <div className="truncate pr-2">
                                    <p className="font-bold text-zinc-200 truncate">{selectedUser.residencyDoc.name}</p>
                                    <p className="text-[9px] text-zinc-500 mt-0.5">{selectedUser.residencyDoc.size} • Sido el {new Date(selectedUser.residencyDoc.uploadedAt).toLocaleDateString('es-ES')}</p>
                                  </div>
                                  <button
                                    onClick={() => triggerDocDownload(selectedUser.residencyDoc.name)}
                                    className="p-1.5 text-indigo-400 hover:text-indigo-300 bg-indigo-950/20 border border-indigo-900/30 rounded-lg hover:scale-105 transition-all cursor-pointer flex items-center justify-center"
                                    title="Descargar PDF"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="py-3 text-center text-zinc-550 text-xs flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl">
                                  <FileText className="w-5 h-5 mb-1.5 text-zinc-700" />
                                  El estudiante no ha subido su resolución de residencia todavía.
                                </div>
                              )}
                            </div>

                            {/* Control de Entrenamientos Autorizados */}
                            <div className="p-4 bg-zinc-950 border border-zinc-800/60 rounded-xl text-xs space-y-3">
                              <h4 className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest mb-1 flex items-center justify-between">
                                <span>Entrenamientos Autorizados</span>
                                <span className="text-[9px] text-indigo-400 font-semibold lowercase">Toca para habilitar</span>
                              </h4>
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                                {resources.map(res => {
                                  const isAllowed = (selectedUser.allowedResources || []).includes(res.id);
                                  return (
                                    <label 
                                      key={res.id} 
                                      className="flex items-start gap-2.5 p-2 bg-zinc-900/60 border border-zinc-850 hover:border-zinc-800 rounded-lg cursor-pointer transition-all hover:bg-zinc-850/20"
                                    >
                                      <input 
                                        type="checkbox"
                                        checked={isAllowed}
                                        onChange={async () => {
                                          const currentAllowed = selectedUser.allowedResources || [];
                                          const newAllowed = isAllowed 
                                            ? currentAllowed.filter(id => id !== res.id)
                                            : [...currentAllowed, res.id];
                                          
                                          // Update database
                                          await mockDb.users.update(selectedUser.id, { allowedResources: newAllowed });
                                          
                                          // Reload users list to keep state in sync
                                          const updatedUsers = await mockDb.users.getAll();
                                          setUsers(updatedUsers);
                                          
                                          // Update local selectedUser state
                                          setSelectedUser(prev => ({
                                            ...prev,
                                            allowedResources: newAllowed
                                          }));
                                        }}
                                        className="mt-0.5 rounded border-zinc-800 bg-zinc-950 text-indigo-650 focus:ring-indigo-500/30"
                                      />
                                      <div className="overflow-hidden">
                                        <p className="font-bold text-zinc-300 truncate">{res.title}</p>
                                        <p className="text-[9px] text-zinc-500 mt-0.5 truncate">{res.category}</p>
                                      </div>
                                    </label>
                                  );
                                })}
                                {resources.length === 0 && (
                                  <p className="text-zinc-500 text-center py-2">No hay entrenamientos cargados en el sistema.</p>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  )}
                </div>

                {/* Listado de Usuarios Registrados (2 Columnas) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-800/60 flex justify-between items-center">
                      <div>
                        <h3 className="text-base font-bold text-zinc-100">Usuarios Registrados</h3>
                        <p className="text-xs text-zinc-500">Administra accesos y visualiza la fiscalidad de cada estudiante.</p>
                      </div>
                      <span className="text-xs font-semibold text-zinc-400 bg-zinc-950 border border-zinc-800/60 px-3 py-1 rounded-full">
                        {totalRegisteredUsers} en total
                      </span>
                    </div>

                    <div className="divide-y divide-zinc-800/60 bg-zinc-900">
                      {paginatedUsers.map(u => {
                        const effectiveDays = calculateResidencyDays(u.arrivalDate, u.absences);
                        return (
                          <div 
                            key={u.id} 
                            onClick={() => {
                              setSelectedUser(u);
                              setShowCreateUserForm(false);
                            }}
                            className={`p-5 flex items-center justify-between gap-4 hover:bg-zinc-850/30 transition-colors cursor-pointer ${
                              selectedUser?.id === u.id ? 'bg-zinc-805/40 border-l-2 border-indigo-505' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border bg-indigo-950/20 text-indigo-400 border-indigo-900/20`}>
                                {u.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-zinc-200 truncate">{u.name}</h4>
                                  <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20`}>
                                    {u.role === 'admin' ? 'Admin' : 'Nómada'}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                              </div>
                            </div>

                            {/* Información compacta fiscal o rol */}
                            <div className="flex items-center gap-4 shrink-0 text-xs">
                              {u.role === 'student' && (
                                <div className="text-right hidden sm:block">
                                  {u.arrivalDate ? (
                                    <>
                                      <p className="font-bold text-zinc-350">{effectiveDays} / 183 días</p>
                                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                        effectiveDays >= 183 
                                          ? 'bg-emerald-950 text-emerald-450 border border-emerald-900/30' 
                                          : 'bg-zinc-950 text-zinc-500 border border-zinc-800/60'
                                      }`}>
                                        {effectiveDays >= 183 ? 'Residente Fiscal' : 'No Residente'}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-zinc-550">Sin datos de viaje</span>
                                  )}
                                </div>
                              )}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Evitar seleccionar el usuario
                                  handleDeleteUser(u.id, u.name);
                                }}
                                className="p-2 text-red-500 hover:text-red-400 bg-red-950/20 border border-red-900/20 hover:border-red-800/40 rounded-xl transition-all cursor-pointer"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Controles de paginación para usuarios */}
                    {totalUsersPages > 1 && (
                      <div className="px-6 py-4 bg-zinc-900/60 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                        <button
                          onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                          disabled={currentUsersPage === 1}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                        >
                          Anterior
                        </button>
                        <span className="text-zinc-400">
                          Página <span className="text-zinc-200 font-semibold">{currentUsersPage}</span> de <span className="text-zinc-200 font-semibold">{totalUsersPages}</span>
                        </span>
                        <button
                          onClick={() => setUsersPage(prev => Math.min(totalUsersPages, prev + 1))}
                          disabled={currentUsersPage === totalUsersPages}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800/60 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-zinc-100">Bandeja de Consultas</h3>
                    <p className="text-xs text-zinc-500">Respuestas y soporte para los nómadas digitales.</p>
                  </div>
                  <span className="text-xs font-semibold text-zinc-400 bg-zinc-950 border border-zinc-800/60 px-3 py-1 rounded-full">
                    {pendingMessages} pendientes
                  </span>
                </div>

                <div className="divide-y divide-zinc-800/60 bg-zinc-900">
                  {paginatedMessages.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs">
                      No hay mensajes en el canal de comunicación en este momento.
                    </div>
                  ) : (
                    paginatedMessages.map(msg => (
                      <div key={msg.id} className="p-6 space-y-4 hover:bg-zinc-850/30 transition-colors">
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-950/40 border border-indigo-900/20 flex items-center justify-center font-bold text-xs text-indigo-400">
                              {msg.sender_name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-zinc-200">{msg.sender_name}</p>
                              <p className="text-[10px] text-zinc-500">Estudiante Nómada</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500">
                              {new Date(msg.created_at).toLocaleString('es-ES')}
                            </span>
                            {msg.reply ? (
                              <span className="text-[10px] text-emerald-455 bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Respondido
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-455 bg-amber-950/40 border border-amber-900/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-amber-400" />
                                Pendiente
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-4 bg-zinc-950 border border-zinc-800/60 rounded-2xl">
                          <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                            {msg.content}
                          </p>
                        </div>

                        {msg.reply ? (
                          <div className="p-4 bg-indigo-950/20 border border-indigo-900/20 rounded-2xl space-y-1.5 ml-6">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                              <span>Tu Respuesta</span>
                            </div>
                            <p className="text-xs text-indigo-200/90 leading-relaxed">
                              {msg.reply}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3 ml-6">
                            <div className="relative">
                              <textarea
                                value={replyText[msg.id] || ''}
                                onChange={(e) => handleReplyChange(msg.id, e.target.value)}
                                rows="2"
                                placeholder="Escribe tu respuesta oficial como administrador..."
                                className="w-full bg-zinc-950 border border-zinc-800/60 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none resize-none pr-10"
                              />
                              <button
                                onClick={() => handleSendReply(msg.id)}
                                disabled={submittingReply[msg.id] || !(replyText[msg.id] && replyText[msg.id].trim())}
                                className="absolute right-3.5 bottom-3.5 text-indigo-500 hover:text-indigo-400 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                              >
                                {submittingReply[msg.id] ? (
                                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    ))
                  )}
                </div>

                {/* Controles de paginación para bandeja de mensajes */}
                {totalMessagesPages > 1 && (
                  <div className="px-6 py-4 bg-zinc-900/60 border-t border-zinc-800/60 flex items-center justify-between text-xs">
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
            )}
          </div>
        )}
      </main>
    </div>
  );
}
