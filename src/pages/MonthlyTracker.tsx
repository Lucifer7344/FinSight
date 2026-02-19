import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AddTransactionDialog } from '@/components/transactions/AddTransactionDialog';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useMonthlyIncome } from '@/hooks/useMonthlyIncome';
import { useProfile } from '@/hooks/useProfile';
import { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function MonthlyTracker() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { transactions, deleteTransaction } = useTransactions(currentMonth);
  const { categories } = useCategories();
  const { amount: monthlyIncome, setIncome } = useMonthlyIncome(currentMonth);
  const { profile } = useProfile();
  const currency = profile?.currency === 'INR' ? '₹' : '$';

  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeValue, setIncomeValue] = useState('');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const totalIncome = monthlyIncome || income;
    return { income: totalIncome, expenses, savings: totalIncome - expenses };
  }, [transactions, monthlyIncome]);

  const expenseGroups = useMemo(() => {
    const groups: Record<string, { catName: string; catColor: string; catGroup: string; txns: Transaction[]; total: number }> = {};
    transactions.filter(t => t.type === 'expense' && t.category).forEach(t => {
      const id = t.category_id!;
      if (!groups[id]) groups[id] = { catName: t.category!.name, catColor: t.category!.color, catGroup: t.category!.category_group || 'variable', txns: [], total: 0 };
      groups[id].txns.push(t);
      groups[id].total += Number(t.amount);
    });
    return groups;
  }, [transactions]);

  const transfers = useMemo(() => transactions.filter(t => t.type === 'expense' && t.category?.category_group === 'transfers'), [transactions]);
  const transferTotal = transfers.reduce((s, t) => s + Number(t.amount), 0);

  const fixedEntries = Object.entries(expenseGroups).filter(([, g]) => g.catGroup === 'fixed');
  const variableEntries = Object.entries(expenseGroups).filter(([, g]) => g.catGroup === 'variable');
  const transferEntries = Object.entries(expenseGroups).filter(([, g]) => g.catGroup === 'transfers');
  const fixedTotal = fixedEntries.reduce((s, [, g]) => s + g.total, 0);
  const variableTotal = variableEntries.reduce((s, [, g]) => s + g.total, 0);

  const fmt = (n: number) => `${currency}${n.toLocaleString('en-IN')}`;

  const handleSaveIncome = async () => {
    try { await setIncome.mutateAsync(Number(incomeValue)); setEditingIncome(false); toast.success('Income updated'); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    if (!deletingTx) return;
    try { await deleteTransaction.mutateAsync(deletingTx.id); toast.success('Deleted'); setDeletingTx(null); }
    catch (e: any) { toast.error(e.message); }
  };

  const CatGroup = ({ title, entries, total, colorClass }: { title: string; entries: [string, any][]; total: number; colorClass: string }) => (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">{title}</CardTitle>
        <span className={cn("text-sm font-bold", colorClass)}>{fmt(total)}</span>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map(([id, g]) => (
          <div key={id}>
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs" style={{ backgroundColor: g.catColor + '20' }}>
                  {g.catName[0]}
                </div>
                <span className="text-sm font-medium">{g.catName}</span>
              </div>
              <span className="text-sm font-semibold">{fmt(g.total)}</span>
            </div>
            {g.txns.map((t: Transaction) => (
              <div key={t.id} className="flex items-center justify-between pl-8 py-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {t.description || 'No description'}
                  {t.is_recurring && <RefreshCw className="w-3 h-3" />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">{fmt(Number(t.amount))}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingTx(t)}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setDeletingTx(t)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        ))}
        {entries.length === 0 && <p className="text-xs text-muted-foreground">No {title.toLowerCase()}</p>}
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Monthly Tracker</h1><p className="text-muted-foreground text-sm">Track your income and expenses by month</p></div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm font-medium w-28 text-center">{format(currentMonth, 'MMMM yyyy')}</span>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}><ChevronRight className="w-4 h-4" /></Button>
            <AddTransactionDialog />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Income', value: fmt(stats.income), color: 'text-income', editable: true },
            { label: 'Total Expenses', value: fmt(stats.expenses), color: 'text-expense' },
            { label: 'Savings', value: fmt(stats.savings), color: stats.savings >= 0 ? 'text-income' : 'text-expense' },
          ].map(({ label, value, color, editable }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {editable && <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setEditingIncome(true); setIncomeValue(String(monthlyIncome || 0)); }}><Pencil className="w-3 h-3" /></Button>}
                </div>
                {editable && editingIncome ? (
                  <div className="flex gap-1">
                    <Input type="number" className="h-7 text-sm" value={incomeValue} onChange={e => setIncomeValue(e.target.value)} />
                    <Button size="sm" className="h-7 px-2" onClick={handleSaveIncome}>Save</Button>
                  </div>
                ) : <p className={cn("text-xl font-bold", color)}>{value}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Expense groups */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CatGroup title="Fixed Expenses" entries={fixedEntries} total={fixedTotal} colorClass="text-expense" />
          <CatGroup title="Variable Expenses" entries={variableEntries} total={variableTotal} colorClass="text-warning" />
          <CatGroup title="Transfers" entries={transferEntries} total={transferTotal} colorClass="text-primary" />
        </div>

        {editingTx && <AddTransactionDialog editTransaction={editingTx} onClose={() => setEditingTx(null)} />}
        <AlertDialog open={!!deletingTx} onOpenChange={o => !o && setDeletingTx(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete transaction?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
