/**
 * Data Service — Centralized persistent data layer
 * Replaces all direct mock data imports.
 * Seeds localStorage with mock data on first run, then all CRUD persists.
 */

import {
  getCollection, setCollection, addItem, updateItem, deleteItem,
  getItem, seedIfEmpty, generateId
} from "./storageService";

// Import mock data for seeding
import { hostels as mockHostels, type Hostel, bookingRequests as mockBookingRequests, paymentAccounts as mockPaymentAccounts, type BookingRequest, type PaymentAccount } from "@/data/mockData";
import { ownerProperties as mockOwnerProperties, propertyRooms as mockPropertyRooms, propertyTenants as mockPropertyTenants, ownerProfile as mockOwnerProfile, type OwnerProperty, type PropertyRoom, type PropertyTenant, type OwnerProfileData } from "@/data/ownerData";
import { mockBills, type OtherBill } from "@/data/billsData";
import { mockFoodProviders, mockFoodItems, mockFoodOrders, type FoodProvider, type FoodItem, type FoodOrder } from "@/data/foodDeliveryData";

// ─── Collection Keys ───────────────────────────────────────────
const KEYS = {
  hostels: "hostels",
  bookingRequests: "booking_requests",
  paymentAccounts: "payment_accounts",
  ownerProperties: "owner_properties",
  propertyRooms: "property_rooms",
  propertyTenants: "property_tenants",
  ownerProfile: "owner_profile",
  bills: "bills",
  foodProviders: "food_providers",
  foodItems: "food_items",
  foodOrders: "food_orders",
  rentPayments: "rent_payments",
  studentProfiles: "student_profiles",
  users: "users",
  visitRequests: "visit_requests",
} as const;

// ─── Rent Payment type ─────────────────────────────────────────
export interface RentPayment {
  id: string;
  studentId: string;
  hostelName: string;
  month: string;
  full: string;
  amount: number;
  status: "Paid" | "Pending";
  date: string;
  receipt: string | null;
  transactionId?: string;
  paidAt?: string;
}

// ─── Student Profile type ──────────────────────────────────────
export interface StudentProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  aadharNo: string;
  panNo?: string;
  collegeName?: string;
  course?: string;
  year?: string;
  bloodGroup?: string;
  medicalConditions?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  profileImage?: string;
}

// ─── Seed all data on first load ───────────────────────────────
export function initializeData(): void {
  seedIfEmpty(KEYS.hostels, mockHostels);
  seedIfEmpty(KEYS.bookingRequests, mockBookingRequests);
  seedIfEmpty(KEYS.paymentAccounts, mockPaymentAccounts);
  seedIfEmpty(KEYS.ownerProperties, mockOwnerProperties);
  seedIfEmpty(KEYS.propertyRooms, mockPropertyRooms);
  seedIfEmpty(KEYS.propertyTenants, mockPropertyTenants);
  seedIfEmpty(KEYS.bills, mockBills);
  seedIfEmpty(KEYS.foodProviders, mockFoodProviders);
  seedIfEmpty(KEYS.foodItems, mockFoodItems);
  seedIfEmpty(KEYS.foodOrders, mockFoodOrders);

  // Seed owner profile as a single-item collection
  seedIfEmpty(KEYS.ownerProfile, [mockOwnerProfile]);

  // Seed default rent payments
  seedIfEmpty(KEYS.rentPayments, [
    { id: "rp-1", studentId: "", hostelName: "Sunrise Student Haven", month: "Jan", full: "January 2026", amount: 3500, status: "Paid", date: "Jan 3", receipt: "/receipts/jan.pdf" },
    { id: "rp-2", studentId: "", hostelName: "Sunrise Student Haven", month: "Feb", full: "February 2026", amount: 3500, status: "Paid", date: "Feb 1", receipt: "/receipts/feb.pdf" },
    { id: "rp-3", studentId: "", hostelName: "Sunrise Student Haven", month: "Mar", full: "March 2026", amount: 3500, status: "Paid", date: "Mar 1", receipt: "/receipts/mar.pdf" },
    { id: "rp-4", studentId: "", hostelName: "Sunrise Student Haven", month: "Apr", full: "April 2026", amount: 3500, status: "Pending", date: "Due Apr 1", receipt: null },
  ] as RentPayment[]);
}

