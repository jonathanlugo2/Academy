import { Users, BookOpen, AlertCircle, CheckCircle2, Scale } from 'lucide-react';
import { formatDate } from '../../lib/dates';
import { daysUntilResidency, isFiscalResident, residencyProgress } from '../../lib/residency';

export default function MetricsOverview({ 
  setActiveTab, 
  totalStudents, 
  totalCourses, 
  pendingMessages, 
  totalAdvisors, 
  users, 
  calculateResidencyDays,
  tickets
}) {
  return (
    <>
      {/* Cuadrícula de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div 
          onClick={() => setActiveTab('users')}
          className="bg-bg-card/60 border border-border-main hover:border-border-hover/25 hover:bg-bg-card/85 rounded-2xl p-5 relative overflow-hidden cursor-pointer transition-all duration-300 backdrop-blur-md shadow-sm hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(0,0,0,0.05),0_0_15px_rgba(15,117,188,0.05)] group"
        >
          <div className="absolute right-4 top-4 text-text-active/20 group-hover:scale-110 transition-transform"><Users className="w-10 h-10 text-text-active" /></div>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono">Estudiantes Activos</span>
          <h3 className="text-3xl font-black text-text-title mt-2 font-mono">{totalStudents}</h3>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono mt-2">Nómadas registrados</p>
        </div>

        <div 
          onClick={() => setActiveTab('content')}
          className="bg-bg-card/60 border border-border-main hover:border-border-hover/25 hover:bg-bg-card/85 rounded-2xl p-5 relative overflow-hidden cursor-pointer transition-all duration-300 backdrop-blur-md shadow-sm hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(0,0,0,0.05),0_0_15px_rgba(15,117,188,0.05)] group"
        >
          <div className="absolute right-4 top-4 text-text-active/20 group-hover:scale-110 transition-transform"><BookOpen className="w-10 h-10 text-text-active" /></div>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono">Formaciones creadas</span>
          <h3 className="text-3xl font-black text-text-title mt-2 font-mono">{totalCourses}</h3>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono mt-2">Con lecciones y materiales</p>
        </div>

        <div 
          onClick={() => setActiveTab('messages')}
          className="bg-bg-card/60 border border-border-main hover:border-border-hover/25 hover:bg-bg-card/85 rounded-2xl p-5 relative overflow-hidden cursor-pointer transition-all duration-300 backdrop-blur-md shadow-sm hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(0,0,0,0.05),0_0_15px_rgba(15,117,188,0.05)] group"
        >
          <div className="absolute right-4 top-4 text-amber-500/20 group-hover:scale-110 transition-transform"><AlertCircle className="w-10 h-10 text-amber-550 dark:text-amber-400" /></div>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono">Consultas Pendientes</span>
          <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2 font-mono">{pendingMessages}</h3>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono mt-2">Requieren respuesta</p>
        </div>

        <div className="bg-bg-card/60 border border-border-main rounded-2xl p-5 relative overflow-hidden backdrop-blur-md shadow-sm">
          <div className="absolute right-4 top-4 text-emerald-500/20"><CheckCircle2 className="w-10 h-10 text-emerald-555 dark:text-emerald-400" /></div>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono">Asesores</span>
          <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-mono">{totalAdvisors}</h3>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono mt-2">Formación interna de la firma</p>
        </div>
      </div>

      {/* Acceso Rápido y Tips de Administración */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card/60 border border-border-main rounded-2xl p-6 backdrop-blur-md shadow-sm">
          <h3 className="text-sm font-bold text-text-title mb-2 flex items-center gap-2 font-mono uppercase tracking-wider">
            <Scale className="w-5 h-5 text-text-active animate-pulse" />
            Control de Residencia Fiscal (183 Días)
          </h3>
          <p className="text-[10px] text-text-muted uppercase font-mono tracking-widest mb-4">
            Estudiantes ordenados por días efectivos en España para evaluar su estado fiscal.
          </p>
          
          <div className="space-y-4 font-mono">
            {users.filter(u => u.role === 'student' && u.active).length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4 uppercase">No hay estudiantes registrados para el control fiscal.</p>
            ) : (
              users
                .filter(u => u.role === 'student' && u.active)
                .map(student => {
                  const days = student.arrivalDate ? calculateResidencyDays(student.arrivalDate, student.absencePeriods) : 0;
                  const isResident = isFiscalResident(days);
                  
                  return (
                    <div key={student.id} className="p-3 bg-bg-input border border-border-main rounded-xl space-y-2 text-[10px]">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-text-main">{student.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          isResident 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]' 
                            : 'bg-bg-active text-text-active border border-border-active'
                        }`}>
                          {isResident ? 'Residente Fiscal' : `${daysUntilResidency(days)} DÍAS RESTANTES`}
                        </span>
                      </div>
                      
                      {student.arrivalDate ? (
                        <div className="space-y-1.5">
                          <div className="w-full h-1.5 bg-bg-main rounded-full overflow-hidden border border-border-main/40">
                            <div 
                              className={`h-full rounded-full transition-all duration-355 ${
                                isResident ? 'bg-emerald-500' : 'bg-indigo-650 shadow-[0_0_8px_rgba(15,117,188,0.2)]'
                              }`}
                              style={{ width: `${residencyProgress(days)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[8.5px] text-text-muted uppercase font-bold tracking-wider">
                            <span>Entrada: {formatDate(student.arrivalDate)}</span>
                            <span>{days} / 183 Días</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[9px] text-text-muted italic uppercase tracking-wider">Sin fecha de llegada registrada.</p>
                      )}
                    </div>
                  );
                })
                .slice(0, 3)
            )}
          </div>
        </div>

        <div className="bg-bg-card/60 border border-border-main rounded-2xl p-6 flex flex-col justify-between backdrop-blur-md shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-text-title mb-2 flex items-center gap-2 font-mono uppercase tracking-wider">
              <AlertCircle className="w-5 h-5 text-amber-550 dark:text-amber-400" />
              Mensajes Pendientes de Nómadas
            </h3>
            <p className="text-[10px] text-text-muted uppercase font-mono tracking-widest mb-4">Preguntas urgentes enviadas por estudiantes.</p>
            
            {tickets.filter(t => t.status === 'open').length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-text-muted bg-bg-input/40 rounded-xl border border-border-main/60 font-mono">
                <CheckCircle2 className="w-8 h-8 text-emerald-555/60 mb-2 animate-pulse" />
                <p className="text-[10px] font-bold uppercase tracking-wider">¡Bandeja al día! Sin tickets pendientes.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2 no-scrollbar font-mono">
                {tickets.filter(t => t.status === 'open').map(ticket => (
                  <div key={ticket.id} className="p-3 bg-bg-input border border-border-main rounded-xl flex items-center justify-between gap-4 text-[10px]">
                    <div className="truncate pr-2">
                      <p className="font-bold text-text-main truncate">{ticket.title}</p>
                      <p className="text-[9px] text-text-muted mt-1 uppercase tracking-wide">Por {ticket.student_name}</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('messages')}
                      className="px-2.5 py-1.5 text-[9px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shrink-0 transition-colors uppercase tracking-widest cursor-pointer shadow-[0_0_8px_rgba(15,117,188,0.12)] border border-indigo-500/10"
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
  );
}
