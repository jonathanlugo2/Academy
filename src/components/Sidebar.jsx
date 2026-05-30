import { LayoutDashboard, FolderKanban, BookOpen, UserCircle, Settings } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { icon: LayoutDashboard, label: 'Inicio', active: true },
    { icon: FolderKanban, label: 'Proyectos' },
    { icon: BookOpen, label: 'Recursos' },
    { icon: UserCircle, label: 'Perfil' },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-950/80 backdrop-blur-md border-r border-zinc-800/80 flex flex-col hidden md:flex z-50">
      <div className="h-16 flex items-center px-6 border-b border-zinc-800/80">
        <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center mr-3 text-indigo-400 shadow-[0_0_10px_rgba(0,242,254,0.15)]">
          <span className="font-extrabold text-indigo-400 text-sm leading-none font-mono">A</span>
        </div>
        <span className="font-extrabold text-zinc-100 tracking-wider text-sm font-mono uppercase">Academy Portal</span>
      </div>
      
      <div className="flex-1 py-6 px-4">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 px-2 font-mono">MAIN MENU</div>
        <nav className="space-y-1.5">
          {navItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center px-3 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer font-mono ${
                item.active 
                  ? 'bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 shadow-[0_0_12px_rgba(0,242,254,0.08)]' 
                  : 'text-zinc-400 border border-transparent hover:bg-zinc-900/40 hover:text-zinc-200'
              }`}
            >
              <item.icon className={`mr-3 h-4.5 w-4.5 shrink-0 ${item.active ? 'text-indigo-400' : 'text-zinc-500'}`} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-zinc-800/80">
        <button className="w-full flex items-center px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 border border-transparent rounded-xl hover:bg-zinc-900/40 hover:text-zinc-200 transition-all cursor-pointer font-mono">
          <Settings className="mr-3 h-4.5 w-4.5 text-zinc-500" />
          Ajustes
        </button>
      </div>
    </aside>
  );
}
