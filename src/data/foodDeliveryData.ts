export interface FoodProvider {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  speciality: string;
  image: string;
  rating: number;
  totalOrders: number;
  isVerified: boolean;
  availableFrom: string; // HH:mm
  availableTo: string;   // HH:mm
  deliveryRadius: string; // e.g. "5 km"
  registeredAt: string;
}
export interface FoodItem {
  id: string;
  providerId: string;
  name: string;
  description: string;
  price: number;
  category: "breakfast" | "lunch" | "dinner" | "snack" | "tiffin";
  type: "veg" | "non-veg" | "vegan";
  image: string;
  isAvailable: boolean;
  preparationTime: string; // e.g. "30 min"
  servingSize: string;     // e.g. "1 person"
}
export interface FoodOrder {
  id: string;
  studentId: string;
  studentName: string;
  providerId: string;
  providerName: string;
  items: { itemId: string; name: string; qty: number; price: number }[];
  totalAmount: number;
  hostelName: string;
  roomNumber: string;
  status: "placed" | "accepted" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
  orderTime: string;
  deliveryTime?: string;
  paymentStatus: "pending" | "paid";
}
export const categoryLabels: Record<FoodItem["category"], string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  tiffin: "Tiffin / Combo",
};
export const mockFoodProviders: FoodProvider[] = [
  {
    id: "fp-1",
    name: "Amma's Kitchen",
    phone: "+91 98765 11111",
    email: "ammas.kitchen@email.com",
    address: "12, 3rd Cross, Koramangala, Bangalore",
    speciality: "South Indian Home Food",
    image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=300&h=200&fit=crop",
    rating: 4.8,
    totalOrders: 342,
    isVerified: true,
    availableFrom: "07:00",
    availableTo: "21:00",
    deliveryRadius: "3 km",
    registeredAt: "2025-06-15",
  },
  {
    id: "fp-2",
    name: "Ghar Ka Khana by Meera",
    phone: "+91 98765 22222",
    email: "meera.food@email.com",
    address: "5, HSR Layout Sector 1, Bangalore",
    speciality: "North Indian Thali & Tiffin",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop",
    rating: 4.6,
    totalOrders: 218,
    isVerified: true,
    availableFrom: "08:00",
    availableTo: "20:30",
    deliveryRadius: "5 km",
    registeredAt: "2025-08-20",
  },
  {
    id: "fp-3",
    name: "Fresh Bites by Sunita",
    phone: "+91 98765 33333",
    email: "sunita.bites@email.com",
    address: "22, BTM Layout, Bangalore",
    speciality: "Healthy Salads & Wraps",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop",
    rating: 4.4,
    totalOrders: 156,
    isVerified: false,
    availableFrom: "09:00",
    availableTo: "19:00",
    deliveryRadius: "4 km",
    registeredAt: "2026-01-10",
  },
];
export const mockFoodItems: FoodItem[] = [
  // Amma's Kitchen
  { id: "fi-1", providerId: "fp-1", name: "Idli Sambar (4 pcs)", description: "Soft steamed idlis with hot sambar & chutneys", price: 60, category: "breakfast", type: "veg", image: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=300&h=200&fit=crop", isAvailable: true, preparationTime: "20 min", servingSize: "1 person" },
  { id: "fi-2", providerId: "fp-1", name: "Rice + Sambar + Curry", description: "Home-style rice with dal and seasonal veggie", price: 80, category: "lunch", type: "veg", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop", isAvailable: true, preparationTime: "30 min", servingSize: "1 person" },
  { id: "fi-3", providerId: "fp-1", name: "Monthly Chapati Dinner Plan ", description: "Soft wheat chapatis with mixed veg curry", price: 1500, category: "dinner", type: "vegan", image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop", isAvailable: true, preparationTime: "25 min", servingSize: "1 person" },
  { id: "fi-4", providerId: "fp-1", name: "Monthly Rice Launch Plan ", description: "Seasonal rice with dal and veggies", price: 2500, category: "dinner", type: "vegan", image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop", isAvailable: true, preparationTime: "25 min", servingSize: "1 person" },
  // Ghar Ka Khana
  { id: "fi-5", providerId: "fp-2", name: "Aloo Paratha (2 pcs)", description: "Stuffed parathas with curd and pickle", price: 70, category: "breakfast", type: "veg", image: "https://images.unsplash.com/photo-1604908177019-a9eb4b90bca5?w=300&h=200&fit=crop", isAvailable: true, preparationTime: "25 min", servingSize: "1 person" },
  { id: "fi-6", providerId: "fp-2", name: "Full Thali (Veg)", description: "Dal, sabzi, rice, roti, salad, sweet", price: 120, category: "lunch", type: "veg", image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=300&h=200&fit=crop", isAvailable: true, preparationTime: "35 min", servingSize: "1 person" },
  { id: "fi-7", providerId: "fp-2", name: "Chicken Curry + Rice", description: "Home-style chicken curry with steamed rice", price: 140, category: "lunch", type: "non-veg", image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&h=200&fit=crop", isAvailable: true, preparationTime: "40 min", servingSize: "1 person" },
  { id: "fi-8", providerId: "fp-2", name: "Monthly Tiffin Plan", description: "Lunch + Dinner daily for 30 days", price: 3500, category: "tiffin", type: "veg", image: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop", isAvailable: true, preparationTime: "N/A", servingSize: "1 person" },
  // Fresh Bites
  { id: "fi-8", providerId: "fp-3", name: "Greek Salad Bowl", description: "Fresh veggies with feta and olive dressing", price: 150, category: "lunch", type: "veg", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop", isAvailable: true, preparationTime: "15 min", servingSize: "1 person" },
  { id: "fi-9", providerId: "fp-3", name: "Paneer Wrap", description: "Whole wheat wrap with grilled paneer & veggies", price: 120, category: "snack", type: "veg", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300&h=200&fit=crop", isAvailable: true, preparationTime: "20 min", servingSize: "1 person" },
  { id: "fi-10", providerId: "fp-3", name: "Monthly Breakfast Plan", description: "Daily breakfast for 30 days", price: 1000, category: "lunch", type: "veg", image: "https://images.unsplash.com/photo-1568084680773-7a5d9f5c8e2d?w=300&h=200&fit=crop", isAvailable: true, preparationTime: "25 min", servingSize: "1 person" },
  { id: "fi-11", providerId: "fp-3", name: "Monthly Breakfast+Dinner Plan", description: "Daily breakfast and dinner for 30 days", price: 2500, category: "lunch", type: "veg", image: "https://images.unsplash.com/photo-1568084680773-7a5d9f5c8e2d?w=300&h=200&fit=crop", isAvailable: true, preparationTime: "25 min", servingSize: "1 person" }
];
export const mockFoodOrders: FoodOrder[] = [
  {
    id: "fo-1",
    studentId: "t1",
    studentName: "Arjun Sharma",
    providerId: "fp-1",
    providerName: "Amma's Kitchen",
    items: [{ itemId: "fi-2", name: "Rice + Sambar + Curry", qty: 1, price: 80 }],
    totalAmount: 80,
    hostelName: "Sunrise Student Haven",
    roomNumber: "101-A",
    status: "delivered",
    orderTime: "2026-04-10T12:30:00",
    deliveryTime: "2026-04-10T13:15:00",
    paymentStatus: "paid",
  },
  {
    id: "fo-2",
    studentId: "t2",
    studentName: "Priya Menon",
    providerId: "fp-2",
    providerName: "Ghar Ka Khana by Meera",
    items: [
      { itemId: "fi-5", name: "Full Thali (Veg)", qty: 1, price: 120 },
      { itemId: "fi-4", name: "Aloo Paratha (2 pcs)", qty: 1, price: 70 },
    ],
    totalAmount: 190,
    hostelName: "Sunrise Student Haven",
    roomNumber: "102-B",
    status: "preparing",
    orderTime: "2026-04-11T12:00:00",
    paymentStatus: "pending",
  },
];