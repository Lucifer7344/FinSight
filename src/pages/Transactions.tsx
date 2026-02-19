import { useState, useMemo } from 'react';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AddTransactionDialog } from '@/components/transactions/AddTransactionDialog';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useProfile } from '@/hooks/useProfile';
import { Transaction } from '@/lib/types';
import { Pencil, Trash2, Search, Plus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Transactions() {
  const { transactions, isLoading, deleteTransaction } = useTransactions();
  const { categories } = useCategories();
  const { profile } = useProfile();
  const currency = profile?.currency === 'INR' ? '₹' : '$';

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = !search || (t.description?.toLowerCase().includes(search.toLowerCase()) || t.category?.name.toLowerCase().includes(search.toLowerCase()));
      const matchType = typeFilter === 'all' || t.type === typeFilter;
      const matchCat = catFilter === 'all' || t.category_id === catFilter;
      return matchSearch && matchType && matchCat;
    });
  }, [transactions, search, typeFilter, catFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach(t => {
      const key = format(new Date(t.date), 'EEEE, MMMM d, yyyy');
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  }, [filtered]);

  const handleDelete = async () => {
    if (!deletingTx) return;
    try { await deleteTransaction.mutateAsync(deletingTx.id); toast.success('Deleted'); setDeletingTx(null); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Transactions</h1><p className="text-muted-foreground text-sm">Manage your income and expenses</p></div>
          <AddTransactionDialog />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <div className="space-y-4">
          {isLoading ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : Object.keys(grouped).length === 0 ? (
            <Card><CardContent className="p-12 text-center"><p className="text-muted-foreground">No transactions found</p></CardContent></Card>
          ) : (
            Object.entries(grouped).map(([date, txns]) => (
              <div key={date}>
                <p className="text-xs font-medium text-muted-foreground mb-2">{date}</p>
                <Card>
                  <CardContent className="p-0">
                    {txns.map((t, i) => (
                      <div key={t.id} className={cn("flex items-center justify-between p-4 hover:bg-muted/40 transition-colors", i < txns.length - 1 && "border-b")}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: (t.category?.color || '#6366f1') + '20' }}>
                            {t.category?.name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{t.description || t.category?.name || 'Transaction'}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              {t.category?.name}
                              {t.is_recurring && <RefreshCw className="w-3 h-3" />}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("text-sm font-semibold", t.type === 'income' ? 'text-income' : 'text-expense')}>
                            {t.type === 'income' ? '+' : '-'}{currency}{Number(t.amount).toLocaleString('en-IN')}
                          </span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingTx(t)}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingTx(t)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ))
          )}
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
