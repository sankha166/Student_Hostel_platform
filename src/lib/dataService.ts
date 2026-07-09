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
  roomBookings: "room_bookings",
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
  paymentMethod?: string;
  collectedBy?: string;
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

// ─── Room Booking / Agreement type ─────────────────────────────
export interface RoomBooking {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  hostelId: string;
  hostelName: string;
  roomNumber: string;
  roomType: string;
  monthlyRent: number;
  securityDeposit: number;
  startDate: string;
  endDate: string;
  agreementDuration: number;
  agreementStatus: "active" | "expired" | "terminated";
  advancePaid: number;
  advanceRefundable: boolean;
  ownerName: string;
  ownerPhone: string;
  createdAt: string;
  terms: string[];
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
  seedIfEmpty(KEYS.ownerProfile, [mockOwnerProfile]);

  // Seed default rent payments
  seedIfEmpty(KEYS.rentPayments, [
    { id: "rp-1", studentId: "", hostelName: "Sunrise Student Haven", month: "Jan", full: "January 2026", amount: 3500, status: "Paid", date: "Jan 3", receipt: "receipt_rp-1", transactionId: "UPI2026010312345", paidAt: "2026-01-03T10:00:00", paymentMethod: "UPI" },
    { id: "rp-2", studentId: "", hostelName: "Sunrise Student Haven", month: "Feb", full: "February 2026", amount: 3500, status: "Paid", date: "Feb 1", receipt: "receipt_rp-2", transactionId: "UPI2026020167890", paidAt: "2026-02-01T09:00:00", paymentMethod: "UPI" },
    { id: "rp-3", studentId: "", hostelName: "Sunrise Student Haven", month: "Mar", full: "March 2026", amount: 3500, status: "Paid", date: "Mar 1", receipt: "receipt_rp-3", transactionId: "CASH-ABC123", paidAt: "2026-03-01T10:00:00", paymentMethod: "Cash" },
    { id: "rp-4", studentId: "", hostelName: "Sunrise Student Haven", month: "Apr", full: "April 2026", amount: 3500, status: "Pending", date: "Due Apr 1", receipt: null },
    { id: "rp-5", studentId: "", hostelName: "Sunrise Student Haven", month: "May", full: "May 2026", amount: 3500, status: "Pending", date: "Due May 1", receipt: null },
    { id: "rp-6", studentId: "", hostelName: "Sunrise Student Haven", month: "Jun", full: "June 2026", amount: 3500, status: "Pending", date: "Due Jun 1", receipt: null },
  ] as RentPayment[]);

  // Seed default room booking
  seedIfEmpty(KEYS.roomBookings, [{
    id: "rb-1",
    studentId: "",
    studentName: "Demo Student",
    studentEmail: "demo@student.com",
    studentPhone: "+91 98765 43210",
    hostelId: "1",
    hostelName: "Sunrise Student Haven",
    roomNumber: "101-A",
    roomType: "Single",
    monthlyRent: 3500,
    securityDeposit: 7000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    agreementDuration: 12,
    agreementStatus: "active",
    advancePaid: 7000,
    advanceRefundable: true,
    ownerName: "Rajesh Kumar",
    ownerPhone: "+91 98765 43210",
    createdAt: "2025-12-28T10:00:00",
    terms: [
      "Monthly rent of ₹3,500 due on 1st of every month",
      "Security deposit of ₹7,000 (2 months rent) refundable on vacating",
      "1 month notice period required before vacating",
      "No smoking or alcohol consumption on premises",
      "Gate closes at 11:00 PM",
      "Visitors allowed only between 10 AM - 8 PM",
      "Tenant responsible for electricity charges beyond ₹500/month",
      "Property damage will be deducted from security deposit",
      "Owner can terminate agreement with 1 month notice for rule violations",
    ],
  }] as RoomBooking[]);
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
        h.name.toLowerCase().includes(q) || h.location.toLowerCase().includes(q) ||
        h.tags.some(t => t.toLowerCase().includes(q)) || h.facilities.some(f => f.toLowerCase().includes(q)) ||
        h.whyRecommended.toLowerCase().includes(q)
      );
    }
    if (filters?.maxPrice) results = results.filter(h => h.price <= filters.maxPrice!);
    if (filters?.location && filters.location !== "All Locations") results = results.filter(h => h.location.toLowerCase().includes(filters.location!.toLowerCase()));
    if (filters?.facilities?.length) results = results.filter(h => filters.facilities!.every(f => h.facilities.some(hf => hf.toLowerCase().includes(f.toLowerCase()))));
    return results;
  },
};

