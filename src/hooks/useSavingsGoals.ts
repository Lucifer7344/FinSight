import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { SavingsGoal } from '@/lib/types';

export function useSavingsGoals() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['savings_goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('savings_goals').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data as SavingsGoal[];
    },
    enabled: !!user,
  });

  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const completedGoals = goals.filter(g => g.is_completed).length;

  const addGoal = useMutation({
    mutationFn: async (goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('savings_goals').insert({ ...goal, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings_goals'] }),
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SavingsGoal> & { id: string }) => {
      const { error } = await supabase.from('savings_goals').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings_goals'] }),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings_goals'] }),
  });

  const addContribution = useMutation({
    mutationFn: async ({ goal, amount }: { goal: SavingsGoal; amount: number }) => {
      const newAmount = Number(goal.current_amount) + amount;
      const { error } = await supabase.from('savings_goals').update({
        current_amount: newAmount,
        is_completed: newAmount >= Number(goal.target_amount),
      }).eq('id', goal.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings_goals'] }),
  });

  return { goals, totalSaved, totalTarget, completedGoals, isLoading, addGoal, updateGoal, deleteGoal, addContribution };
}
