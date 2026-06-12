import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
  subscriptionTier: string | null;
  subscriptionExpiry: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("apex_token"));
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const storedToken = localStorage.getItem("apex_token");
    if (!storedToken) { setIsLoading(false); return; }
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${storedToken}` } })
      .then(r => r.ok ? r.json() : null)
      .then(u => { if (u) { setUser(u); setToken(storedToken); } else { localStorage.removeItem("apex_token"); setToken(null); } })
      .catch(() => { localStorage.removeItem("apex_token"); setToken(null); })
      .finally(() => setIsLoading(false));
  }, []);

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem("apex_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("apex_token");
    setToken(null);
    setUser(null);
    queryClient.clear();
  };

  return <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
