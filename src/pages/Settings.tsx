import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sun, Moon, Monitor, Plus, Trash2, Pencil, Bell } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useCategories } from '@/hooks/useCategories';
import { useTheme } from '@/hooks/useTheme';
import { Category } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const profileSchema = z.object({ full_name: z.string().min(2), currency: z.string(), low_fund_threshold: z.string() });
const catSchema = z.object({ name: z.string().min(1).max(50), icon: z.string(), color: z.string(), type: z.enum(['income', 'expense']), category_group: z.enum(['fixed', 'variable', 'transfers']) });

type ProfileForm = z.infer<typeof profileSchema>;
type CatForm = z.infer<typeof catSchema>;

const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#10b981','#14b8a6','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899'];

export default function Settings() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { theme, setTheme } = useTheme();

  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { full_name: profile?.full_name || '', currency: profile?.currency || 'INR', low_fund_threshold: String(profile?.low_fund_threshold || 100) },
  });

  const catForm = useForm<CatForm>({
    resolver: zodResolver(catSchema),
    defaultValues: { name: '', icon: 'tag', color: '#6366f1', type: 'expense', category_group: 'variable' },
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    try { await updateProfile.mutateAsync({ full_name: data.full_name, currency: data.currency, low_fund_threshold: Number(data.low_fund_threshold) }); toast.success('Profile saved'); }
    catch (e: any) { toast.error(e.message); }
  };

  const openEditCat = (cat: Category) => {
    setEditingCat(cat);
    catForm.reset({ name: cat.name, icon: cat.icon || 'tag', color: cat.color || '#6366f1', type: cat.type, category_group: cat.category_group || 'variable' });
    setCatDialogOpen(true);
  };

  const handleCatClose = () => { setCatDialogOpen(false); setEditingCat(null); catForm.reset(); };

  const onCatSubmit = async (data: CatForm) => {
    try {
      if (editingCat) { await updateCategory.mutateAsync({ id: editingCat.id, ...data }); toast.success('Updated'); }
      else { await addCategory.mutateAsync({ ...data, is_default: false }); toast.success('Category added'); }
      handleCatClose();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteCat = async () => {
    if (!deletingCat) return;
    try { await deleteCategory.mutateAsync(deletingCat.id); toast.success('Deleted'); setDeletingCat(null); }
    catch (e: any) { toast.error(e.message); }
  };

  const catsByGroup = {
    'Fixed Expenses': categories.filter(c => c.type === 'expense' && c.category_group === 'fixed'),
    'Variable Expenses': categories.filter(c => c.type === 'expense' && c.category_group === 'variable'),
    'Transfers': categories.filter(c => c.category_group === 'transfers'),
    'Income': categories.filter(c => c.type === 'income'),
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div><h1 className="text-2xl font-bold">Settings</h1><p className="text-muted-foreground text-sm">Manage your account and preferences</p></div>

        {/* Appearance */}
        <Card>
          <CardHeader><CardTitle className="text-base">Appearance</CardTitle><CardDescription>Customize the look and feel</CardDescription></CardHeader>
          <CardContent>
            <Label className="text-sm">Theme</Label>
            <div className="flex gap-2 mt-2">
              {[{ value: 'light', label: 'Light', icon: Sun }, { value: 'dark', label: 'Dark', icon: Moon }, { value: 'system', label: 'System', icon: Monitor }].map(({ value, label, icon: Icon }) => (
                <Button key={value} variant={theme === value ? 'default' : 'outline'} size="sm" className="gap-2 flex-1" onClick={() => setTheme(value as any)}>
                  <Icon className="w-4 h-4" />{label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Profile */}
        <Card>
          <CardHeader><CardTitle className="text-base">Profile</CardTitle><CardDescription>Update your personal information</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div><Label>Email</Label><Input value={user?.email || ''} disabled className="bg-muted" /></div>
              <div><Label>Full Name</Label><Input {...profileForm.register('full_name')} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Currency</Label>
                  <Select value={profileForm.watch('currency')} onValueChange={v => profileForm.setValue('currency', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Low Fund Alert</Label><Input type="number" {...profileForm.register('low_fund_threshold')} /></div>
              </div>
              <Button type="submit" disabled={updateProfile.isPending}>Save Changes</Button>
            </form>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="text-base">Categories</CardTitle><CardDescription>Manage your transaction categories</CardDescription></div>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setCatDialogOpen(true)}><Plus className="w-4 h-4" />Add Category</Button>
          </CardHeader>
          <CardContent>
            {Object.entries(catsByGroup).map(([group, cats]) => cats.length > 0 && (
              <div key={group} className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{group}</p>
                <div className="space-y-1">
                  {cats.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md" style={{ backgroundColor: cat.color + '30', border: `1.5px solid ${cat.color}40` }} />
                        <span className="text-sm font-medium">{cat.name}</span>
                        <span className="text-xs text-muted-foreground">{cat.type}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditCat(cat)}><Pencil className="w-3 h-3" /></Button>
                        {!cat.is_default && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingCat(cat)}><Trash2 className="w-3 h-3" /></Button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" />Push Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Bill Reminders', desc: 'Get notified before bills are due' },
              { label: 'Goal Progress', desc: 'Updates on your savings goals' },
              { label: 'Low Balance Alerts', desc: 'When balance falls below threshold' },
              { label: 'Budget Alerts', desc: 'When approaching budget limits' },
            ].map(({ label, desc }) => (
              <div key={label} className="flex items-center justify-between">
                <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                <Switch defaultChecked />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Category Dialog */}
        <Dialog open={catDialogOpen} onOpenChange={o => !o && handleCatClose()}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingCat ? 'Edit Category' : 'Add Category'}</DialogTitle></DialogHeader>
            <form onSubmit={catForm.handleSubmit(onCatSubmit)} className="space-y-4">
              <div><Label>Name</Label><Input placeholder="Category name" {...catForm.register('name')} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={catForm.watch('type')} onValueChange={v => catForm.setValue('type', v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="expense">Expense</SelectItem><SelectItem value="income">Income</SelectItem></SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Group</Label>
                  <Select value={catForm.watch('category_group')} onValueChange={v => catForm.setValue('category_group', v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="fixed">Fixed</SelectItem><SelectItem value="variable">Variable</SelectItem><SelectItem value="transfers">Transfers</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLORS.map(c => (
                    <button key={c} type="button" className={cn("w-7 h-7 rounded-full transition-transform", catForm.watch('color') === c && "ring-2 ring-offset-2 ring-ring scale-110")}
                      style={{ backgroundColor: c }} onClick={() => catForm.setValue('color', c)} />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={handleCatClose}>Cancel</Button>
                <Button type="submit" className="flex-1">{editingCat ? 'Update' : 'Add'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deletingCat} onOpenChange={o => !o && setDeletingCat(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete category?</AlertDialogTitle><AlertDialogDescription>Transactions in this category will have no category.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteCat} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
