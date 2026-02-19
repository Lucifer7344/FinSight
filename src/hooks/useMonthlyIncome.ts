import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useMonthlyIncome(month: Date) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['monthly_income', user?.id, month.getFullYear(), month.getMonth() + 1],
    queryFn: async () => {
      const { data } = await supabase.from('monthly_income')
        .select('*').eq('user_id', user!.id)
        .eq('month', month.getMonth() + 1).eq('year', month.getFullYear()).single();
      return data;
    },
    enabled: !!user,
  });

  const setIncome = useMutation({
    mutationFn: async (amount: number) => {
      const { error } = await supabase.from('monthly_income').upsert({
        user_id: user!.id, amount, month: month.getMonth() + 1, year: month.getFullYear(),
      }, { onConflict: 'user_id,month,year' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['monthly_income'] }),
  });

  return { amount: data?.amount || 0, isLoading, setIncome };
}
