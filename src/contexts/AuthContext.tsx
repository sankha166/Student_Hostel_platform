import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, setToken } from "@/lib/apiClient";

export interface User {
  id: string;
  accountId: string;
  email: string;
  name: string; // computed from firstName + lastName
  firstName: string;
  lastName?: string;
  role: "student" | "owner"; // frontend maps "resident"→"student", "owner"→"owner"
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; name: string; role: "student" | "owner"; phone?: string }) => Promise<User>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_DATA_KEY = "userData";

function mapBackendUser(u: any): User {
  const role = u.role === "resident" ? "student" : "owner";
  return {
    id: u.id,
    accountId: u.accountId,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    name: [u.firstName, u.lastName].filter(Boolean).join(" "),
    role: role as "student" | "owner",
    phone: u.phone,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const raw = localStorage.getItem(USER_DATA_KEY);
    if (token && raw) {
      try {
        setUser(mapBackendUser(JSON.parse(raw)));
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem(USER_DATA_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await api.post<{ token: string; user: any }>("/auth/login", { email, password });
    setToken(data.token);
    const mapped = mapBackendUser(data.user);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
    setUser(mapped);
    return mapped;
  };

  const register = async (reg: { email: string; password: string; name: string; role: "student" | "owner"; phone?: string }): Promise<User> => {
    const backendRole = reg.role === "student" ? "resident" : "owner";
    const data = await api.post<{ token: string; user: any }>("/auth/register", { ...reg, role: backendRole });
    setToken(data.token);
    const mapped = mapBackendUser(data.user);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
    setUser(mapped);
    return mapped;
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem(USER_DATA_KEY);
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
