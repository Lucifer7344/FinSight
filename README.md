# FinSight — Combined App + Admin Panel

A production-ready personal finance tracker with a fully integrated admin panel. Both apps run from a single codebase.

---

## Your Supabase Credentials (Pre-configured)

| Key | Value |
|-----|-------|
| Project URL | https://oewncjptnbocpvdeihxi.supabase.co |
| Anon/Publishable Key | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ld25janB0bmJvY3B2ZGVpaHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTk1NTgsImV4cCI6MjA4NzA3NTU1OH0.mA2IVcxGdgsVZXwtGBLnDuNKrRTC3Eh5hqKAzY1p0RM |

These are already in your .env file. No extra setup needed for credentials.

---

## Quick Start

Step 1: Install
  npm install

Step 2: Database Setup (REQUIRED for first time)
  - Go to: https://supabase.com/dashboard/project/oewncjptnbocpvdeihxi
  - Click SQL Editor in left sidebar
  - Paste and run the file: supabase/migrations/001_initial_schema.sql

Step 3: Run
  npm run dev
  - App: http://localhost:8080
  - Admin: http://localhost:8080/admin/login (password: admin123)

---

## URL Map

Main App:
  /                  Landing page
  /auth              Sign in / Sign up
  /dashboard         Dashboard
  /transactions      Transactions
  /monthly           Monthly tracker
  /loans             Loans & credit cards
  /goals             Savings goals
  /reports           Reports
  /budgets           Budgets
  /settings          Settings

Admin Panel:
  /admin/login       Admin login (password: admin123)
  /admin             Overview dashboard
  /admin/database    Browse all database tables
  /admin/sql         SQL query editor
  /admin/users       User management
  /admin/analytics   Platform analytics
  /admin/activity    Live transaction feed
  /admin/alerts      System alerts
  /admin/settings    Admin settings & docs

---

## How to Add/Change Credentials

Edit the .env file:

  VITE_SUPABASE_URL=https://oewncjptnbocpvdeihxi.supabase.co
  VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_jwt_key
  VITE_ADMIN_PASSWORD=your_admin_password
  VITE_SUPABASE_SERVICE_KEY=your_service_role_key  (optional, for full SQL access)

Where to find keys:
  1. Go to https://supabase.com/dashboard
  2. Select your project
  3. Settings -> API
  4. Copy: Project URL, anon/public key, service_role key

---

## Admin Panel Guide

Login: Go to /admin/login, password is admin123 (change via VITE_ADMIN_PASSWORD)

Features:
  Overview    - Platform stats, user signups chart, recent transactions
  Database    - Click any table card to browse rows with pagination
  SQL Editor  - Write SELECT queries, use quick templates, export to CSV
  Users       - See all users, click row to open detail modal with transactions
  Analytics   - Income/expense bar charts, signup trends, engagement pie chart
  Activity    - Live feed of all transactions (auto-refreshes every 15 seconds)
  Alerts      - View/filter/delete system alerts, mark all as read
  Settings    - Env variable reference, schema docs

For full admin SQL (JOIN queries across tables):
  1. Get service_role key from Supabase Dashboard -> Settings -> API
  2. Add to .env: VITE_SUPABASE_SERVICE_KEY=your_key
  3. Restart dev server

WARNING: Service role key bypasses RLS. Never deploy publicly with it exposed.

---

## Build & Deploy

Build:
  npm run build     (output in /dist folder)

Deploy to Vercel:
  npm i -g vercel && vercel --prod
  Then set env variables in Vercel dashboard

Deploy to Netlify:
  netlify deploy --prod --dir=dist

Required env vars for deployment:
  VITE_SUPABASE_URL
  VITE_SUPABASE_PUBLISHABLE_KEY
  VITE_ADMIN_PASSWORD

---

## Project Structure

  src/
  |-- App.tsx                   Main router (user routes + /admin/* routes)
  |-- pages/                    FinSight user pages (Dashboard, Transactions, etc.)
  |-- admin/                    Admin panel (self-contained inside src/)
  |   |-- components/layout/    AdminLayout sidebar
  |   |-- hooks/                useAdminAuth, useAdminData
  |   |-- lib/                  supabaseAdmin client, utils
  |   +-- pages/                Admin page components
  |-- components/               Shared shadcn/ui components
  |-- hooks/                    User app hooks (useAuth, useTransactions, etc.)
  +-- integrations/supabase/    Auto-generated DB types + client

---

## Database Tables

Run supabase/migrations/001_initial_schema.sql to create:

  profiles         User settings (name, currency, budget, theme)
  transactions     All income/expense records
  categories       Custom categories per user
  budgets          Monthly category budget limits
  loans            Loans and credit cards with EMI
  savings_goals    Financial goals with progress tracking
  monthly_income   Monthly income entries
  alerts           System notifications (low fund, budget exceeded)

---

## Troubleshooting

"relation does not exist" error:
  -> Run the SQL migration file in Supabase SQL Editor

Admin shows no data:
  -> By default uses anon key (respects RLS - only shows logged-in user's data)
  -> Add VITE_SUPABASE_SERVICE_KEY for full admin data access

Auth not working:
  -> Check VITE_SUPABASE_PUBLISHABLE_KEY matches your project's anon JWT

App blank / network error:
  -> Verify VITE_SUPABASE_URL is correct in .env
