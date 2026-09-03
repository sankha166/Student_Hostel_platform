/**
 * Nexus API — typed client functions for the Residential Nexus backend.
 */
import { api } from "./apiClient";

// --- Types ---
export interface Property {
  id: string; accountId: string; name: string; type: string;
  address: string; city: string; state: string; pincode?: string;
  latitude?: number; longitude?: number;
  contactPhone?: string; contactEmail?: string;
  amenities: string[]; imageUrl?: string; rules: any;
  status: string; createdAt: string;
}

export interface Building { id: string; propertyId: string; name: string; floorsCount?: number; floors: Floor[]; }
export interface Floor { id: string; buildingId: string; floorNumber: number; name?: string; rooms: Room[]; }
export interface Room { id: string; floorId: string; roomNumber: string; roomType: string; sharingType?: string; rentAmount: number; depositAmount: number; amenities: string[]; status: string; beds: Bed[]; }
export interface Bed { id: string; roomId: string; bedNumber: string; bedType: string; status: string; currentResidentId?: string; notes?: string; }

export interface Resident {
  id: string; propertyId: string; bedId?: string; userId?: string;
  firstName: string; lastName?: string; email?: string; phone: string;
  dateOfBirth?: string; gender?: string;
  idType?: string; idNumber?: string; idDocumentUrl?: string; photoUrl?: string;
  emergencyName?: string; emergencyPhone?: string; emergencyRelation?: string;
  occupation?: string; institution?: string; status: string;
  bed?: Bed & { room: Room & { floor: Floor & { building: Building } } };
  user?: any;
}

export interface Stay {
  id: string; residentId: string; bedId: string;
  checkInDate: string; expectedCheckOut?: string; actualCheckOut?: string;
  rentAmount: number; depositAmount: number; depositStatus: string;
  status: string; noticeDate?: string;
  bed?: Bed & { room: Room };
}

export interface Payment {
  id: string; residentId: string; stayId?: string;
  type: string; amount: number; dueDate: string; paidDate?: string;
  status: string; paidAmount: number; paymentMethod?: string; transactionId?: string;
  rentMonth?: number; rentYear?: number; notes?: string;
  resident?: Resident;
}

export interface Complaint {
  id: string; propertyId: string; residentId?: string;
  category: string; subCategory?: string; title: string; description?: string;
  priority: string; status: string; assignedToId?: string;
  resolutionNotes?: string; resolvedAt?: string;
  slaHours: number; slaDeadline: string; slaBreached: boolean;
  residentRating?: number; residentFeedback?: string;
  createdAt: string;
  resident?: Resident; assignedTo?: any; room?: Room;
}

// --- Auth ---
export const authApi = {
  login: (email: string, password: string) => api.post<{ token: string; user: any }>("/auth/login", { email, password }),
  register: (data: { email: string; password: string; name: string; role: "owner" | "resident"; phone?: string }) => api.post<{ token: string; user: any }>("/auth/register", data),
  me: () => api.get<{ user: any }>("/auth/me"),
};

// --- Dashboard ---
export const dashboardApi = {
  overview: () => api.get<any>("/dashboard/overview"),
  property: (id: string) => api.get<any>(`/dashboard/properties/${id}`),
};

// --- Properties ---
export const propertyApi = {
  list: () => api.get<Property[]>("/properties"),
  get: (id: string) => api.get<Property & { buildings: Building[] }>(`/properties/${id}`),
  create: (data: Partial<Property>) => api.post<Property>("/properties", data),
  update: (id: string, data: Partial<Property>) => api.put<Property>(`/properties/${id}`, data),
  delete: (id: string) => api.delete(`/properties/${id}`),
};

