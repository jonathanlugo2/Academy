import { LayoutDashboard, FolderKanban, BookOpen, UserCircle, Settings } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { icon: LayoutDashboard, label: 'Inicio', active: true },
    { icon: FolderKanban, label: 'Proyectos' },
    { icon: BookOpen, label: 'Recursos' },
    { icon: UserCircle, label: 'Perfil' },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-bg-sidebar/80 backdrop-blur-md border-r border-border-main flex flex-col hidden md:flex z-50">
      <div className="h-16 flex items-center px-6 border-b border-border-main">
        <div className="w-8 h-8 rounded-lg bg-bg-active border border-border-active flex items-center justify-center mr-3 text-text-active shadow-[0_0_10px_rgba(15,117,188,0.15)]">
          <span className="font-extrabold text-text-active text-sm leading-none font-mono">A</span>
        </div>
        <span className="font-extrabold text-text-title tracking-wider text-sm font-mono uppercase">Academy Portal</span>
      </div>
      
      <div className="flex-1 py-6 px-4">
        <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 px-2 font-mono">MAIN MENU</div>
        <nav className="space-y-1.5">
          {navItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center px-3 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer font-mono ${
                item.active 
                  ? 'bg-bg-active border border-border-active text-text-active shadow-[0_0_12px_rgba(15,117,188,0.08)]' 
                  : 'text-text-muted border border-transparent hover:bg-bg-input/40 hover:text-text-main'
              }`}
            >
              <item.icon className={`mr-3 h-4.5 w-4.5 shrink-0 ${item.active ? 'text-text-active' : 'text-text-muted'}`} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-border-main">
        <button className="w-full flex items-center px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-muted border border-transparent rounded-xl hover:bg-bg-input/40 hover:text-text-main transition-all cursor-pointer font-mono">
          <Settings className="mr-3 h-4.5 w-4.5 text-text-muted" />
          Ajustes
        </button>
      </div>
    </aside>
  );
}
