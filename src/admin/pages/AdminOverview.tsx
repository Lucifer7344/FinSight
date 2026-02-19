import { Link } from 'react-router-dom';
import { Users, ArrowLeftRight, TrendingUp, TrendingDown, CreditCard, Target, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminOverview, useAdminSignups, useAdminTxAnalytics } from '../hooks/useAdminData';
import { formatAdminCurrency, formatNumber, timeAgo } from '../lib/adminUtils';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function StatCard({ label, value, icon: Icon, color = 'primary', sub }: any) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    red: 'text-red-400 bg-red-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
  };
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminOverview() {
  const { data: stats, isLoading } = useAdminOverview();
  const { data: signups } = useAdminSignups();
  const { data: txChart } = useAdminTxAnalytics();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Overview</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Platform-wide FinSight statistics</p>
        </div>
        <Link to="/admin/database" className="text-sm text-primary hover:underline">View database →</Link>
      </div>

      {/* Stats Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-24" />) : (
          <>
            <StatCard label="Total Users" value={formatNumber(stats?.userCount ?? 0)} icon={Users} color="cyan" />
            <StatCard label="Transactions" value={formatNumber(stats?.txCount ?? 0)} icon={ArrowLeftRight} color="violet" />
            <StatCard label="Total Income" value={formatAdminCurrency(stats?.totalIncome ?? 0)} icon={TrendingUp} color="emerald" />
            <StatCard label="Total Expenses" value={formatAdminCurrency(stats?.totalExpense ?? 0)} icon={TrendingDown} color="red" />
          </>
        )}
      </div>

      {/* Stats Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Loans" value={stats?.loanCount ?? 0} icon={CreditCard} color="amber" />
        <StatCard label="Savings Goals" value={stats?.goalCount ?? 0} icon={Target} color="primary" />
        <StatCard
          label="Net Savings"
          value={formatAdminCurrency((stats?.totalIncome ?? 0) - (stats?.totalExpense ?? 0))}
          icon={TrendingUp} color="emerald"
        />
        <StatCard
          label="Savings Rate"
          value={stats?.totalIncome ? `${(((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100).toFixed(1)}%` : '—'}
          icon={Activity} color="cyan"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">User Signups (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            {signups ? (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={signups} margin={{ top: 4, right: 4, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => v.slice(5)} interval={6} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="signups" stroke="hsl(var(--primary))" fill="url(#sg)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-40" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Monthly Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {txChart ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={txChart} margin={{ top: 4, right: 4, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `₹${formatNumber(v)}`} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => formatAdminCurrency(v)} />
                  <Bar dataKey="income" name="Income" fill="hsl(var(--income, 142 71% 45%))" radius={[3,3,0,0]} />
                  <Bar dataKey="expense" name="Expense" fill="hsl(var(--expense, 0 70% 55%))" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-40" />}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold">Recent Transactions (All Users)</CardTitle>
          <Link to="/admin/activity" className="text-xs text-primary hover:underline">View all →</Link>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : stats?.recentTx.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No transactions yet</div>
          ) : (
            <div className="divide-y divide-border">
              {stats?.recentTx.map((tx: any) => (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tx.type === 'income' ? 'bg-income' : 'bg-expense'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{tx.description || 'Transaction'}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(tx.created_at)}</p>
                  </div>
                  <span className={`text-sm font-semibold font-mono ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatAdminCurrency(Number(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
