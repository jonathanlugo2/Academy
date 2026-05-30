import { 
  LayoutDashboard, BookOpen, MessageSquare, LogOut, Scale, ChevronLeft, ChevronRight, Users 
} from 'lucide-react';

export default function AdminSidebar({ 
  isSidebarCollapsed, 
  setIsSidebarCollapsed, 
  activeTab, 
  setActiveTab, 
  logout, 
  pendingMessages 
}) {
  return (
    <aside className={`w-full ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'} bg-zinc-950/80 backdrop-blur-md border-r border-zinc-800/80 flex flex-col shrink-0 h-auto md:h-full transition-all duration-300 ease-in-out`}>
      <div className="h-16 flex items-center px-6 border-b border-zinc-800/80 justify-between">
        <div className="flex items-center overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center mr-3 text-indigo-400 shadow-[0_0_10px_rgba(0,242,254,0.15)] shrink-0 animate-pulse">
            <Scale className="w-4.5 h-4.5" />
          </div>
          {!isSidebarCollapsed && (
            <span className="font-extrabold text-zinc-100 tracking-wider text-sm whitespace-nowrap transition-opacity duration-300 font-mono uppercase">
              ExpatFiscal
            </span>
          )}
        </div>
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition-colors hidden md:block shrink-0 cursor-pointer"
          title={isSidebarCollapsed ? "Expandir menú" : "Contraer menú"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      
      {/* Links de Navegación */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`w-full flex items-center py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer font-mono ${
            isSidebarCollapsed ? 'justify-center px-0' : 'px-3'
          } ${
            activeTab === 'overview' 
              ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/20 shadow-[0_0_12px_rgba(0,242,254,0.08)]' 
              : 'text-zinc-400 border border-transparent hover:bg-zinc-900/40 hover:text-zinc-200'
          }`}
          title={isSidebarCollapsed ? "Resumen General" : undefined}
        >
          <LayoutDashboard className={`${isSidebarCollapsed ? 'm-0' : 'mr-3'} h-5 w-5 shrink-0`} />
          {!isSidebarCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">Resumen General</span>}
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`w-full flex items-center py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer font-mono ${
            isSidebarCollapsed ? 'justify-center px-0' : 'px-3'
          } ${
            activeTab === 'content' 
              ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/20 shadow-[0_0_12px_rgba(0,242,254,0.08)]' 
              : 'text-zinc-400 border border-transparent hover:bg-zinc-900/40 hover:text-zinc-200'
          }`}
          title={isSidebarCollapsed ? "Gestión Contenidos" : undefined}
        >
          <BookOpen className={`${isSidebarCollapsed ? 'm-0' : 'mr-3'} h-5 w-5 shrink-0`} />
          {!isSidebarCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">Gestión Contenidos</span>}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`w-full flex items-center py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer font-mono ${
            isSidebarCollapsed ? 'justify-center px-0' : 'px-3'
          } ${
            activeTab === 'users' 
              ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/20 shadow-[0_0_12px_rgba(0,242,254,0.08)]' 
              : 'text-zinc-400 border border-transparent hover:bg-zinc-900/40 hover:text-zinc-200'
          }`}
          title={isSidebarCollapsed ? "Gestión Usuarios" : undefined}
        >
          <Users className={`${isSidebarCollapsed ? 'm-0' : 'mr-3'} h-5 w-5 shrink-0`} />
          {!isSidebarCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">Gestión Usuarios</span>}
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`w-full flex items-center py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer relative font-mono ${
            isSidebarCollapsed ? 'justify-center px-0' : 'px-3'
          } ${
            activeTab === 'messages' 
              ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/20 shadow-[0_0_12px_rgba(0,242,254,0.08)]' 
              : 'text-zinc-400 border border-transparent hover:bg-zinc-900/40 hover:text-zinc-200'
          }`}
          title={isSidebarCollapsed ? "Bandeja Mensajes" : undefined}
        >
          <MessageSquare className={`${isSidebarCollapsed ? 'm-0' : 'mr-3'} h-5 w-5 shrink-0`} />
          {!isSidebarCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">Bandeja Mensajes</span>}
          {pendingMessages > 0 && !isSidebarCollapsed && (
            <span className="ml-auto bg-indigo-400 text-zinc-950 font-bold text-[9px] w-5 h-5 flex items-center justify-center rounded-lg animate-pulse shrink-0 font-mono border border-indigo-300/40 shadow-[0_0_8px_rgba(0,242,254,0.3)]">
              {pendingMessages}
            </span>
          )}
        </button>
      </nav>

      {/* Cerrar Sesión */}
      <div className="p-4 border-t border-zinc-800/80 mt-auto font-mono">
        <button
          onClick={logout}
          className={`w-full flex items-center py-2.5 text-xs font-bold uppercase tracking-wider text-red-400 border border-transparent rounded-xl hover:bg-red-950/20 hover:text-red-300 transition-colors cursor-pointer ${
            isSidebarCollapsed ? 'justify-center px-0' : 'px-3'
          }`}
          title={isSidebarCollapsed ? "Cerrar Sesión" : undefined}
        >
          <LogOut className={`${isSidebarCollapsed ? 'm-0' : 'mr-3'} h-5 w-5 shrink-0`} />
          {!isSidebarCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}
