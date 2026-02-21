import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, Shield, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { toast } from 'sonner';

export function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    await new Promise(r => setTimeout(r, 500));
    if (login(password)) {
      toast.success('Welcome to Admin Panel');
      navigate('/admin');
    } else {
      setError('Invalid admin password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 glass-bg">
      {/* Orbs */}
      <div className="glass-orb w-96 h-96 bg-cyan-400/15 -top-20 -right-20 fixed animate-float" />
      <div className="glass-orb w-64 h-64 bg-blue-400/10 bottom-0 left-0 fixed" style={{ animation: 'float 8s ease-in-out infinite', animationDelay: '2s' }} />

      <div className="w-full max-w-sm relative z-10 animate-scale-in">
        <Link to="/auth" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />Back to FinSight
        </Link>

        <div className="glass-panel rounded-3xl p-8 space-y-6">
          {/* Icon */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-xl"
              style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', boxShadow: '0 8px 30px rgba(6,182,212,0.4)' }}>
              <Layers className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Enter password to access the dashboard</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
              <div className="relative">
                <Input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Admin password"
                  className="glass-input h-11 rounded-xl border-0 pr-10"
                  autoFocus
                />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-xs text-destructive p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                  <Shield className="w-3.5 h-3.5" />{error}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading || !password}
              className="w-full h-11 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none"
              style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', boxShadow: '0 4px 16px rgba(6,182,212,0.4)' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {loading ? 'Authenticating…' : 'Access Dashboard'}
            </button>
          </form>

          <div className="text-center pt-2 border-t" style={{ borderColor: 'var(--glass-border-subtle)' }}>
            <p className="text-xs text-muted-foreground">
              Default: <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">admin123</code>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Set <code>VITE_ADMIN_PASSWORD</code> in .env</p>
          </div>
        </div>
      </div>
    </div>
  );
}
