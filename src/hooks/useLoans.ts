import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Loan } from '@/lib/types';

export function useLoans() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['loans', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('loans').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data as Loan[];
    },
    enabled: !!user,
  });

  const activeLoans = loans.filter(l => l.is_active);
  const totalEMI = activeLoans.reduce((sum, l) => sum + Number(l.monthly_emi), 0);
  const totalDebt = activeLoans.reduce((sum, l) => sum + Number(l.remaining_balance), 0);

  const addLoan = useMutation({
    mutationFn: async (loan: Omit<Loan, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('loans').insert({ ...loan, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loans'] }),
  });

  const updateLoan = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Loan> & { id: string }) => {
      const { error } = await supabase.from('loans').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loans'] }),
  });

  const deleteLoan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('loans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loans'] }),
  });

  const makePayment = useMutation({
    mutationFn: async ({ loan, amount }: { loan: Loan; amount: number }) => {
      const newBalance = Math.max(0, Number(loan.remaining_balance) - amount);
      const { error } = await supabase.from('loans').update({
        remaining_balance: newBalance,
        is_active: newBalance > 0,
      }).eq('id', loan.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loans'] }),
  });

  return { loans, activeLoans, totalEMI, totalDebt, isLoading, addLoan, updateLoan, deleteLoan, makePayment };
}
