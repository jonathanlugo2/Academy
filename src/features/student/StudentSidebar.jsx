import React from 'react';
import { 
  GraduationCap, ChevronRight, ChevronLeft, BookOpen, 
  MessageSquare
} from 'lucide-react';

export default function StudentSidebar({ 
  isSidebarCollapsed, 
  setIsSidebarCollapsed, 
  activeTab, 
  setActiveTab
}) {

  return (
    <aside 
      className={`fixed bottom-0 left-0 right-0 z-50 h-16 w-full flex flex-row border-t border-border-main bg-bg-sidebar/95 backdrop-blur-lg shadow-lg md:relative md:bottom-auto md:left-auto md:right-auto md:z-10 md:h-full ${
        isSidebarCollapsed ? 'md:w-20' : 'md:w-64'
      } md:flex-col md:border-t-0 md:border-r md:border-border-main md:shadow-sm transition-all duration-300 ease-in-out`}
    >
      {/* Header del Sidebar (Solo Visible en Escritorio) */}
      <div className="hidden md:flex h-16 items-center px-6 border-b border-border-main justify-between shrink-0 w-full">
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
      <nav className="flex flex-row justify-around items-center p-2 w-full h-full overflow-hidden md:flex-col md:justify-start md:items-stretch md:p-4 md:space-y-1.5 md:h-auto md:flex-1 md:overflow-y-auto no-scrollbar">
        
        {/* Botón: Formación */}
        <button
          onClick={() => setActiveTab('resources')}
          className={`flex flex-col justify-center items-center py-1 px-2 h-full w-24 rounded-xl transition-all cursor-pointer font-mono md:w-full md:flex-row md:justify-start md:items-center md:h-auto md:py-2.5 md:rounded-xl md:border ${
            isSidebarCollapsed ? 'md:justify-center md:px-0' : 'md:px-3'
          } ${
            activeTab === 'resources' 
              ? 'bg-bg-active text-text-active border border-border-active shadow-[0_0_12px_rgba(99,102,241,0.08)]' 
              : 'text-text-muted border-transparent hover:bg-bg-input hover:text-text-main'
          }`}
          title={isSidebarCollapsed ? "Material Formativo" : undefined}
        >
          <BookOpen className={`${isSidebarCollapsed ? 'md:m-0' : 'md:mr-3'} h-5 w-5 shrink-0`} />
          {!isSidebarCollapsed && (
            <span className="hidden md:inline whitespace-nowrap transition-opacity duration-300 text-xs font-semibold uppercase tracking-wider">
              Material Formativo
            </span>
          )}
          <span className="inline md:hidden text-[9px] mt-0.5 tracking-tight font-medium font-sans">
            Formación
          </span>
        </button>

        {/* Botón: Soporte */}
        <button
          onClick={() => setActiveTab('support')}
          className={`flex flex-col justify-center items-center py-1 px-2 h-full w-24 rounded-xl transition-all cursor-pointer font-mono md:w-full md:flex-row md:justify-start md:items-center md:h-auto md:py-2.5 md:rounded-xl md:border ${
            isSidebarCollapsed ? 'md:justify-center md:px-0' : 'md:px-3'
          } ${
            activeTab === 'support' 
              ? 'bg-bg-active text-text-active border border-border-active shadow-[0_0_12px_rgba(99,102,241,0.08)]' 
              : 'text-text-muted border-transparent hover:bg-bg-input hover:text-text-main'
          }`}
          title={isSidebarCollapsed ? "Canal de Soporte" : undefined}
        >
          <MessageSquare className={`${isSidebarCollapsed ? 'md:m-0' : 'md:mr-3'} h-5 w-5 shrink-0`} />
          {!isSidebarCollapsed && (
            <span className="hidden md:inline whitespace-nowrap transition-opacity duration-300 text-xs font-semibold uppercase tracking-wider">
              Canal de Soporte
            </span>
          )}
          <span className="inline md:hidden text-[9px] mt-0.5 tracking-tight font-medium font-sans">
            Soporte
          </span>
        </button>
      </nav>
    </aside>
  );
}
