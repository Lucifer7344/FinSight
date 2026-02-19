-- Create transaction type enum
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');

-- Profiles
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    currency TEXT DEFAULT 'INR',
    monthly_budget DECIMAL(12,2) DEFAULT 0,
    low_fund_threshold DECIMAL(12,2) DEFAULT 100,
    theme TEXT DEFAULT 'light',
    accent_color TEXT DEFAULT '#10b981',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'tag',
    color TEXT DEFAULT '#6366f1',
    type transaction_type NOT NULL DEFAULT 'expense',
    category_group TEXT DEFAULT 'variable',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transactions
CREATE TABLE public.transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    type transaction_type NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency TEXT,
    next_occurrence DATE,
    reminder_enabled BOOLEAN DEFAULT false,
    reminder_days_before INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Budgets
CREATE TABLE public.budgets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, category_id, month, year)
);

-- Alerts
CREATE TABLE public.alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Loans
CREATE TABLE public.loans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    monthly_emi NUMERIC NOT NULL DEFAULT 0,
    remaining_balance NUMERIC NOT NULL DEFAULT 0,
    loan_type TEXT NOT NULL DEFAULT 'loan',
    is_active BOOLEAN NOT NULL DEFAULT true,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Monthly Income
CREATE TABLE public.monthly_income (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, month, year)
);

-- Savings Goals
CREATE TABLE public.savings_goals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC NOT NULL DEFAULT 0,
    current_amount NUMERIC NOT NULL DEFAULT 0,
    deadline DATE,
    icon TEXT DEFAULT 'target',
    color TEXT DEFAULT '#10b981',
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "profiles_self" ON public.profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "categories_self" ON public.categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "transactions_self" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "budgets_self" ON public.budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "alerts_self" ON public.alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "loans_self" ON public.loans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "monthly_income_self" ON public.monthly_income FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "savings_goals_self" ON public.savings_goals FOR ALL USING (auth.uid() = user_id);

-- Updated at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

-- Updated at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_monthly_income_updated_at BEFORE UPDATE ON public.monthly_income FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON public.savings_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, currency)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'INR');
    
    -- Default categories
    INSERT INTO public.categories (user_id, name, icon, color, type, category_group, is_default) VALUES
        (NEW.id, 'Salary', 'briefcase', '#10b981', 'income', 'variable', true),
        (NEW.id, 'Freelance', 'laptop', '#06b6d4', 'income', 'variable', true),
        (NEW.id, 'Investments', 'trending-up', '#8b5cf6', 'income', 'variable', true),
        (NEW.id, 'Food', 'utensils', '#f97316', 'expense', 'variable', true),
        (NEW.id, 'Shopping', 'shopping-bag', '#ec4899', 'expense', 'variable', true),
        (NEW.id, 'Entertainment', 'film', '#a855f7', 'expense', 'variable', true),
        (NEW.id, 'Health', 'heart', '#ef4444', 'expense', 'variable', true),
        (NEW.id, 'Travel', 'plane', '#3b82f6', 'expense', 'variable', true),
        (NEW.id, 'Rent', 'home', '#14b8a6', 'expense', 'fixed', true),
        (NEW.id, 'Miscellaneous', 'tag', '#6366f1', 'expense', 'variable', true);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
