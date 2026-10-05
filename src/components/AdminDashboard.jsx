import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { calculateResidencyDays } from '../lib/residency';
import AdminSidebar from '../features/admin/AdminSidebar';
import MetricsOverview from '../features/admin/MetricsOverview';
import ResourceUploader from '../features/admin/ResourceUploader';
import UserManagementTable from '../features/admin/UserManagementTable';
import MessagesPanel from '../features/admin/MessagesPanel';
import ResourcePlayer from '../features/resources/ResourcePlayer';
import { ResourceIcon } from '../features/resources/resourceMeta';
import ErrorBanner from './ErrorBanner';

const DEFAULT_CATEGORY = 'Trámites y Visados';
const MIN_PASSWORD_LENGTH = 10;

// Los PDF subidos a Storage guardan este marcador en `url` (columna NOT NULL);
// el archivo real se sirve con una URL firmada a partir de `storage_path`.
const storageMarker = (path) => `storage:academy-resources/${path}`;

const resourceIcon = (type) => <ResourceIcon type={type} size="w-4 h-4" />;

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'content', 'messages', 'users'

  // Datos
  const [resources, setResources] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  // Mensajes del ticket seleccionado (guardados junto a su id para saber si están cargados)
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [messagesState, setMessagesState] = useState({ ticketId: null, messages: [] });
  const ticketMessages = selectedTicketId && messagesState.ticketId === selectedTicketId ? messagesState.messages : [];
  const loadingMessages = Boolean(selectedTicketId) && messagesState.ticketId !== selectedTicketId;

  // Formulario de recursos
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('document');
  const [newUrl, setNewUrl] = useState('');
  const [newStoragePath, setNewStoragePath] = useState(null);
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState(DEFAULT_CATEGORY);
  const [newTags, setNewTags] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [previewResource, setPreviewResource] = useState(null);
  const [selectedAssignUserIds, setSelectedAssignUserIds] = useState([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Respuestas a tickets
  const [replyText, setReplyText] = useState({});
  const [submittingReply, setSubmittingReply] = useState({});

  // Gestión de usuarios
  const [selectedUser, setSelectedUser] = useState(null);
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

  // Carga inicial en paralelo
  useEffect(() => {
    let active = true;
    Promise.all([api.resources.getAll(), api.tickets.getAll(), api.users.getAll()])
      .then(([resList, ticketsList, usersList]) => {
        if (!active) return;
        setResources(resList);
        setTickets(ticketsList);
        setUsers(usersList);
      })
      .catch(e => {
        console.error('Error al cargar datos:', e);
        if (active) setActionError('No se pudieron cargar los datos del panel: ' + e.message);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedTicketId) return undefined;
    let active = true;
    api.tickets.getMessages(selectedTicketId)
      .then(messages => active && setMessagesState({ ticketId: selectedTicketId, messages }))
      .catch(err => {
        console.error('Error al cargar mensajes del ticket:', err);
        if (active) {
          setMessagesState({ ticketId: selectedTicketId, messages: [] });
          setActionError('No se pudieron cargar los mensajes del ticket.');
        }
      });
    return () => { active = false; };
  }, [selectedTicketId]);

  const flashFormSuccess = (message) => {
    setFormSuccess(message);
    setTimeout(() => setFormSuccess(''), 3000);
  };

  const resetResourceForm = () => {
    setEditingResourceId(null);
    setNewTitle('');
    setNewUrl('');
    setNewStoragePath(null);
    setNewDesc('');
    setNewTags('');
    setNewType('document');
    setNewCategory(DEFAULT_CATEGORY);
    setSelectedAssignUserIds([]);
    setStudentSearchQuery('');
    setNewImageUrl('');
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newTitle.trim() || !newUrl.trim() || !newDesc.trim()) {
      setFormError('Por favor completa los campos requeridos (Título, URL y Descripción).');
      return false;
    }

    const previous = editingResourceId ? resources.find(r => r.id === editingResourceId) : null;
    const keepsPreviousUrl = Boolean(previous) && newUrl === previous.url;
    const isUploadedPdf = newUrl.startsWith('storage:');

    // El archivo almacenado depende del tipo (bucket) y solo admite PDF subidos
    if (isUploadedPdf && newType !== 'document') {
      setFormError('El PDF subido solo puede usarse con el tipo Documento.');
      return false;
    }
    if (keepsPreviousUrl && previous.storage_path && newType !== previous.type) {
      setFormError('Este recurso tiene un archivo almacenado: para cambiar su tipo, sustituye antes el archivo o el enlace.');
      return false;
    }

    // Se conserva el archivo salvo que se haya subido otro o cambiado el enlace
    const storagePath = keepsPreviousUrl
      ? (previous.storage_path || null)
      : (isUploadedPdf && newUrl === storageMarker(newStoragePath) ? newStoragePath : null);
    const resourceData = {
      title: newTitle.trim(),
      type: newType,
      url: newUrl,
      description: newDesc.trim(),
      category: newCategory,
      tags: newTags,
      imageUrl: newImageUrl,
      storagePath
    };

    setIsSubmitting(true);
    try {
      const savedResource = editingResourceId
        ? await api.resources.update(editingResourceId, resourceData)
        : await api.resources.create(resourceData);

      // Asignación atómica en servidor: solo los alumnos seleccionados
      await api.resources.setAssignments(savedResource.id, selectedAssignUserIds);

      // Si se sustituyó el archivo o el enlace, el archivo anterior ya no se usa
      if (previous?.storage_path && previous.storage_path !== savedResource.storage_path) {
        await api.resources.removeFile(previous);
      }

      setFormSuccess(editingResourceId ? '¡Recurso formativo actualizado con éxito!' : '¡Recurso formativo creado con éxito!');
      resetResourceForm();

      const [updatedResources, updatedUsers] = await Promise.all([api.resources.getAll(), api.users.getAll()]);
      setResources(updatedResources);
      setUsers(updatedUsers);
      return true;
    } catch (err) {
      setFormError('Error al procesar el recurso: ' + err.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sube el PDF a Storage (bucket privado) en lugar de guardarlo en base64
  const handlePdfFileChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    setFormError('');
    setUploadingPdf(true);
    try {
      const path = await api.resources.uploadDocument(file);
      setNewStoragePath(path);
      setNewUrl(storageMarker(path));
      flashFormSuccess('¡Archivo PDF subido!');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    setUploadingImage(true);
    setFormError('');
    try {
      setNewImageUrl(await api.resources.uploadCover(file));
      flashFormSuccess('¡Imagen subida y asignada con éxito!');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleStartEditResource = (resource) => {
    setEditingResourceId(resource.id);
    setNewTitle(resource.title);
    setNewType(resource.type || 'document');
    setNewUrl(resource.url);
    setNewStoragePath(resource.storage_path || null);
    setNewDesc(resource.description);
    setNewCategory(resource.category || DEFAULT_CATEGORY);
    setNewTags(resource.tags ? resource.tags.join(', ') : '');
    setNewImageUrl(resource.image_url || '');

    // Alumnos que ya tienen este recurso asignado
    setSelectedAssignUserIds(
      users
        .filter(u => u.role === 'student' && (u.allowedResources || []).includes(resource.id))
        .map(u => u.id)
    );
    setStudentSearchQuery('');
    setFormError('');
    setFormSuccess('');

    document.getElementById('resource-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    resetResourceForm();
    setFormError('');
    setFormSuccess('');
  };

  const handleDeleteResource = async (resource) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este recurso formativo?')) return;
    try {
      await api.resources.delete(resource);
      const [updatedResources, updatedUsers] = await Promise.all([api.resources.getAll(), api.users.getAll()]);
      setResources(updatedResources);
      setUsers(updatedUsers);
      if (selectedUser) {
        setSelectedUser(updatedUsers.find(u => u.id === selectedUser.id) || null);
      }
    } catch (e) {
      setActionError('Error al borrar el recurso: ' + e.message);
    }
  };

  const handleSendReply = async (ticketId, attachment = null) => {
    const text = replyText[ticketId];
    if (!text || !text.trim()) return;

    setSubmittingReply(prev => ({ ...prev, [ticketId]: true }));
    try {
      const newMsg = await api.tickets.createMessage({
        ticket_id: ticketId,
        sender_id: user.id,
        content: text.trim(),
        attachment_url: attachment?.url || null,
        attachment_name: attachment?.name || null,
        attachment_type: attachment?.type || null
      });

      setReplyText(prev => ({ ...prev, [ticketId]: '' }));
      setMessagesState(prev => (
        prev.ticketId === ticketId ? { ...prev, messages: [...prev.messages, newMsg] } : prev
      ));
      setTickets(await api.tickets.getAll());
    } catch (e) {
      setActionError('Error al enviar la respuesta: ' + e.message);
    } finally {
      setSubmittingReply(prev => ({ ...prev, [ticketId]: false }));
    }
  };

  const handleCloseTicket = async (ticketId) => {
    if (!confirm('¿Estás seguro de que deseas cerrar este ticket y marcarlo como completado?')) return;
    try {
      await api.tickets.close(ticketId);
      setTickets(await api.tickets.getAll());
    } catch (e) {
      setActionError('Error al cerrar el ticket: ' + e.message);
    }
  };

  const handleReplyChange = (id, value) => {
    setReplyText(prev => ({ ...prev, [id]: value }));
  };

  const handleUploadAttachment = (file) => api.tickets.uploadAttachment(file, user.id);

  const resetUserForm = () => {
    setEditingUserId(null);
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
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!uEmail.trim() || !uName.trim()) {
      setUserError('Nombre y Correo son campos obligatorios.');
      return false;
    }
    if (!editingUserId && uPassword.length < MIN_PASSWORD_LENGTH) {
      setUserError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return false;
    }

    const profileData = {
      name: uName.trim(),
      role: uRole,
      passport: uPassport.trim() || null,
      nie: uNie.trim() || null,
      address: uAddress.trim() || null,
      postalCode: uPostalCode.trim() || null,
      arrivalDate: uArrivalDate || null,
      aeatDate: uAeatDate || null,
      ssDate: uSsDate || null
    };

    setCreatingUser(true);
    try {
      if (editingUserId) {
        const updated = await api.users.update(editingUserId, profileData);
        setUserSuccess('¡Usuario actualizado correctamente!');
        setSelectedUser(updated);
      } else {
        await api.users.create({ ...profileData, email: uEmail.trim(), password: uPassword });
        setUserSuccess('¡Usuario registrado correctamente!');
      }
      resetUserForm();
      setUsers(await api.users.getAll());
      return true;
    } catch (err) {
      setUserError(err.message);
      return false;
    } finally {
      setCreatingUser(false);
    }
  };

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
  };

  const handleCancelEditUser = () => {
    resetUserForm();
    setUserError('');
    setUserSuccess('');
  };

  const handleDeleteUser = async (id, name) => {
    if (id === user.id) {
      setActionError('No puedes eliminar tu propio usuario administrador en sesión.');
      return;
    }
    if (!confirm(`¿Estás seguro de que deseas eliminar el usuario "${name}"? Se borrarán su cuenta, su perfil y sus tickets. Esta acción es irreversible.`)) return;

    try {
      await api.users.delete(id);
      if (selectedUser?.id === id) setSelectedUser(null);
      setUsers(await api.users.getAll());
    } catch (e) {
      setActionError('Error al eliminar el usuario: ' + e.message);
    }
  };

  const openResidencyDoc = async (doc) => {
    try {
      const url = await api.residencyDocs.getUrl(doc);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setActionError(e.message);
    }
  };

  const renderPreviewPlayer = () => {
    if (!previewResource) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-main/90 backdrop-blur-md">
        <div className="bg-bg-card border border-border-main rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="h-14 border-b border-border-main px-6 flex items-center justify-between bg-bg-main/40 shrink-0 font-mono text-xs uppercase">
            <div>
              <span className="text-[9px] text-text-active font-bold uppercase tracking-wider bg-bg-active px-2 py-1 rounded-md border border-border-active">
                VISTA PREVIA ADMIN
              </span>
              <h3 className="text-xs font-bold text-text-title mt-2.5 truncate max-w-lg">{previewResource.title}</h3>
            </div>
            <button
              onClick={() => setPreviewResource(null)}
              className="text-[10px] text-text-muted hover:text-text-main font-bold bg-bg-input hover:bg-bg-card border border-border-main px-3 py-2 rounded-lg cursor-pointer transition-colors"
            >
              CERRAR VISTA PREVIA
            </button>
          </div>

          <div className="flex-1 bg-black overflow-hidden relative flex items-center justify-center">
            <ResourcePlayer resource={previewResource} userEmail={user.email} />
          </div>

          <div className="h-14 border-t border-border-main px-6 flex items-center justify-between bg-bg-main/40 shrink-0 font-mono text-[10px] text-text-muted uppercase tracking-widest">
            <span>TIPO: <strong className="text-text-title">{previewResource.type}</strong></span>
            <span>CATEGORÍA: <strong className="text-text-title">{previewResource.category}</strong></span>
          </div>
        </div>
      </div>
    );
  };

  // Métricas
  const totalResources = resources.length;
  const pendingMessages = tickets.filter(t => t.status === 'open').length;
  const totalStudents = users.filter(u => u.role === 'student').length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;


  if (!user) return null;

  return (
    <div className="h-screen overflow-hidden bg-bg-main flex flex-col md:flex-row text-text-main font-sans cyber-grid">
      
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
        <header className="h-16 border-b border-border-main bg-bg-card/60 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-text-title font-mono">
            {activeTab === 'overview' && 'SYSTEM SUMMARY // OVERVIEW'}
            {activeTab === 'content' && 'CONTENT MANAGEMENT // ARCHIVE'}
            {activeTab === 'users' && 'USER ADMINISTRATION // ROLES'}
            {activeTab === 'messages' && 'COMMUNICATION HUB // SUPPORT TICKET'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-[10px] text-text-active bg-bg-active border border-border-active px-3 py-1.5 rounded-xl font-bold font-mono uppercase tracking-wider hidden sm:inline-block shadow-[0_0_10px_rgba(15,117,188,0.05)]">
              Modo Administrador
            </div>
            <div className="flex items-center gap-2.5 pl-3 border-l border-border-main">
              <div className="w-8 h-8 rounded-xl bg-bg-input border border-border-main flex items-center justify-center font-bold text-text-active text-xs font-mono shadow-sm">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-text-main leading-none">{user?.name}</p>
                <p className="text-[9px] text-text-muted mt-1 uppercase tracking-wider font-bold font-mono leading-none">Administrador</p>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-bg-main">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-xs text-text-muted font-mono uppercase tracking-wider">Loading Database...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto no-scrollbar">
            <ErrorBanner message={actionError} onClose={() => setActionError('')} />
            
            {activeTab === 'overview' && (
              <MetricsOverview 
                setActiveTab={setActiveTab}
                totalStudents={totalStudents}
                totalResources={totalResources}
                pendingMessages={pendingMessages}
                totalAdmins={totalAdmins}
                users={users}
                calculateResidencyDays={calculateResidencyDays}
                tickets={tickets}
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
                newImageUrl={newImageUrl} setNewImageUrl={setNewImageUrl}
                uploadingImage={uploadingImage}
                uploadingPdf={uploadingPdf}
                handleImageUpload={handleImageUpload}
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
                openResidencyDoc={openResidencyDoc}
                resources={resources}
                setUsers={setUsers}
                users={users}
                handleDeleteUser={handleDeleteUser}
              />
            )}

            {activeTab === 'messages' && (
              <MessagesPanel 
                pendingMessages={pendingMessages}
                tickets={tickets}
                selectedTicketId={selectedTicketId}
                setSelectedTicketId={setSelectedTicketId}
                ticketMessages={ticketMessages}
                loadingMessages={loadingMessages}
                replyText={replyText}
                handleReplyChange={handleReplyChange}
                handleSendReply={handleSendReply}
                submittingReply={submittingReply}
                handleCloseTicket={handleCloseTicket}
                handleUploadAttachment={handleUploadAttachment}
              />
            )}
            
            {renderPreviewPlayer()}
          </div>
        )}
      </main>
    </div>
  );
}
