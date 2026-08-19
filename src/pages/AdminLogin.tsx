import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_BASE_URL } from '@/lib/backend';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  if (localStorage.getItem('admin_token')) return <Navigate to="/admin" replace />;
  async function submit(e:FormEvent){e.preventDefault();setLoading(true);setError('');try{const r=await fetch(`${API_BASE_URL}/api/admin/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});const d=await r.json();if(!r.ok)throw new Error(d.message||'Login failed');localStorage.setItem('admin_token',d.token);localStorage.setItem('admin_user',JSON.stringify(d.user));navigate('/admin',{replace:true});}catch(err){setError(err instanceof Error?err.message:'Login failed');}finally{setLoading(false);}}
  return <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6"><form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl space-y-5"><div className="flex items-center gap-3"><div className="rounded-2xl bg-primary/10 p-3"><ShieldCheck className="text-primary"/></div><div><h1 className="text-2xl font-bold">Administrator</h1><p className="text-sm text-muted-foreground">Residential Nexus control center</p></div></div>{error&&<div className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">{error}</div>}<div className="relative"><Mail className="absolute left-3 top-3.5 size-4 text-muted-foreground"/><Input className="pl-10" type="email" required placeholder="Admin email" value={email} onChange={e=>setEmail(e.target.value)}/></div><div className="relative"><Lock className="absolute left-3 top-3.5 size-4 text-muted-foreground"/><Input className="pl-10" type="password" required placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/></div><Button disabled={loading} className="w-full h-11">{loading?'Signing in…':'Sign in securely'}</Button><p className="text-xs text-center text-muted-foreground">Administrator credentials are configured server-side. No default password is stored in the frontend.</p></form></div>;
}
