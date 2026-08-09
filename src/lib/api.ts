import { apiRequest, APIError, setAccessToken } from './apiClient';

export { APIError };

export const studentAPI={
 searchHostels:async(query:string,filters:Record<string,any>={})=>{const params=new URLSearchParams();if(query)params.set('q',query);if(filters.city)params.set('city',filters.city);const r=await apiRequest<any>(`/api/v1/properties?${params}`);return r.data||[];},
 searchByImage:async(_file:File)=>({results:[],message:'Image search is not enabled until an AI vision provider is configured.'}),
 getHostelDetails:async(id:string)=>{const r=await apiRequest<any>(`/api/v1/properties/${id}`);return r.data;},
 getHostelReviews:async(id:string)=>{const r=await apiRequest<any>(`/api/v1/reviews/${id}`);return r.data||[];},
 bookHostel:async(hostelId:string,bookingData:Record<string,any>)=>{const r=await apiRequest<any>('/api/v1/bookings',{method:'POST',body:JSON.stringify({propertyId:hostelId,roomId:bookingData.roomId,visitDate:bookingData.visitDate,message:bookingData.message})});return r.data;},
 getRentPayments:async(_studentId:string)=>{const r=await apiRequest<any>('/api/v1/payments/mine');return r.data||[];},
 getProfile:async(_studentId:string)=>{const r=await apiRequest<any>('/api/v1/me');return r.data;}
};

export const ownerAPI={
 getProperties:async(_ownerId:string)=>{const r=await apiRequest<any>('/api/v1/properties?mine=true');return r.data||[];},
 createProperty:async(data:Record<string,any>)=>{const r=await apiRequest<any>('/api/v1/properties',{method:'POST',body:JSON.stringify(data)});return r.data;},
 updateProperty:async(id:string,updates:Record<string,any>)=>{const r=await apiRequest<any>(`/api/v1/properties/${id}`,{method:'PATCH',body:JSON.stringify(updates)});return r.data;},
 deleteProperty:async(_id:string)=>({success:false,message:'Property deletion is intentionally disabled until soft-delete/audit support is added.'}),
 getPropertyRooms:async(id:string)=>{const r=await apiRequest<any>(`/api/v1/properties/${id}/rooms`);return r.data||[];},
 getPropertyTenants:async(_id:string)=>{return [];},
 addTenant:async(_propertyId:string,_data:Record<string,any>)=>{throw new Error('Tenant onboarding endpoint is the next persistence module.');},
 getBookingRequests:async(_id:string)=>{const r=await apiRequest<any>('/api/v1/bookings/owner');return r.data||[];},
 respondToBooking:async(id:string,status:'approved'|'rejected',data:Record<string,any>={})=>{const r=await apiRequest<any>(`/api/v1/bookings/${id}/status`,{method:'PATCH',body:JSON.stringify({status,roomId:data.roomId})});return r.data;},
 getPaymentAccounts:async(_ownerId:string)=>[],
 addPaymentAccount:async(_ownerId:string,_data:Record<string,any>)=>{throw new Error('Payment-account endpoint is not implemented yet.');},
 getProfile:async(_ownerId:string)=>{const r=await apiRequest<any>('/api/v1/me');return r.data;},
 updateProfile:async(_ownerId:string,updates:Record<string,any>)=>{const r=await apiRequest<any>('/api/v1/me',{method:'PATCH',body:JSON.stringify(updates)});return r.data;}
};

export const authAPI={
 studentLogin:async(email:string,password:string)=>login(email,password),
 ownerLogin:async(email:string,password:string)=>login(email,password),
 studentSignup:async(data:Record<string,any>)=>register({...data,role:'student'}),
 ownerSignup:async(data:Record<string,any>)=>register({...data,role:'owner'}),
 googleLogin:async()=>{throw new Error('Google OAuth requires provider credentials and backend OAuth configuration.');},
 logout:async()=>{setAccessToken(null);return {success:true};},
 verifyToken:async(_token:string)=>{try{await apiRequest('/api/v1/me');return {valid:true};}catch{return {valid:false};}},
 refreshToken:async()=>{throw new Error('Refresh-token rotation is not enabled yet.');},
 forgotPassword:async()=>({message:'Password reset email provider must be configured before enabling this flow.'}),
 resetPassword:async()=>({success:false,message:'Password reset endpoint is not enabled yet.'})
};
async function login(email:string,password:string){const r=await apiRequest<any>('/api/v1/auth/login',{method:'POST',body:JSON.stringify({email,password})});setAccessToken(r.data.token);return r.data;}
async function register(data:Record<string,any>){const r=await apiRequest<any>('/api/v1/auth/register',{method:'POST',body:JSON.stringify(data)});setAccessToken(r.data.token);return r.data;}

export const paymentAPI={
 initializePayment:async(amount:number,description:string)=>{const r=await apiRequest<any>('/api/v1/payments/initialize',{method:'POST',body:JSON.stringify({amount,description})});return r.data;},
 verifyPayment:async(paymentId:string,_signature:string)=>({verified:false,paymentId,message:'Payment verification must be completed by a configured gateway webhook.'})
};

export const aiServices={
 extractRoomFeatures:async(_file:File)=>({features:[],message:'Configure a vision provider to enable image feature extraction.'}),
 getRecommendations:async(_preferences:Record<string,any>)=>{const r=await apiRequest<any>('/api/v1/properties');return (r.data||[]).slice(0,3);},
 processUserQuery:async(query:string)=>({query,intent:'search',preferences:{query}})
};

export async function handleAPIResponse(response:Response){const data=await response.json().catch(()=>({}));if(!response.ok)throw new APIError(response.status,data?.error?.message||'API Error',data);return data;}
