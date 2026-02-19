import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import MonthlyTracker from "./pages/MonthlyTracker";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Loans from "./pages/Loans";
import SavingsGoals from "./pages/SavingsGoals";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// ─── Admin Imports ────────────────────────────────────────────────────────
import { AdminAuthProvider, useAdminAuth } from "./admin/hooks/useAdminAuth";
import { AdminLayout } from "./admin/components/layout/AdminLayout";
import { AdminLogin } from "./admin/pages/AdminLogin";
import { AdminOverview } from "./admin/pages/AdminOverview";
import { AdminDatabase } from "./admin/pages/AdminDatabase";
import { AdminSQL } from "./admin/pages/AdminSQL";
import { AdminUsers } from "./admin/pages/AdminUsers";
import { AdminAnalytics, AdminActivity, AdminAlerts, AdminSettings } from "./admin/pages/AdminOtherPages";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60000, retry: 1 } } });

// ─── User App Protection ──────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

// ─── Admin Protection ─────────────────────────────────────────────────────
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* ─── Main App Routes ─── */}
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/monthly" element={<ProtectedRoute><MonthlyTracker /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
      <Route path="/loans" element={<ProtectedRoute><Loans /></ProtectedRoute>} />
      <Route path="/goals" element={<ProtectedRoute><SavingsGoals /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* ─── Admin Panel Routes ─── */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminRoute><AdminOverview /></AdminRoute>} />
      <Route path="/admin/database" element={<AdminRoute><AdminDatabase /></AdminRoute>} />
      <Route path="/admin/sql" element={<AdminRoute><AdminSQL /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
      <Route path="/admin/activity" element={<AdminRoute><AdminActivity /></AdminRoute>} />
      <Route path="/admin/alerts" element={<AdminRoute><AdminAlerts /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminAuthProvider>
          <ThemeProvider>
            <Toaster richColors />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ThemeProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
