/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { mockDb } from '../utils/mockDb';
import { 
  ExternalLink, Video, Presentation, FileText, Code
} from 'lucide-react';

// Import refactored components
import AdminSidebar from '../features/admin/AdminSidebar';
import MetricsOverview from '../features/admin/MetricsOverview';
import ResourceUploader from '../features/admin/ResourceUploader';
import UserManagementTable from '../features/admin/UserManagementTable';
import MessagesPanel from '../features/admin/MessagesPanel';

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
  const [previewResource, setPreviewResource] = useState(null);

  // States for replies
  const [replyText, setReplyText] = useState({});
  const [submittingReply, setSubmittingReply] = useState({});

  // States for User Assignment in Content Creation Form
  const [selectedAssignUserIds, setSelectedAssignUserIds] = useState([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

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
  const [editingUserId, setEditingUserId] = useState(null);
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
      let savedResource;
      if (editingResourceId) {
        // Modo Edición
        savedResource = await mockDb.resources.update(editingResourceId, {
          title: newTitle,
          type: newType,
          url: newUrl,
          description: newDesc,
          category: newCategory,
          tags: newTags ? newTags.split(',').map(t => t.trim()) : []
        });
        setFormSuccess('¡Recurso formativo actualizado con éxito!');
        setEditingResourceId(null);
      } else {
        // Modo Creación
        savedResource = await mockDb.resources.create({
          title: newTitle,
          type: newType,
          url: newUrl,
          description: newDesc,
          category: newCategory,
          tags: newTags ? newTags.split(',').map(t => t.trim()) : []
        });
        setFormSuccess('¡Recurso formativo creado con éxito!');
      }

      const resourceId = savedResource.id;

      // Sincronizar asignación de entrenamientos autorizados en los perfiles de los estudiantes
      const allStudents = users.filter(u => u.role === 'student');
      const updatePromises = allStudents.map(async (student) => {
        const isSelected = selectedAssignUserIds.includes(student.id);
        const hasAccess = (student.allowedResources || []).includes(resourceId);
        
        if (isSelected && !hasAccess) {
          const newAllowed = [...(student.allowedResources || []), resourceId];
          return mockDb.users.update(student.id, { allowedResources: newAllowed });
        } else if (!isSelected && hasAccess) {
          const newAllowed = (student.allowedResources || []).filter(id => id !== resourceId);
          return mockDb.users.update(student.id, { allowedResources: newAllowed });
        }
      });
      await Promise.all(updatePromises);

      // Limpiar estados
      setNewTitle('');
      setNewUrl('');
      setNewDesc('');
      setNewTags('');
      setNewType('document');
      setNewCategory('Trámites y Visados');
      setSelectedAssignUserIds([]);
      setStudentSearchQuery('');
      
      const updated = await mockDb.resources.getAll();
      setResources(updated);
      
      // Recargar lista de usuarios para mantener sincronizada la vista lateral de detalles
      const updatedUsers = await mockDb.users.getAll();
      setUsers(updatedUsers);
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
    
    // Cargar estudiantes que ya tienen este entrenamiento asignado
    const studentsWithAccess = users
      .filter(u => u.role === 'student' && (u.allowedResources || []).includes(resource.id))
      .map(u => u.id);
    setSelectedAssignUserIds(studentsWithAccess);
    setStudentSearchQuery('');

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
    setSelectedAssignUserIds([]);
    setStudentSearchQuery('');
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

    if (editingUserId) {
      if (!uEmail.trim() || !uName.trim()) {
        setUserError('Nombre y Correo son campos obligatorios.');
        return;
      }
    } else {
      if (!uEmail.trim() || !uPassword.trim() || !uName.trim()) {
        setUserError('Nombre, Correo y Contraseña son campos obligatorios.');
        return;
      }

      if (uPassword.length < 6) {
        setUserError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
    }

    setCreatingUser(true);
    try {
      if (editingUserId) {
        // Modo Edición
        const updated = await mockDb.users.update(editingUserId, {
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

        // Limpiar formulario y cerrar edición
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

        setUserSuccess('¡Usuario actualizado correctamente!');
        setEditingUserId(null);
        setSelectedUser(updated); // Actualizar panel de detalles
        setShowCreateUserForm(false);
      } else {
        // Modo Creación
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
      }
      
      // Recargar lista de usuarios
      const updatedList = await mockDb.users.getAll();
      setUsers(updatedList);
    } catch (err) {
      setUserError(err.message);
    } finally {
      setCreatingUser(false);
    }
  };

  // Handler para iniciar edición de usuario
  const handleStartEditUser = (userToEdit) => {
    setEditingUserId(userToEdit.id);
    setUName(userToEdit.name || '');
    setUEmail(userToEdit.email || '');
    setUPassword(''); // La contraseña no se edita aquí
    setURole(userToEdit.role || 'student');
    setUPassport(userToEdit.passport || '');
    setUNie(userToEdit.nie || '');
    setUAddress(userToEdit.address || '');
    setUPostalCode(userToEdit.postalCode || '');
    setUArrivalDate(userToEdit.arrivalDate || '');
    setUAeatDate(userToEdit.aeatDate || '');
    setUSsDate(userToEdit.ssDate || '');
    
    setUserError('');
    setUserSuccess('');
    setShowCreateUserForm(true);
  };

  // Handler para cancelar edición de usuario
  const handleCancelEditUser = () => {
    setEditingUserId(null);
    setUName('');
    setUEmail('');
    setUPassword('');
    setURole('student');
    setUPassport('');
    setUNie('');
    setUAddress('');
    setUPostalCode('');
    setUArrivalDate('');
    setUAeatDate('');
    setUSsDate('');
    setUserError('');
    setUserSuccess('');
    
    if (selectedUser) {
      setShowCreateUserForm(false);
    }
  };

  const renderPreviewPlayer = () => {
    if (!previewResource) return null;

    let embedUrl = previewResource.url || '';
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
    else if (previewResource.type === 'document' || embedUrl.toLowerCase().endsWith('.pdf') || embedUrl.toLowerCase().includes('.pdf?')) {
      isEmbeddable = true;
    }
    // Detect direct video
    else if (embedUrl.toLowerCase().endsWith('.mp4') || embedUrl.toLowerCase().endsWith('.webm') || embedUrl.toLowerCase().endsWith('.ogg')) {
      isVideoTag = true;
    }

    // Extract iframe src if raw HTML is pasted
    if (previewResource.type === 'html_video' || embedUrl.trim().startsWith('<')) {
      const srcMatch = embedUrl.match(/src=["'](.*?)["']/);
      if (srcMatch && srcMatch[1]) {
        embedUrl = srcMatch[1];
        isEmbeddable = true;
      }
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
        <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="h-14 border-b border-zinc-850 px-6 flex items-center justify-between bg-zinc-950/40 shrink-0 font-mono text-xs uppercase">
            <div>
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider bg-indigo-950/45 border border-indigo-500/25 px-2 py-1 rounded-md">
                VISTA PREVIA ADMIN
              </span>
              <h3 className="text-xs font-bold text-zinc-350 mt-2.5 truncate max-w-lg">{previewResource.title}</h3>
            </div>
            <button 
              onClick={() => setPreviewResource(null)}
              className="text-[10px] text-zinc-400 hover:text-zinc-200 font-bold bg-zinc-900 hover:bg-zinc-800 border border-zinc-805 px-3 py-2 rounded-lg cursor-pointer transition-colors"
            >
              CERRAR VISTA PREVIA
            </button>
          </div>

          <div className="flex-1 bg-black overflow-hidden relative flex items-center justify-center">
            {isEmbeddable ? (
              <iframe 
                src={embedUrl}
                title={previewResource.title}
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
              <div className="max-w-md w-full bg-zinc-900 border border-zinc-800/80 rounded-2xl p-8 text-center space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-950/60 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto shadow-[0_0_12px_rgba(0,242,254,0.1)]">
                  <ExternalLink className="w-6 h-6" />
                </div>
                <div className="space-y-2 font-mono">
                  <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Enlace Externo Recomendado</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed font-sans font-medium">
                    Este tipo de recurso no se puede incrustar por restricciones de seguridad externas.
                  </p>
                </div>
                <a 
                  href={previewResource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 py-2.5 px-6 bg-indigo-650 hover:bg-indigo-600 text-zinc-950 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_10px_rgba(0,242,254,0.15)]"
                >
                  Abrir enlace en pestaña nueva
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
          
          <div className="h-14 border-t border-zinc-850 px-6 flex items-center justify-between bg-zinc-950/40 shrink-0 font-mono text-[10px] text-zinc-550 uppercase tracking-widest">
            <span>TIPO: <strong className="text-zinc-350">{previewResource.type}</strong></span>
            <span>CATEGORÍA: <strong className="text-zinc-350">{previewResource.category}</strong></span>
          </div>
        </div>
      </div>
    );
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
      case 'video': return <Video className="w-4 h-4 text-rose-450" />;
      case 'presentation': return <Presentation className="w-4 h-4 text-amber-400" />;
      case 'document': return <FileText className="w-4 h-4 text-sky-400" />;
      case 'html_video': return <Code className="w-4 h-4 text-emerald-450" />;
      case 'link': return <ExternalLink className="w-4 h-4 text-indigo-400" />;
      default: return <FileText className="w-4 h-4 text-zinc-400" />;
    }
  };

  if (!user) return null;

  return (
    <div className="h-screen overflow-hidden bg-zinc-950 flex flex-col md:flex-row text-zinc-100 font-sans cyber-grid">
      
      <AdminSidebar 
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        logout={logout}
        pendingMessages={pendingMessages}
      />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-100 font-mono">
            {activeTab === 'overview' && 'SYSTEM SUMMARY // OVERVIEW'}
            {activeTab === 'content' && 'CONTENT MANAGEMENT // ARCHIVE'}
            {activeTab === 'users' && 'USER ADMINISTRATION // ROLES'}
            {activeTab === 'messages' && 'COMMUNICATION HUB // SUPPORT TICKET'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-[10px] text-indigo-400 bg-indigo-950/40 border border-indigo-500/25 px-3 py-1.5 rounded-xl font-bold font-mono uppercase tracking-wider hidden sm:inline-block shadow-[0_0_10px_rgba(0,242,254,0.05)]">
              Modo Administrador
            </div>
            <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-850">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-indigo-400 text-xs font-mono shadow-sm">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-zinc-200 leading-none">{user?.name}</p>
                <p className="text-[9px] text-zinc-550 mt-1 uppercase tracking-wider font-bold font-mono leading-none">Administrador</p>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-zinc-950">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-xs text-zinc-550 font-mono uppercase tracking-wider">Loading Database...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto no-scrollbar">
            
            {activeTab === 'overview' && (
              <MetricsOverview 
                setActiveTab={setActiveTab}
                totalStudents={totalStudents}
                totalResources={totalResources}
                pendingMessages={pendingMessages}
                totalAdmins={totalAdmins}
                users={users}
                calculateResidencyDays={calculateResidencyDays}
                messages={messages}
              />
            )}

            {activeTab === 'content' && (
              <ResourceUploader 
                editingResourceId={editingResourceId}
                handleAddResource={handleAddResource}
                formError={formError}
                formSuccess={formSuccess}
                isSubmitting={isSubmitting}
                newTitle={newTitle} setNewTitle={setNewTitle}
                newType={newType} setNewType={setNewType}
                newUrl={newUrl} setNewUrl={setNewUrl}
                newDesc={newDesc} setNewDesc={setNewDesc}
                newCategory={newCategory} setNewCategory={setNewCategory}
                newTags={newTags} setNewTags={setNewTags}
                handlePdfFileChange={handlePdfFileChange}
                handleCancelEdit={handleCancelEdit}
                selectedAssignUserIds={selectedAssignUserIds} setSelectedAssignUserIds={setSelectedAssignUserIds}
                studentSearchQuery={studentSearchQuery} setStudentSearchQuery={setStudentSearchQuery}
                users={users}
                resources={resources}
                setPreviewResource={setPreviewResource}
                handleStartEditResource={handleStartEditResource}
                handleDeleteResource={handleDeleteResource}
                resourceIcon={resourceIcon}
              />
            )}

            {activeTab === 'users' && (
              <UserManagementTable 
                editingUserId={editingUserId}
                handleCreateUser={handleCreateUser}
                uName={uName} setUName={setUName}
                uEmail={uEmail} setUEmail={setUEmail}
                uPassword={uPassword} setUPassword={setUPassword}
                uRole={uRole} setURole={setURole}
                uPassport={uPassport} setUPassport={setUPassport}
                uNie={uNie} setUNie={setUNie}
                uArrivalDate={uArrivalDate} setUArrivalDate={setUArrivalDate}
                uAddress={uAddress} setUAddress={setUAddress}
                uPostalCode={uPostalCode} setUPostalCode={setUPostalCode}
                uAeatDate={uAeatDate} setUAeatDate={setUAeatDate}
                uSsDate={uSsDate} setUSsDate={setUSsDate}
                userError={userError}
                userSuccess={userSuccess}
                creatingUser={creatingUser}
                handleCancelEditUser={handleCancelEditUser}
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
                handleStartEditUser={handleStartEditUser}
                calculateResidencyDays={calculateResidencyDays}
                triggerDocDownload={triggerDocDownload}
                resources={resources}
                setUsers={setUsers}
                users={users}
                handleDeleteUser={handleDeleteUser}
              />
            )}

            {activeTab === 'messages' && (
              <MessagesPanel 
                pendingMessages={pendingMessages}
                messages={messages}
                replyText={replyText}
                handleReplyChange={handleReplyChange}
                handleSendReply={handleSendReply}
                submittingReply={submittingReply}
              />
            )}
            
            {renderPreviewPlayer()}
          </div>
        )}
      </main>
    </div>
  );
}
