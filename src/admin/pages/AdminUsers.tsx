import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useAdminUsers, useAdminUserDetail } from '../hooks/useAdminData';
import { formatAdminCurrency, timeAgo } from '../lib/adminUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function AdminUsers() {
  const { data: users, isLoading } = useAdminUsers();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detail, isLoading: detailLoading } = useAdminUserDetail(selectedId);

  const filtered = users?.filter(u =>
    !search || (u.full_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
  ) ?? [];

  // Signup chart
  const signupChart = (() => {
    const days = Array.from({length:7}, (_,i) => {
      const d = new Date(); d.setDate(d.getDate() - (6-i)); return d.toISOString().split('T')[0];
    });
    const counts: Record<string,number> = {};
    users?.forEach(u => { const d = u.created_at.split('T')[0]; counts[d] = (counts[d]??0)+1; });
    return days.map(d => ({ date: new Date(d).toLocaleDateString('en',{weekday:'short'}), signups: counts[d]??0 }));
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage all platform users</p>
        </div>
        <Badge variant="outline" className="mt-1">{users?.length ?? 0} total</Badge>
      </div>

      {/* Signups chart */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Signups — Last 7 Days</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={signupChart} margin={{top:0,right:0,left:-30,bottom:0}}>
              <XAxis dataKey="date" tick={{fontSize:11, fill:'hsl(var(--muted-foreground))'}} />
              <YAxis tick={{fontSize:11, fill:'hsl(var(--muted-foreground))'}} allowDecimals={false} />
              <Tooltip contentStyle={{background:'hsl(var(--card))',border:'1px solid hsl(var(--border))',borderRadius:8,fontSize:12}} />
              <Bar dataKey="signups" fill="hsl(var(--primary))" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">{filtered.length} users found</CardTitle>
          <div className="relative w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…" className="pl-8 h-8 text-xs" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    {['User','Currency','Budget','Theme','Joined',''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map(user => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedId(user.user_id)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {(user.full_name || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name || 'Unnamed'}</p>
                            <p className="text-xs text-muted-foreground font-mono">{user.user_id.substring(0,12)}…</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline">{user.currency || 'INR'}</Badge></td>
                      <td className="px-4 py-3 font-mono text-sm">{user.monthly_budget ? formatAdminCurrency(Number(user.monthly_budget), user.currency || 'INR') : '—'}</td>
                      <td className="px-4 py-3"><Badge variant="secondary">{user.theme || 'system'}</Badge></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{timeAgo(user.created_at)}</td>
                      <td className="px-4 py-3"><span className="text-xs text-primary">View →</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedId} onOpenChange={v => !v && setSelectedId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.profile?.full_name || 'User Detail'}</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-3">{Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : detail ? (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Transactions', val: detail.transactions.length },
                  { label: 'Income', val: formatAdminCurrency(detail.income), cls: 'text-income' },
                  { label: 'Expenses', val: formatAdminCurrency(detail.expenses), cls: 'text-expense' },
                  { label: 'Loans', val: detail.loans.length }
                ].map(s => (
                  <div key={s.label} className="bg-muted rounded-lg p-3 text-center">
                    <p className={`text-lg font-bold ${s.cls || ''}`}>{s.val}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Profile fields */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Profile</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {detail.profile && Object.entries(detail.profile).filter(([k]) => !k.includes('_at') && k !== 'id').map(([k,v]) => (
                    <div key={k} className="flex justify-between py-1.5 px-3 rounded-lg bg-muted">
                      <span className="text-muted-foreground text-xs">{k}</span>
                      <span className="text-xs font-mono">{String(v ?? '—')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Transactions */}
              {detail.transactions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recent Transactions</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {detail.transactions.slice(0,10).map(tx => (
                      <div key={tx.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted">
                        <div>
                          <p className="text-sm">{tx.description || (tx as any).categories?.name || 'Transaction'}</p>
                          <p className="text-xs text-muted-foreground">{tx.date}</p>
                        </div>
                        <span className={`text-sm font-semibold font-mono ${tx.type==='income'?'text-income':'text-expense'}`}>
                          {tx.type==='income'?'+':'-'}{formatAdminCurrency(Number(tx.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Savings Goals */}
              {detail.goals.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Savings Goals</p>
                  <div className="space-y-2">
                    {detail.goals.map(g => {
                      const pct = Math.min(100, (Number(g.current_amount)/Number(g.target_amount))*100);
                      return (
                        <div key={g.id} className="px-3 py-2.5 rounded-lg bg-muted">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">{g.name}</span>
                            <span className="text-xs font-mono text-muted-foreground">{pct.toFixed(0)}%</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
