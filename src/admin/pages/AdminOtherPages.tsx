import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminTxAnalytics, useAdminSignups, useAdminOverview, useAdminActivity, useAdminAllAlerts } from '../hooks/useAdminData';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { formatAdminCurrency, formatNumber, timeAgo } from '../lib/adminUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'sonner';

// ─── Analytics ─────────────────────────────────────────────────────────────
export function AdminAnalytics() {
  const { data: txChart } = useAdminTxAnalytics();
  const { data: signups } = useAdminSignups();
  const { data: stats } = useAdminOverview();

  const savingsRate = stats?.totalIncome
    ? (((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100).toFixed(1)
    : '0.0';

  const engagementData = [
    { name: 'Users', value: stats?.userCount ?? 0 },
    { name: 'Loans', value: stats?.loanCount ?? 0 },
    { name: 'Goals', value: stats?.goalCount ?? 0 },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(38 92% 50%)', 'hsl(142 71% 45%)'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Platform-wide financial insights</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Savings Rate', value: `${savingsRate}%`, desc: '(Income − Expenses) / Income' },
          { label: 'Avg Tx/User', value: stats ? formatNumber(stats.userCount > 0 ? Math.round(stats.txCount / stats.userCount) : 0) : '—', desc: 'Per user average' },
          { label: 'Total Flow', value: stats ? formatAdminCurrency(stats.totalIncome + stats.totalExpense) : '—', desc: 'All money movement' },
          { label: 'Net Balance', value: stats ? formatAdminCurrency(stats.totalIncome - stats.totalExpense) : '—', desc: 'Income minus expenses' },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{k.label}</p>
              <p className="text-2xl font-bold text-primary">{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Income vs Expenses (6 months)</CardTitle></CardHeader>
          <CardContent>
            {txChart ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={txChart} margin={{top:4,right:4,left:-20,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{fontSize:11, fill:'hsl(var(--muted-foreground))'}} />
                  <YAxis tick={{fontSize:11, fill:'hsl(var(--muted-foreground))'}} tickFormatter={v => `₹${formatNumber(v)}`} />
                  <Tooltip contentStyle={{background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:8,fontSize:12}}
                    formatter={(v:number) => formatAdminCurrency(v)} />
                  <Legend wrapperStyle={{fontSize:12, color:'hsl(var(--muted-foreground))'}} />
                  <Bar dataKey="income" name="Income" fill="hsl(142 71% 45%)" radius={[3,3,0,0]} />
                  <Bar dataKey="expense" name="Expense" fill="hsl(0 70% 55%)" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-48" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Signups (30 days)</CardTitle></CardHeader>
          <CardContent>
            {signups ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={signups} margin={{top:4,right:4,left:-25,bottom:0}}>
                  <defs>
                    <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{fontSize:10, fill:'hsl(var(--muted-foreground))'}} tickFormatter={v => v.slice(5)} interval={5} />
                  <YAxis tick={{fontSize:10, fill:'hsl(var(--muted-foreground))'}} allowDecimals={false} />
                  <Tooltip contentStyle={{background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:8,fontSize:12}} />
                  <Area type="monotone" dataKey="signups" stroke="hsl(var(--primary))" fill="url(#aGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-48" />}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Platform Engagement</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-6">
          <ResponsiveContainer width="40%" height={160}>
            <PieChart>
              <Pie data={engagementData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                {engagementData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:8,fontSize:12}} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3">
            {engagementData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-sm text-muted-foreground w-16">{d.name}</span>
                <span className="text-lg font-bold">{d.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Activity Log ──────────────────────────────────────────────────────────
export function AdminActivity() {
  const { data: activities, isLoading, dataUpdatedAt } = useAdminActivity();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  const filtered = activities?.filter(a => {
    const s = !search || a.description?.toLowerCase().includes(search.toLowerCase());
    const t = typeFilter === 'all' || a.type === typeFilter;
    return s && t;
  }) ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Real-time transaction stream</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search description…" className="max-w-xs" />
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['all','income','expense'] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${typeFilter===t?'bg-card text-foreground shadow':'text-muted-foreground hover:text-foreground'}`}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} entries</span>
      </div>

      <Card>
        {isLoading ? (
          <CardContent><div className="space-y-3 pt-4">{Array.from({length:8}).map((_,i) => <Skeleton key={i} className="h-14" />)}</div></CardContent>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((a: any) => {
              const cat = a.categories as any;
              return (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: cat?.color ? `${cat.color}22` : '#6366f122', color: cat?.color || '#6366f1', border: `1px solid ${cat?.color || '#6366f1'}44` }}>
                    {cat?.name?.[0] ?? 'T'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm truncate">{a.description || cat?.name || 'Transaction'}</p>
                      <Badge variant={a.type === 'income' ? 'default' : 'destructive'} className="text-xs">{a.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.date} · {timeAgo(a.created_at)}</p>
                  </div>
                  <span className={`text-sm font-semibold font-mono ${a.type==='income'?'text-income':'text-expense'}`}>
                    {a.type==='income'?'+':'-'}{formatAdminCurrency(Number(a.amount))}
                  </span>
                </div>
              );
            })}
            {filtered.length === 0 && <CardContent><p className="text-center py-10 text-sm text-muted-foreground">No activity found</p></CardContent>}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Alerts ────────────────────────────────────────────────────────────────
export function AdminAlerts() {
  const { data: alerts, isLoading } = useAdminAllAlerts();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all'|'unread'|'read'>('all');
  const unread = alerts?.filter(a => !a.is_read).length ?? 0;

  const filtered = alerts?.filter(a =>
    filter === 'all' ? true : filter === 'unread' ? !a.is_read : a.is_read
  ) ?? [];

  const markAllRead = async () => {
    await supabaseAdmin.from('alerts').update({ is_read: true }).eq('is_read', false);
    qc.invalidateQueries({ queryKey: ['admin', 'allAlerts'] });
    toast.success('All marked as read');
  };
  const deleteAlert = async (id: string) => {
    await supabaseAdmin.from('alerts').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin', 'allAlerts'] });
    toast.success('Alert deleted');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div><h1 className="text-2xl font-bold">Alerts</h1><p className="text-muted-foreground text-sm mt-0.5">System alerts across all users</p></div>
        {unread > 0 && <Button size="sm" variant="outline" onClick={markAllRead}>Mark all read ({unread})</Button>}
      </div>

      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {(['all','unread','read'] as const).map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-4 py-1.5 text-xs rounded-md font-medium transition-all ${filter===t?'bg-card text-foreground shadow':'text-muted-foreground hover:text-foreground'}`}>
            {t.charAt(0).toUpperCase()+t.slice(1)}{t==='unread'&&unread>0&&<span className="ml-1.5 bg-primary text-primary-foreground text-xs px-1.5 rounded-full">{unread}</span>}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? (
          <CardContent><div className="space-y-3 pt-4">{Array.from({length:6}).map((_,i) => <Skeleton key={i} className="h-16" />)}</div></CardContent>
        ) : filtered.length === 0 ? (
          <CardContent><p className="text-center py-10 text-sm text-muted-foreground">No alerts found</p></CardContent>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((alert: any) => (
              <div key={alert.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors ${!alert.is_read?'bg-primary/2':''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-xs ${
                  alert.type==='budget_exceeded'?'bg-destructive/10 text-destructive':
                  alert.type==='low_fund'?'bg-amber-500/10 text-amber-500':'bg-primary/10 text-primary'}`}>
                  !
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <Badge variant={alert.type==='budget_exceeded'?'destructive':alert.type==='low_fund'?'secondary':'default'}>
                      {alert.type.replace(/_/g,' ')}
                    </Badge>
                    {!alert.is_read && <div className="w-1.5 h-1.5 bg-primary rounded-full" />}
                  </div>
                  {alert.message && <p className="text-xs text-muted-foreground">{alert.message}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(alert.created_at)}</p>
                </div>
                <button onClick={() => deleteAlert(alert.id)} className="text-muted-foreground hover:text-destructive transition-colors text-xs mt-1">✕</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Settings ──────────────────────────────────────────────────────────────
export function AdminSettings() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-bold">Settings</h1><p className="text-muted-foreground text-sm mt-0.5">Admin panel configuration</p></div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Environment Setup</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Create a <code className="text-primary bg-primary/10 px-1 rounded">.env</code> file in the project root:</p>
          <pre className="bg-muted rounded-lg p-4 text-xs font-mono text-foreground overflow-x-auto leading-relaxed whitespace-pre-wrap">
{`# FinSight Combined - Environment Variables

# ─── Supabase (Required) ──────────────────────
VITE_SUPABASE_URL=https://oewncjptnbocpvdeihxi.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ld25janB0bmJvY3B2ZGVpaHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTk1NTgsImV4cCI6MjA4NzA3NTU1OH0.mA2IVcxGdgsVZXwtGBLnDuNKrRTC3Eh5hqKAzY1p0RM

# ─── Admin Panel ──────────────────────────────
VITE_ADMIN_PASSWORD=admin123

# ─── Optional: Full Admin SQL Access ──────────
# Get from: Supabase Dashboard → Settings → API → service_role
# VITE_SUPABASE_SERVICE_KEY=your_service_role_key`}
          </pre>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ⚠️ The service_role key bypasses Row Level Security. Only add it if you need full admin SQL access. Never expose it in public deployments.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Connection Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Project URL', val: 'https://oewncjptnbocpvdeihxi.supabase.co' },
            { label: 'Region', val: 'Auto-detected' },
            { label: 'Admin Password', val: 'Set via VITE_ADMIN_PASSWORD' },
          ].map(r => (
            <div key={r.label} className="flex justify-between py-2 px-3 rounded-lg bg-muted">
              <span className="text-xs text-muted-foreground">{r.label}</span>
              <span className="text-xs font-mono">{r.val}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Database Schema</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y divide-border/50">
            {[
              { t: 'profiles', d: 'User settings, currency, theme, budget' },
              { t: 'transactions', d: 'All income/expense entries' },
              { t: 'categories', d: 'Transaction categories per user' },
              { t: 'budgets', d: 'Monthly category budgets' },
              { t: 'loans', d: 'Loans and credit cards' },
              { t: 'savings_goals', d: 'Financial goals with progress' },
              { t: 'monthly_income', d: 'Monthly income records' },
              { t: 'alerts', d: 'System notifications' },
            ].map(r => (
              <div key={r.t} className="flex gap-4 py-2.5">
                <code className="text-xs text-primary w-32 flex-shrink-0">{r.t}</code>
                <span className="text-xs text-muted-foreground">{r.d}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