// ═══════════════════════════════════════════════════════════════
// HOSTELS
// ═══════════════════════════════════════════════════════════════

export const hostelService = {
  getAll: (): Hostel[] => getCollection<Hostel>(KEYS.hostels),

  getById: (id: string): Hostel | undefined => getItem<Hostel>(KEYS.hostels, id),

  search: (query: string, filters?: { maxPrice?: number; location?: string; facilities?: string[] }): Hostel[] => {
    let results = getCollection<Hostel>(KEYS.hostels);
    const q = query.toLowerCase().trim();

    if (q) {
      results = results.filter(h =>
        h.name.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q) ||
        h.tags.some(t => t.toLowerCase().includes(q)) ||
        h.facilities.some(f => f.toLowerCase().includes(q)) ||
        h.whyRecommended.toLowerCase().includes(q)
      );
    }

    if (filters?.maxPrice) {
      results = results.filter(h => h.price <= filters.maxPrice!);
    }

    if (filters?.location && filters.location !== "All Locations") {
      results = results.filter(h =>
        h.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters?.facilities && filters.facilities.length > 0) {
      results = results.filter(h =>
        filters.facilities!.every(f =>
          h.facilities.some(hf => hf.toLowerCase().includes(f.toLowerCase()))
        )
      );
    }

    return results;
  },
};

// ═══════════════════════════════════════════════════════════════
// BOOKING REQUESTS
// ═══════════════════════════════════════════════════════════════

