import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTransactions } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Budgets() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { transactions } = useTransactions(currentMonth);
  const { profile, updateProfile } = useProfile();
  const currency = profile?.currency === 'INR' ? '₹' : '$';
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [newBudget, setNewBudget] = useState('');

  const stats = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const budget = Number(profile?.monthly_budget) || 0;
    return { expenses, income, budget, savings: income - expenses };
  }, [transactions, profile]);

  const isOverBudget = stats.expenses > stats.budget && stats.budget > 0;
  const budgetPct = stats.budget > 0 ? Math.min((stats.expenses / stats.budget) * 100, 100) : 0;

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; spent: number; color: string }>();
    transactions.filter(t => t.type === 'expense' && t.category).forEach(t => {
      const k = t.category_id!;
      if (map.has(k)) map.get(k)!.spent += Number(t.amount);
      else map.set(k, { name: t.category!.name, spent: Number(t.amount), color: t.category!.color || '#6366f1' });
    });
    return Array.from(map.values()).sort((a, b) => b.spent - a.spent);
  }, [transactions]);

  const handleSaveBudget = async () => {
    try {
      await updateProfile.mutateAsync({ monthly_budget: Number(newBudget) });
      toast.success('Budget updated');
      setBudgetDialogOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const fmt = (n: number) => `${currency}${n.toLocaleString('en-IN')}`;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Budgets</h1><p className="text-muted-foreground text-sm">Track your spending limits</p></div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm font-medium w-28 text-center">{format(currentMonth, 'MMMM yyyy')}</span>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Monthly Budget Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Monthly Budget</CardTitle>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => { setNewBudget(String(stats.budget)); setBudgetDialogOpen(true); }}>
              <Pencil className="w-3.5 h-3.5" />Edit Budget
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm font-medium">
              <span>Monthly Budget</span>
              <span className={cn(isOverBudget ? 'text-expense' : 'text-foreground')}>{fmt(stats.expenses)} / {fmt(stats.budget)}</span>
            </div>
            <Progress value={budgetPct} className={cn("h-3", isOverBudget && "[&>div]:bg-expense")} />
            {isOverBudget && <p className="text-sm text-expense font-medium">Over budget by {fmt(stats.expenses - stats.budget)}</p>}
            <div className="grid grid-cols-3 gap-4 pt-2 border-t">
              <div className="text-center"><p className="text-xs text-muted-foreground">Total Income</p><p className="text-base font-bold text-income">{fmt(stats.income)}</p></div>
              <div className="text-center"><p className="text-xs text-muted-foreground">Total Expenses</p><p className="text-base font-bold text-expense">{fmt(stats.expenses)}</p></div>
              <div className="text-center"><p className="text-xs text-muted-foreground">Net Savings</p><p className={cn("text-base font-bold", stats.savings >= 0 ? 'text-income' : 'text-expense')}>{fmt(stats.savings)}</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Spending by Category */}
        <Card>
          <CardHeader className="pb-2"><CardTitle>Spending by Category</CardTitle></CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No expense data this month</p>
            ) : (
              <div className="space-y-4">
                {categoryBreakdown.map((item, i) => {
                  const pct = stats.expenses > 0 ? (item.spent / stats.expenses) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <span className="text-sm font-semibold">{fmt(item.spent)} <span className="text-muted-foreground font-normal">({pct.toFixed(1)}%)</span></span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Monthly Budget</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Monthly Budget Amount</Label><Input type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)} placeholder="e.g. 50000" /></div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setBudgetDialogOpen(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleSaveBudget}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
