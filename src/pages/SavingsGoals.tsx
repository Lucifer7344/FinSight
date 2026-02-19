import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Target, CheckCircle, Plus, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { useProfile } from '@/hooks/useProfile';
import { SavingsGoal } from '@/lib/types';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';

const schema = z.object({ name: z.string().min(1), target_amount: z.string().min(1), current_amount: z.string().default('0'), deadline: z.string().optional(), color: z.string().default('#10b981') });
type FormData = z.infer<typeof schema>;

export default function SavingsGoals() {
  const { goals, totalSaved, totalTarget, completedGoals, isLoading, addGoal, updateGoal, deleteGoal, addContribution } = useSavingsGoals();
  const { profile } = useProfile();
  const currency = profile?.currency === 'INR' ? '₹' : '$';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<SavingsGoal | null>(null);
  const [contributionGoal, setContributionGoal] = useState<SavingsGoal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { color: '#10b981', current_amount: '0' } });

  const openEdit = (g: SavingsGoal) => {
    setEditingGoal(g);
    form.reset({ name: g.name, target_amount: String(g.target_amount), current_amount: String(g.current_amount), deadline: g.deadline || '', color: g.color || '#10b981' });
    setDialogOpen(true);
  };
  const handleClose = () => { setDialogOpen(false); setEditingGoal(null); form.reset(); };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { name: data.name, target_amount: Number(data.target_amount), current_amount: Number(data.current_amount), deadline: data.deadline || null, color: data.color, icon: 'target', is_completed: Number(data.current_amount) >= Number(data.target_amount) };
      if (editingGoal) { await updateGoal.mutateAsync({ id: editingGoal.id, ...payload }); toast.success('Updated'); }
      else { await addGoal.mutateAsync(payload); toast.success('Goal created!'); }
      handleClose();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    if (!deletingGoal) return;
    try { await deleteGoal.mutateAsync(deletingGoal.id); toast.success('Deleted'); setDeletingGoal(null); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleContribution = async () => {
    if (!contributionGoal) return;
    try { await addContribution.mutateAsync({ goal: contributionGoal, amount: Number(contributionAmount) }); toast.success('Contribution added!'); setContributionGoal(null); setContributionAmount(''); }
    catch (e: any) { toast.error(e.message); }
  };

  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const fmt = (n: number) => `${currency}${n.toLocaleString('en-IN')}`;

  const GoalCard = ({ goal }: { goal: SavingsGoal }) => {
    const pct = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
    const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;
    return (
      <Card className={goal.is_completed ? 'border-income/30 bg-income-muted/20' : ''}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">{goal.name}</p>
              {daysLeft !== null && <p className="text-xs text-muted-foreground mt-0.5">{daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}</p>}
            </div>
            <div className="flex items-center gap-1">
              {goal.is_completed && <CheckCircle className="w-5 h-5 text-income" />}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(goal)}><Pencil className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingGoal(goal)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-semibold text-income">{fmt(Number(goal.current_amount))}</span>
              <span className="text-muted-foreground">of {fmt(Number(goal.target_amount))}</span>
            </div>
            <Progress value={pct} className="h-2" style={{ '--tw-bg-opacity': 1 } as any} />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{pct.toFixed(0)}% complete</span>
              <span>{fmt(Number(goal.target_amount) - Number(goal.current_amount))} remaining</span>
            </div>
          </div>
          {!goal.is_completed && (
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => { setContributionGoal(goal); setContributionAmount(''); }}>
              <Plus className="w-3.5 h-3.5" />Add Contribution
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedList = goals.filter(g => g.is_completed);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Savings Goals</h1><p className="text-muted-foreground text-sm">Track your progress towards financial goals</p></div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="w-4 h-4" />New Goal</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Saved', value: fmt(totalSaved), color: 'text-income' },
            { label: 'Total Target', value: fmt(totalTarget), color: 'text-foreground' },
            { label: 'Goals Completed', value: String(completedGoals), sub: `of ${goals.length} total`, color: 'text-primary' },
          ].map(({ label, value, color, sub }) => (
            <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">{label}</p><p className={`text-xl font-bold ${color}`}>{value}</p>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</CardContent></Card>
          ))}
        </div>

        {/* Overall progress */}
        {goals.length > 0 && (
          <Card><CardContent className="p-4 space-y-2">
            <p className="text-sm font-medium">Overall Progress</p>
            <Progress value={overallPct} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{overallPct.toFixed(0)}% complete</span>
              <span>{fmt(totalTarget - totalSaved)} remaining</span>
            </div>
          </CardContent></Card>
        )}

        {/* Active goals */}
        {activeGoals.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Active Goals ({activeGoals.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{activeGoals.map(g => <GoalCard key={g.id} goal={g} />)}</div>
          </div>
        )}

        {/* Completed */}
        {completedList.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-income" />Completed ({completedList.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{completedList.map(g => <GoalCard key={g.id} goal={g} />)}</div>
          </div>
        )}

        {goals.length === 0 && !isLoading && (
          <Card className="border-dashed"><CardContent className="py-12 text-center">
            <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-1">No savings goals yet</p>
            <p className="text-muted-foreground text-sm mb-4">Create your first savings goal</p>
            <Button onClick={() => setDialogOpen(true)}>New Goal</Button>
          </CardContent></Card>
        )}

        {/* Add/Edit dialog */}
        <Dialog open={dialogOpen} onOpenChange={o => !o && handleClose()}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingGoal ? 'Edit Goal' : 'New Savings Goal'}</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div><Label>Goal Name</Label><Input placeholder="e.g. Emergency Fund" {...form.register('name')} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Target Amount</Label><Input type="number" {...form.register('target_amount')} /></div>
                <div><Label>Current Amount</Label><Input type="number" {...form.register('current_amount')} /></div>
              </div>
              <div><Label>Deadline (optional)</Label><Input type="date" {...form.register('deadline')} /></div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
                <Button type="submit" className="flex-1">{editingGoal ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Contribution dialog */}
        <Dialog open={!!contributionGoal} onOpenChange={o => !o && setContributionGoal(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Contribution — {contributionGoal?.name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Amount</Label><Input type="number" value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} placeholder="Amount to add" /></div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setContributionGoal(null)}>Cancel</Button>
                <Button className="flex-1" onClick={handleContribution}>Add</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deletingGoal} onOpenChange={o => !o && setDeletingGoal(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete goal?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
