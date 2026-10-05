import { useState, useMemo } from 'react';
import { 
  UserPlus, Edit2, AlertCircle, CheckCircle2, User, MapPin, Download, Trash2, 
  FileText, Search, Filter, X, Eye, ChevronRight, ChevronLeft, Users, 
  Shield, CreditCard, Calendar, Activity, Settings2
} from 'lucide-react';
import { api } from '../../services/api';
import { formatDate } from '../../lib/dates';
import { RESIDENCY_THRESHOLD_DAYS, residencyProgress } from '../../lib/residency';

export default function UserManagementTable({
  editingUserId,
  handleCreateUser,
  uName, setUName,
  uEmail, setUEmail,
  uPassword, setUPassword,
  uRole, setURole,
  uPassport, setUPassport,
  uNie, setUNie,
  uArrivalDate, setUArrivalDate,
  uAddress, setUAddress,
  uPostalCode, setUPostalCode,
  uAeatDate, setUAeatDate,
  uSsDate, setUSsDate,
  userError,
  userSuccess,
  creatingUser,
  handleCancelEditUser,
  selectedUser,
  setSelectedUser,
  handleStartEditUser,
  calculateResidencyDays,
  openResidencyDoc,
  resources,
  setUsers,
  users, // Recibimos el listado completo para filtrar aquí
  handleDeleteUser
}) {
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [resourceSearchQuery, setResourceSearchQuery] = useState('');
  const [assignError, setAssignError] = useState('');

  const selectedResidencyDays = selectedUser ? calculateResidencyDays(selectedUser.arrivalDate, selectedUser.absences) : 0;
  const selectedIsResident = selectedResidencyDays >= RESIDENCY_THRESHOLD_DAYS;

  // Activa/desactiva un recurso para el alumno seleccionado (RPC atómica)
  const toggleResourceAccess = async (resourceId, enable) => {
    setAssignError('');
    try {
      const allowedResources = await api.users.setResourceAssignment(selectedUser.id, resourceId, enable);
      setUsers(prev => prev.map(u => (u.id === selectedUser.id ? { ...u, allowedResources } : u)));
      setSelectedUser(prev => ({ ...prev, allowedResources }));
    } catch (err) {
      setAssignError('No se pudo actualizar el acceso: ' + err.message);
    }
  };
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtrado inteligente
  const filteredUsers = useMemo(() => {
    return users
      .filter(u => {
        const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (u.nie && (u.nie || '').toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesRole = filterRole === 'all' || u.role === filterRole;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [users, searchQuery, filterRole]);

  // Paginación local
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedData = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openCreateModal = () => {
    handleCancelEditUser();
    setShowModal(true);
  };

  const onEdit = (user) => {
    handleStartEditUser(user);
    setShowModal(true);
  };

  const onViewDetails = (user) => {
    setSelectedUser(user);
    setResourceSearchQuery('');
    setShowDetailsModal(true);
  };

  // Tras guardar con éxito se muestra el aviso un momento y se cierra el modal
  const onSubmit = async (e) => {
    if (await handleCreateUser(e)) {
      setTimeout(() => setShowModal(false), 1500);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER DE SECCIÓN CON BOTÓN DE ACCIÓN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-card/40 p-4 rounded-2xl border border-border-main/80 backdrop-blur-sm">
        <div>
          <h3 className="text-lg font-bold text-text-title flex items-center gap-2 font-mono uppercase tracking-tight">
            <Users className="w-5 h-5 text-text-active" />
            Control de Usuarios y Nómadas
          </h3>
          <p className="text-xs text-text-muted font-mono mt-0.5">Gestión de accesos, roles y cumplimiento fiscal.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-95 border border-indigo-400/20"
        >
          <UserPlus className="w-4 h-4" />
          Registrar Usuario
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-bg-input/20 p-3 rounded-2xl border border-border-main/40">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="BUSCAR POR NOMBRE, EMAIL O NIE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-input border border-border-main rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-main focus:border-border-hover outline-none font-mono"
          />
        </div>
        <div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full bg-bg-input border border-border-main rounded-xl px-4 py-2.5 text-xs text-text-main focus:border-border-hover outline-none font-mono cursor-pointer"
          >
            <option value="all">TODOS LOS ROLES</option>
            <option value="student">NÓMADA (ESTUDIANTE)</option>
            <option value="admin">ADMINISTRADOR</option>
          </select>
        </div>
      </div>

      {/* TABLA ERP MODERNA */}
      <div className="bg-bg-card border border-border-main rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-main bg-bg-input/40 text-[10px] text-text-muted font-mono uppercase tracking-widest">
                <th className="px-6 py-4 font-bold">Usuario</th>
                <th className="px-6 py-4 font-bold">Identidad</th>
                <th className="px-6 py-4 font-bold">Estatus Fiscal</th>
                <th className="px-6 py-4 font-bold">Acceso</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/40">
              {paginatedData.length > 0 ? (
                paginatedData.map((user) => {
                  const residencyDays = calculateResidencyDays(user.arrivalDate, user.absences);
                  const isResident = residencyDays >= RESIDENCY_THRESHOLD_DAYS;
                  
                  return (
                    <tr key={user.id} className="group hover:bg-bg-input/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-bg-active border border-border-active flex items-center justify-center text-text-active font-bold text-xs shadow-inner">
                            {user.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-text-main truncate group-hover:text-text-title transition-colors">{user.name}</p>
                            <p className="text-[10px] text-text-muted truncate lowercase font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono">
                            <CreditCard className="w-3 h-3 text-text-muted" />
                            <span>NIE: {user.nie || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono">
                            <Shield className="w-3 h-3 text-text-muted" />
                            <span>PAS: {user.passport || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'student' ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[10px] font-mono text-text-muted">{residencyDays} / {RESIDENCY_THRESHOLD_DAYS} DÍAS</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isResident ? 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-400' : 'bg-bg-input text-text-muted border border-border-main'}`}>
                                {isResident ? 'Residente' : 'Pendiente'}
                              </span>
                            </div>
                            <div className="w-24 h-1 bg-bg-input rounded-full overflow-hidden border border-border-main/30">
                              <div 
                                className={`h-full rounded-full ${isResident ? 'bg-emerald-500' : 'bg-indigo-650'}`}
                                style={{ width: `${residencyProgress(residencyDays)}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-text-active bg-bg-active border border-border-active px-2 py-0.5 rounded uppercase font-mono">Staff Admin</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-1">
                           <span className="text-[9px] font-bold text-text-muted uppercase font-mono">Recursos: {(user.allowedResources || []).length}</span>
                           <span className="text-[9px] text-text-muted font-mono uppercase">{user.role === 'admin' ? 'Total Root' : 'Limitado'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onViewDetails(user)}
                            className="p-2 text-text-active hover:bg-bg-active rounded-lg transition-all cursor-pointer"
                            title="Ver Expediente"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEdit(user)}
                            className="p-2 text-text-muted hover:text-text-title hover:bg-bg-input rounded-lg transition-all cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-text-muted font-mono text-xs uppercase tracking-widest">
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-bg-input/25 border-t border-border-main flex items-center justify-between">
            <p className="text-[10px] text-text-muted font-mono uppercase">
              <span className="text-text-main">{filteredUsers.length}</span> Usuarios en sistema
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-bg-input border border-border-main rounded-lg text-text-muted disabled:opacity-30 hover:bg-bg-card transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                      currentPage === i + 1 
                        ? 'bg-indigo-600 text-white border border-indigo-500 shadow-[0_0_8px_rgba(15,117,188,0.2)]' 
                        : 'bg-bg-input text-text-muted border border-border-main hover:text-text-main hover:bg-bg-card'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-bg-input border border-border-main rounded-lg text-text-muted disabled:opacity-30 hover:bg-bg-card transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE REGISTRO / EDICIÓN */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-bg-card border border-border-main rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-border-main flex justify-between items-center bg-bg-input/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-bg-active border border-border-active flex items-center justify-center text-text-active">
                  {editingUserId ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-title uppercase tracking-tight font-mono">
                    {editingUserId ? 'Editar Perfil de Usuario' : 'Registrar Nuevo Miembro'}
                  </h3>
                  <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Gestión de Acceso a la Academia</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-bg-input rounded-xl text-text-muted hover:text-text-title transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <form onSubmit={onSubmit} className="space-y-6">
                {userError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl flex items-start gap-3 font-mono">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{userError}</span>
                  </div>
                )}
                {userSuccess && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 dark:text-emerald-400 text-xs rounded-2xl flex items-start gap-3 font-mono">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>{userSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 font-mono ml-1">Nombre Completo *</label>
                    <input type="text" value={uName} onChange={(e) => setUName(e.target.value)} required className="w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3.5 text-xs text-text-main outline-none focus:border-border-hover transition-all font-mono" placeholder="Ej. Juan Pérez" />
                  </div>

                  <div className={editingUserId ? "md:col-span-2" : ""}>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 font-mono ml-1">Email Corporativo *</label>
                    <input type="email" value={uEmail} onChange={(e) => setUEmail(e.target.value)} required disabled={!!editingUserId} className="w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3.5 text-xs text-text-main outline-none focus:border-border-hover transition-all font-mono disabled:opacity-50" placeholder="usuario@expatfiscal.com" />
                  </div>

                  {!editingUserId && (
                    <div>
                      <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 font-mono ml-1">Contraseña Temporal *</label>
                      <input type="password" value={uPassword} onChange={(e) => setUPassword(e.target.value)} required minLength={10} autoComplete="new-password" className="w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3.5 text-xs text-text-main outline-none focus:border-border-hover transition-all font-mono" placeholder="Mínimo 10 caracteres" />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 font-mono ml-1">Rol de Usuario</label>
                    <select value={uRole} onChange={(e) => setURole(e.target.value)} className="w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3.5 text-xs text-text-main outline-none font-mono cursor-pointer appearance-none focus:border-border-hover transition-all">
                      <option value="student">NÓMADA (ESTUDIANTE)</option>
                      <option value="admin">ADMINISTRADOR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 font-mono ml-1">Nº Pasaporte</label>
                    <input type="text" value={uPassport} onChange={(e) => setUPassport(e.target.value)} className="w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3.5 text-xs text-text-main outline-none focus:border-border-hover transition-all font-mono" placeholder="PA000000" />
                  </div>

                  {uRole === 'student' && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border-main">
                      <div className="md:col-span-2"><span className="text-[9px] font-bold text-text-active uppercase tracking-widest block mb-2 font-mono">Expediente de Residencia Fiscal</span></div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 font-mono ml-1">NIE (Identidad Extranjera)</label>
                        <input type="text" value={uNie} onChange={(e) => setUNie(e.target.value)} className="w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3.5 text-xs text-text-main outline-none focus:border-border-hover transition-all font-mono" placeholder="Y0000000-X" />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 font-mono ml-1">Fecha de Llegada a España</label>
                        <input type="date" value={uArrivalDate} onChange={(e) => setUArrivalDate(e.target.value)} className="w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3 text-xs text-text-muted outline-none focus:border-border-hover transition-all font-mono" />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 font-mono ml-1">Dirección de Residencia</label>
                        <input type="text" value={uAddress} onChange={(e) => setUAddress(e.target.value)} className="w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3.5 text-xs text-text-main outline-none focus:border-border-hover transition-all font-mono" placeholder="Calle, Número, Piso" />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 font-mono ml-1">Código Postal</label>
                        <input type="text" value={uPostalCode} onChange={(e) => setUPostalCode(e.target.value)} className="w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3.5 text-xs text-text-main outline-none focus:border-border-hover transition-all font-mono" placeholder="28001" />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 font-mono ml-1">Fecha Alta en la AEAT</label>
                        <input type="date" value={uAeatDate} onChange={(e) => setUAeatDate(e.target.value)} className="w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3 text-xs text-text-muted outline-none focus:border-border-hover transition-all font-mono" />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 font-mono ml-1">Fecha Alta en Seguridad Social</label>
                        <input type="date" value={uSsDate} onChange={(e) => setUSsDate(e.target.value)} className="w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3 text-xs text-text-muted outline-none focus:border-border-hover transition-all font-mono" />
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="px-8 py-6 border-t border-border-main bg-bg-card/50 flex gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3.5 bg-bg-input border border-border-main text-text-muted hover:text-text-title rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all font-mono cursor-pointer">Cancelar</button>
              <button type="submit" disabled={creatingUser} onClick={onSubmit} className="flex-[2] px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all font-mono flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 cursor-pointer">
                {creatingUser ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (editingUserId ? 'Guardar Cambios' : 'Confirmar Registro')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLES DEL EXPEDIENTE */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-bg-card border border-border-main rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-border-main flex justify-between items-center bg-bg-input/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-bg-active border border-border-active flex items-center justify-center text-text-active font-black text-lg">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-title uppercase tracking-tight font-mono">{selectedUser.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold text-text-active bg-bg-active border border-border-active px-2 py-0.5 rounded uppercase font-mono tracking-widest">
                      {selectedUser.role === 'student' ? 'Nómada Digital' : 'Administrador'}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono lowercase">{selectedUser.email}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => { setShowDetailsModal(false); setResourceSearchQuery(''); }} className="p-2 hover:bg-bg-input rounded-xl text-text-muted hover:text-text-title transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              {/* Grid de Información Base */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-bg-input/40 p-4 rounded-2xl border border-border-main/60">
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1 font-mono">Identidad Fiscal</p>
                  <p className="text-sm font-bold text-text-main font-mono">{selectedUser.nie || 'SIN NIE'}</p>
                </div>
                <div className="bg-bg-input/40 p-4 rounded-2xl border border-border-main/60">
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1 font-mono">Pasaporte</p>
                  <p className="text-sm font-bold text-text-main font-mono">{selectedUser.passport || 'SIN DATOS'}</p>
                </div>
                <div className="bg-bg-input/40 p-4 rounded-2xl border border-border-main/60">
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1 font-mono">Entrada a España</p>
                  <p className="text-sm font-bold text-text-main font-mono">{formatDate(selectedUser.arrivalDate, 'NO REGISTRADA')}</p>
                </div>
              </div>

              {selectedUser.role === 'student' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Control Residencia */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-text-title uppercase tracking-widest flex items-center gap-2 font-mono">
                      <Activity className="w-4 h-4 text-text-active" />
                      Cumplimiento de 183 Días
                    </h4>
                    <div className="bg-bg-input/40 p-6 rounded-3xl border border-border-main/85 space-y-6">
                      <div className="flex justify-between items-end">
                        <div className="text-3xl font-black text-text-main font-mono">
                          {selectedResidencyDays}
                          <span className="text-sm text-text-muted font-bold ml-1">/ {RESIDENCY_THRESHOLD_DAYS}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-xl uppercase tracking-widest font-mono ${selectedIsResident ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-bg-input text-text-muted border border-border-main'}`}>
                          {selectedIsResident ? 'RESIDENTE' : 'PENDIENTE'}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-bg-main rounded-full overflow-hidden border border-border-main/60 p-0.5">
                        <div className={`h-full rounded-full transition-all duration-1000 ${selectedIsResident ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-indigo-650 shadow-[0_0_15px_rgba(15,117,188,0.3)]'}`} style={{ width: `${residencyProgress(selectedResidencyDays)}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[9px] text-text-muted font-mono uppercase font-bold tracking-widest">
                        <span>LLEGADA: {formatDate(selectedUser.arrivalDate, 'N/A')}</span>
                        <span>DÍAS FUERA: {selectedUser.absences || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acceso a Recursos */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-text-title uppercase tracking-widest flex items-center gap-2 font-mono">
                        <Settings2 className="w-4 h-4 text-text-active" />
                        Autorizaciones de Contenido
                      </h4>
                    </div>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                      <input 
                        type="text"
                        placeholder="BUSCAR CONTENIDO..."
                        value={resourceSearchQuery}
                        onChange={(e) => setResourceSearchQuery(e.target.value)}
                        className="w-full bg-bg-input border border-border-main rounded-xl pl-9 pr-4 py-2 text-[10px] text-text-main outline-none focus:border-border-hover/30 transition-all font-mono uppercase"
                      />
                    </div>

                    {assignError && (
                      <p className="text-[10px] text-red-500 font-mono flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{assignError}</p>
                    )}
                    <div className="bg-bg-input/40 p-4 rounded-3xl border border-border-main/80 max-h-[220px] overflow-y-auto custom-scrollbar space-y-2">
                      {(() => {
                        const filtered = resources.filter(res => 
                           (res.title || '').toLowerCase().includes(resourceSearchQuery.toLowerCase()) || 
                           (res.category || '').toLowerCase().includes(resourceSearchQuery.toLowerCase())
                        );

                        if (filtered.length === 0) {
                          return (
                            <div className="p-8 text-center text-text-muted font-mono text-[9px] uppercase tracking-widest">
                              No se encontraron recursos
                            </div>
                          );
                        }

                        return filtered.map(res => {
                          const isAllowed = (selectedUser.allowedResources || []).includes(res.id);
                          return (
                            <div key={res.id} className="flex items-center justify-between p-3 bg-bg-input border border-border-main rounded-xl">
                              <div className="min-w-0 pr-4">
                                <p className="text-[11px] font-bold text-text-main truncate font-mono">{res.title}</p>
                                <p className="text-[8px] text-text-muted uppercase font-mono">{res.category}</p>
                              </div>
                              <button
                                onClick={() => toggleResourceAccess(res.id, !isAllowed)}
                                className={`text-[8px] font-bold px-2 py-1 rounded-lg border transition-all font-mono uppercase tracking-widest cursor-pointer ${isAllowed ? 'bg-bg-active text-text-active border-border-active' : 'bg-bg-input text-text-muted border-border-main'}`}
                              >
                                {isAllowed ? 'Habilitado' : 'Bloqueado'}
                              </button>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Documentación */}
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="text-xs font-bold text-text-title uppercase tracking-widest flex items-center gap-2 font-mono">
                      <FileText className="w-4 h-4 text-text-active" />
                      Expediente Digital
                    </h4>
                    {selectedUser.residencyDoc ? (
                      <div className="flex items-center justify-between p-4 bg-bg-input border border-border-main rounded-2xl group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-bg-input border border-border-main flex items-center justify-center text-text-muted group-hover:text-text-active transition-colors"><FileText className="w-5 h-5" /></div>
                          <div>
                            <p className="text-xs font-bold text-text-main uppercase font-mono">{selectedUser.residencyDoc.name}</p>
                            <p className="text-[9px] text-text-muted font-mono uppercase mt-0.5">{selectedUser.residencyDoc.size} • SUBIDO: {formatDate(selectedUser.residencyDoc.uploadedAt)}</p>
                          </div>
                        </div>
                        <button onClick={() => openResidencyDoc(selectedUser.residencyDoc)} className="px-4 py-2 bg-bg-active text-text-active hover:bg-indigo-600 hover:text-white border border-border-active rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all font-mono flex items-center gap-2 cursor-pointer">
                          <Download className="w-3.5 h-3.5" /> Descargar
                        </button>
                      </div>
                    ) : (
                      <div className="py-12 border-2 border-dashed border-border-main rounded-3xl flex flex-col items-center justify-center text-text-muted font-mono">
                         <X className="w-8 h-8 mb-2 opacity-20" />
                         <p className="text-[10px] uppercase font-bold tracking-widest">Sin documentos subidos</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-8 py-6 border-t border-border-main bg-bg-card/50 flex gap-3">
               <button onClick={() => { setShowDetailsModal(false); onEdit(selectedUser); }} className="flex-1 px-6 py-3.5 bg-bg-input border border-border-main text-text-main hover:text-text-title rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all font-mono flex items-center justify-center gap-2 cursor-pointer">
                 <Edit2 className="w-4 h-4" /> Editar Perfil
               </button>
               <button onClick={() => setShowDetailsModal(false)} className="flex-1 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all font-mono cursor-pointer">
                 Cerrar Expediente
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
