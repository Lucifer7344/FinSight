import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CreditCard, Landmark, Plus, Pencil, Trash2, DollarSign,
  Clock, TrendingDown, Calendar, CheckCircle2, ChevronDown,
  ChevronUp, Calculator, Zap, Target, AlertTriangle, BarChart2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLoans } from '@/hooks/useLoans';
import { useProfile } from '@/hooks/useProfile';
import { Loan } from '@/lib/types';
import { toast } from 'sonner';
import { format, addMonths } from 'date-fns';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  total_amount: z.string().min(1, 'Required'),
  monthly_emi: z.string().default('0'),
  remaining_balance: z.string().min(1, 'Required'),
  loan_type: z.enum(['loan', 'credit_card']),
  start_date: z.string(),
  interest_rate: z.string().default('0'),
});
type FormData = z.infer<typeof schema>;

// ── Payoff calculation engine ──────────────────────────────────────────────
interface PayoffResult {
  months: number;
  totalPaid: number;
  totalInterest: number;
  payoffDate: Date;
  monthlyBreakdown: { month: number; principal: number; interest: number; balance: number }[];
}

function calcPayoff(remaining: number, emi: number, annualRate = 0): PayoffResult | null {
  if (emi <= 0 || remaining <= 0) return null;

  if (annualRate === 0) {
    const months = Math.ceil(remaining / emi);
    return {
      months,
      totalPaid: months * emi,
      totalInterest: 0,
      payoffDate: addMonths(new Date(), months),
      monthlyBreakdown: [],
    };
  }

  const r = annualRate / 100 / 12;
  let balance = remaining;
  let months = 0;
  let totalInterest = 0;
  let totalPaid = 0;
  const breakdown: PayoffResult['monthlyBreakdown'] = [];

  while (balance > 0.01 && months < 600) {
    const interest = balance * r;
    const principal = emi - interest;
    if (principal <= 0) return null; // EMI too low to cover interest
    const actualPrincipal = Math.min(principal, balance);
    const actualPayment = actualPrincipal + interest;
    totalInterest += interest;
    totalPaid += actualPayment;
    balance -= actualPrincipal;
    months++;
    if (months <= 12) {
      breakdown.push({ month: months, principal: Math.round(actualPrincipal), interest: Math.round(interest), balance: Math.round(balance) });
    }
  }

  return {
    months,
    totalPaid: Math.round(totalPaid),
    totalInterest: Math.round(totalInterest),
    payoffDate: addMonths(new Date(), months),
    monthlyBreakdown: breakdown,
  };
}

function formatDuration(m: number): string {
  if (m <= 0) return '—';
  const y = Math.floor(m / 12);
  const mo = m % 12;
  if (y === 0) return `${mo} month${mo !== 1 ? 's' : ''}`;
  if (mo === 0) return `${y} year${y !== 1 ? 's' : ''}`;
  return `${y}y ${mo}m`;
}

