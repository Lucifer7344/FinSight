export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: { created_at: string; id: string; is_read: boolean | null; message: string | null; title: string; type: string; user_id: string }
        Insert: { created_at?: string; id?: string; is_read?: boolean | null; message?: string | null; title: string; type: string; user_id: string }
        Update: { created_at?: string; id?: string; is_read?: boolean | null; message?: string | null; title?: string; type?: string; user_id?: string }
        Relationships: []
      }
      budgets: {
        Row: { amount: number; category_id: string | null; created_at: string; id: string; month: number; user_id: string; year: number }
        Insert: { amount: number; category_id?: string | null; created_at?: string; id?: string; month: number; user_id: string; year: number }
        Update: { amount?: number; category_id?: string | null; created_at?: string; id?: string; month?: number; user_id?: string; year?: number }
        Relationships: [{ foreignKeyName: "budgets_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] }]
      }
      categories: {
        Row: { category_group: string | null; color: string | null; created_at: string; icon: string | null; id: string; is_default: boolean | null; name: string; type: Database["public"]["Enums"]["transaction_type"]; user_id: string }
        Insert: { category_group?: string | null; color?: string | null; created_at?: string; icon?: string | null; id?: string; is_default?: boolean | null; name: string; type?: Database["public"]["Enums"]["transaction_type"]; user_id: string }
        Update: { category_group?: string | null; color?: string | null; created_at?: string; icon?: string | null; id?: string; is_default?: boolean | null; name?: string; type?: Database["public"]["Enums"]["transaction_type"]; user_id?: string }
        Relationships: []
      }
      loans: {
        Row: { created_at: string; id: string; is_active: boolean; loan_type: string; monthly_emi: number; name: string; remaining_balance: number; start_date: string; total_amount: number; updated_at: string; user_id: string }
        Insert: { created_at?: string; id?: string; is_active?: boolean; loan_type?: string; monthly_emi?: number; name: string; remaining_balance?: number; start_date?: string; total_amount?: number; updated_at?: string; user_id: string }
        Update: { created_at?: string; id?: string; is_active?: boolean; loan_type?: string; monthly_emi?: number; name?: string; remaining_balance?: number; start_date?: string; total_amount?: number; updated_at?: string; user_id?: string }
        Relationships: []
      }
      monthly_income: {
        Row: { amount: number; created_at: string; id: string; month: number; updated_at: string; user_id: string; year: number }
        Insert: { amount?: number; created_at?: string; id?: string; month: number; updated_at?: string; user_id: string; year: number }
        Update: { amount?: number; created_at?: string; id?: string; month?: number; updated_at?: string; user_id?: string; year?: number }
        Relationships: []
      }
      profiles: {
        Row: { accent_color: string | null; created_at: string; currency: string | null; full_name: string | null; id: string; low_fund_threshold: number | null; monthly_budget: number | null; theme: string | null; updated_at: string; user_id: string }
        Insert: { accent_color?: string | null; created_at?: string; currency?: string | null; full_name?: string | null; id?: string; low_fund_threshold?: number | null; monthly_budget?: number | null; theme?: string | null; updated_at?: string; user_id: string }
        Update: { accent_color?: string | null; created_at?: string; currency?: string | null; full_name?: string | null; id?: string; low_fund_threshold?: number | null; monthly_budget?: number | null; theme?: string | null; updated_at?: string; user_id?: string }
        Relationships: []
      }
      savings_goals: {
        Row: { color: string | null; created_at: string; current_amount: number; deadline: string | null; icon: string | null; id: string; is_completed: boolean; name: string; target_amount: number; updated_at: string; user_id: string }
        Insert: { color?: string | null; created_at?: string; current_amount?: number; deadline?: string | null; icon?: string | null; id?: string; is_completed?: boolean; name: string; target_amount?: number; updated_at?: string; user_id: string }
        Update: { color?: string | null; created_at?: string; current_amount?: number; deadline?: string | null; icon?: string | null; id?: string; is_completed?: boolean; name?: string; target_amount?: number; updated_at?: string; user_id?: string }
        Relationships: []
      }
      transactions: {
        Row: { amount: number; category_id: string | null; created_at: string; date: string; description: string | null; id: string; is_recurring: boolean | null; next_occurrence: string | null; recurring_frequency: string | null; reminder_days_before: number | null; reminder_enabled: boolean | null; type: Database["public"]["Enums"]["transaction_type"]; updated_at: string; user_id: string }
        Insert: { amount: number; category_id?: string | null; created_at?: string; date?: string; description?: string | null; id?: string; is_recurring?: boolean | null; next_occurrence?: string | null; recurring_frequency?: string | null; reminder_days_before?: number | null; reminder_enabled?: boolean | null; type: Database["public"]["Enums"]["transaction_type"]; updated_at?: string; user_id: string }
        Update: { amount?: number; category_id?: string | null; created_at?: string; date?: string; description?: string | null; id?: string; is_recurring?: boolean | null; next_occurrence?: string | null; recurring_frequency?: string | null; reminder_days_before?: number | null; reminder_enabled?: boolean | null; type?: Database["public"]["Enums"]["transaction_type"]; updated_at?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "transactions_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] }]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { transaction_type: "income" | "expense" }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]
