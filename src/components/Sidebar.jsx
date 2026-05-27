import { LayoutDashboard, FolderKanban, BookOpen, UserCircle, Settings } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { icon: LayoutDashboard, label: 'Inicio', active: true },
    { icon: FolderKanban, label: 'Proyectos' },
    { icon: BookOpen, label: 'Recursos' },
    { icon: UserCircle, label: 'Perfil' },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex z-50">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center mr-3">
          <span className="font-bold text-slate-900 text-lg leading-none">A</span>
        </div>
        <span className="font-bold text-slate-200 tracking-tight">Academy</span>
      </div>
      
      <div className="flex-1 py-6 px-4">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4 px-2">Menu Principal</div>
        <nav className="space-y-1">
          {navItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                item.active 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <item.icon className={`mr-3 h-5 w-5 ${item.active ? 'text-blue-400' : 'text-slate-500'}`} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <button className="w-full flex items-center px-2 py-2 text-sm font-medium text-slate-400 rounded-md hover:bg-slate-800/50 hover:text-slate-200 transition-colors">
          <Settings className="mr-3 h-5 w-5 text-slate-500" />
          Ajustes
        </button>
      </div>
    </aside>
  );
}
