import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { Transaction } from '@/lib/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

const schema = z.object({
  description: z.string().optional(),
  amount: z.string().min(1),
  type: z.enum(['income', 'expense']),
  category_id: z.string().optional(),
  date: z.string(),
  is_recurring: z.boolean().default(false),
});
type FormData = z.infer<typeof schema>;

interface Props {
  trigger?: React.ReactNode;
  editTransaction?: Transaction | null;
  onClose?: () => void;
}

export function AddTransactionDialog({ trigger, editTransaction, onClose }: Props) {
  const [open, setOpen] = useState(!!editTransaction);
  const { addTransaction, updateTransaction } = useTransactions();
  const { categories } = useCategories();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editTransaction ? {
      description: editTransaction.description || '',
      amount: String(editTransaction.amount),
      type: editTransaction.type,
      category_id: editTransaction.category_id || '',
      date: editTransaction.date,
      is_recurring: editTransaction.is_recurring,
    } : {
      type: 'expense',
      date: format(new Date(), 'yyyy-MM-dd'),
      is_recurring: false,
    },
  });

  const typeWatch = form.watch('type');
  const filteredCats = categories.filter(c => c.type === typeWatch);

  const handleClose = () => { setOpen(false); form.reset(); onClose?.(); };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        description: data.description || null,
        amount: Number(data.amount),
        type: data.type,
        category_id: data.category_id || null,
        date: data.date,
        is_recurring: data.is_recurring,
        recurring_frequency: null,
        next_occurrence: null,
        reminder_enabled: false,
        reminder_days_before: 3,
      };
      if (editTransaction) {
        await updateTransaction.mutateAsync({ id: editTransaction.id, ...payload });
        toast.success('Transaction updated');
      } else {
        await addTransaction.mutateAsync(payload);
        toast.success('Transaction added');
      }
      handleClose();
    } catch (e: any) { toast.error(e.message); }
  };

  const triggerEl = trigger || (
    <Button size="sm" className="gap-2"><Plus className="w-4 h-4" />Add Transaction</Button>
  );

  return (
    <>
      {!editTransaction && <span onClick={() => setOpen(true)}>{triggerEl}</span>}
      <Dialog open={open || !!editTransaction} onOpenChange={o => { if (!o) handleClose(); else setOpen(true); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Type Toggle */}
            <div>
              <Label>Type</Label>
              <div className="flex gap-2 mt-1.5">
                {['income', 'expense'].map(t => (
                  <button key={t} type="button"
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${typeWatch === t ? (t === 'income' ? 'bg-income text-white' : 'bg-expense text-white') : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                    onClick={() => { form.setValue('type', t as any); form.setValue('category_id', ''); }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div><Label>Amount</Label><Input type="number" step="0.01" placeholder="0.00" {...form.register('amount')} /></div>
            <div><Label>Description</Label><Input placeholder="Optional description" {...form.register('description')} /></div>
            <div>
              <Label>Category</Label>
              <Select value={form.watch('category_id') || ''} onValueChange={v => form.setValue('category_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {filteredCats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" {...form.register('date')} /></div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={addTransaction.isPending || updateTransaction.isPending}>
                {editTransaction ? 'Update' : 'Add Transaction'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