export const bookingService = {
  getAll: (): BookingRequest[] => getCollection<BookingRequest>(KEYS.bookingRequests),

  getByProperty: (propertyId: string): BookingRequest[] => {
    // For now, all requests are shown for all properties (mock limitation)
    return getCollection<BookingRequest>(KEYS.bookingRequests);
  },

  create: (data: Omit<BookingRequest, "id" | "status" | "createdAt">): BookingRequest => {
    const request: BookingRequest = {
      ...data,
      id: generateId("br-"),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    return addItem(KEYS.bookingRequests, request);
  },

  updateStatus: (id: string, status: BookingRequest["status"]): BookingRequest | undefined => {
    return updateItem<BookingRequest>(KEYS.bookingRequests, id, { status });
  },
};

// ═══════════════════════════════════════════════════════════════
// PAYMENT ACCOUNTS
// ═══════════════════════════════════════════════════════════════

export const paymentAccountService = {
  getAll: (): PaymentAccount[] => getCollection<PaymentAccount>(KEYS.paymentAccounts),

  add: (data: Omit<PaymentAccount, "id">): PaymentAccount => {
    const account: PaymentAccount = {
      ...data,
      id: generateId("pa-"),
    };
    return addItem(KEYS.paymentAccounts, account);
  },

  delete: (id: string): boolean => deleteItem<PaymentAccount>(KEYS.paymentAccounts, id),

  setPrimary: (id: string): void => {
    const accounts = getCollection<PaymentAccount>(KEYS.paymentAccounts);
    const updated = accounts.map(a => ({ ...a, isPrimary: a.id === id }));
    setCollection(KEYS.paymentAccounts, updated);
  },
};

// ═══════════════════════════════════════════════════════════════
// OWNER PROPERTIES
// ═══════════════════════════════════════════════════════════════

export const propertyService = {
  getAll: (): OwnerProperty[] => getCollection<OwnerProperty>(KEYS.ownerProperties),

  getById: (id: string): OwnerProperty | undefined => getItem<OwnerProperty>(KEYS.ownerProperties, id),

  create: (data: Omit<OwnerProperty, "id" | "createdAt">): OwnerProperty => {
    const property: OwnerProperty = {
      ...data,
      id: generateId("prop-"),
      createdAt: new Date().toISOString().split("T")[0],
    };
    return addItem(KEYS.ownerProperties, property);
  },

  update: (id: string, patch: Partial<OwnerProperty>): OwnerProperty | undefined => {
    return updateItem<OwnerProperty>(KEYS.ownerProperties, id, patch);
  },

  delete: (id: string): boolean => deleteItem<OwnerProperty>(KEYS.ownerProperties, id),
};

// ═══════════════════════════════════════════════════════════════
// ROOMS
// ═══════════════════════════════════════════════════════════════

export const roomService = {
  getAll: (): PropertyRoom[] => getCollection<PropertyRoom>(KEYS.propertyRooms),

  getByProperty: (propertyId: string): PropertyRoom[] => {
    return getCollection<PropertyRoom>(KEYS.propertyRooms).filter(r => r.propertyId === propertyId);
  },

  add: (data: Omit<PropertyRoom, "id">): PropertyRoom => {
    const room: PropertyRoom = {
      ...data,
      id: generateId("r-"),
    };
    return addItem(KEYS.propertyRooms, room);
  },

  update: (id: string, patch: Partial<PropertyRoom>): PropertyRoom | undefined => {
    return updateItem<PropertyRoom>(KEYS.propertyRooms, id, patch);
  },

  getAvailable: (propertyId: string): PropertyRoom[] => {
    return getCollection<PropertyRoom>(KEYS.propertyRooms)
      .filter(r => r.propertyId === propertyId && r.status === "available");
  },
};

// ═══════════════════════════════════════════════════════════════
// TENANTS
// ═══════════════════════════════════════════════════════════════

export const tenantService = {
  getAll: (): PropertyTenant[] => getCollection<PropertyTenant>(KEYS.propertyTenants),

  getByProperty: (propertyId: string): PropertyTenant[] => {
    return getCollection<PropertyTenant>(KEYS.propertyTenants).filter(t => t.propertyId === propertyId);
  },

  add: (data: Omit<PropertyTenant, "id">): PropertyTenant => {
    const tenant: PropertyTenant = {
      ...data,
      id: generateId("t-"),
    };
    return addItem(KEYS.propertyTenants, tenant);
  },

  update: (id: string, patch: Partial<PropertyTenant>): PropertyTenant | undefined => {
    return updateItem<PropertyTenant>(KEYS.propertyTenants, id, patch);
  },
};

// ═══════════════════════════════════════════════════════════════
// BILLS
// ═══════════════════════════════════════════════════════════════

export const billService = {
  getByProperty: (propertyId: string): OtherBill[] => {
    return getCollection<OtherBill>(KEYS.bills).filter(b => b.propertyId === propertyId);
  },

  add: (data: Omit<OtherBill, "id" | "createdAt">): OtherBill => {
    const bill: OtherBill = {
      ...data,
      id: generateId("bill-"),
      createdAt: new Date().toISOString().split("T")[0],
    };
    return addItem(KEYS.bills, bill);
  },

  updateStatus: (id: string, status: OtherBill["status"]): OtherBill | undefined => {
    return updateItem<OtherBill>(KEYS.bills, id, { status });
  },
};

// ═══════════════════════════════════════════════════════════════
// FOOD
// ═══════════════════════════════════════════════════════════════

export const foodService = {
  getProviders: (): FoodProvider[] => getCollection<FoodProvider>(KEYS.foodProviders),

  getProviderById: (id: string): FoodProvider | undefined => getItem<FoodProvider>(KEYS.foodProviders, id),

  getItems: (providerId?: string): FoodItem[] => {
    const items = getCollection<FoodItem>(KEYS.foodItems);
    return providerId ? items.filter(i => i.providerId === providerId) : items;
  },

  getOrders: (studentId?: string): FoodOrder[] => {
    const orders = getCollection<FoodOrder>(KEYS.foodOrders);
    return studentId ? orders.filter(o => o.studentId === studentId) : orders;
  },

  placeOrder: (data: Omit<FoodOrder, "id" | "status" | "orderTime" | "paymentStatus">): FoodOrder => {
    const order: FoodOrder = {
      ...data,
      id: generateId("fo-"),
      status: "placed",
      orderTime: new Date().toISOString(),
      paymentStatus: "pending",
    };
    return addItem(KEYS.foodOrders, order);
  },

  registerProvider: (data: Omit<FoodProvider, "id" | "rating" | "totalOrders" | "isVerified" | "registeredAt">): FoodProvider => {
    const provider: FoodProvider = {
      ...data,
      id: generateId("fp-"),
      rating: 0,
      totalOrders: 0,
      isVerified: false,
      registeredAt: new Date().toISOString().split("T")[0],
    };
    return addItem(KEYS.foodProviders, provider);
  },
};

// ═══════════════════════════════════════════════════════════════
// RENT PAYMENTS
// ═══════════════════════════════════════════════════════════════

export const rentService = {
  getPayments: (studentId?: string): RentPayment[] => {
    return getCollection<RentPayment>(KEYS.rentPayments);
  },

  recordPayment: (id: string, transactionId: string): RentPayment | undefined => {
    return updateItem<RentPayment>(KEYS.rentPayments, id, {
      status: "Paid" as const,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      transactionId,
      paidAt: new Date().toISOString(),
      receipt: `receipt_${id}`,
    });
  },

  getAll: (): RentPayment[] => getCollection<RentPayment>(KEYS.rentPayments),
};

// ═══════════════════════════════════════════════════════════════
// PROFILES
// ═══════════════════════════════════════════════════════════════

export const profileService = {
  getOwnerProfile: (): OwnerProfileData | undefined => {
    const profiles = getCollection<OwnerProfileData>(KEYS.ownerProfile);
    return profiles[0];
  },

  updateOwnerProfile: (patch: Partial<OwnerProfileData>): OwnerProfileData | undefined => {
    const profiles = getCollection<OwnerProfileData>(KEYS.ownerProfile);
    if (profiles.length === 0) return undefined;
    profiles[0] = { ...profiles[0], ...patch };
    setCollection(KEYS.ownerProfile, profiles);
    return profiles[0];
  },

  getStudentProfile: (userId: string): StudentProfile | undefined => {
    return getCollection<StudentProfile>(KEYS.studentProfiles).find(p => p.userId === userId);
  },

  upsertStudentProfile: (profile: StudentProfile): StudentProfile => {
    const profiles = getCollection<StudentProfile>(KEYS.studentProfiles);
    const idx = profiles.findIndex(p => p.userId === profile.userId);
    if (idx >= 0) {
      profiles[idx] = { ...profiles[idx], ...profile };
    } else {
      profiles.push(profile);
    }
    setCollection(KEYS.studentProfiles, profiles);
    return idx >= 0 ? profiles[idx] : profile;
  },
};

// ═══════════════════════════════════════════════════════════════
// AUTH / USERS
// ═══════════════════════════════════════════════════════════════

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: "student" | "owner";
  phone?: string;
  address?: string;
  passwordHash: string;
  createdAt: string;
}

