import { Users, BookOpen, AlertCircle, CheckCircle2, Scale } from 'lucide-react';

export default function MetricsOverview({ 
  setActiveTab, 
  totalStudents, 
  totalResources, 
  pendingMessages, 
  totalAdmins, 
  users, 
  calculateResidencyDays,
  messages
}) {
  return (
    <>
      {/* Cuadrícula de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div 
          onClick={() => setActiveTab('users')}
          className="bg-zinc-900/60 border border-zinc-800/80 hover:border-indigo-500/25 hover:bg-zinc-900/85 rounded-2xl p-5 relative overflow-hidden cursor-pointer transition-all duration-300 backdrop-blur-md shadow-sm hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(0,0,0,0.5),0_0_15px_rgba(0,242,254,0.15)] group"
        >
          <div className="absolute right-4 top-4 text-indigo-550/20 group-hover:scale-110 transition-transform"><Users className="w-10 h-10 text-indigo-400" /></div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Estudiantes Activos</span>
          <h3 className="text-3xl font-black text-white mt-2 font-mono">{totalStudents}</h3>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mt-2">Nómadas registrados</p>
        </div>

        <div 
          onClick={() => setActiveTab('content')}
          className="bg-zinc-900/60 border border-zinc-800/80 hover:border-indigo-500/25 hover:bg-zinc-900/85 rounded-2xl p-5 relative overflow-hidden cursor-pointer transition-all duration-300 backdrop-blur-md shadow-sm hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(0,0,0,0.5),0_0_15px_rgba(0,242,254,0.15)] group"
        >
          <div className="absolute right-4 top-4 text-indigo-550/20 group-hover:scale-110 transition-transform"><BookOpen className="w-10 h-10 text-indigo-400" /></div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Formaciones creadas</span>
          <h3 className="text-3xl font-black text-white mt-2 font-mono">{totalResources}</h3>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mt-2">PDFs, vídeos y guías</p>
        </div>

        <div 
          onClick={() => setActiveTab('messages')}
          className="bg-zinc-900/60 border border-zinc-800/80 hover:border-indigo-500/25 hover:bg-zinc-900/85 rounded-2xl p-5 relative overflow-hidden cursor-pointer transition-all duration-300 backdrop-blur-md shadow-sm hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(0,0,0,0.5),0_0_15px_rgba(0,242,254,0.15)] group"
        >
          <div className="absolute right-4 top-4 text-amber-500/20 group-hover:scale-110 transition-transform"><AlertCircle className="w-10 h-10 text-amber-400" /></div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Consultas Pendientes</span>
          <h3 className="text-3xl font-black text-white mt-2 font-mono text-amber-400">{pendingMessages}</h3>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mt-2">Requieren respuesta</p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md shadow-sm">
          <div className="absolute right-4 top-4 text-emerald-500/20"><CheckCircle2 className="w-10 h-10 text-emerald-400" /></div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Administradores</span>
          <h3 className="text-3xl font-black text-white mt-2 font-mono text-emerald-400">{totalAdmins}</h3>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mt-2">Control total del sistema</p>
        </div>
      </div>

      {/* Acceso Rápido y Tips de Administración */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md shadow-sm">
          <h3 className="text-sm font-bold text-zinc-100 mb-2 flex items-center gap-2 font-mono uppercase tracking-wider">
            <Scale className="w-5 h-5 text-indigo-400 animate-pulse" />
            Control de Residencia Fiscal (183 Días)
          </h3>
          <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest mb-4">
            Estudiantes ordenados por días efectivos en España para evaluar su estado fiscal.
          </p>
          
          <div className="space-y-4 font-mono">
            {users.filter(u => u.role === 'student').length === 0 ? (
              <p className="text-xs text-zinc-555 text-center py-4 uppercase">No hay estudiantes registrados para el control fiscal.</p>
            ) : (
              users
                .filter(u => u.role === 'student')
                .map(student => {
                  const days = student.arrivalDate ? calculateResidencyDays(student.arrivalDate, student.absences) : 0;
                  const isResident = days >= 183;
                  
                  return (
                    <div key={student.id} className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl space-y-2 text-[10px]">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-zinc-250">{student.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          isResident 
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]' 
                            : 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {isResident ? 'Residente Fiscal' : `${183 - days} DÍAS RESTANTES`}
                        </span>
                      </div>
                      
                      {student.arrivalDate ? (
                        <div className="space-y-1.5">
                          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/40">
                            <div 
                              className={`h-full rounded-full transition-all duration-355 ${
                                isResident ? 'bg-emerald-500' : 'bg-indigo-500 shadow-[0_0_8px_rgba(0,242,254,0.2)]'
                              }`}
                              style={{ width: `${Math.min(100, (days / 183) * 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[8.5px] text-zinc-550 uppercase font-bold tracking-wider">
                            <span>Entrada: {new Date(student.arrivalDate).toLocaleDateString('es-ES')}</span>
                            <span>{days} / 183 Días</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[9px] text-zinc-550 italic uppercase tracking-wider">Sin fecha de llegada registrada.</p>
                      )}
                    </div>
                  );
                })
                .slice(0, 3)
            )}
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-md shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 mb-2 flex items-center gap-2 font-mono uppercase tracking-wider">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Mensajes Pendientes de Nómadas
            </h3>
            <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest mb-4">Preguntas urgentes enviadas por estudiantes.</p>
            
            {messages.filter(m => !m.reply).length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-zinc-550 bg-zinc-950/40 rounded-xl border border-zinc-805/60 font-mono">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mb-2 animate-pulse" />
                <p className="text-[10px] font-bold uppercase tracking-wider">¡Bandeja al día! Sin consultas pendientes.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2 no-scrollbar font-mono">
                {messages.filter(m => !m.reply).map(msg => (
                  <div key={msg.id} className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-4 text-[10px]">
                    <div className="truncate pr-2">
                      <p className="font-bold text-zinc-200 truncate">{msg.content}</p>
                      <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-wide">Por {msg.sender_name}</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('messages')}
                      className="px-2.5 py-1.5 text-[9px] bg-indigo-650 hover:bg-indigo-600 text-zinc-950 font-bold rounded-lg shrink-0 transition-colors uppercase tracking-widest cursor-pointer shadow-[0_0_8px_rgba(0,242,254,0.12)] border border-indigo-500/10"
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
