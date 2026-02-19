import { useState } from 'react';
import { Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminTableCounts, useAdminTableData } from '../hooks/useAdminData';
import { timeAgo } from '../lib/adminUtils';

function CellValue({ col, value }: { col: string; value: any }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground italic text-xs">null</span>;
  if (typeof value === 'boolean') return <Badge variant={value ? 'default' : 'secondary'}>{String(value)}</Badge>;
  if (col.includes('_at') || col === 'date') return <span className="text-xs text-muted-foreground font-mono">{timeAgo(value)}</span>;
  if (col === 'amount') return <span className="font-mono text-income text-sm">₹{Number(value).toLocaleString('en-IN')}</span>;
  if (col === 'type') return <Badge variant={value === 'income' ? 'default' : 'destructive'}>{value}</Badge>;
  if (col === 'color') return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded-full border" style={{ background: value }} />
      <span className="text-xs font-mono text-muted-foreground">{value}</span>
    </div>
  );
  if (col === 'id' || col.endsWith('_id')) return <span className="text-xs font-mono text-muted-foreground">{String(value).substring(0,8)}…</span>;
  const str = String(value);
  return <span className="text-sm" title={str}>{str.length > 50 ? str.substring(0,50)+'…' : str}</span>;
}

export function AdminDatabase() {
  const { data: counts, isLoading: countsLoading } = useAdminTableCounts();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const { data: tableData, isLoading: tableLoading } = useAdminTableData(selectedTable ?? '', page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Database</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Browse all tables and their data</p>
      </div>

      {/* Table Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {countsLoading ? Array.from({length:8}).map((_,i) => <Skeleton key={i} className="h-20" />) :
          counts?.map(({ name, count }) => (
            <button key={name} onClick={() => { setSelectedTable(name); setPage(0); }}
              className={`text-left p-4 rounded-xl border transition-all hover:border-primary/40 ${
                selectedTable === name ? 'border-primary/50 bg-primary/5' : 'border-border bg-card hover:bg-muted/50'
              }`}>
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-mono text-primary">{name}</span>
              </div>
              <p className="text-xl font-bold">{count.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">rows</p>
            </button>
          ))
        }
      </div>

      {/* Table Viewer */}
      {selectedTable && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-sm font-mono">{selectedTable}</CardTitle>
              <Badge variant="outline">RLS Protected</Badge>
              <span className="text-xs text-muted-foreground">{tableData?.count ?? 0} rows</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setSelectedTable(null)}>Close</Button>
          </CardHeader>
          <CardContent className="p-0">
            {tableLoading ? (
              <div className="p-4 space-y-2">{Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : tableData?.rows.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No data in this table yet</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border">
                      <tr>
                        {tableData?.rows[0] && Object.keys(tableData.rows[0]).map(col => (
                          <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {tableData?.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          {Object.entries(row).map(([key, val]) => (
                            <td key={key} className="px-4 py-3"><CellValue col={key} value={val} /></td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {(tableData?.count ?? 0) > 20 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Showing {page * 20 + 1}–{Math.min((page + 1) * 20, tableData?.count ?? 0)} of {tableData?.count}
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>←</Button>
                      <Button size="sm" variant="outline" disabled={(page + 1) * 20 >= (tableData?.count ?? 0)} onClick={() => setPage(p => p + 1)}>→</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
