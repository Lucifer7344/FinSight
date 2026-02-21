import { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, Target, CreditCard, Plus, ArrowUpRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useTransactions } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useProfile';
import { useLoans } from '@/hooks/useLoans';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { AddTransactionDialog } from '@/components/transactions/AddTransactionDialog';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';

const CHART_COLORS = ['#10b981','#ef4444','#f97316','#3b82f6','#8b5cf6','#06b6d4'];

function GlassStatCard({ title, value, sub, icon: Icon, gradient, delay = 0 }: any) {
  return (
    <div className={`stat-card animate-fade-in-up`} style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/50" />
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs font-medium text-muted-foreground mt-0.5">{title}</p>
      {sub && <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { transactions, isLoading } = useTransactions(currentMonth);
  const { profile } = useProfile();
  const { totalEMI, totalDebt } = useLoans();
  const { goals, totalSaved, totalTarget } = useSavingsGoals();
  const currency = profile?.currency === 'INR' ? '₹' : '$';
  const fmt = (n: number) => `${currency}${n.toLocaleString('en-IN')}`;

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const budget = Number(profile?.monthly_budget) || 0;
    return { income, expenses, savings: income - expenses, budget };
  }, [transactions, profile]);

  const categoryData = useMemo(() => {
    const map = new Map<string, { name: string; value: number; color: string }>();
    transactions.filter(t => t.type === 'expense' && t.category).forEach(t => {
      const key = t.category_id!;
      const ex = map.get(key);
      if (ex) ex.value += Number(t.amount);
      else map.set(key, { name: t.category?.name || 'Other', value: Number(t.amount), color: t.category?.color || '#6366f1' });
    });
    return Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [transactions]);

  // Last 6 months bar chart data
  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const s = startOfMonth(d); const e = endOfMonth(d);
      const monthly = transactions.filter(t => { const td = new Date(t.date); return td >= s && td <= e; });
      return {
        month: format(d, 'MMM'),
        income: monthly.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0),
        expense: monthly.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0),
      };
    });
  }, [transactions]);

  const budgetPct = stats.budget > 0 ? Math.min((stats.expenses / stats.budget) * 100, 100) : 0;
  const isOverBudget = stats.expenses > stats.budget && stats.budget > 0;
  const recentTx = transactions.slice(0, 6);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass-panel p-3 rounded-xl text-xs space-y-1">
        <p className="font-semibold">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-5 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {format(currentMonth, 'MMMM yyyy')} · Your financial overview
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Month nav */}
            <div className="glass-card flex items-center rounded-xl overflow-hidden">
              <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                className="px-2.5 py-2 hover:bg-muted/50 transition-colors text-muted-foreground">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-semibold">{format(currentMonth, 'MMM yy')}</span>
              <button onClick={() => setCurrentMonth(m => subMonths(m, -1))}
                className="px-2.5 py-2 hover:bg-muted/50 transition-colors text-muted-foreground">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <AddTransactionDialog trigger={
              <button className="glass-primary h-9 px-4 rounded-xl text-sm font-semibold flex items-center gap-1.5 hover:opacity-90 transition-all">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            } />
          </div>
        </div>

        {/* Stat cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <GlassStatCard title="Total Income" value={fmt(stats.income)} icon={TrendingUp} gradient="glass-income" delay={0} />
            <GlassStatCard title="Total Expenses" value={fmt(stats.expenses)} icon={TrendingDown} gradient="glass-expense" delay={0.05} />
            <GlassStatCard title="Net Savings" value={fmt(stats.savings)} icon={Wallet}
              gradient={stats.savings >= 0 ? 'glass-primary' : 'glass-expense'} delay={0.1} />
            <GlassStatCard title="EMI / Loans" value={fmt(totalEMI)} sub={`${fmt(totalDebt)} total debt`} icon={CreditCard} gradient="glass-amber" delay={0.15} />
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar chart */}
          <div className="glass-card rounded-2xl p-5 lg:col-span-2 animate-fade-in-up delay-200">
            <h3 className="text-sm font-bold mb-4">Income vs Expenses (6 months)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${currency}${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="income" name="Income" fill="hsl(152 60% 40%)" radius={[6,6,0,0]} />
                <Bar dataKey="expense" name="Expense" fill="hsl(12 80% 50%)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="glass-card rounded-2xl p-5 animate-fade-in-up delay-300">
            <h3 className="text-sm font-bold mb-4">Spending by Category</h3>
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value">
                      {categoryData.map((entry, i) => <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)', borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {categoryData.slice(0,4).map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color || CHART_COLORS[i] }} />
                      <span className="flex-1 truncate text-muted-foreground">{c.name}</span>
                      <span className="font-semibold">{fmt(c.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">No expense data</div>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent transactions */}
          <div className="glass-card rounded-2xl p-5 lg:col-span-2 animate-fade-in-up delay-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">Recent Transactions</h3>
              <a href="/transactions" className="text-xs text-primary hover:underline">View all →</a>
            </div>
            {recentTx.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No transactions this month</p>
            ) : (
              <div className="space-y-2">
                {recentTx.map(tx => (
                  <div key={tx.id} className="glass-row flex items-center gap-3 p-3 rounded-xl transition-all">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: `${tx.category?.color || '#6366f1'}22`, color: tx.category?.color || '#6366f1', border: `1px solid ${tx.category?.color || '#6366f1'}33` }}>
                      {(tx.category?.name || tx.description || 'T')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description || tx.category?.name || 'Transaction'}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(tx.date), 'dd MMM')}</p>
                    </div>
                    <span className={cn('text-sm font-bold font-mono', tx.type === 'income' ? 'income-text' : 'expense-text')}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(Number(tx.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column: budget + goals */}
          <div className="space-y-4">
            {/* Budget */}
            <div className="glass-card rounded-2xl p-5 animate-fade-in-up delay-400">
              <h3 className="text-sm font-bold mb-4">Budget Status</h3>
              {stats.budget > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Spent</span>
                    <span className={cn('font-bold', isOverBudget ? 'expense-text' : 'income-text')}>
                      {budgetPct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--glass-bg)' }}>
                    <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                      style={{
                        width: `${budgetPct}%`,
                        background: isOverBudget ? 'var(--gradient-expense)' : 'var(--gradient-income)'
                      }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{fmt(stats.expenses)} spent</span>
                    <span className="text-muted-foreground">{fmt(stats.budget)} budget</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">Set a budget in Settings</p>
              )}
            </div>

            {/* Goals summary */}
            <div className="glass-card rounded-2xl p-5 animate-fade-in-up delay-400">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Savings Goals</h3>
                <a href="/goals" className="text-xs text-primary hover:underline">View all →</a>
              </div>
              {goals.length > 0 ? (
                <div className="space-y-3">
                  {goals.slice(0, 2).map(g => {
                    const pct = Math.min(100, (Number(g.current_amount) / Number(g.target_amount)) * 100);
                    return (
                      <div key={g.id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium truncate">{g.name}</span>
                          <span className="text-muted-foreground ml-2">{pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--glass-bg)' }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'var(--gradient-primary)' }} />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted-foreground">{goals.filter(g => g.is_completed).length}/{goals.length} completed</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Target className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                  <a href="/goals" className="text-xs text-primary hover:underline">Set a goal →</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
