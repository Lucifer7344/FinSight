import { useState } from 'react';
import { Play, Copy, Download, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { toast } from 'sonner';

const QUICK_QUERIES = [
  { label: 'All Users', sql: 'SELECT user_id, full_name, currency, created_at FROM profiles ORDER BY created_at DESC LIMIT 20;' },
  { label: 'Recent Transactions', sql: 'SELECT id, user_id, amount, type, description, date FROM transactions ORDER BY created_at DESC LIMIT 20;' },
  { label: 'Active Loans', sql: "SELECT user_id, name, principal_amount, remaining_amount, emi_amount FROM loans WHERE status = 'active';"},
  { label: 'Savings Goals', sql: 'SELECT user_id, name, target_amount, current_amount, is_completed, deadline FROM savings_goals ORDER BY created_at DESC;' },
  { label: 'All Categories', sql: 'SELECT user_id, name, type, category_group, color FROM categories ORDER BY type, name;' },
  { label: 'Budgets This Month', sql: `SELECT b.user_id, c.name, b.amount, b.month, b.year FROM budgets b LEFT JOIN categories c ON c.id = b.category_id WHERE b.year = EXTRACT(YEAR FROM NOW()) AND b.month = EXTRACT(MONTH FROM NOW());` },
];

export function AdminSQL() {
  const [sql, setSql] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ms, setMs] = useState(0);

  const runQuery = async () => {
    if (!sql.trim()) return;
    setLoading(true); setError(''); setResults(null);
    const t0 = performance.now();
    try {
      // Try to extract table name for simple SELECT queries
      const match = sql.trim().match(/^SELECT\s+.+\s+FROM\s+(\w+)/is);
      if (match) {
        const table = match[1];
        const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
        const limit = limitMatch ? parseInt(limitMatch[1]) : 100;
        const { data, error: err } = await (supabaseAdmin as any).from(table).select('*').limit(limit);
        setMs(Math.round(performance.now() - t0));
        if (err) setError(err.message || 'Query failed');
        else setResults(data ?? []);
      } else {
        setError('Preview mode supports single-table SELECT queries. Add VITE_SUPABASE_SERVICE_KEY and an exec_sql RPC for full SQL support.');
        setMs(0);
      }
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    }
    setLoading(false);
  };

  const exportCSV = () => {
    if (!results?.length) return;
    const csv = [Object.keys(results[0]), ...results.map(r => Object.values(r))].map(row => row.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'query.csv'; a.click();
    toast.success('Exported to CSV');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">SQL Editor</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Run queries against your database</p>
      </div>

      {/* Quick queries */}
      <div className="flex flex-wrap gap-2">
        {QUICK_QUERIES.map(q => (
          <button key={q.label} onClick={() => setSql(q.sql)}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary transition-all">
            {q.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-mono">Query Editor</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Ctrl+Enter to run</span>
            <Button size="sm" variant="outline" onClick={() => { setSql(''); setResults(null); setError(''); }}><Trash2 className="w-3.5 h-3.5" /></Button>
            <Button size="sm" onClick={runQuery} disabled={loading || !sql.trim()}>
              <Play className="w-3.5 h-3.5" />{loading ? 'Running…' : 'Run'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <textarea
            value={sql}
            onChange={e => setSql(e.target.value)}
            onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runQuery(); }}
            placeholder="-- Write SQL here&#10;-- Ctrl+Enter to run&#10;SELECT * FROM profiles LIMIT 10;"
            className="w-full min-h-[160px] bg-muted/30 p-4 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-none border-t border-border"
            spellCheck={false}
          />
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm">Results</CardTitle>
            {results !== null && (
              <>
                <Badge variant="outline">{results.length} rows</Badge>
                <span className="text-xs text-muted-foreground">{ms}ms</span>
              </>
            )}
          </div>
          {results && results.length > 0 && (
            <Button size="sm" variant="outline" onClick={exportCSV}><Download className="w-3.5 h-3.5" />Export CSV</Button>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive font-mono">
              {error}
            </div>
          )}
          {results === null && !error && (
            <div className="text-center py-10 text-muted-foreground">
              <Play className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Run a query to see results</p>
            </div>
          )}
          {results && results.length === 0 && <p className="text-center py-6 text-sm text-muted-foreground">Query returned 0 rows</p>}
          {results && results.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>{Object.keys(results[0]).map(c => <th key={c} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {results.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-3 py-2 text-xs font-mono text-muted-foreground">
                          {v === null ? <span className="italic">null</span> : String(v).substring(0, 50)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
