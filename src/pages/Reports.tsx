import { useState, useMemo } from 'react';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTransactions } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useProfile';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const COLORS = ['#10b981','#ef4444','#f97316','#3b82f6','#8b5cf6','#06b6d4','#ec4899','#eab308'];

export default function Reports() {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const { transactions: allTx } = useTransactions();
  const { profile } = useProfile();
  const currency = profile?.currency === 'INR' ? '₹' : '$';

  const filtered = useMemo(() => {
    if (period === 'monthly') {
      const d = new Date(selectedYear, selectedMonth, 1);
      const start = format(startOfMonth(d), 'yyyy-MM-dd');
      const end = format(endOfMonth(d), 'yyyy-MM-dd');
      return allTx.filter(t => t.date >= start && t.date <= end);
    } else {
      const start = format(startOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd');
      const end = format(endOfYear(new Date(selectedYear, 11, 31)), 'yyyy-MM-dd');
      return allTx.filter(t => t.date >= start && t.date <= end);
    }
  }, [allTx, period, selectedYear, selectedMonth]);

  const stats = useMemo(() => {
    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    return { income, expenses, savings: income - expenses, txCount: filtered.length };
  }, [filtered]);

  const catData = useMemo(() => {
    const map = new Map<string, { name: string; value: number; color: string }>();
    filtered.filter(t => t.type === 'expense' && t.category).forEach(t => {
      const k = t.category_id!;
      if (map.has(k)) map.get(k)!.value += Number(t.amount);
      else map.set(k, { name: t.category!.name, value: Number(t.amount), color: t.category!.color || '#6366f1' });
    });
    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const barData = useMemo(() => {
    if (period === 'yearly') {
      return MONTHS.map((m, i) => {
        const d = new Date(selectedYear, i, 1);
        const start = format(startOfMonth(d), 'yyyy-MM-dd');
        const end = format(endOfMonth(d), 'yyyy-MM-dd');
        const monthTx = allTx.filter(t => t.date >= start && t.date <= end);
        return { month: m.slice(0, 3), income: monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0), expenses: monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) };
      });
    }
    return [
      { period: 'Income', value: stats.income },
      { period: 'Expenses', value: stats.expenses },
    ];
  }, [allTx, period, selectedYear, stats]);

  const fmt = (n: number) => `${currency}${n.toLocaleString('en-IN')}`;
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Reports</h1><p className="text-muted-foreground text-sm">Analyze your spending patterns and trends</p></div>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" />Export PDF</Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={period} onValueChange={v => setPeriod(v as any)}>
            <TabsList><TabsTrigger value="monthly">Monthly</TabsTrigger><TabsTrigger value="yearly">Yearly</TabsTrigger></TabsList>
          </Tabs>
          <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          {period === 'monthly' && (
            <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
            </Select>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Income', value: fmt(stats.income), color: 'text-income' },
            { label: 'Expenses', value: fmt(stats.expenses), color: 'text-expense' },
            { label: 'Net Savings', value: fmt(stats.savings), color: stats.savings >= 0 ? 'text-income' : 'text-expense' },
            { label: 'Transactions', value: String(stats.txCount), color: 'text-foreground' },
          ].map(({ label, value, color }) => (
            <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">{label}</p><p className={cn("text-xl font-bold", color)}>{value}</p></CardContent></Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Spending by Category</CardTitle></CardHeader>
            <CardContent>
              {catData.length > 0 ? (
                <>
                  <PieChart width={280} height={220} style={{ margin: '0 auto' }}>
                    <Pie data={catData} cx={135} cy={100} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {catData.map((e, i) => <Cell key={i} fill={e.color || COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmt(v)} />
                  </PieChart>
                  <div className="space-y-2 mt-2">
                    {catData.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || COLORS[i % COLORS.length] }} />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <div className="flex gap-3 text-sm text-muted-foreground">
                          <span>{stats.expenses > 0 ? ((item.value / stats.expenses) * 100).toFixed(1) : '0'}%</span>
                          <span className="font-medium text-foreground">{fmt(item.value)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-center text-muted-foreground py-10">No expense data</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Income vs Expenses</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                {period === 'yearly' ? (
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${currency}${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => fmt(v)} />
                    <Bar dataKey="income" fill="#10b981" radius={[3,3,0,0]} name="Income" />
                    <Bar dataKey="expenses" fill="#ef4444" radius={[3,3,0,0]} name="Expenses" />
                  </BarChart>
                ) : (
                  <BarChart data={[{ name: 'Current', income: stats.income, expenses: stats.expenses }]} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${currency}${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => fmt(v)} />
                    <Bar dataKey="income" fill="#10b981" radius={[3,3,0,0]} name="Income" />
                    <Bar dataKey="expenses" fill="#ef4444" radius={[3,3,0,0]} name="Expenses" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Spending */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Top Spending Categories</CardTitle></CardHeader>
          <CardContent>
            {catData.length > 0 ? (
              <div className="space-y-3">
                {catData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: item.color || COLORS[i % COLORS.length] }}>{i + 1}</div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">{stats.expenses > 0 ? ((item.value / stats.expenses) * 100).toFixed(1) : '0'}%</span>
                      <span className="font-semibold w-24 text-right">{fmt(item.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-center py-6">No data for this period</p>}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
