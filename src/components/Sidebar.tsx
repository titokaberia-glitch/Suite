import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  BedDouble, 
  CalendarDays, 
  UtensilsCrossed, 
  Package, 
  BarChart3, 
  Settings,
  LogOut,
  Hotel,
  Users,
  ShoppingBag,
  Wallet
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['admin', 'receptionist', 'manager'] },
    { icon: BedDouble, label: 'Rooms', path: '/rooms', roles: ['admin', 'receptionist'] },
    { icon: CalendarDays, label: 'Reservations', path: '/reservations', roles: ['admin', 'receptionist'] },
    { icon: UtensilsCrossed, label: 'POS', path: '/pos', roles: ['admin', 'waiter'] },
    { icon: ShoppingBag, label: 'Orders', path: '/orders', roles: ['admin', 'waiter', 'manager'] },
    { icon: Package, label: 'Inventory', path: '/inventory', roles: ['admin'] },
    { icon: Wallet, label: 'Finances', path: '/finances', roles: ['admin', 'manager'] },
    { icon: Users, label: 'Staff', path: '/staff', roles: ['admin', 'manager'] },
    { icon: BarChart3, label: 'Reports', path: '/reports', roles: ['admin', 'manager'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <aside className="w-72 glass-card border-r border-white/20 dark:border-white/10 flex flex-col h-screen sticky top-0 z-20">
      <div className="p-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 hover:rotate-12 transition-transform duration-300 cursor-pointer">
          <Hotel className="text-white w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">SuiteControl</span>
          <span className="text-[9px] font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase mt-1">System</span>
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-2 mt-4 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-4 px-5 py-3.5 rounded-2xl text-xs font-bold tracking-widest uppercase transition-all duration-200 active:scale-95",
              isActive 
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md border border-slate-100 dark:border-slate-700" 
                : "text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="bg-white/50 dark:bg-slate-900/50 rounded-3xl p-4 mb-4 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
              <Users className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">{user?.name}</p>
              <p className="text-[10px] font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase mt-0.5">{user?.role}</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-5 py-4 btn-destructive"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