// ═══════════════════════════════════════════════════════════════
// BOOKING REQUESTS
// ═══════════════════════════════════════════════════════════════
export const bookingService = {
  getAll: (): BookingRequest[] => getCollection<BookingRequest>(KEYS.bookingRequests),
  getByProperty: (propertyId: string): BookingRequest[] => getCollection<BookingRequest>(KEYS.bookingRequests),
  create: (data: Omit<BookingRequest, "id" | "status" | "createdAt">): BookingRequest => {
    const request: BookingRequest = { ...data, id: generateId("br-"), status: "pending", createdAt: new Date().toISOString() };
    return addItem(KEYS.bookingRequests, request);
  },
  updateStatus: (id: string, status: BookingRequest["status"]): BookingRequest | undefined => updateItem<BookingRequest>(KEYS.bookingRequests, id, { status }),
};

// ═══════════════════════════════════════════════════════════════
// PAYMENT ACCOUNTS
// ═══════════════════════════════════════════════════════════════
export const paymentAccountService = {
  getAll: (): PaymentAccount[] => getCollection<PaymentAccount>(KEYS.paymentAccounts),
  add: (data: Omit<PaymentAccount, "id">): PaymentAccount => {
    const account: PaymentAccount = { ...data, id: generateId("pa-") };
    return addItem(KEYS.paymentAccounts, account);
  },
  delete: (id: string): boolean => deleteItem<PaymentAccount>(KEYS.paymentAccounts, id),
  setPrimary: (id: string): void => {
    const accounts = getCollection<PaymentAccount>(KEYS.paymentAccounts);
    setCollection(KEYS.paymentAccounts, accounts.map(a => ({ ...a, isPrimary: a.id === id })));
  },
};

// ═══════════════════════════════════════════════════════════════
// OWNER PROPERTIES
// ═══════════════════════════════════════════════════════════════
export const propertyService = {
  getAll: (): OwnerProperty[] => getCollection<OwnerProperty>(KEYS.ownerProperties),
  getById: (id: string): OwnerProperty | undefined => getItem<OwnerProperty>(KEYS.ownerProperties, id),
  create: (data: Omit<OwnerProperty, "id" | "createdAt">): OwnerProperty => {
    const property: OwnerProperty = { ...data, id: generateId("prop-"), createdAt: new Date().toISOString().split("T")[0] };
    return addItem(KEYS.ownerProperties, property);
  },
  update: (id: string, patch: Partial<OwnerProperty>): OwnerProperty | undefined => updateItem<OwnerProperty>(KEYS.ownerProperties, id, patch),
  delete: (id: string): boolean => deleteItem<OwnerProperty>(KEYS.ownerProperties, id),
};

// ═══════════════════════════════════════════════════════════════
// ROOMS
// ═══════════════════════════════════════════════════════════════
export const roomService = {
  getAll: (): PropertyRoom[] => getCollection<PropertyRoom>(KEYS.propertyRooms),
  getByProperty: (propertyId: string): PropertyRoom[] => getCollection<PropertyRoom>(KEYS.propertyRooms).filter(r => r.propertyId === propertyId),
  add: (data: Omit<PropertyRoom, "id">): PropertyRoom => {
    const room: PropertyRoom = { ...data, id: generateId("r-") };
    return addItem(KEYS.propertyRooms, room);
  },
  update: (id: string, patch: Partial<PropertyRoom>): PropertyRoom | undefined => updateItem<PropertyRoom>(KEYS.propertyRooms, id, patch),
  getAvailable: (propertyId: string): PropertyRoom[] => getCollection<PropertyRoom>(KEYS.propertyRooms).filter(r => r.propertyId === propertyId && r.status === "available"),
};

