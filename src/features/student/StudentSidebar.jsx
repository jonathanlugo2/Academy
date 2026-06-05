import React from 'react';
import { 
  GraduationCap, ChevronRight, ChevronLeft, BookOpen, 
  MessageSquare
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function StudentSidebar({ 
  isSidebarCollapsed, 
  setIsSidebarCollapsed, 
  activeTab, 
  setActiveTab, 
  logout 
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className={`w-full ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'} bg-bg-sidebar backdrop-blur-md border-r border-border-main flex flex-col shrink-0 h-auto md:h-full transition-all duration-300 ease-in-out shadow-sm`}>
      <div className="h-16 flex items-center px-6 border-b border-border-main justify-between">
        <div className="flex items-center overflow-hidden">
          <div className={`w-8 h-8 rounded-lg bg-bg-active border border-border-active flex items-center justify-center text-text-active shadow-[0_0_10px_rgba(99,102,241,0.15)] shrink-0 ${isSidebarCollapsed ? 'mr-0' : 'mr-3'}`}>
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
          onClick={() => setActiveTab('resources')}
          className={`w-full flex items-center py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer font-mono ${
            isSidebarCollapsed ? 'justify-center px-0' : 'px-3'
          } ${
            activeTab === 'resources' 
              ? 'bg-bg-active text-text-active border border-border-active shadow-[0_0_12px_rgba(99,102,241,0.08)]' 
              : 'text-text-muted border border-transparent hover:bg-bg-input hover:text-text-main'
          }`}
          title={isSidebarCollapsed ? "Material Formativo" : undefined}
        >
          <BookOpen className={`${isSidebarCollapsed ? 'm-0' : 'mr-3'} h-5 w-5 shrink-0`} />
          {!isSidebarCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">Material Formativo</span>}
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`w-full flex items-center py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer font-mono ${
            isSidebarCollapsed ? 'justify-center px-0' : 'px-3'
          } ${
            activeTab === 'support' 
              ? 'bg-bg-active text-text-active border border-border-active shadow-[0_0_12px_rgba(99,102,241,0.08)]' 
              : 'text-text-muted border border-transparent hover:bg-bg-input hover:text-text-main'
          }`}
          title={isSidebarCollapsed ? "Canal de Soporte" : undefined}
        >
          <MessageSquare className={`${isSidebarCollapsed ? 'm-0' : 'mr-3'} h-5 w-5 shrink-0`} />
          {!isSidebarCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">Canal de Soporte</span>}
        </button>
      </nav>
    </aside>
  );
}
