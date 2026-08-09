const API_BASE_URL=(import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/,'');
let accessToken=localStorage.getItem('auth_token');
export function setAccessToken(token:string|null){accessToken=token;if(token)localStorage.setItem('auth_token',token);else localStorage.removeItem('auth_token');}
export async function apiRequest<T>(path:string,options:RequestInit={}){const headers=new Headers(options.headers);if(options.body && !headers.has('Content-Type'))headers.set('Content-Type','application/json');if(accessToken)headers.set('Authorization',`Bearer ${accessToken}`);const response=await fetch(`${API_BASE_URL}${path}`,{...options,headers});const data=await response.json().catch(()=>({}));if(!response.ok)throw new APIError(response.status,data?.error?.message||'API request failed',data);return data as T;}
export class APIError extends Error{constructor(public status:number,message:string,public data?:unknown){super(message);this.name='APIError';}}