// ═══════════════════════════════════════════════════════════════
// TENANTS
// ═══════════════════════════════════════════════════════════════
export const tenantService = {
  getAll: (): PropertyTenant[] => getCollection<PropertyTenant>(KEYS.propertyTenants),
  getByProperty: (propertyId: string): PropertyTenant[] => getCollection<PropertyTenant>(KEYS.propertyTenants).filter(t => t.propertyId === propertyId),
  getById: (id: string): PropertyTenant | undefined => getItem<PropertyTenant>(KEYS.propertyTenants, id),
  add: (data: Omit<PropertyTenant, "id">): PropertyTenant => {
    const tenant: PropertyTenant = { ...data, id: generateId("t-") };
    return addItem(KEYS.propertyTenants, tenant);
  },
  update: (id: string, patch: Partial<PropertyTenant>): PropertyTenant | undefined => updateItem<PropertyTenant>(KEYS.propertyTenants, id, patch),
};

// ═══════════════════════════════════════════════════════════════
// BILLS
// ═══════════════════════════════════════════════════════════════
export const billService = {
  getByProperty: (propertyId: string): OtherBill[] => getCollection<OtherBill>(KEYS.bills).filter(b => b.propertyId === propertyId),
  add: (data: Omit<OtherBill, "id" | "createdAt">): OtherBill => {
    const bill: OtherBill = { ...data, id: generateId("bill-"), createdAt: new Date().toISOString().split("T")[0] };
    return addItem(KEYS.bills, bill);
  },
  updateStatus: (id: string, status: OtherBill["status"]): OtherBill | undefined => updateItem<OtherBill>(KEYS.bills, id, { status }),
};

// ═══════════════════════════════════════════════════════════════
// FOOD — with payment, status tracking, delivery
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
    const filtered = studentId ? orders.filter(o => o.studentId === studentId) : orders;
    return filtered.sort((a, b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime());
  },
  placeOrder: (data: Omit<FoodOrder, "id" | "status" | "orderTime" | "paymentStatus"> & { paymentMethod?: string; transactionId?: string }): FoodOrder => {
    const provider = getItem<FoodProvider>(KEYS.foodProviders, data.providerId);
    const prepTime = provider ? 30 : 25;
    const estimatedDelivery = new Date(Date.now() + prepTime * 60 * 1000).toISOString();
    const order: FoodOrder = {
      ...data, id: generateId("fo-"), status: "placed",
      orderTime: new Date().toISOString(), paymentStatus: "paid", deliveryTime: estimatedDelivery,
    };
    if (provider) updateItem<FoodProvider>(KEYS.foodProviders, provider.id, { totalOrders: provider.totalOrders + 1 });
    return addItem(KEYS.foodOrders, order);
  },
  updateOrderStatus: (orderId: string, status: FoodOrder["status"]): FoodOrder | undefined => {
    const patch: Partial<FoodOrder> = { status };
    if (status === "delivered") patch.deliveryTime = new Date().toISOString();
    return updateItem<FoodOrder>(KEYS.foodOrders, orderId, patch);
  },
  registerProvider: (data: Omit<FoodProvider, "id" | "rating" | "totalOrders" | "isVerified" | "registeredAt">): FoodProvider => {
    const provider: FoodProvider = { ...data, id: generateId("fp-"), rating: 0, totalOrders: 0, isVerified: false, registeredAt: new Date().toISOString().split("T")[0] };
    return addItem(KEYS.foodProviders, provider);
  },
};

