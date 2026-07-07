/**
 * API Service Module — Local Implementation
 * 
 * All API calls are routed to the local dataService (localStorage).
 * This keeps the API interface stable for future backend migration.
 * To switch to a real backend, replace these implementations with fetch() calls.
 */

import {
  hostelService, bookingService, rentService, paymentAccountService,
  propertyService, roomService, tenantService, profileService,
  authService, foodService,
  type Hostel, type BookingRequest, type PaymentAccount,
  type OwnerProperty, type PropertyRoom, type PropertyTenant,
  type RentPayment,
} from "./dataService";

// ============ STUDENT API ============

export const studentAPI = {
  searchHostels: async (query: string, filters?: Record<string, any>) => {
    return hostelService.search(query, filters as any);
  },

  searchByImage: async (_file: File) => {
    // Image search requires an AI backend — return helpful message
    return {
      results: [],
      message: "Image search requires an AI service backend. Use text search instead.",
    };
  },

  getHostelDetails: async (hostelId: string) => {
    return hostelService.getById(hostelId);
  },

  getHostelReviews: async (hostelId: string) => {
    const hostel = hostelService.getById(hostelId);
    return hostel?.reviews || [];
  },

  bookHostel: async (_hostelId: string, bookingData: Record<string, any>) => {
    return bookingService.create(bookingData as any);
  },

  getRentPayments: async (studentId: string) => {
    return rentService.getPayments(studentId);
  },

  getProfile: async (studentId: string) => {
    return profileService.getStudentProfile(studentId);
  },
};

// ============ OWNER API ============

export const ownerAPI = {
  getProperties: async (_ownerId: string) => {
    return propertyService.getAll();
  },

  createProperty: async (propertyData: Record<string, any>) => {
    return propertyService.create(propertyData as any);
  },

  updateProperty: async (propertyId: string, updates: Record<string, any>) => {
    return propertyService.update(propertyId, updates);
  },

  deleteProperty: async (propertyId: string) => {
    return { success: propertyService.delete(propertyId) };
  },

  getPropertyRooms: async (propertyId: string) => {
    return roomService.getByProperty(propertyId);
  },

  getPropertyTenants: async (propertyId: string) => {
    return tenantService.getByProperty(propertyId);
  },

  addTenant: async (_propertyId: string, tenantData: Record<string, any>) => {
    return tenantService.add(tenantData as any);
  },

  getBookingRequests: async (_propertyId: string) => {
    return bookingService.getAll();
  },

  respondToBooking: async (
    bookingId: string,
    status: "approved" | "rejected",
    _data?: Record<string, any>
  ) => {
    const mappedStatus = status === "approved" ? "accepted" : "rejected";
    return bookingService.updateStatus(bookingId, mappedStatus as any);
  },

  getPaymentAccounts: async (_ownerId: string) => {
    return paymentAccountService.getAll();
  },

  addPaymentAccount: async (_ownerId: string, accountData: Record<string, any>) => {
    return paymentAccountService.add(accountData as any);
  },

  getProfile: async (_ownerId: string) => {
    return profileService.getOwnerProfile();
  },

  updateProfile: async (_ownerId: string, updates: Record<string, any>) => {
    return profileService.updateOwnerProfile(updates);
  },
};

// ============ AUTH API ============

export const authAPI = {
  studentLogin: async (email: string, password: string) => {
    return authService.login(email, password);
  },

  studentSignup: async (userData: Record<string, any>) => {
    return authService.signup({
      email: userData.email,
      password: userData.password,
      name: userData.name || userData.fullName,
      role: "student",
      phone: userData.phone,
      address: userData.address,
    });
  },

  ownerLogin: async (email: string, password: string) => {
    return authService.login(email, password);
  },

  ownerSignup: async (userData: Record<string, any>) => {
    return authService.signup({
      email: userData.email,
      password: userData.password,
      name: userData.name || userData.fullName,
      role: "owner",
      phone: userData.phone,
      address: userData.address,
    });
  },

  googleLogin: async (_googleToken: string, role: "student" | "owner") => {
    // Google OAuth requires a real backend — simulate with demo accounts
    const email = `demo.${role}@gmail.com`;
    try {
      return await authService.login(email, "demo123456");
    } catch {
      return await authService.signup({
        email,
        password: "demo123456",
        name: role === "student" ? "Demo Student" : "Demo Owner",
        role,
      });
    }
  },

  logout: async () => {
    return { success: true };
  },

  verifyToken: async (_token: string) => {
    return { valid: true };
  },

  refreshToken: async (_refreshToken: string) => {
    return { token: `tok_${Date.now()}` };
  },

  forgotPassword: async (_email: string) => {
    return { message: "Password reset is not available in local mode. Please create a new account." };
  },

  resetPassword: async (_token: string, _password: string) => {
    return { success: false, message: "Password reset requires a backend server." };
  },
};

// ============ PAYMENT API ============

export const paymentAPI = {
  initializePayment: async (amount: number, description: string) => {
    // UPI payments are handled via deep links in the UI
    return {
      orderId: `order_${Date.now()}`,
      amount,
      description,
      method: "UPI",
    };
  },

  verifyPayment: async (paymentId: string, _signature: string) => {
    return { verified: true, paymentId };
  },
};

// ============ AI SERVICES ============

export const aiServices = {
  extractRoomFeatures: async (_file: File) => {
    return {
      features: [],
      message: "AI feature extraction requires a backend service.",
    };
  },

  getRecommendations: async (_userPreferences: Record<string, any>) => {
    // Return top-rated hostels as recommendations
    const all = hostelService.getAll();
    return all.sort((a, b) => b.matchPercent - a.matchPercent).slice(0, 3);
  },

  processUserQuery: async (query: string) => {
    return {
      query,
      intent: "search",
      preferences: {},
    };
  },
};

// ============ ERROR HANDLING ============

export class APIError extends Error {
  constructor(public status: number, public data: any) {
    super(data?.message || "API Error");
  }
}

export async function handleAPIResponse(response: Response) {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new APIError(response.status, data);
  }
  return response.json();
}