// Simple hash function using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "rn_salt_2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export const authService = {
  signup: async (data: {
    email: string;
    password: string;
    name: string;
    role: "student" | "owner";
    phone?: string;
    address?: string;
  }): Promise<{ user: Omit<StoredUser, "passwordHash">; token: string }> => {
    const users = getCollection<StoredUser>(KEYS.users);
    const existing = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error("An account with this email already exists");
    }

    const passwordHash = await hashPassword(data.password);
    const user: StoredUser = {
      id: generateId(`${data.role}_`),
      email: data.email.toLowerCase().trim(),
      name: data.name.trim(),
      role: data.role,
      phone: data.phone?.trim(),
      address: data.address?.trim(),
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    addItem(KEYS.users, user);

    const token = `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  },

  login: async (email: string, password: string): Promise<{ user: Omit<StoredUser, "passwordHash">; token: string }> => {
    const users = getCollection<StoredUser>(KEYS.users);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      throw new Error("No account found with this email. Please sign up first.");
    }

    const passwordHash = await hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      throw new Error("Incorrect password. Please try again.");
    }

    const token = `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  },

  getUsers: (): StoredUser[] => getCollection<StoredUser>(KEYS.users),
};

// Re-export types
export type { Hostel, BookingRequest, PaymentAccount, OwnerProperty, PropertyRoom, PropertyTenant, OwnerProfileData, OtherBill, FoodProvider, FoodItem, FoodOrder };
