import { Transaction } from './types';
import { format } from 'date-fns';

export function exportToCSV(transactions: Transaction[], filename = 'transactions') {
  const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
  const rows = transactions.map(t => [
    format(new Date(t.date), 'yyyy-MM-dd'),
    t.description || '',
    t.category?.name || '',
    t.type,
    t.amount.toString(),
  ]);

  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportToExcel(transactions: Transaction[], filename = 'transactions') {
  try {
    const XLSX = await import('xlsx');
    const data = transactions.map(t => ({
      Date: format(new Date(t.date), 'yyyy-MM-dd'),
      Description: t.description || '',
      Category: t.category?.name || '',
      Type: t.type,
      Amount: t.amount,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch {
    exportToCSV(transactions, filename);
  }
}
