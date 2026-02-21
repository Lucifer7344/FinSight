import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, Loader2, AlertCircle, TrendingUp, Shield, Zap, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const schema = z.object({
  fullName: z.string().min(2).optional().or(z.literal('')),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'At least 6 characters'),
});
type FormData = z.infer<typeof schema>;

const features = [
  { icon: TrendingUp, title: 'Smart Analytics', desc: 'Visual charts and insights about your spending habits' },
  { icon: Shield, title: 'Secure & Private', desc: 'Your data is encrypted and protected with Supabase RLS' },
  { icon: Zap, title: 'Instant Updates', desc: 'Real-time sync across all your devices automatically' },
];

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true); setAuthError(null);
    try {
      if (isSignUp) {
        const { error } = await signUp(data.email, data.password, data.fullName);
        if (error) throw error;
        toast.success('Account created! Check your email to verify.');
      } else {
        const { error } = await signIn(data.email, data.password);
        if (error) throw error;
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      setAuthError(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex glass-bg">
      {/* Background orbs */}
      <div className="glass-orb w-[500px] h-[500px] bg-primary/20 -top-32 -left-32 fixed animate-float" />
      <div className="glass-orb w-80 h-80 bg-blue-400/15 bottom-0 left-1/4 fixed" style={{ animationDelay: '3s', animation: 'float 8s ease-in-out infinite' }} />
      <div className="glass-orb w-64 h-64 bg-purple-400/10 top-1/3 right-0 fixed" style={{ animationDelay: '1.5s', animation: 'float 7s ease-in-out infinite' }} />

      {/* Left panel — feature showcase */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 animate-fade-in-up">
          <div className="w-11 h-11 rounded-2xl glass-primary flex items-center justify-center shadow-xl">
            <Sparkles className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <span className="font-bold text-xl gradient-text">FinSight</span>
            <p className="text-xs text-muted-foreground">Personal Finance</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="space-y-8 animate-fade-in-up delay-100">
          <div className="space-y-4">
            <div className="glass-badge inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-primary">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Smart Finance Tracking
            </div>
            <h1 className="text-5xl font-bold tracking-tight leading-tight">
              Take control of your<br />
              <span className="gradient-text">financial future</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-sm">
              Track income, expenses, loans, and savings with beautiful analytics and smart insights.
            </p>
          </div>

          {/* Feature cards */}
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={f.title} className={`glass-card flex items-center gap-4 p-4 rounded-2xl animate-fade-in-up`} style={{ animationDelay: `${(i + 2) * 0.1}s` }}>
                <div className="w-10 h-10 rounded-xl glass-primary flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-6 animate-fade-in-up delay-400">
          {[['10k+', 'Users'], ['₹50Cr+', 'Tracked'], ['4.9★', 'Rating']].map(([val, label]) => (
            <div key={label} className="glass-card px-5 py-3 rounded-2xl text-center">
              <p className="text-xl font-bold gradient-text">{val}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md animate-scale-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl glass-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">FinSight</span>
          </div>

          <div className="glass-panel rounded-3xl p-8 space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {isSignUp ? 'Create account' : 'Welcome back'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isSignUp ? 'Start tracking your finances today' : 'Sign in to your FinSight account'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                  <Input
                    {...form.register('fullName')}
                    placeholder="Your name"
                    className="glass-input h-11 rounded-xl border-0"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input
                  {...form.register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className="glass-input h-11 rounded-xl border-0"
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                <div className="relative">
                  <Input
                    {...form.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="glass-input h-11 rounded-xl border-0 pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              {authError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {authError}
                </div>
              )}

              <button type="submit" disabled={isLoading}
                className="w-full h-11 glass-primary rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isLoading ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            {/* Toggle */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button onClick={() => { setIsSignUp(s => !s); setAuthError(null); form.reset(); }}
                  className="font-semibold text-primary hover:underline underline-offset-2 transition-all">
                  {isSignUp ? 'Sign in' : 'Sign up free'}
                </button>
              </p>
            </div>

            {/* Admin link */}
            <div className="text-center pt-2 border-t" style={{ borderColor: 'var(--glass-border-subtle)' }}>
              <a href="/admin/login" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Admin Panel →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
