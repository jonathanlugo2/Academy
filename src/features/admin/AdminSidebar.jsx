import { 
  LayoutDashboard, BookOpen, MessageSquare, LogOut, GraduationCap, ChevronLeft, ChevronRight, Users, Sun, Moon 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function AdminSidebar({ 
  isSidebarCollapsed, 
  setIsSidebarCollapsed, 
  activeTab, 
  setActiveTab, 
  logout, 
  pendingMessages 
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className={`w-full ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'} bg-bg-sidebar backdrop-blur-md border-r border-border-main flex flex-col shrink-0 h-auto md:h-full transition-all duration-300 ease-in-out shadow-sm`}>
      <div className="h-16 flex items-center px-6 border-b border-border-main justify-between">
        <div className="flex items-center overflow-hidden">
          <div className={`w-8 h-8 rounded-lg bg-bg-active border border-border-active flex items-center justify-center text-text-active shadow-[0_0_10px_rgba(15,117,188,0.15)] shrink-0 ${isSidebarCollapsed ? 'mr-0' : 'mr-3'}`}>
            <GraduationCap className="w-4.5 h-4.5" />
          </div>
          {!isSidebarCollapsed && (
            <span className="font-extrabold text-text-title tracking-wider text-sm whitespace-nowrap transition-opacity duration-300 font-mono uppercase">
              ExpatFiscal
            </span>
          )}
        </div>
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-bg-input transition-colors hidden md:block shrink-0 cursor-pointer"
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
              ? 'bg-bg-active text-text-active border border-border-active shadow-[0_0_12px_rgba(15,117,188,0.08)]' 
              : 'text-text-muted border border-transparent hover:bg-bg-input hover:text-text-main'
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
              ? 'bg-bg-active text-text-active border border-border-active shadow-[0_0_12px_rgba(15,117,188,0.08)]' 
              : 'text-text-muted border border-transparent hover:bg-bg-input hover:text-text-main'
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
              ? 'bg-bg-active text-text-active border border-border-active shadow-[0_0_12px_rgba(15,117,188,0.08)]' 
              : 'text-text-muted border border-transparent hover:bg-bg-input hover:text-text-main'
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
              ? 'bg-bg-active text-text-active border border-border-active shadow-[0_0_12px_rgba(15,117,188,0.08)]' 
              : 'text-text-muted border border-transparent hover:bg-bg-input hover:text-text-main'
          }`}
          title={isSidebarCollapsed ? "Bandeja Mensajes" : undefined}
        >
          <MessageSquare className={`${isSidebarCollapsed ? 'm-0' : 'mr-3'} h-5 w-5 shrink-0`} />
          {!isSidebarCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">Bandeja Mensajes</span>}
          {pendingMessages > 0 && !isSidebarCollapsed && (
            <span className="ml-auto bg-indigo-600 text-white font-bold text-[9px] w-5 h-5 flex items-center justify-center rounded-lg shrink-0 font-mono border border-indigo-550/20">
              {pendingMessages}
            </span>
          )}
        </button>
      </nav>

      {/* Selector de Tema */}
      <div className="p-4 border-t border-border-main font-mono">
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center py-2.5 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-text-main hover:bg-bg-input rounded-xl transition-all cursor-pointer ${
            isSidebarCollapsed ? 'justify-center px-0 px-3' : 'px-3'
          }`}
          title={isSidebarCollapsed ? "Cambiar Tema" : undefined}
        >
          {theme === 'dark' ? (
            <>
              <Sun className={`${isSidebarCollapsed ? 'm-0' : 'mr-3'} h-5 w-5 shrink-0 text-amber-400`} />
              {!isSidebarCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">Modo Claro</span>}
            </>
          ) : (
            <>
              <Moon className={`${isSidebarCollapsed ? 'm-0' : 'mr-3'} h-5 w-5 shrink-0 text-indigo-500`} />
              {!isSidebarCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">Modo Oscuro</span>}
            </>
          )}
        </button>
      </div>

      {/* Cerrar Sesión */}
      <div className="p-4 border-t border-border-main font-mono">
        <button
          onClick={logout}
          className={`w-full flex items-center py-2.5 text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-400 border border-transparent rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer ${
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
