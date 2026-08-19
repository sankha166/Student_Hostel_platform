const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");
const TOKEN_KEY = "auth_token";
export class APIError extends Error { constructor(public status:number, public data:any){super(data?.message||"API request failed");} }
async function request<T>(path:string, options:RequestInit={}):Promise<T>{const headers=new Headers(options.headers);if(options.body&&!headers.has("Content-Type"))headers.set("Content-Type","application/json");const token=localStorage.getItem(TOKEN_KEY);if(token)headers.set("Authorization",`Bearer ${token}`);const response=await fetch(`${API_BASE}${path}`,{...options,headers});const data=await response.json().catch(()=>({}));if(!response.ok)throw new APIError(response.status,data);return data as T;}
const qs=(p:Record<string,any>)=>{const q=new URLSearchParams();Object.entries(p).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=="")q.set(k,String(v));});return q.toString()?`?${q}`:"";};
export const studentAPI={
 searchHostels:(query:string,filters:Record<string,any>={})=>request<{results:any[]}>(`/api/hostels${qs({q:query,...filters})}`),
 getHostelDetails:(id:string)=>request<any>(`/api/hostels/${id}`),
 getHostelReviews:(id:string)=>request<{results:any[]}>(`/api/reviews/property/${id}`),
 submitReview:(propertyId:string,rating:number,comment?:string)=>request<any>("/api/reviews",{method:"POST",body:JSON.stringify({propertyId,rating,comment})}),
 bookHostel:(propertyId:string,data:Record<string,any>)=>request<any>("/api/bookings",{method:"POST",body:JSON.stringify({propertyId,...data})}),
 getBookings:()=>request<{results:any[]}>("/api/bookings"),
 cancelBooking:(id:string)=>request<any>(`/api/bookings/${id}`,{method:"PATCH",body:JSON.stringify({status:"cancelled"})}),
 getAgreements:()=>request<{results:any[]}>("/api/agreements"),
 getBills:()=>request<{results:any[]}>("/api/bills"),
 payBill:(id:string)=>request<any>(`/api/bills/${id}/pay`,{method:"POST"}),
 getRentPayments:()=>request<{results:any[]}>("/api/payments"),
 getNotifications:()=>request<{results:any[]}>("/api/notifications"),
 markNotificationRead:(id:string)=>request<any>(`/api/notifications/${id}/read`,{method:"PATCH"}),
 getFoodOrders:()=>request<{results:any[]}>("/api/food/orders"),
 createFoodOrder:(data:Record<string,any>)=>request<any>("/api/food/orders",{method:"POST",body:JSON.stringify(data)}),
 getProfile:()=>request<any>("/api/auth/me"),
 updateProfile:(data:Record<string,any>)=>request<any>("/api/auth/profile",{method:"PATCH",body:JSON.stringify(data)}),
};
export const ownerAPI={
 getProperties:()=>request<{results:any[]}>("/api/owner/properties"),
 createProperty:(data:Record<string,any>)=>request<any>("/api/owner/properties",{method:"POST",body:JSON.stringify(data)}),
 updateProperty:(id:string,data:Record<string,any>)=>request<any>(`/api/owner/properties/${id}`,{method:"PATCH",body:JSON.stringify(data)}),
 deleteProperty:(id:string)=>request<any>(`/api/owner/properties/${id}`,{method:"DELETE"}),
 getPropertyRooms:(id:string)=>request<{results:any[]}>(`/api/owner/properties/${id}/rooms`),
 addRoom:(id:string,data:Record<string,any>)=>request<any>(`/api/owner/properties/${id}/rooms`,{method:"POST",body:JSON.stringify(data)}),
 updateRoom:(id:string,data:Record<string,any>)=>request<any>(`/api/owner/rooms/${id}`,{method:"PATCH",body:JSON.stringify(data)}),
 getTenants:()=>request<{results:any[]}>("/api/agreements"),
 getBookingRequests:()=>request<{results:any[]}>("/api/bookings"),
 respondToBooking:(id:string,status:"approved"|"rejected",data:Record<string,any>={})=>request<any>(`/api/bookings/${id}`,{method:"PATCH",body:JSON.stringify({...data,status:status==="approved"?"accepted":"rejected"})}),
 getBills:()=>request<{results:any[]}>("/api/bills"),
 createBill:(data:Record<string,any>)=>request<any>("/api/bills",{method:"POST",body:JSON.stringify(data)}),
 getPayments:()=>request<{results:any[]}>("/api/payments"),
 getFoodOrders:()=>request<{results:any[]}>("/api/food/orders"),
 updateFoodOrder:(id:string,status:string)=>request<any>(`/api/food/orders/${id}`,{method:"PATCH",body:JSON.stringify({status})}),
 getProfile:()=>request<any>("/api/auth/me"),
 updateProfile:(data:Record<string,any>)=>request<any>("/api/auth/profile",{method:"PATCH",body:JSON.stringify(data)}),
};
export const authAPI={
 studentLogin:(email:string,password:string)=>request<any>("/api/auth/login",{method:"POST",body:JSON.stringify({email,password})}),
 studentSignup:(data:Record<string,any>)=>request<any>("/api/auth/signup",{method:"POST",body:JSON.stringify({...data,name:data.name||data.fullName,role:"student"})}),
 ownerLogin:(email:string,password:string)=>request<any>("/api/auth/login",{method:"POST",body:JSON.stringify({email,password})}),
 ownerSignup:(data:Record<string,any>)=>request<any>("/api/auth/signup",{method:"POST",body:JSON.stringify({...data,name:data.name||data.fullName,role:"owner"})}),
 logout:async()=>{localStorage.removeItem(TOKEN_KEY);localStorage.removeItem("userData");return{success:true};},
 verifyToken:()=>request<any>("/api/auth/me"),
};
export const paymentAPI={initializePayment:(amount:number,description:string)=>request<any>("/api/payments/order",{method:"POST",body:JSON.stringify({amount,description})}),verifyPayment:(paymentId:string,signature?:string)=>request<any>("/api/payments/verify",{method:"POST",body:JSON.stringify({paymentId,signature})})};