// ═══════════════════════════════════════════════════════════════
// ROOM BOOKING / AGREEMENT
// ═══════════════════════════════════════════════════════════════
export const bookingAgreementService = {
  getByStudent: (studentId: string): RoomBooking | undefined => {
    // For demo, return first active booking regardless of studentId
    const bookings = getCollection<RoomBooking>(KEYS.roomBookings);
    return bookings.find(b => b.agreementStatus === "active") || bookings[0];
  },
  getAll: (): RoomBooking[] => getCollection<RoomBooking>(KEYS.roomBookings),
  create: (data: Omit<RoomBooking, "id" | "createdAt">): RoomBooking => {
    const booking: RoomBooking = { ...data, id: generateId("rb-"), createdAt: new Date().toISOString() };
    return addItem(KEYS.roomBookings, booking);
  },
  terminate: (id: string): RoomBooking | undefined => updateItem<RoomBooking>(KEYS.roomBookings, id, { agreementStatus: "terminated" }),
};

// ═══════════════════════════════════════════════════════════════
// RENT PAYMENTS — Enhanced
// ═══════════════════════════════════════════════════════════════
export const rentService = {
  getPayments: (_studentId?: string): RentPayment[] => getCollection<RentPayment>(KEYS.rentPayments),
  recordPayment: (id: string, transactionId: string, method: string = "UPI"): RentPayment | undefined => {
    return updateItem<RentPayment>(KEYS.rentPayments, id, {
      status: "Paid" as const,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      transactionId, paidAt: new Date().toISOString(),
      receipt: `receipt_${id}`, paymentMethod: method,
    });
  },
  markAsPaidCash: (id: string, collectedBy: string): RentPayment | undefined => {
    return updateItem<RentPayment>(KEYS.rentPayments, id, {
      status: "Paid" as const,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      transactionId: `CASH-${Date.now().toString(36).toUpperCase()}`,
      paidAt: new Date().toISOString(), receipt: `receipt_${id}`,
      paymentMethod: "Cash", collectedBy,
    });
  },
  addMonth: (data: Omit<RentPayment, "id">): RentPayment => addItem(KEYS.rentPayments, { ...data, id: generateId("rp-") }),
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
    if (idx >= 0) { profiles[idx] = { ...profiles[idx], ...profile }; }
    else { profiles.push(profile); }
    setCollection(KEYS.studentProfiles, profiles);
    return idx >= 0 ? profiles[idx] : profile;
  },
};

// ═══════════════════════════════════════════════════════════════
// AUTH / USERS
// ═══════════════════════════════════════════════════════════════
export interface StoredUser {
  id: string; email: string; name: string; role: "student" | "owner";
  phone?: string; address?: string; passwordHash: string; createdAt: string;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "rn_salt_2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export const authService = {
  signup: async (data: { email: string; password: string; name: string; role: "student" | "owner"; phone?: string; address?: string; }): Promise<{ user: Omit<StoredUser, "passwordHash">; token: string }> => {
    const users = getCollection<StoredUser>(KEYS.users);
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error("An account with this email already exists");
    }
    const passwordHash = await hashPassword(data.password);
    const user: StoredUser = {
      id: generateId(`${data.role}_`), email: data.email.toLowerCase().trim(),
      name: data.name.trim(), role: data.role, phone: data.phone?.trim(),
      address: data.address?.trim(), passwordHash, createdAt: new Date().toISOString(),
    };
    addItem(KEYS.users, user);
    const token = `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  },

  login: async (email: string, password: string): Promise<{ user: Omit<StoredUser, "passwordHash">; token: string }> => {
    const users = getCollection<StoredUser>(KEYS.users);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) throw new Error("No account found with this email. Please sign up first.");
    const passwordHash = await hashPassword(password);
    if (user.passwordHash !== passwordHash) throw new Error("Incorrect password. Please try again.");
    const token = `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  },

  getUsers: (): StoredUser[] => getCollection<StoredUser>(KEYS.users),
};

// Re-export types
export type { Hostel, BookingRequest, PaymentAccount, OwnerProperty, PropertyRoom, PropertyTenant, OwnerProfileData, OtherBill, FoodProvider, FoodItem, FoodOrder };
