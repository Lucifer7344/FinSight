import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Transaction } from '@/lib/types';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export function useTransactions(month?: Date) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const monthKey = month ? format(month, 'yyyy-MM') : 'all';

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', user?.id, monthKey],
    queryFn: async () => {
      let query = supabase.from('transactions')
        .select('*, category:categories(*)')
        .eq('user_id', user!.id)
        .order('date', { ascending: false });

      if (month) {
        query = query
          .gte('date', format(startOfMonth(month), 'yyyy-MM-dd'))
          .lte('date', format(endOfMonth(month), 'yyyy-MM-dd'));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });

  const addTransaction = useMutation({
    mutationFn: async (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category'>) => {
      const { error } = await supabase.from('transactions').insert({ ...tx, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      const { category, ...rest } = updates as any;
      const { error } = await supabase.from('transactions').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });

  return { transactions, isLoading, addTransaction, updateTransaction, deleteTransaction };
}
