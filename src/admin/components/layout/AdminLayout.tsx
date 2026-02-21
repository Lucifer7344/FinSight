import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Database, Terminal, Users, BarChart2, Activity, Bell, Settings, LogOut, Menu, X, Layers, ExternalLink, ChevronRight } from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { cn } from '@/lib/utils';

const adminNav = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { path: '/admin/database', label: 'Database', icon: Database },
  { path: '/admin/sql', label: 'SQL Editor', icon: Terminal },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/admin/activity', label: 'Activity', icon: Activity },
  { path: '/admin/alerts', label: 'Alerts', icon: Bell },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleLogout = () => { logout(); navigate('/admin/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', boxShadow: '0 4px 14px rgba(6,182,212,0.35)' }}>
            <Layers className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-sidebar-foreground">Admin Panel</p>
            <p className="text-[10px] text-muted-foreground">FinSight Control</p>
          </div>
        </div>
        <NavLink to="/dashboard" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-0.5">
          <ExternalLink className="w-3 h-3" />Back to app
        </NavLink>
      </div>

      <div className="mx-4 h-px" style={{ background: 'var(--glass-border-subtle)' }} />

      <nav className="flex-1 p-3 space-y-0.5 mt-2 overflow-y-auto">
        {adminNav.map(({ path, label, icon: Icon, end }) => (
          <NavLink key={path} to={path} end={end} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 glass-nav-item group',
              isActive
                ? 'text-white'
                : 'text-sidebar-foreground hover:text-sidebar-accent-foreground'
            )}
            style={({ isActive }) => isActive ? {
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              boxShadow: '0 4px 14px rgba(6,182,212,0.30)',
            } : {}}>
            {({ isActive }) => (
              <>
                <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-white' : 'text-muted-foreground')} />
                <span>{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 ml-auto text-white/70" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3">
        <div className="mx-0 h-px mb-3" style={{ background: 'var(--glass-border-subtle)' }} />
        <div className="glass-card flex items-center gap-2.5 p-3 rounded-xl mb-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs text-muted-foreground">Live · Admin Session</span>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-destructive transition-all glass-nav-item">
          <LogOut className="w-3.5 h-3.5" />Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen glass-bg overflow-hidden">
      {/* Orbs */}
      <div className="glass-orb w-80 h-80 bg-cyan-400/12 -top-20 -left-20 fixed" />
      <div className="glass-orb w-64 h-64 bg-blue-400/8 bottom-0 right-0 fixed" />

      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 glass-sidebar relative z-10">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <aside className="absolute left-0 top-0 bottom-0 w-64 glass-panel z-50 animate-slide-in-left" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="font-bold text-sm" style={{ color: '#06b6d4' }}>Admin Panel</span>
              <button onClick={() => setSidebarOpen(false)} className="glass-btn w-7 h-7 rounded-lg flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 glass-panel" style={{ borderBottom: '1px solid var(--glass-border-subtle)' }}>
          <button onClick={() => setSidebarOpen(true)} className="glass-btn w-9 h-9 rounded-xl flex items-center justify-center">
            <Menu className="w-4 h-4" />
          </button>
          <span className="font-bold text-sm" style={{ color: '#06b6d4' }}>Admin Panel</span>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />Live
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
