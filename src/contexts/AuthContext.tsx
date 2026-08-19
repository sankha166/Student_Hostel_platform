import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authAPI } from "@/lib/api";

export interface User { id: string; email: string; name: string; role: "student" | "owner"; avatar?: string; avatar_url?: string; phone?: string; address?: string; }
interface AuthContextType { user: User | null; loading: boolean; isAuthenticated: boolean; login: (user: User, token: string) => void; logout: () => void; updateUser: (updates: Partial<User>) => void; }
const AuthContext = createContext<AuthContextType | null>(null);
const AUTH_TOKEN_KEY = "auth_token";
const USER_DATA_KEY = "userData";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,setUser]=useState<User|null>(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{ (async()=>{ const token=localStorage.getItem(AUTH_TOKEN_KEY); if(!token){setLoading(false);return;} try { const result=await authAPI.verifyToken(); const next=result.user as User; setUser(next); localStorage.setItem(USER_DATA_KEY,JSON.stringify(next)); } catch { localStorage.removeItem(AUTH_TOKEN_KEY); localStorage.removeItem(USER_DATA_KEY); setUser(null); } finally { setLoading(false); } })(); },[]);
  const login=(newUser:User,token:string)=>{localStorage.setItem(AUTH_TOKEN_KEY,token);localStorage.setItem(USER_DATA_KEY,JSON.stringify(newUser));setUser(newUser);};
  const logout=()=>{localStorage.removeItem(AUTH_TOKEN_KEY);localStorage.removeItem(USER_DATA_KEY);setUser(null);};
  const updateUser=(updates:Partial<User>)=>{if(!user)return;const updated={...user,...updates};localStorage.setItem(USER_DATA_KEY,JSON.stringify(updated));setUser(updated);};
  return <AuthContext.Provider value={{user,loading,isAuthenticated:!!user,login,logout,updateUser}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const ctx=useContext(AuthContext);if(!ctx)throw new Error("useAuth must be used inside AuthProvider");return ctx;}
