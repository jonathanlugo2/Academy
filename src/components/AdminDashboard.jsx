import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { calculateResidencyDays } from '../lib/residency';
import AdminSidebar from '../features/admin/AdminSidebar';
import MetricsOverview from '../features/admin/MetricsOverview';
import CourseManager from '../features/admin/courses/CourseManager';
import UserManagementTable from '../features/admin/UserManagementTable';
import MessagesPanel from '../features/admin/MessagesPanel';
import ChangePasswordModal from '../features/account/ChangePasswordModal';
import TempPasswordModal from '../features/admin/TempPasswordModal';
import ErrorBanner from './ErrorBanner';

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'content', 'messages', 'users'

  // Datos
  const [courses, setCourses] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  // Mensajes del ticket seleccionado (guardados junto a su id para saber si están cargados)
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [messagesState, setMessagesState] = useState({ ticketId: null, messages: [] });
  const ticketMessages = selectedTicketId && messagesState.ticketId === selectedTicketId ? messagesState.messages : [];
  const loadingMessages = Boolean(selectedTicketId) && messagesState.ticketId !== selectedTicketId;

  // Respuestas a tickets
  const [replyText, setReplyText] = useState({});
  const [submittingReply, setSubmittingReply] = useState({});

  // Gestión de usuarios
  const [selectedUser, setSelectedUser] = useState(null);
  const [uEmail, setUEmail] = useState('');
  const [uAccess, setUAccess] = useState('invite'); // 'invite' | 'password'
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
  // Contraseña temporal recién generada: se muestra una sola vez
  const [tempCredential, setTempCredential] = useState(null);
  const [accountNotice, setAccountNotice] = useState('');

  // Carga inicial en paralelo
  useEffect(() => {
    let active = true;
    Promise.all([api.courses.getAll(), api.tickets.getAll(), api.users.getAll()])
      .then(([courseList, ticketsList, usersList]) => {
        if (!active) return;
        setCourses(courseList);
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
    setUAccess('invite');
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

    // Los asesores no tienen expediente de residencia
    const isStudent = uRole === 'student';
    const profileData = {
      name: uName.trim(),
      role: uRole,
      passport: isStudent ? uPassport.trim() || null : null,
      nie: isStudent ? uNie.trim() || null : null,
      address: isStudent ? uAddress.trim() || null : null,
      postalCode: isStudent ? uPostalCode.trim() || null : null,
      arrivalDate: isStudent ? uArrivalDate || null : null,
      aeatDate: isStudent ? uAeatDate || null : null,
      ssDate: isStudent ? uSsDate || null : null
    };
    // El rol del administrador no se cambia desde el formulario
    const previousRole = editingUserId && users.find(u => u.id === editingUserId)?.role;
    if (previousRole === 'admin') delete profileData.role;
    if (previousRole === 'student' && uRole === 'advisor'
        && !confirm('Al convertirlo en asesor se borrarán sus datos de residencia (NIE, pasaporte, dirección y fechas). ¿Continuar?')) {
      return false;
    }

    setCreatingUser(true);
    try {
      if (editingUserId) {
        const updated = await api.users.update(editingUserId, profileData);
        setUserSuccess('¡Usuario actualizado correctamente!');
        setSelectedUser(updated);
      } else {
        const email = uEmail.trim();
        const { tempPassword, recovered } = await api.users.create({ ...profileData, email, access: uAccess });
        const prefix = recovered ? 'Se ha recuperado una cuenta antigua con ese correo. ' : '';
        if (tempPassword) {
          setTempCredential({ name: profileData.name, email, password: tempPassword });
          setUserSuccess(`${prefix}Usuario registrado. Comparte la contraseña temporal por un canal seguro.`);
        } else {
          setUserSuccess(`${prefix}Usuario registrado. Hemos enviado la invitación a ${email}.`);
        }
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

  // Ejecuta una acción de cuenta y recarga la lista
  const runAccountAction = async (action, errorPrefix) => {
    setActionError('');
    setAccountNotice('');
    try {
      const notice = await action();
      setUsers(await api.users.getAll());
      if (notice) setAccountNotice(notice);
    } catch (e) {
      setActionError(`${errorPrefix}: ${e.message}`);
    }
  };

  const handleDeactivateUser = (target) => {
    if (!confirm(`¿Dar de baja a "${target.name}"? No podrá iniciar sesión, pero se conservan sus datos, formaciones y progreso. Podrás reactivarlo cuando quieras.`)) return;
    runAccountAction(async () => {
      await api.users.deactivate(target.id);
      return `${target.name} ha sido dado de baja.`;
    }, 'No se pudo dar de baja al usuario');
  };

  const handleReactivateUser = (target) => runAccountAction(async () => {
    await api.users.reactivate(target.id);
    return `${target.name} vuelve a tener acceso.`;
  }, 'No se pudo reactivar al usuario');

  const handleDeleteUser = (target) => {
    const typed = prompt(
      `Eliminar definitivamente a "${target.name}" borra su cuenta, formaciones, progreso, tickets y documentos. No se puede deshacer.\n\nEscribe su correo para confirmar:`
    );
    if (typed === null) return;
    if (typed.trim().toLowerCase() !== (target.email || '').toLowerCase()) {
      setActionError('El correo no coincide: no se ha eliminado el usuario.');
      return;
    }
    runAccountAction(async () => {
      await api.users.delete(target.id);
      if (selectedUser?.id === target.id) setSelectedUser(null);
      return `${target.name} ha sido eliminado. Su correo puede volver a darse de alta.`;
    }, 'No se pudo eliminar el usuario');
  };

  const handleSendAccessLink = (target) => runAccountAction(async () => {
    await api.users.sendAccessLink(target.id);
    return `Enlace de acceso enviado a ${target.email}.`;
  }, 'No se pudo enviar el enlace');

  const handleResetPassword = (target) => {
    if (!confirm(`¿Generar una contraseña temporal para "${target.name}"? La actual dejará de funcionar y tendrá que elegir una nueva al entrar.`)) return;
    runAccountAction(async () => {
      const password = await api.users.resetPassword(target.id);
      setTempCredential({ name: target.name, email: target.email, password });
    }, 'No se pudo generar la contraseña');
  };

  const openResidencyDoc = async (doc) => {
    try {
      const url = await api.residencyDocs.getUrl(doc);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setActionError(e.message);
    }
  };

  // Métricas
  const totalCourses = courses.length;
  const pendingMessages = tickets.filter(t => t.status === 'open').length;
  const totalStudents = users.filter(u => u.role === 'student' && u.active).length;
  const totalAdvisors = users.filter(u => u.role === 'advisor' && u.active).length;


  if (!user) return null;

  return (
    <div className="h-screen overflow-hidden bg-bg-main flex flex-col md:flex-row text-text-main font-sans cyber-grid">
      
      <AdminSidebar 
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        logout={logout}
        onChangePassword={() => setShowChangePassword(true)}
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
            {accountNotice && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono flex justify-between gap-3">
                <span>{accountNotice}</span>
                <button onClick={() => setAccountNotice('')} className="font-bold cursor-pointer" aria-label="Cerrar aviso">×</button>
              </div>
            )}
            
            {activeTab === 'overview' && (
              <MetricsOverview 
                setActiveTab={setActiveTab}
                totalStudents={totalStudents}
                totalCourses={totalCourses}
                pendingMessages={pendingMessages}
                totalAdvisors={totalAdvisors}
                users={users}
                calculateResidencyDays={calculateResidencyDays}
                tickets={tickets}
              />
            )}

            {activeTab === 'content' && (
              <CourseManager
                courses={courses}
                setCourses={setCourses}
                users={users}
                userEmail={user.email}
              />
            )}

            {activeTab === 'users' && (
              <UserManagementTable 
                editingUserId={editingUserId}
                handleCreateUser={handleCreateUser}
                uName={uName} setUName={setUName}
                uEmail={uEmail} setUEmail={setUEmail}
                uAccess={uAccess} setUAccess={setUAccess}
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
                courses={courses}
                setCourses={setCourses}
                setUsers={setUsers}
                users={users}
                currentUserId={user.id}
                handleDeactivateUser={handleDeactivateUser}
                handleReactivateUser={handleReactivateUser}
                handleDeleteUser={handleDeleteUser}
                handleSendAccessLink={handleSendAccessLink}
                handleResetPassword={handleResetPassword}
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

          </div>
        )}
      </main>

      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
      {tempCredential && <TempPasswordModal credential={tempCredential} onClose={() => setTempCredential(null)} />}
    </div>
  );
}