// ── Loan Payoff Section ────────────────────────────────────────────────────
function PayoffSection({ loan, fmt }: { loan: Loan; fmt: (n: number) => string }) {
  const [expanded, setExpanded] = useState(false);
  const [customEmi, setCustomEmi] = useState('');
  const [customRate, setCustomRate] = useState(String(0));
  const [showBreakdown, setShowBreakdown] = useState(false);

  const emi = Number(customEmi) || Number(loan.monthly_emi) || 0;
  const rate = Number(customRate);
  const remaining = Number(loan.remaining_balance);

  const result = useMemo(() => calcPayoff(remaining, emi, rate), [remaining, emi, rate]);
  const faster25 = useMemo(() => (result ? calcPayoff(remaining, emi * 1.25, rate) : null), [remaining, emi, rate, result]);
  const faster50 = useMemo(() => (result ? calcPayoff(remaining, emi * 1.5, rate) : null), [remaining, emi, rate, result]);
  const minEmi = rate > 0 ? Math.ceil((remaining * (rate / 100 / 12)) / (1 - Math.pow(1 + rate / 100 / 12, -360))) : 0;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl glass-btn text-xs font-semibold transition-all"
      >
        <span className="flex items-center gap-2">
          <Calculator className="w-3.5 h-3.5 text-primary" />
          <span className="gradient-text">Payoff Calculator</span>
          {result && !expanded && (
            <span className="text-muted-foreground font-normal">
              · {formatDuration(result.months)}
            </span>
          )}
        </span>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-4 animate-fade-in-up">
          {/* Calculator inputs */}
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Adjust Parameters</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground font-medium block mb-1">Monthly EMI Override</label>
                <Input
                  type="number"
                  placeholder={`Current: ${fmt(Number(loan.monthly_emi))}`}
                  value={customEmi}
                  onChange={e => setCustomEmi(e.target.value)}
                  className="glass-input border-0 rounded-xl h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-medium block mb-1">Interest Rate (% /yr)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 8.5"
                  value={customRate === '0' ? '' : customRate}
                  onChange={e => setCustomRate(e.target.value || '0')}
                  className="glass-input border-0 rounded-xl h-9 text-xs"
                />
              </div>
            </div>
            {rate > 0 && minEmi > 0 && emi <= minEmi && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                EMI too low — minimum to cover interest: {fmt(minEmi + 100)}
              </div>
            )}
          </div>

          {/* Main payoff result */}
          {result ? (
            <>
              <div className="glass-card rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 glass-primary rounded-xl flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time to be debt-free</p>
                    <p className="text-lg font-bold gradient-text">{formatDuration(result.months)}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[10px] text-muted-foreground">Target date</p>
                    <p className="text-sm font-bold">{format(result.payoffDate, 'MMM yyyy')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="glass-card rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground">Total EMI</p>
                    <p className="text-xs font-bold income-text mt-0.5">{fmt(emi)}</p>
                    <p className="text-[9px] text-muted-foreground">/month</p>
                  </div>
                  <div className="glass-card rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground">Total Payment</p>
                    <p className="text-xs font-bold mt-0.5">{fmt(result.totalPaid)}</p>
                    <p className="text-[9px] text-muted-foreground">all included</p>
                  </div>
                  <div className="glass-card rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground">Interest Cost</p>
                    <p className="text-xs font-bold expense-text mt-0.5">{fmt(result.totalInterest)}</p>
                    <p className="text-[9px] text-muted-foreground">{result.totalPaid > 0 ? ((result.totalInterest / result.totalPaid) * 100).toFixed(1) : 0}% of total</p>
                  </div>
                </div>

                {/* Progress bar showing months */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
                    <span>Today</span>
                    <span>{result.months} payments remaining</span>
                    <span>{format(result.payoffDate, 'MMM yyyy')}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--glass-bg)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (Number(loan.total_amount - loan.remaining_balance) / loan.total_amount) * 100)}%`, background: 'var(--gradient-primary)' }} />
                  </div>
                </div>
              </div>

              {/* Payment acceleration */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Pay Faster Scenarios</p>

                {faster25 && (
                  <div className="glass-card rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 glass-income rounded-xl flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">Pay 25% more — {fmt(Math.round(emi * 1.25))}/mo</p>
                      <p className="text-[11px] text-muted-foreground">
                        Done in <span className="income-text font-bold">{formatDuration(faster25.months)}</span>
                        {' '}· saves <span className="income-text font-semibold">{formatDuration(result.months - faster25.months)}</span>
                      </p>
                    </div>
                    {result.totalInterest > 0 && faster25.totalInterest < result.totalInterest && (
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Interest saved</p>
                        <p className="text-xs income-text font-bold">{fmt(result.totalInterest - faster25.totalInterest)}</p>
                      </div>
                    )}
                  </div>
                )}

                {faster50 && (
                  <div className="glass-card rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 glass-primary rounded-xl flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">Pay 50% more — {fmt(Math.round(emi * 1.5))}/mo</p>
                      <p className="text-[11px] text-muted-foreground">
                        Done in <span className="income-text font-bold">{formatDuration(faster50.months)}</span>
                        {' '}· saves <span className="income-text font-semibold">{formatDuration(result.months - faster50.months)}</span>
                      </p>
                    </div>
                    {result.totalInterest > 0 && faster50.totalInterest < result.totalInterest && (
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Interest saved</p>
                        <p className="text-xs income-text font-bold">{fmt(result.totalInterest - faster50.totalInterest)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Monthly breakdown (first 12 months) */}
              {result.monthlyBreakdown.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowBreakdown(b => !b)}
                    className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground px-1 py-1 transition-colors"
                  >
                    <span className="flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5" />Month-by-month (first 12)</span>
                    {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  {showBreakdown && (
                    <div className="glass-card rounded-xl overflow-hidden mt-2">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b" style={{ borderColor: 'var(--glass-border-subtle)' }}>
                              {['Month', 'Principal', 'Interest', 'Balance'].map(h => (
                                <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.monthlyBreakdown.map(row => (
                              <tr key={row.month} className="border-b transition-colors glass-row" style={{ borderColor: 'var(--glass-border-subtle)' }}>
                                <td className="px-3 py-2 text-muted-foreground">{row.month}</td>
                                <td className="px-3 py-2 income-text font-medium">{fmt(row.principal)}</td>
                                <td className="px-3 py-2 expense-text">{fmt(row.interest)}</td>
                                <td className="px-3 py-2 font-semibold">{fmt(row.balance)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="glass-card rounded-xl p-4 text-center text-xs text-muted-foreground">
              {emi <= 0 ? 'Enter EMI to calculate payoff timeline' : 'EMI too low to cover interest — increase EMI amount'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Loan Card ──────────────────────────────────────────────────────────────
function LoanCard({ loan, fmt, onEdit, onDelete, onPay }: {
  loan: Loan;
  fmt: (n: number) => string;
  onEdit: () => void;
  onDelete: () => void;
  onPay: () => void;
}) {
  const pct = loan.total_amount > 0
    ? Math.min(100, ((Number(loan.total_amount) - Number(loan.remaining_balance)) / Number(loan.total_amount)) * 100)
    : 0;
  const payoffQuick = useMemo(() => calcPayoff(Number(loan.remaining_balance), Number(loan.monthly_emi), 0), [loan]);
  const isLoan = loan.loan_type === 'loan';

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4 hover:shadow-[var(--glass-shadow-lg)] transition-all duration-300 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isLoan ? 'glass-blue' : 'glass-purple'}`}>
            {isLoan
              ? <Landmark className="w-4.5 h-4.5 text-white" />
              : <CreditCard className="w-4.5 h-4.5 text-white" />}
          </div>
          <div>
            <p className="font-bold text-sm">{loan.name}</p>
            <span className="text-[10px] glass-badge px-2 py-0.5 rounded-full text-muted-foreground inline-block mt-0.5">
              {isLoan ? 'Loan' : 'Credit Card'}
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit}
            className="w-7 h-7 glass-btn rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Pencil className="w-3 h-3" />
          </button>
          <button onClick={onDelete}
            className="w-7 h-7 glass-btn rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Principal', value: fmt(Number(loan.total_amount)) },
          { label: 'Monthly EMI', value: loan.monthly_emi > 0 ? fmt(Number(loan.monthly_emi)) : '—', cls: 'text-primary' },
          { label: 'Remaining', value: fmt(Number(loan.remaining_balance)), cls: 'expense-text' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="glass-card rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className={`text-xs font-bold mt-0.5 ${cls ?? ''}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-[10px] mb-1.5">
          <span className="text-muted-foreground">Paid {fmt(Number(loan.total_amount) - Number(loan.remaining_balance))}</span>
          <span className="income-text font-semibold">{pct.toFixed(1)}% complete</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--glass-bg)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: 'var(--gradient-primary)' }}
          />
        </div>
      </div>

      {/* ★ Quick payoff summary badge */}
      {payoffQuick && loan.monthly_emi > 0 && (
        <div className="rounded-xl p-3 space-y-2" style={{ background: 'hsla(var(--primary),0.07)', border: '1px solid hsla(var(--primary),0.12)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(payoffQuick.months)} to clear
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
              <Calendar className="w-3 h-3" />
              {format(payoffQuick.payoffDate, 'MMM yyyy')}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Months Left</p>
              <p className="text-sm font-bold text-primary">{payoffQuick.months}</p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Per Month</p>
              <p className="text-sm font-bold">{fmt(Number(loan.monthly_emi))}</p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Free By</p>
              <p className="text-sm font-bold income-text">{format(payoffQuick.payoffDate, 'MMM yy')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Record payment button */}
      <button
        onClick={onPay}
        className="w-full h-9 glass-income rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all"
      >
        <DollarSign className="w-3.5 h-3.5" />Record Payment
      </button>

      {/* Expandable payoff calculator */}
      <PayoffSection loan={loan} fmt={fmt} />
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function Loans() {
  const { loans, activeLoans, totalEMI, totalDebt, addLoan, updateLoan, deleteLoan, makePayment, isLoading } = useLoans();
  const { profile } = useProfile();
  const currency = profile?.currency === 'INR' ? '₹' : '$';
  const fmt = (n: number) => `${currency}${Number(n).toLocaleString('en-IN')}`;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [deletingLoan, setDeletingLoan] = useState<Loan | null>(null);
  const [paymentLoan, setPaymentLoan] = useState<Loan | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { loan_type: 'loan', start_date: new Date().toISOString().split('T')[0], monthly_emi: '0', interest_rate: '0' },
  });

  const openEdit = (loan: Loan) => {
    setEditingLoan(loan);
    form.reset({
      name: loan.name,
      total_amount: String(loan.total_amount),
      monthly_emi: String(loan.monthly_emi),
      remaining_balance: String(loan.remaining_balance),
      loan_type: loan.loan_type as any,
      start_date: loan.start_date,
      interest_rate: '0',
    });
    setDialogOpen(true);
  };

  const handleClose = () => { setDialogOpen(false); setEditingLoan(null); form.reset(); };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        name: data.name,
        total_amount: Number(data.total_amount),
        monthly_emi: Number(data.monthly_emi),
        remaining_balance: Number(data.remaining_balance),
        loan_type: data.loan_type,
        is_active: true,
        start_date: data.start_date,
      };
      if (editingLoan) {
        await updateLoan.mutateAsync({ id: editingLoan.id, ...payload });
        toast.success('Loan updated');
      } else {
        await addLoan.mutateAsync(payload);
        toast.success('Loan added!');
      }
      handleClose();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    if (!deletingLoan) return;
    try {
      await deleteLoan.mutateAsync(deletingLoan.id);
      toast.success('Deleted');
      setDeletingLoan(null);
    } catch (e: any) { toast.error(e.message); }
  };

  const handlePayment = async () => {
    if (!paymentLoan || !paymentAmount) return;
    try {
      await makePayment.mutateAsync({ loan: paymentLoan, amount: Number(paymentAmount) });
      toast.success('Payment recorded!');
      setPaymentLoan(null);
      setPaymentAmount('');
    } catch (e: any) { toast.error(e.message); }
  };

  const loansList = loans.filter(l => l.loan_type === 'loan');
  const cardsList = loans.filter(l => l.loan_type === 'credit_card');

  const maxPayoffMonths = useMemo(() => {
    const results = activeLoans
      .filter(l => l.monthly_emi > 0)
      .map(l => calcPayoff(Number(l.remaining_balance), Number(l.monthly_emi), 0)?.months ?? 0);
    return results.length ? Math.max(...results) : 0;
  }, [activeLoans]);

  return (
    <AppLayout>
      <div className="space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Loans & Cards</h1>
            <p className="text-sm text-muted-foreground">Track EMIs, debt progress, and payoff timelines</p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="glass-primary h-9 px-4 rounded-xl text-sm font-semibold text-white flex items-center gap-2 hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />Add Loan
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in-up delay-100">
          {[
            { label: 'Monthly EMI', value: fmt(totalEMI), icon: DollarSign, cls: 'glass-expense' },
            { label: 'Total Debt', value: fmt(totalDebt), icon: TrendingDown, cls: 'glass-amber' },
            { label: 'Active Loans', value: String(activeLoans.length), icon: CreditCard, cls: 'glass-blue' },
            { label: 'Longest Payoff', value: maxPayoffMonths ? formatDuration(maxPayoffMonths) : '—', icon: Clock, cls: 'glass-primary' },
          ].map(({ label, value, icon: Icon, cls }) => (
            <div key={label} className="stat-card rounded-2xl p-4">
              <div className={`w-9 h-9 rounded-xl ${cls} flex items-center justify-center shadow-lg mb-2`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Loans section */}
        {loansList.length > 0 && (
          <div className="animate-fade-in-up delay-200">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <div className="w-6 h-6 glass-blue rounded-lg flex items-center justify-center">
                <Landmark className="w-3.5 h-3.5 text-white" />
              </div>
              Loans
              <span className="text-muted-foreground font-normal">({loansList.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {loansList.map(l => (
                <LoanCard
                  key={l.id} loan={l} fmt={fmt}
                  onEdit={() => openEdit(l)}
                  onDelete={() => setDeletingLoan(l)}
                  onPay={() => { setPaymentLoan(l); setPaymentAmount(String(l.monthly_emi || '')); }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Credit cards section */}
        {cardsList.length > 0 && (
          <div className="animate-fade-in-up delay-300">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <div className="w-6 h-6 glass-purple rounded-lg flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5 text-white" />
              </div>
              Credit Cards
              <span className="text-muted-foreground font-normal">({cardsList.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {cardsList.map(l => (
                <LoanCard
                  key={l.id} loan={l} fmt={fmt}
                  onEdit={() => openEdit(l)}
                  onDelete={() => setDeletingLoan(l)}
                  onPay={() => { setPaymentLoan(l); setPaymentAmount(String(l.monthly_emi || '')); }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {loans.length === 0 && !isLoading && (
          <div className="glass-card rounded-3xl py-16 text-center animate-scale-in">
            <div className="w-16 h-16 glass-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">No loans or cards yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Add your loans and credit cards to track EMIs and see exactly when you'll be debt-free.
            </p>
            <button
              onClick={() => setDialogOpen(true)}
              className="glass-primary h-10 px-6 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
            >
              Add First Loan
            </button>
          </div>
        )}

        {/* Add/Edit Loan Dialog */}
        <Dialog open={dialogOpen} onOpenChange={o => !o && handleClose()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-8 h-8 glass-primary rounded-xl flex items-center justify-center">
                  {editingLoan ? <Pencil className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
                </div>
                {editingLoan ? 'Edit Loan' : 'Add Loan / Card'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</Label>
                <Input
                  placeholder="e.g. Home Loan, HDFC Card"
                  {...form.register('name')}
                  className="glass-input border-0 rounded-xl mt-1"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</Label>
                <Select value={form.watch('loan_type')} onValueChange={v => form.setValue('loan_type', v as any)}>
                  <SelectTrigger className="glass-input border-0 rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loan">Loan</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Amount</Label>
                  <Input type="number" placeholder="500000" {...form.register('total_amount')} className="glass-input border-0 rounded-xl mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remaining Balance</Label>
                  <Input type="number" placeholder="350000" {...form.register('remaining_balance')} className="glass-input border-0 rounded-xl mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly EMI</Label>
                  <Input type="number" placeholder="15000" {...form.register('monthly_emi')} className="glass-input border-0 rounded-xl mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interest % /yr</Label>
                  <Input type="number" placeholder="8.5" step="0.1" {...form.register('interest_rate')} className="glass-input border-0 rounded-xl mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start Date</Label>
                <Input type="date" {...form.register('start_date')} className="glass-input border-0 rounded-xl mt-1" />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={handleClose} className="flex-1 h-10 glass-btn rounded-xl text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" className="flex-1 h-10 glass-primary rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all">
                  {editingLoan ? 'Update Loan' : 'Add Loan'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={!!paymentLoan} onOpenChange={o => !o && setPaymentLoan(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-8 h-8 glass-income rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                Record Payment
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="glass-card rounded-xl p-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold">{paymentLoan?.name}</p>
                  <span className="text-xs expense-text font-bold">
                    {fmt(Number(paymentLoan?.remaining_balance))} remaining
                  </span>
                </div>
                {paymentLoan?.monthly_emi > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Regular EMI: {fmt(Number(paymentLoan.monthly_emi))}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Amount</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder={fmt(Number(paymentLoan?.monthly_emi))}
                  className="glass-input border-0 rounded-xl mt-1"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPaymentLoan(null)} className="flex-1 h-10 glass-btn rounded-xl text-sm font-semibold">
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={!paymentAmount || Number(paymentAmount) <= 0}
                  className="flex-1 h-10 glass-income rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog open={!!deletingLoan} onOpenChange={o => !o && setDeletingLoan(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this loan?</AlertDialogTitle>
              <AlertDialogDescription>
                "{deletingLoan?.name}" will be permanently removed from your records.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
