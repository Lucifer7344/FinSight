import { createContext, useContext, useState } from 'react';

const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

interface AdminAuthCtx { isAuthenticated: boolean; login: (p: string) => boolean; logout: () => void; }
const AdminAuthContext = createContext<AdminAuthCtx>({ isAuthenticated: false, login: () => false, logout: () => {} });

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('_adm') === '1');

  const login = (password: string) => {
    if (password === ADMIN_PASS) { setIsAuthenticated(true); sessionStorage.setItem('_adm', '1'); return true; }
    return false;
  };
  const logout = () => { setIsAuthenticated(false); sessionStorage.removeItem('_adm'); };

  return <AdminAuthContext.Provider value={{ isAuthenticated, login, logout }}>{children}</AdminAuthContext.Provider>;
}

export const useAdminAuth = () => useContext(AdminAuthContext);
