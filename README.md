# FinSight — Personal Finance Tracker

A production-ready personal finance tracking web app built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- 📊 **Dashboard** — Income/expense overview, charts, budget status, recent transactions
- 📅 **Monthly Tracker** — View expenses grouped by Fixed/Variable/Transfers per month
- 💳 **Transactions** — Add, edit, delete, search & filter all transactions
- 🏦 **Loans & Cards** — Track loans, credit card balances, EMIs, record payments
- 🎯 **Savings Goals** — Create goals, track progress, add contributions
- 📈 **Reports** — Monthly/yearly charts, spending by category, top categories
- 💰 **Budgets** — Set monthly budget, track spending by category
- ⚙️ **Settings** — Profile, theme (light/dark/system), categories, notifications

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS + shadcn/ui components
- **State**: TanStack Query (React Query)
- **Auth + DB**: Supabase
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo>
cd finsight
npm install
```

### 2. Set up Supabase

Your `.env` is already configured with the project credentials. If you need to use a different Supabase project:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

### 3. Run the SQL migration

In the Supabase dashboard → SQL Editor, run the file:
```
supabase/migrations/001_initial_schema.sql
```

### 4. Start development

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

The `dist/` folder can be deployed to:
- **Vercel**: `vercel --prod`
- **Netlify**: Drag & drop the `dist` folder
- **Cloudflare Pages**: Connect your repo

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Deploy

### Netlify

1. `npm run build`
2. Drag `dist/` folder to Netlify
3. Set environment variables in site settings

### Environment Variables

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon key |

## Project Structure

```
src/
├── components/
│   ├── layout/       # AppLayout, sidebar
│   ├── transactions/ # AddTransactionDialog
│   └── ui/           # shadcn-style UI components
├── hooks/            # Data hooks (useAuth, useTransactions, etc.)
├── integrations/
│   └── supabase/     # Client + TypeScript types
├── lib/              # Types, utilities
└── pages/            # Route pages
```
