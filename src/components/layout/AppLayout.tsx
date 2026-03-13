import React from 'react';
import { Outlet, Navigate, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, ArrowRightLeft, Bell, TrendingUp, User, Settings, ShieldAlert } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user && !user.email_confirmed_at) return <Navigate to="/confirm-email" replace />;

  const navItems = [
    { to: '/', icon: Home, label: 'الرئيسية' },
    { to: '/transfer', icon: ArrowRightLeft, label: 'التحويلات' },
    { to: '/earnings', icon: TrendingUp, label: 'الأرباح' },
    { to: '/account', icon: User, label: 'الحساب' },
    { to: '/settings', icon: Settings, label: 'الإعدادات' },
  ];

  if (profile?.role === 'admin') {
    navItems.push({ to: '/admin', icon: ShieldAlert, label: 'لوحة التحكم' });
  }

  const displayName = profile?.fullName || profile?.email || 'User';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-l border-gray-100 h-screen sticky top-0 shadow-sm z-40">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <h1 className="text-xl font-black text-gray-900 tracking-tight truncate">VolckaPay</h1>
            <p className="text-xs text-gray-500 truncate">{displayName}</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300
                ${isActive 
                  ? 'bg-indigo-50 text-indigo-600 font-bold' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'}
              `}
            >
              <item.icon size={22} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top App Bar (Mobile & Desktop) */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-30 flex items-center justify-between shadow-sm lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">VolckaPay</h1>
          </div>
          <div className="hidden lg:block">
            <h2 className="text-xl font-bold text-gray-800">مرحباً، {displayName}</h2>
          </div>
          <Link to="/notifications" className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
            <Bell size={24} />
            {/* Unread badge indicator (optional) */}
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation (Mobile Only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 sm:px-6 py-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] pb-safe">
        <nav className="flex items-center justify-between max-w-md mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 min-w-[64px]
                ${isActive 
                  ? 'text-indigo-600 scale-105' 
                  : 'text-gray-400 hover:text-gray-600'}
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon 
                    size={22} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className={isActive ? 'drop-shadow-sm' : ''} 
                  />
                  <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'} transition-all duration-300 whitespace-nowrap`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};
