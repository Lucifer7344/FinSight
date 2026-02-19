import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { toast } from 'sonner';

export function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    await new Promise(r => setTimeout(r, 400));
    if (login(password)) {
      toast.success('Welcome to Admin Panel');
      navigate('/admin');
    } else {
      setError('Invalid admin password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        {/* Back link */}
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to FinSight
        </Link>

        <Card className="border-border">
          <CardHeader className="text-center pb-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-7 h-7 text-cyan-400" />
            </div>
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Enter your admin password to continue</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Admin Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoFocus
                />
                {error && <p className="text-xs text-destructive mt-1.5 flex items-center gap-1"><Shield className="w-3 h-3" />{error}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading || !password}>
                {loading ? 'Authenticating…' : 'Access Dashboard'}
              </Button>
            </form>
            <div className="mt-4 pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                Default: <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">admin123</code>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Set <code>VITE_ADMIN_PASSWORD</code> in .env to change
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