// --- Inventory ---
export const inventoryApi = {
  hierarchy: (propertyId: string) => api.get<Building[]>(`/properties/${propertyId}/inventory`),
  availableBeds: (propertyId: string) => api.get<Bed[]>(`/properties/${propertyId}/available-beds`),
  addBuilding: (propertyId: string, data: { name: string; floorsCount?: number }) => api.post<Building>(`/properties/${propertyId}/buildings`, data),
  deleteBuilding: (id: string) => api.delete(`/buildings/${id}`),
  addFloor: (buildingId: string, data: { floorNumber: number; name?: string }) => api.post<Floor>(`/buildings/${buildingId}/floors`, data),
  deleteFloor: (id: string) => api.delete(`/floors/${id}`),
  addRoom: (floorId: string, data: { roomNumber: string; roomType: string; sharingType?: string; rentAmount: number; depositAmount?: number; amenities?: string[] }) => api.post<Room>(`/floors/${floorId}/rooms`, data),
  updateRoom: (id: string, data: Partial<Room>) => api.patch<Room>(`/rooms/${id}`, data),
  deleteRoom: (id: string) => api.delete(`/rooms/${id}`),
  addBed: (roomId: string, data: { bedNumber: string; bedType?: string; status?: string; notes?: string }) => api.post<Bed>(`/rooms/${roomId}/beds`, data),
  updateBed: (id: string, data: { status?: string; currentResidentId?: string; notes?: string }) => api.patch<Bed>(`/beds/${id}`, data),
  deleteBed: (id: string) => api.delete(`/beds/${id}`),
};

// --- Residents ---
export const residentApi = {
  listByProperty: (propertyId: string) => api.get<Resident[]>(`/properties/${propertyId}/residents`),
  get: (id: string) => api.get<Resident & { stays: Stay[] }>(`/residents/${id}`),
  create: (propertyId: string, data: Partial<Resident>) => api.post<Resident>(`/properties/${propertyId}/residents`, data),
  update: (id: string, data: Partial<Resident>) => api.put<Resident>(`/residents/${id}`, data),
  delete: (id: string) => api.delete(`/residents/${id}`),
};

// --- Stays (allocation) ---
export const stayApi = {
  allocate: (data: { residentId: string; bedId: string; checkInDate: string; expectedCheckOut?: string; rentAmount: number; depositAmount?: number }) => api.post<Stay>("/stays", data),
  checkOut: (id: string, data: { actualCheckOut?: string; depositStatus?: string }) => api.post<Stay>(`/stays/${id}/check-out`, data),
  transfer: (id: string, data: { newBedId: string; checkInDate?: string }) => api.post<Stay>(`/stays/${id}/transfer`, data),
  byResident: (residentId: string) => api.get<Stay[]>(`/residents/${residentId}/stays`),
};

// --- Payments ---
export const paymentApi = {
  byProperty: (propertyId: string) => api.get<Payment[]>(`/properties/${propertyId}/payments`),
  byResident: (residentId: string) => api.get<Payment[]>(`/residents/${residentId}/payments`),
  record: (data: { residentId: string; type: string; amount: number; dueDate: string; paymentMethod?: string; transactionId?: string; rentMonth?: number; rentYear?: number; notes?: string }) => api.post<Payment>("/payments", data),
  update: (id: string, data: Partial<Payment>) => api.patch<Payment>(`/payments/${id}`, data),
  generateRent: (propertyId: string, data: { month?: number; year?: number }) => api.post<{ success: boolean; created: number }>(`/properties/${propertyId}/payments/generate-rent`, data),
};

// --- Complaints ---
export const complaintApi = {
  byProperty: (propertyId: string) => api.get<Complaint[]>(`/properties/${propertyId}/complaints`),
  get: (id: string) => api.get<Complaint>(`/complaints/${id}`),
  create: (data: { propertyId: string; residentId?: string; category: string; title: string; description?: string; priority?: string }) => api.post<Complaint>("/complaints", data),
  update: (id: string, data: Partial<Complaint> & { status?: string; assignedToId?: string; resolutionNotes?: string; residentRating?: number; residentFeedback?: string }) => api.patch<Complaint>(`/complaints/${id}`, data),
};

// --- Resident Portal (self-service) ---
export const residentPortalApi = {
  profile: () => api.get<{ resident: Resident; property: Property; bed: any; activeStay: Stay | null }>("/resident/profile"),
  updateProfile: (data: any) => api.put<Resident>("/resident/profile", data),
  payments: () => api.get<Payment[]>("/resident/payments"),
  payPayment: (id: string, data: { paymentMethod?: string; transactionId?: string }) => api.post<Payment>(`/resident/payments/${id}/pay`, data),
  complaints: () => api.get<Complaint[]>("/resident/complaints"),
  createComplaint: (data: { category: string; title: string; description?: string; priority?: string }) => api.post<Complaint>("/resident/complaints", data),
};
