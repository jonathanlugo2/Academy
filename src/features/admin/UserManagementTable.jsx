import { useState, useMemo } from 'react';
import { 
  UserPlus, Edit2, AlertCircle, CheckCircle2, User, MapPin, Download, Trash2, 
  FileText, Search, Filter, X, Eye, ChevronRight, ChevronLeft, Users, 
  Shield, CreditCard, Calendar, Activity, Settings2
} from 'lucide-react';
import { mockDb } from '../../utils/mockDb';

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
  triggerDocDownload,
  resources,
  setUsers,
  users, // Recibimos el listado completo para filtrar aquí
  handleDeleteUser
}) {
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtrado inteligente
  const filteredUsers = useMemo(() => {
    return users
      .filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (u.nie && u.nie.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesRole = filterRole === 'all' || u.role === filterRole;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
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
    setShowDetailsModal(true);
  };

  const onSubmit = async (e) => {
    const success = await handleCreateUser(e);
    // Asumimos éxito si no hay error persistente después de un breve tiempo o si el parent indica éxito
    if (!userError) {
      setTimeout(() => {
        if (userSuccess) setShowModal(false);
      }, 1500);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER DE SECCIÓN CON BOTÓN DE ACCIÓN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/80 backdrop-blur-sm">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono uppercase tracking-tight">
            <Users className="w-5 h-5 text-indigo-400" />
            Control de Usuarios y Nómadas
          </h3>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">Gestión de accesos, roles y cumplimiento fiscal.</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-zinc-900/20 p-3 rounded-2xl border border-zinc-800/40">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="BUSCAR POR NOMBRE, EMAIL O NIE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 focus:border-indigo-500/50 outline-none font-mono"
          />
        </div>
        <div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:border-indigo-500/50 outline-none font-mono cursor-pointer"
          >
            <option value="all">TODOS LOS ROLES</option>
            <option value="student">NÓMADA (ESTUDIANTE)</option>
            <option value="admin">ADMINISTRADOR</option>
          </select>
        </div>
      </div>

      {/* TABLA ERP MODERNA */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                <th className="px-6 py-4 font-bold">Usuario</th>
                <th className="px-6 py-4 font-bold">Identidad</th>
                <th className="px-6 py-4 font-bold">Estatus Fiscal</th>
                <th className="px-6 py-4 font-bold">Acceso</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {paginatedData.length > 0 ? (
                paginatedData.map((user) => {
                  const residencyDays = calculateResidencyDays(user.arrivalDate, user.absences);
                  const isResident = residencyDays >= 183;
                  
                  return (
                    <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs shadow-inner">
                            {user.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-zinc-200 truncate group-hover:text-white transition-colors">{user.name}</p>
                            <p className="text-[10px] text-zinc-550 truncate lowercase font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                            <CreditCard className="w-3 h-3 text-zinc-600" />
                            <span>NIE: {user.nie || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                            <Shield className="w-3 h-3 text-zinc-600" />
                            <span>PAS: {user.passport || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'student' ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[10px] font-mono text-zinc-500">{residencyDays} / 183 DÍAS</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isResident ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                {isResident ? 'Residente' : 'Pendiente'}
                              </span>
                            </div>
                            <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isResident ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                style={{ width: `${Math.min(100, (residencyDays / 183) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-indigo-400 bg-indigo-950/30 border border-indigo-500/20 px-2 py-0.5 rounded uppercase font-mono">Staff Admin</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-1">
                           <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono">Recursos: {(user.allowedResources || []).length}</span>
                           <span className="text-[9px] text-zinc-600 font-mono uppercase">{user.role === 'admin' ? 'Total Root' : 'Limitado'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onViewDetails(user)}
                            className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                            title="Ver Expediente"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEdit(user)}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
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
                  <td colSpan="5" className="px-6 py-12 text-center text-zinc-550 font-mono text-xs uppercase tracking-widest">
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-zinc-950/20 border-t border-zinc-800/80 flex items-center justify-between">
            <p className="text-[10px] text-zinc-500 font-mono uppercase">
              <span className="text-zinc-300">{filteredUsers.length}</span> Usuarios en sistema
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400 disabled:opacity-30 hover:bg-zinc-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-[10px] font-bold font-mono transition-all ${
                      currentPage === i + 1 
                        ? 'bg-indigo-600 text-white border border-indigo-500' 
                        : 'bg-zinc-950 text-zinc-500 border border-zinc-800 hover:text-zinc-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400 disabled:opacity-30 hover:bg-zinc-900 transition-colors"
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  {editingUserId ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-tight font-mono">
                    {editingUserId ? 'Editar Perfil de Usuario' : 'Registrar Nuevo Miembro'}
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Gestión de Acceso a la Academia</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
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
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-2xl flex items-start gap-3 font-mono">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>{userSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 font-mono ml-1">Nombre Completo *</label>
                    <input type="text" value={uName} onChange={(e) => setUName(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3.5 text-xs text-zinc-200 outline-none focus:border-indigo-500/50 transition-all font-mono" placeholder="Ej. Juan Pérez" />
                  </div>

                  <div className={editingUserId ? "md:col-span-2" : ""}>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 font-mono ml-1">Email Corporativo *</label>
                    <input type="email" value={uEmail} onChange={(e) => setUEmail(e.target.value)} required disabled={!!editingUserId} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3.5 text-xs text-zinc-200 outline-none focus:border-indigo-500/50 transition-all font-mono disabled:opacity-50" placeholder="usuario@expatfiscal.com" />
                  </div>

                  {!editingUserId && (
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 font-mono ml-1">Contraseña Temporal *</label>
                      <input type="password" value={uPassword} onChange={(e) => setUPassword(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3.5 text-xs text-zinc-200 outline-none focus:border-indigo-500/50 transition-all font-mono" placeholder="••••••••" />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 font-mono ml-1">Rol de Usuario</label>
                    <select value={uRole} onChange={(e) => setURole(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3.5 text-xs text-zinc-200 outline-none font-mono cursor-pointer appearance-none focus:border-indigo-500/50 transition-all">
                      <option value="student">NÓMADA (ESTUDIANTE)</option>
                      <option value="admin">ADMINISTRADOR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 font-mono ml-1">Nº Pasaporte</label>
                    <input type="text" value={uPassport} onChange={(e) => setUPassport(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3.5 text-xs text-zinc-200 outline-none focus:border-indigo-500/50 transition-all font-mono" placeholder="PA000000" />
                  </div>

                  {uRole === 'student' && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800">
                      <div className="md:col-span-2"><span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block mb-2 font-mono">Expediente de Residencia Fiscal</span></div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 font-mono ml-1">NIE (Identidad Extranjera)</label>
                        <input type="text" value={uNie} onChange={(e) => setUNie(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3.5 text-xs text-zinc-200 outline-none focus:border-indigo-500/50 transition-all font-mono" placeholder="Y0000000-X" />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 font-mono ml-1">Fecha de Llegada a España</label>
                        <input type="date" value={uArrivalDate} onChange={(e) => setUArrivalDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-xs text-zinc-300 outline-none focus:border-indigo-500/50 transition-all font-mono" />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 font-mono ml-1">Dirección de Residencia</label>
                        <input type="text" value={uAddress} onChange={(e) => setUAddress(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3.5 text-xs text-zinc-200 outline-none focus:border-indigo-500/50 transition-all font-mono" placeholder="Calle, Número, Piso" />
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="px-8 py-6 border-t border-zinc-800 bg-zinc-900/50 flex gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3.5 bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all font-mono">Cancelar</button>
              <button type="submit" disabled={creatingUser} onClick={onSubmit} className="flex-[2] px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all font-mono flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10">
                {creatingUser ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (editingUserId ? 'Guardar Cambios' : 'Confirmar Registro')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLES DEL EXPEDIENTE */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-lg">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight font-mono">{selectedUser.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-2 py-0.5 rounded uppercase font-mono tracking-widest">
                      {selectedUser.role === 'student' ? 'Nómada Digital' : 'Administrador'}
                    </span>
                    <span className="text-[10px] text-zinc-550 font-mono lowercase">{selectedUser.email}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              {/* Grid de Información Base */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800/60">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">Identidad Fiscal</p>
                  <p className="text-sm font-bold text-zinc-200 font-mono">{selectedUser.nie || 'SIN NIE'}</p>
                </div>
                <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800/60">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">Pasaporte</p>
                  <p className="text-sm font-bold text-zinc-200 font-mono">{selectedUser.passport || 'SIN DATOS'}</p>
                </div>
                <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800/60">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">Entrada a España</p>
                  <p className="text-sm font-bold text-zinc-200 font-mono">{selectedUser.arrivalDate ? new Date(selectedUser.arrivalDate).toLocaleDateString('es-ES') : 'NO REGISTRADA'}</p>
                </div>
              </div>

              {selectedUser.role === 'student' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Control Residencia */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 font-mono">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      Cumplimiento de 183 Días
                    </h4>
                    <div className="bg-zinc-950/40 p-6 rounded-3xl border border-zinc-800/80 space-y-6">
                      <div className="flex justify-between items-end">
                        <div className="text-3xl font-black text-white font-mono">
                          {calculateResidencyDays(selectedUser.arrivalDate, selectedUser.absences)} 
                          <span className="text-sm text-zinc-600 font-bold ml-1">/ 183</span>
                        </div>
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-xl uppercase tracking-widest font-mono ${calculateResidencyDays(selectedUser.arrivalDate, selectedUser.absences) >= 183 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
                          {calculateResidencyDays(selectedUser.arrivalDate, selectedUser.absences) >= 183 ? 'RESIDENTE' : 'PENDIENTE'}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/60 p-0.5">
                        <div className={`h-full rounded-full transition-all duration-1000 ${calculateResidencyDays(selectedUser.arrivalDate, selectedUser.absences) >= 183 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-indigo-500 shadow-[0_0_15px_rgba(0,242,254,0.3)]'}`} style={{ width: `${Math.min(100, (calculateResidencyDays(selectedUser.arrivalDate, selectedUser.absences) / 183) * 100)}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[9px] text-zinc-550 font-mono uppercase font-bold tracking-widest">
                        <span>LLEGADA: {selectedUser.arrivalDate || 'N/A'}</span>
                        <span>DÍAS FUERA: {selectedUser.absences || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acceso a Recursos */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 font-mono">
                      <Settings2 className="w-4 h-4 text-indigo-400" />
                      Autorizaciones de Contenido
                    </h4>
                    <div className="bg-zinc-950/40 p-4 rounded-3xl border border-zinc-800/80 max-h-[220px] overflow-y-auto custom-scrollbar space-y-2">
                      {resources.map(res => {
                        const isAllowed = (selectedUser.allowedResources || []).includes(res.id);
                        return (
                          <div key={res.id} className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                            <div className="min-w-0 pr-4">
                              <p className="text-[11px] font-bold text-zinc-200 truncate font-mono">{res.title}</p>
                              <p className="text-[8px] text-zinc-600 uppercase font-mono">{res.category}</p>
                            </div>
                            <button
                              onClick={async () => {
                                const currentAllowed = selectedUser.allowedResources || [];
                                const newAllowed = isAllowed ? currentAllowed.filter(id => id !== res.id) : [...currentAllowed, res.id];
                                await mockDb.users.update(selectedUser.id, { allowedResources: newAllowed });
                                const updatedUsers = await mockDb.users.getAll();
                                setUsers(updatedUsers);
                                setSelectedUser(prev => ({ ...prev, allowedResources: newAllowed }));
                              }}
                              className={`text-[8px] font-bold px-2 py-1 rounded-lg border transition-all font-mono uppercase tracking-widest ${isAllowed ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-zinc-950 text-zinc-600 border-zinc-800'}`}
                            >
                              {isAllowed ? 'Habilitado' : 'Bloqueado'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Documentación */}
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 font-mono">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      Expediente Digital
                    </h4>
                    {selectedUser.residencyDoc ? (
                      <div className="flex items-center justify-between p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-indigo-400 transition-colors"><FileText className="w-5 h-5" /></div>
                          <div>
                            <p className="text-xs font-bold text-zinc-200 uppercase font-mono">{selectedUser.residencyDoc.name}</p>
                            <p className="text-[9px] text-zinc-600 font-mono uppercase mt-0.5">{selectedUser.residencyDoc.size} • SUBIDO: {new Date(selectedUser.residencyDoc.uploadedAt).toLocaleDateString('es-ES')}</p>
                          </div>
                        </div>
                        <button onClick={() => triggerDocDownload(selectedUser.residencyDoc.name)} className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all font-mono flex items-center gap-2">
                          <Download className="w-3.5 h-3.5" /> Descargar
                        </button>
                      </div>
                    ) : (
                      <div className="py-12 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-zinc-600 font-mono">
                         <X className="w-8 h-8 mb-2 opacity-20" />
                         <p className="text-[10px] uppercase font-bold tracking-widest">Sin documentos subidos</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-8 py-6 border-t border-zinc-800 bg-zinc-900/50 flex gap-3">
               <button onClick={() => { setShowDetailsModal(false); onEdit(selectedUser); }} className="flex-1 px-6 py-3.5 bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all font-mono flex items-center justify-center gap-2">
                 <Edit2 className="w-4 h-4" /> Editar Perfil
               </button>
               <button onClick={() => setShowDetailsModal(false)} className="flex-1 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all font-mono">
                 Cerrar Expediente
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
