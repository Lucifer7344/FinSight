import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Landmark, Plus, Pencil, Trash2, DollarSign } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLoans } from '@/hooks/useLoans';
import { useProfile } from '@/hooks/useProfile';
import { Loan } from '@/lib/types';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(1),
  total_amount: z.string().min(1),
  monthly_emi: z.string().default('0'),
  remaining_balance: z.string().min(1),
  loan_type: z.enum(['loan', 'credit_card']),
  start_date: z.string(),
});
type FormData = z.infer<typeof schema>;

export default function Loans() {
  const { loans, activeLoans, totalEMI, totalDebt, addLoan, updateLoan, deleteLoan, makePayment, isLoading } = useLoans();
  const { profile } = useProfile();
  const currency = profile?.currency === 'INR' ? '₹' : '$';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [deletingLoan, setDeletingLoan] = useState<Loan | null>(null);
  const [paymentLoan, setPaymentLoan] = useState<Loan | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { loan_type: 'loan', start_date: new Date().toISOString().split('T')[0], monthly_emi: '0' } });

  const openEdit = (loan: Loan) => {
    setEditingLoan(loan);
    form.reset({ name: loan.name, total_amount: String(loan.total_amount), monthly_emi: String(loan.monthly_emi), remaining_balance: String(loan.remaining_balance), loan_type: loan.loan_type as any, start_date: loan.start_date });
    setDialogOpen(true);
  };

  const handleClose = () => { setDialogOpen(false); setEditingLoan(null); form.reset(); };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { name: data.name, total_amount: Number(data.total_amount), monthly_emi: Number(data.monthly_emi), remaining_balance: Number(data.remaining_balance), loan_type: data.loan_type, is_active: true, start_date: data.start_date };
      if (editingLoan) { await updateLoan.mutateAsync({ id: editingLoan.id, ...payload }); toast.success('Updated'); }
      else { await addLoan.mutateAsync(payload); toast.success('Added'); }
      handleClose();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    if (!deletingLoan) return;
    try { await deleteLoan.mutateAsync(deletingLoan.id); toast.success('Deleted'); setDeletingLoan(null); }
    catch (e: any) { toast.error(e.message); }
  };

  const handlePayment = async () => {
    if (!paymentLoan) return;
    try { await makePayment.mutateAsync({ loan: paymentLoan, amount: Number(paymentAmount) }); toast.success('Payment recorded'); setPaymentLoan(null); setPaymentAmount(''); }
    catch (e: any) { toast.error(e.message); }
  };

  const fmt = (n: number) => `${currency}${n.toLocaleString('en-IN')}`;

  const LoanCard = ({ loan }: { loan: Loan }) => {
    const pct = loan.total_amount > 0 ? ((loan.total_amount - loan.remaining_balance) / loan.total_amount) * 100 : 0;
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">{loan.name}</p>
              <Badge variant="secondary" className="mt-1 text-xs">{loan.loan_type === 'credit_card' ? 'Credit Card' : 'Loan'}</Badge>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(loan)}><Pencil className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingLoan(loan)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-xs text-muted-foreground">Total</p><p className="text-sm font-semibold">{fmt(Number(loan.total_amount))}</p></div>
            <div><p className="text-xs text-muted-foreground">EMI</p><p className={`text-sm font-semibold ${loan.monthly_emi > 0 ? 'text-expense' : 'text-muted-foreground'}`}>{fmt(Number(loan.monthly_emi))}</p></div>
            <div><p className="text-xs text-muted-foreground">Remaining</p><p className="text-sm font-semibold text-expense">{fmt(Number(loan.remaining_balance))}</p></div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Paid: {fmt(Number(loan.total_amount) - Number(loan.remaining_balance))}</span>
              <span>{pct.toFixed(1)}%</span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => { setPaymentLoan(loan); setPaymentAmount(String(loan.monthly_emi || '')); }}>
            <DollarSign className="w-3.5 h-3.5" />Record Payment
          </Button>
        </CardContent>
      </Card>
    );
  };

  const loansList = loans.filter(l => l.loan_type === 'loan');
  const cardsList = loans.filter(l => l.loan_type === 'credit_card');

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Loans & Cards</h1><p className="text-muted-foreground text-sm">Track your loans, EMIs, and credit cards</p></div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="w-4 h-4" />Add Loan/Card</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Monthly EMI', value: fmt(totalEMI), color: 'text-expense' },
            { label: 'Total Debt', value: fmt(totalDebt), color: 'text-foreground' },
            { label: 'Active Loans', value: String(activeLoans.length), color: 'text-warning' },
          ].map(({ label, value, color }) => (
            <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">{label}</p><p className={`text-xl font-bold ${color}`}>{value}</p></CardContent></Card>
          ))}
        </div>

        {/* Loans */}
        {loansList.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Landmark className="w-5 h-5" />Loans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{loansList.map(l => <LoanCard key={l.id} loan={l} />)}</div>
          </div>
        )}

        {/* Credit Cards */}
        {cardsList.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><CreditCard className="w-5 h-5" />Credit Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{cardsList.map(l => <LoanCard key={l.id} loan={l} />)}</div>
          </div>
        )}

        {loans.length === 0 && !isLoading && (
          <Card className="border-dashed"><CardContent className="py-12 text-center">
            <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-1">No loans or cards yet</p>
            <p className="text-muted-foreground text-sm mb-4">Add your loans and credit cards to track your debt</p>
            <Button onClick={() => setDialogOpen(true)}>Add Loan/Card</Button>
          </CardContent></Card>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={o => !o && handleClose()}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingLoan ? 'Edit Loan' : 'Add Loan/Card'}</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div><Label>Name</Label><Input placeholder="e.g. Home Loan, SBI Card" {...form.register('name')} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.watch('loan_type')} onValueChange={v => form.setValue('loan_type', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="loan">Loan</SelectItem><SelectItem value="credit_card">Credit Card</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Total Amount</Label><Input type="number" {...form.register('total_amount')} /></div>
                <div><Label>Remaining Balance</Label><Input type="number" {...form.register('remaining_balance')} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Monthly EMI</Label><Input type="number" placeholder="0" {...form.register('monthly_emi')} /></div>
                <div><Label>Start Date</Label><Input type="date" {...form.register('start_date')} /></div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
                <Button type="submit" className="flex-1">{editingLoan ? 'Update' : 'Add'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={!!paymentLoan} onOpenChange={o => !o && setPaymentLoan(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Payment — {paymentLoan?.name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Payment Amount</Label><Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="Amount paid" /></div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setPaymentLoan(null)}>Cancel</Button>
                <Button className="flex-1" onClick={handlePayment}>Record Payment</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deletingLoan} onOpenChange={o => !o && setDeletingLoan(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete loan?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
