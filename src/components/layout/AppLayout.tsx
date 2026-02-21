import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, ArrowLeftRight, CreditCard,
  Target, BarChart2, Wallet, Settings, LogOut, Menu, X,
  Sparkles, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/monthly', label: 'Monthly', icon: Calendar },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/loans', label: 'Loans', icon: CreditCard },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/reports', label: 'Reports', icon: BarChart2 },
  { path: '/budgets', label: 'Budgets', icon: Wallet },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => { await signOut(); navigate('/auth'); };
  const initials = (profile?.full_name || user?.email || 'U')[0].toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl glass-primary flex items-center justify-center shadow-lg">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <span className="font-bold text-base text-sidebar-foreground tracking-tight">FinSight</span>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Personal Finance</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px" style={{ background: 'var(--glass-border-subtle)' }} />

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto mt-2">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={path} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 glass-nav-item group',
              isActive
                ? 'glass-nav-active'
                : 'text-sidebar-foreground hover:text-sidebar-accent-foreground'
            )}>
            {({ isActive }) => (
              <>
                <Icon className={cn('w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110', isActive ? 'text-white' : 'text-muted-foreground')} />
                <span>{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/70" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 space-y-2">
        <div className="mx-0 h-px mb-2" style={{ background: 'var(--glass-border-subtle)' }} />
        <div className="glass-card flex items-center gap-3 p-3 rounded-xl">
          <div className="w-8 h-8 rounded-full glass-primary flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{profile?.full_name || user?.email?.split('@')[0]}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-destructive transition-all hover:bg-destructive/8 glass-nav-item"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen glass-bg overflow-hidden">
      {/* Background orbs */}
      <div className="glass-orb w-96 h-96 bg-primary/15 -top-20 -left-20 fixed" style={{ animationDelay: '0s' }} />
      <div className="glass-orb w-64 h-64 bg-blue-400/10 top-1/2 right-0 fixed" style={{ animationDelay: '2s' }} />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 glass-sidebar relative z-10">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <aside className="absolute left-0 top-0 bottom-0 w-64 glass-panel z-50 animate-slide-in-left" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="font-bold text-sm gradient-text">FinSight</span>
              <button onClick={() => setSidebarOpen(false)} className="glass-btn w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 glass-panel border-b-0 border-0" style={{ borderBottom: '1px solid var(--glass-border-subtle)' }}>
          <button onClick={() => setSidebarOpen(true)} className="glass-btn w-9 h-9 rounded-xl flex items-center justify-center">
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg glass-primary flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-base gradient-text">FinSight</span>
          </div>
          <div className="ml-auto">
            <div className="w-8 h-8 rounded-full glass-primary flex items-center justify-center text-xs font-bold text-white">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 xl:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
