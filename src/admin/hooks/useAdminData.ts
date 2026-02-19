import { useQuery } from '@tanstack/react-query';
import { supabaseAdmin } from '../lib/supabaseAdmin';

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      const [
        { count: userCount },
        { count: txCount },
        { data: txData },
        { count: loanCount },
        { count: goalCount },
        { data: recentTx }
      ] = await Promise.all([
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('transactions').select('amount,type'),
        supabaseAdmin.from('loans').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('savings_goals').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('transactions').select('id,amount,type,description,date,created_at,user_id').order('created_at', { ascending: false }).limit(10)
      ]);
      return {
        userCount: userCount ?? 0, txCount: txCount ?? 0, loanCount: loanCount ?? 0, goalCount: goalCount ?? 0,
        totalIncome: txData?.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) ?? 0,
        totalExpense: txData?.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) ?? 0,
        recentTx: recentTx ?? []
      };
    },
    refetchInterval: 30_000
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    }
  });
}

export function useAdminUserDetail(userId: string | null) {
  return useQuery({
    queryKey: ['admin', 'user', userId],
    enabled: !!userId,
    queryFn: async () => {
      const [
        { data: profile }, { data: transactions }, { data: loans }, { data: goals }, { data: alerts }
      ] = await Promise.all([
        supabaseAdmin.from('profiles').select('*').eq('user_id', userId!).single(),
        supabaseAdmin.from('transactions').select('*,categories(name,color)').eq('user_id', userId!).order('date', { ascending: false }).limit(20),
        supabaseAdmin.from('loans').select('*').eq('user_id', userId!),
        supabaseAdmin.from('savings_goals').select('*').eq('user_id', userId!),
        supabaseAdmin.from('alerts').select('*').eq('user_id', userId!).order('created_at', { ascending: false }).limit(10)
      ]);
      const txs = transactions ?? [];
      return {
        profile, transactions: txs, loans: loans ?? [], goals: goals ?? [], alerts: alerts ?? [],
        income: txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
        expenses: txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      };
    }
  });
}

export function useAdminTableCounts() {
  return useQuery({
    queryKey: ['admin', 'tableCounts'],
    queryFn: async () => {
      const tables = ['profiles', 'transactions', 'categories', 'budgets', 'loans', 'savings_goals', 'monthly_income', 'alerts'];
      const results = await Promise.all(
        tables.map(t => supabaseAdmin.from(t as any).select('*', { count: 'exact', head: true }).then(r => ({ name: t, count: r.count ?? 0 })))
      );
      return results;
    },
    refetchInterval: 60_000
  });
}

export function useAdminTableData(tableName: string, page = 0, pageSize = 20) {
  return useQuery({
    queryKey: ['admin', 'table', tableName, page],
    enabled: !!tableName,
    queryFn: async () => {
      const from = page * pageSize, to = from + pageSize - 1;
      const { data, error, count } = await supabaseAdmin.from(tableName as any)
        .select('*', { count: 'exact' }).range(from, to).order('created_at', { ascending: false });
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    }
  });
}

export function useAdminActivity() {
  return useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin.from('transactions')
        .select('id,amount,type,description,date,created_at,user_id,categories(name,color)')
        .order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 15_000
  });
}

export function useAdminAllAlerts() {
  return useQuery({
    queryKey: ['admin', 'allAlerts'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin.from('alerts')
        .select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 20_000
  });
}

export function useAdminSignups() {
  return useQuery({
    queryKey: ['admin', 'signups'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin.from('profiles').select('created_at').order('created_at', { ascending: true });
      if (error) throw error;
      const last30 = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (29 - i)); return d.toISOString().split('T')[0];
      });
      const counts: Record<string, number> = {};
      data?.forEach(p => { const day = p.created_at.split('T')[0]; counts[day] = (counts[day] ?? 0) + 1; });
      return last30.map(date => ({ date, signups: counts[date] ?? 0 }));
    }
  });
}

export function useAdminTxAnalytics() {
  return useQuery({
    queryKey: ['admin', 'txAnalytics'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin.from('transactions')
        .select('amount,type,date').order('date', { ascending: false }).limit(2000);
      if (error) throw error;
      const months: Record<string, { income: number; expense: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        months[d.toISOString().substring(0, 7)] = { income: 0, expense: 0 };
      }
      data?.forEach(t => {
        const key = t.date.substring(0, 7);
        if (months[key]) {
          if (t.type === 'income') months[key].income += Number(t.amount);
          else months[key].expense += Number(t.amount);
        }
      });
      return Object.entries(months).map(([month, v]) => ({
        month: new Date(month + '-01').toLocaleDateString('en', { month: 'short', year: '2-digit' }), ...v
      }));
    }
  });
}
