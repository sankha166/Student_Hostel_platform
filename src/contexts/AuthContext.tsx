import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authAPI } from "@/lib/api";
import { setAccessToken } from "@/lib/apiClient";

export interface User { id:string; email:string; name:string; role:"student"|"owner"|"admin"; avatar?:string; phone?:string; address?:string; }
interface AuthContextType { user:User|null; loading:boolean; isAuthenticated:boolean; login:(user:User,token:string)=>void; logout:()=>void; updateUser:(updates:Partial<User>)=>void; }
const AuthContext=createContext<AuthContextType|null>(null);
const USER_DATA_KEY="userData";

export function AuthProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null); const [loading,setLoading]=useState(true);
 useEffect(()=>{(async()=>{const token=localStorage.getItem("auth_token");if(!token){setLoading(false);return;}try{setAccessToken(token);const result=await authAPI.verifyToken(token);if(result.valid){const profile=await fetch(`${(import.meta.env.VITE_API_URL||"http://localhost:3000").replace(/\/$/,"")}/api/v1/me`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json());if(profile?.data)setUser(profile.data);else throw new Error("Invalid session");}else{throw new Error("Expired session");}}catch{setAccessToken(null);localStorage.removeItem(USER_DATA_KEY);setUser(null);}finally{setLoading(false);}})();},[]);
 const login=(newUser:User,token:string)=>{setAccessToken(token);localStorage.setItem(USER_DATA_KEY,JSON.stringify(newUser));setUser(newUser);};
 const logout=()=>{void authAPI.logout();localStorage.removeItem(USER_DATA_KEY);setUser(null);};
 const updateUser=(updates:Partial<User>)=>{setUser(current=>current?{...current,...updates}:current);};
 return <AuthContext.Provider value={{user,loading,isAuthenticated:!!user,login,logout,updateUser}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const ctx=useContext(AuthContext);if(!ctx)throw new Error("useAuth must be used inside AuthProvider");return ctx;}
