import { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, AlertTriangle, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransactions } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useProfile';
import { useLoans } from '@/hooks/useLoans';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { AddTransactionDialog } from '@/components/transactions/AddTransactionDialog';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = ['#10b981','#ef4444','#f97316','#3b82f6','#8b5cf6','#06b6d4','#ec4899'];

export default function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { transactions, isLoading } = useTransactions(currentMonth);
  const { profile } = useProfile();
  const { totalEMI, totalDebt } = useLoans();
  const { goals, totalSaved, totalTarget } = useSavingsGoals();
  const currency = profile?.currency === 'INR' ? '₹' : '$';

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
      const existing = map.get(key);
      if (existing) existing.value += Number(t.amount);
      else map.set(key, { name: t.category?.name || 'Unknown', value: Number(t.amount), color: t.category?.color || '#6366f1' });
    });
    return Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [transactions]);

  const budgetPct = stats.budget > 0 ? Math.min((stats.expenses / stats.budget) * 100, 100) : 0;
  const isOverBudget = stats.expenses > stats.budget && stats.budget > 0;

  const fmt = (n: number) => `${currency}${n.toLocaleString('en-IN')}`;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Your financial overview at a glance</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm font-medium w-28 text-center">{format(currentMonth, 'MMMM yyyy')}</span>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}><ChevronRight className="w-4 h-4" /></Button>
            <AddTransactionDialog trigger={<Button size="sm" className="gap-2"><Plus className="w-4 h-4" />Add</Button>} />
          </div>
        </div>

        {/* Budget Alert */}
        {isOverBudget && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <p className="text-sm text-destructive font-medium">Budget Exceeded — You've spent {fmt(stats.expenses - stats.budget)} over your {fmt(stats.budget)} monthly budget</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Income', value: fmt(stats.income), icon: TrendingUp, color: 'text-income' },
            { label: 'Expenses', value: fmt(stats.expenses), icon: TrendingDown, color: 'text-expense' },
            { label: 'Savings', value: fmt(stats.savings), icon: Wallet, color: stats.savings >= 0 ? 'text-income' : 'text-expense' },
            { label: 'Monthly EMI', value: fmt(totalEMI), icon: Wallet, color: 'text-foreground', sub: `Total debt: ${fmt(totalDebt)}` },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <Card key={label}>
              <CardContent className="p-4">
                {isLoading ? <Skeleton className="h-10 w-full" /> : (
                  <>
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className={cn("text-xl font-bold", color)}>{value}</p>
                    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spending by Category */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Spending by Category</CardTitle></CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <div className="flex gap-4 items-center">
                  <PieChart width={160} height={160}>
                    <Pie data={categoryData} cx={75} cy={75} innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2}>
                      {categoryData.map((entry, i) => <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                  <div className="flex-1 space-y-2">
                    {categoryData.slice(0, 5).map((item, i) => {
                      const pct = stats.expenses > 0 ? ((item.value / stats.expenses) * 100).toFixed(1) : '0';
                      return (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || COLORS[i % COLORS.length] }} />
                            <span className="text-xs truncate max-w-[100px]">{item.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-8">No expense data</p>}
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Budget Overview</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Monthly Budget</span>
                <span className={cn("font-medium", isOverBudget ? "text-expense" : "text-foreground")}>{fmt(stats.expenses)} / {fmt(stats.budget)}</span>
              </div>
              <Progress value={budgetPct} className={cn("h-3", isOverBudget && "[&>div]:bg-expense")} />
              {isOverBudget ? (
                <Badge variant="expense">Over budget by {fmt(stats.expenses - stats.budget)}</Badge>
              ) : (
                <p className="text-xs text-muted-foreground">{fmt(stats.budget - stats.expenses)} remaining this month</p>
              )}
              <div className="pt-2 grid grid-cols-3 gap-3 text-center">
                <div><p className="text-xs text-muted-foreground">Income</p><p className="text-sm font-semibold text-income">{fmt(stats.income)}</p></div>
                <div><p className="text-xs text-muted-foreground">Expenses</p><p className="text-sm font-semibold text-expense">{fmt(stats.expenses)}</p></div>
                <div><p className="text-xs text-muted-foreground">Net Savings</p><p className={cn("text-sm font-semibold", stats.savings >= 0 ? 'text-income' : 'text-expense')}>{fmt(stats.savings)}</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">Recent Transactions</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No transactions this month</p>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 8).map(t => (
                    <div key={t.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (t.category?.color || '#6366f1') + '20' }}>
                          <span className="text-xs">{t.category?.name?.[0] || '?'}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t.description || t.category?.name || 'Transaction'}</p>
                          <p className="text-xs text-muted-foreground">{t.category?.name} • {format(new Date(t.date), 'MMM d')}</p>
                        </div>
                      </div>
                      <span className={cn("text-sm font-semibold", t.type === 'income' ? 'text-income' : 'text-expense')}>
                        {t.type === 'income' ? '+' : '-'}{currency}{Number(t.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goals */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Goal Milestones</CardTitle></CardHeader>
            <CardContent>
              {goals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No goals set</p>
              ) : (
                <div className="space-y-4">
                  {goals.slice(0, 4).map(g => {
                    const pct = g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0;
                    return (
                      <div key={g.id} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium truncate">{g.name}</span>
                          <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{currency}{Number(g.current_amount).toLocaleString('en-IN')}</span>
                          <span>{currency}{Number(g.target_amount).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
