import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { Loader2 } from "lucide-react";

// Admin
import { AdminAuthProvider, useAdminAuth } from "./admin/hooks/useAdminAuth";
import { AdminLayout } from "./admin/components/layout/AdminLayout";

// Lazy load all pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MonthlyTracker = lazy(() => import("./pages/MonthlyTracker"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Budgets = lazy(() => import("./pages/Budgets"));
const Loans = lazy(() => import("./pages/Loans"));
const SavingsGoals = lazy(() => import("./pages/SavingsGoals"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages — all lazy loaded
const AdminLogin = lazy(() => import("./admin/pages/AdminLogin").then(m => ({ default: m.AdminLogin })));
const AdminOverview = lazy(() => import("./admin/pages/AdminOverview").then(m => ({ default: m.AdminOverview })));
const AdminDatabase = lazy(() => import("./admin/pages/AdminDatabase").then(m => ({ default: m.AdminDatabase })));
const AdminSQL = lazy(() => import("./admin/pages/AdminSQL").then(m => ({ default: m.AdminSQL })));
const AdminUsers = lazy(() => import("./admin/pages/AdminUsers").then(m => ({ default: m.AdminUsers })));
const AdminAnalytics = lazy(() => import("./admin/pages/AdminOtherPages").then(m => ({ default: m.AdminAnalytics })));
const AdminActivity = lazy(() => import("./admin/pages/AdminOtherPages").then(m => ({ default: m.AdminActivity })));
const AdminAlerts = lazy(() => import("./admin/pages/AdminOtherPages").then(m => ({ default: m.AdminAlerts })));
const AdminSettings = lazy(() => import("./admin/pages/AdminOtherPages").then(m => ({ default: m.AdminSettings })));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, retry: 1, refetchOnWindowFocus: false } }
});

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center glass-bg">
      <div className="glass-card p-8 rounded-3xl flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl glass-primary flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* User App */}
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
        {/* Admin */}
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
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminAuthProvider>
          <ThemeProvider>
            <Toaster richColors position="top-right" />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ThemeProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
