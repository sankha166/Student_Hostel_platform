import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, CreditCard, Plus, ArrowLeft, BedDouble, IndianRupee,
  TrendingUp, UserCheck, ClipboardList, Search, Phone, Mail, Calendar,
  CheckCircle2, XCircle, Clock, Home, Bell, Edit, Download, X,
  Building2, Banknote, CreditCard as CardIcon, Shield, Landmark, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  ownerProperties, propertyRooms, propertyTenants,
  type PropertyRoom, type PropertyTenant, type OwnerProperty
} from "@/data/ownerData";
import {
  bookingRequests as initialRequests, paymentAccounts as initialAccounts,
  type BookingRequest, type PaymentAccount
} from "@/data/ownerMockCompat";
import AllocationDialog, { AllocationData } from "@/components/AllocationDialog"; // Adjust path as needed

type Tab = "dashboard" | "rooms" | "tenants" | "requests" | "payments" | "edit";

// Mock payment history for tenants
const generatePaymentHistory = (tenant: PropertyTenant) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();
  const history = [];
  for (let i = 5; i >= 0; i--) {
    const monthIdx = (currentMonth - i + 12) % 12;
    const year = new Date().getFullYear() - (currentMonth - i < 0 ? 1 : 0);
    const isPaid = i > 0 || tenant.rentStatus === "Paid";
    history.push({
      id: `ph-${tenant.id}-${monthIdx}`,
      month: months[monthIdx],
      year,
      amount: tenant.rentAmount,
      status: isPaid ? "Paid" as const : tenant.rentStatus as "Paid" | "Pending" | "Overdue",
      paidDate: isPaid ? `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 10) + 1).padStart(2, "0")}` : undefined,
      transactionId: isPaid ? `TXN${Math.random().toString(36).substring(2, 10).toUpperCase()}` : undefined,
    });
  }
  return history;
};

// Mock notifications
const mockNotifications = [
  { id: "n1", text: "New booking request from Amit Verma", time: "2 hours ago", read: false, type: "booking" },
  { id: "n2", text: "Rent payment received — ₹5,500 from Karan Desai", time: "5 hours ago", read: false, type: "payment" },
  { id: "n3", text: "Room 102-B maintenance completed", time: "1 day ago", read: true, type: "maintenance" },
  { id: "n4", text: "Tenant Priya Menon's rent is overdue", time: "2 days ago", read: true, type: "overdue" },
  { id: "n5", text: "Visit request scheduled for tomorrow", time: "3 days ago", read: true, type: "visit" },
];

const PropertyDashboard = () => {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState(initialRequests);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAllocation, setShowAllocation] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<PropertyTenant | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [selectedRoom, setSelectedRoom] = useState("");

  // Add Room form state
  const [newRoom, setNewRoom] = useState({
    roomNumber: "", floor: "", type: "Single" as PropertyRoom["type"],
    capacity: 1, price: 0, amenities: ""
  });
  const [rooms, setRooms] = useState<PropertyRoom[]>(propertyRooms);

  // Edit property state
  const property = ownerProperties.find(p => p.id === propertyId);
  const [editForm, setEditForm] = useState<Partial<OwnerProperty>>(property || {});

  // New account form
  const [newAccount, setNewAccount] = useState<Partial<PaymentAccount>>({
    type: "upi", label: "", upiId: "", bankName: "", accountNumber: "", ifsc: "", holderName: "", isPrimary: false
  });

  const propRooms = useMemo(() => rooms.filter(r => r.propertyId === propertyId), [rooms, propertyId]);
  const propTenants = useMemo(() => propertyTenants.filter(t => t.propertyId === propertyId), [propertyId]);
  
  const freeRooms = useMemo(() => 
  propRooms.filter(r => r.status === "available"), 
  [propRooms]
);

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Property Not Found</h2>
          <Button onClick={() => navigate("/owner")} className="rounded-xl gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const occupancy = property.totalBeds > 0 ? Math.round((property.occupiedBeds / property.totalBeds) * 100) : 0;
  const paidTenants = propTenants.filter(t => t.rentStatus === "Paid").length;
  const pendingTenants = propTenants.filter(t => t.rentStatus !== "Paid").length;
  const pendingRequestsCount = requests.filter(r => r.status === "pending").length;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const filteredTenants = propTenants.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.phone.includes(searchQuery)
  );

  const stats = [
    { label: "Total Tenants", value: propTenants.length.toString(), icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Occupancy", value: `${occupancy}%`, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950" },
    { label: "Revenue", value: `₹${property.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950" },
    { label: "Due Amount", value: `₹${property.dueAmount.toLocaleString()}`, icon: IndianRupee, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Total Rooms", value: property.totalRooms.toString(), icon: BedDouble, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950" },
    { label: "Available", value: freeRooms.length.toString(), icon: Home, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
  ];

  const tabItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "rooms" as const, label: "Rooms", icon: BedDouble },
    { id: "tenants" as const, label: "Tenants", icon: Users },
    { id: "requests" as const, label: "Requests", icon: ClipboardList, badge: pendingRequestsCount },
    { id: "payments" as const, label: "Payments", icon: CreditCard },
    { id: "edit" as const, label: "Edit Hostel Details", icon: Edit },
  ];

  const handleAcceptRequest = (req: BookingRequest) => {
    if (req.type === "booking") {
      setSelectedRequest(req);
      setSelectedRoom("");
      setShowAllocation(true);
    } else {
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "accepted" as const } : r));
    }
  };

  const handleRejectRequest = (reqId: string) => {
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: "rejected" as const } : r));
  };

const handleAllocationConfirm = (data: AllocationData) => {
  if (selectedRequest) {
    // 1. Update the request status to accepted
    setRequests(prev => prev.map(r => 
      r.id === selectedRequest.id ? { ...r, status: "accepted" as const } : r
    ));

    // 2. Update the room status to occupied
    setRooms(prev => prev.map(r => 
      (r.id === data.room || r.roomNumber === data.room) 
        ? { ...r, status: "occupied" as const, currentOccupancy: r.currentOccupancy + 1 } 
        : r
    ));

    // Note: In a real app, you would save the allocation to the database
  }
  
  setSelectedRequest(null);
  setShowAllocation(false);
};

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const room: PropertyRoom = {
      id: `r-new-${Date.now()}`,
      propertyId: propertyId!,
      roomNumber: newRoom.roomNumber,
      floor: newRoom.floor,
      type: newRoom.type,
      capacity: newRoom.capacity,
      currentOccupancy: 0,
      price: newRoom.price,
      status: "available",
      amenities: newRoom.amenities.split(",").map(a => a.trim()).filter(Boolean),
    };
    setRooms(prev => [...prev, room]);
    setNewRoom({ roomNumber: "", floor: "", type: "Single", capacity: 1, price: 0, amenities: "" });
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const acc: PaymentAccount = {
      id: `pa-${Date.now()}`,
      type: newAccount.type || "upi",
      label: newAccount.label || "",
      upiId: newAccount.upiId,
      bankName: newAccount.bankName,
      accountNumber: newAccount.accountNumber,
      ifsc: newAccount.ifsc,
      holderName: newAccount.holderName,
      isPrimary: accounts.length === 0,
    };
    setAccounts(prev => [...prev, acc]);
    setShowAddAccount(false);
    setNewAccount({ type: "upi", label: "", upiId: "", bankName: "", accountNumber: "", ifsc: "", holderName: "", isPrimary: false });
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDownloadReceipt = (tenant: PropertyTenant, month: string, year: number, amount: number, txnId?: string) => {
    const receipt = `
═══════════════════════════════════════
         PAYMENT RECEIPT
═══════════════════════════════════════
Property: ${property.name}
Location: ${property.location}

Tenant: ${tenant.name}
Room: ${tenant.room}
Month: ${month} ${year}

Amount Paid: ₹${amount.toLocaleString()}
Transaction ID: ${txnId || "N/A"}
Status: PAID

Generated on: ${new Date().toLocaleDateString()}
═══════════════════════════════════════
    `;
    const blob = new Blob([receipt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Receipt_${tenant.name.replace(/\s/g, "_")}_${month}_${year}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card shrink-0">
        <div className="p-6 border-b">
          <button onClick={() => navigate("/owner")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to All Properties
          </button>
          <div className="flex items-center gap-3">
            <img src={property.image} alt={property.name} className="w-10 h-10 rounded-xl object-cover" />
            <div className="min-w-0">
              <h2 className="font-bold text-foreground text-sm truncate">{property.name}</h2>
              <p className="text-xs text-muted-foreground truncate">{property.location}</p>
            </div>
          </div>
          <Badge variant="outline" className="mt-3 text-primary border-primary">
            {property.type.toUpperCase()}
          </Badge>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {tabItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs shrink-0">
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header with Notification */}
        <header className="border-b bg-card px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => navigate("/owner")} className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">{property.name}</h1>
              <p className="text-xs text-muted-foreground">{property.location}</p>
            </div>
          </div>
          <h1 className="hidden lg:block text-lg font-semibold text-foreground">
            {tabItems.find(t => t.id === activeTab)?.label}
          </h1>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center font-bold">
                  {unreadNotifications}
                </span>
              )}
            </Button>
            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-12 w-80 bg-card border rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {unreadNotifications > 0 && (
                        <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                          Mark all read
                        </button>
                      )}
                      <button onClick={() => setShowNotifications(false)}>
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.read ? "bg-primary" : "bg-muted-foreground/30"}`} />
                          <div>
                            <p className={`text-sm ${!n.read ? "font-medium text-foreground" : "text-muted-foreground"}`}>{n.text}</p>
                            <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Mobile Tab Nav */}
        <div className="flex lg:hidden gap-2 overflow-x-auto p-4 pb-2">
          {tabItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(item.id)}
              className="rounded-xl gap-1 shrink-0 text-xs"
            >
              <item.icon className="w-3 h-3" />
              {item.label}
              {item.badge && item.badge > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  {item.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                          <s.icon className={`w-5 h-5 ${s.color}`} />
                        </div>
                        <p className="text-xl font-bold text-foreground">{s.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Rent Collection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Collected</span>
                          <span className="font-medium text-emerald-600">{paidTenants}/{propTenants.length}</span>
                        </div>
                        <Progress value={propTenants.length > 0 ? (paidTenants / propTenants.length) * 100 : 0} className="h-3" />
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-foreground">{paidTenants} Paid</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-foreground">{pendingTenants} Pending</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Room Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-emerald-50 dark:bg-emerald-950 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                          {propRooms.filter(r => r.status === "occupied").length}
                        </p>
                        <p className="text-xs text-muted-foreground">Occupied</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                          {freeRooms.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Available</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                          {propRooms.filter(r => r.status === "maintenance").length}
                        </p>
                        <p className="text-xs text-muted-foreground">Maintenance</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Rooms Tab */}
          {activeTab === "rooms" && (
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" /> Add New Room
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddRoom} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Room Number *</label>
                      <Input placeholder="e.g. 301-A" value={newRoom.roomNumber} onChange={e => setNewRoom(p => ({ ...p, roomNumber: e.target.value }))} required className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Floor *</label>
                      <Input placeholder="e.g. 3rd" value={newRoom.floor} onChange={e => setNewRoom(p => ({ ...p, floor: e.target.value }))} required className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Room Type *</label>
                      <select value={newRoom.type} onChange={e => setNewRoom(p => ({ ...p, type: e.target.value as PropertyRoom["type"] }))} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
                        <option value="Single">Single</option>
                        <option value="Double">Double</option>
                        <option value="Triple">Triple</option>
                        <option value="Shared (2-bed)">Shared (2-bed)</option>
                        <option value="Shared (4-bed)">Shared (4-bed)</option>
                        <option value="Single (Attached Bath)">Single (Attached Bath)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Capacity *</label>
                      <Input type="number" min={1} placeholder="Number of beds" value={newRoom.capacity} onChange={e => setNewRoom(p => ({ ...p, capacity: parseInt(e.target.value) || 1 }))} required className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Monthly Rent (₹) *</label>
                      <Input type="number" min={0} placeholder="e.g. 5500" value={newRoom.price || ""} onChange={e => setNewRoom(p => ({ ...p, price: parseInt(e.target.value) || 0 }))} required className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Amenities</label>
                      <Input placeholder="Wi-Fi, AC (comma separated)" value={newRoom.amenities} onChange={e => setNewRoom(p => ({ ...p, amenities: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="md:col-span-2 lg:col-span-3 flex justify-end">
                      <Button type="submit" className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Add Room</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">All Rooms ({propRooms.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Room</TableHead>
                          <TableHead>Floor</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Occupied</TableHead>
                          <TableHead>Rent</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Amenities</TableHead>
                          <TableHead>Add Bills</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {propRooms.map(room => (
                          <TableRow key={room.id}>
                            <TableCell className="font-medium">{room.roomNumber}</TableCell>
                            <TableCell>{room.floor}</TableCell>
                            <TableCell>{room.type}</TableCell>
                            <TableCell>{room.capacity}</TableCell>
                            <TableCell>{room.currentOccupancy}/{room.capacity}</TableCell>
                            <TableCell>₹{room.price.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={room.status === "available" ? "default" : room.status === "occupied" ? "secondary" : "destructive"}>
                                {room.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <div className="flex gap-1 flex-wrap">
                                {room.amenities.slice(0, 3).map(a => (
                                  <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                                ))}
                                {room.amenities.length > 3 && (
                                  <Badge variant="outline" className="text-xs">+{room.amenities.length - 3}</Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tenants Tab */}
          {activeTab === "tenants" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search by name, room or phone..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 rounded-xl" />
                </div>
                <Badge variant="outline">{filteredTenants.length} tenants</Badge>
              </div>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Join Date</TableHead>
                          <TableHead>Rent</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTenants.map(tenant => (
                          <TableRow key={tenant.id}>
                            <TableCell>
                              <button
                                onClick={() => setSelectedTenant(tenant)}
                                className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
                              >
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-bold text-primary">{tenant.name.charAt(0)}</span>
                                </div>
                                <span className="font-medium text-primary underline underline-offset-2 cursor-pointer">{tenant.name}</span>
                              </button>
                            </TableCell>
                            <TableCell><Badge variant="outline">{tenant.room}</Badge></TableCell>
                            <TableCell><span className="flex items-center gap-1 text-sm"><Phone className="w-3 h-3" /> {tenant.phone}</span></TableCell>
                            <TableCell><span className="flex items-center gap-1 text-sm"><Mail className="w-3 h-3" /> {tenant.email}</span></TableCell>
                            <TableCell><span className="flex items-center gap-1 text-sm"><Calendar className="w-3 h-3" /> {tenant.joinDate}</span></TableCell>
                            <TableCell className="font-medium">₹{tenant.rentAmount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={tenant.rentStatus === "Paid" ? "default" : "destructive"}>{tenant.rentStatus}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredTenants.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No tenants found matching "{searchQuery}"
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === "requests" && (
            <div className="space-y-4">
              {requests.length === 0 && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    No requests yet
                  </CardContent>
                </Card>
              )}
              {requests.map((req) => (
                <Card key={req.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{req.studentName.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{req.studentName}</h3>
                          <Badge variant={req.type === "visit" ? "outline" : "default"}>
                            {req.type === "visit" ? "Visit Request" : "Booking Request"}
                          </Badge>
                          <Badge variant={req.status === "pending" ? "secondary" : req.status === "accepted" ? "default" : "destructive"}>
                            {req.status}
                          </Badge>
                        </div>
                        {req.message && <p className="text-sm text-muted-foreground mt-1">{req.message}</p>}
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {req.phone}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {req.preferredDate}</span>
                          {req.requestedRoom && <span>Room {req.requestedRoom}</span>}
                          {req.advanceAmount && <span>Advance ₹{req.advanceAmount.toLocaleString()}</span>}
                        </div>
                        {req.status === "pending" && (
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" onClick={() => handleAcceptRequest(req)} className="rounded-xl gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Accept
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleRejectRequest(req.id)} className="rounded-xl gap-1 text-destructive">
                              <XCircle className="w-4 h-4" /> Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Payment Accounts</h2>
                  <p className="text-sm text-muted-foreground">Manage your payment collection methods</p>
                </div>
                <Button onClick={() => setShowAddAccount(true)} className="rounded-xl gap-2">
                  <Plus className="w-4 h-4" /> Add Account
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {accounts.map(acc => (
                  <Card key={acc.id} className={`border-0 shadow-sm overflow-hidden ${acc.isPrimary ? "ring-2 ring-primary" : ""}`}>
                    <div className={`h-1.5 ${acc.isPrimary ? "bg-primary" : "bg-muted"}`} />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${acc.type === "upi" ? "bg-violet-50 dark:bg-violet-950" : "bg-blue-50 dark:bg-blue-950"}`}>
                          {acc.type === "upi" ? <Banknote className="w-6 h-6 text-violet-600" /> : <Landmark className="w-6 h-6 text-blue-600" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={acc.type === "upi" ? "default" : "secondary"} className="uppercase text-xs">{acc.type}</Badge>
                          {acc.isPrimary && (
                            <Badge className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" variant="outline">
                              <Shield className="w-3 h-3 mr-1" /> Primary
                            </Badge>
                          )}
                        </div>
                      </div>
                      <h3 className="font-semibold text-foreground text-base mb-2">{acc.label}</h3>
                      <Separator className="my-3" />
                      <div className="space-y-2 text-sm">
                        {acc.upiId && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">UPI ID</span>
                            <span className="font-medium text-foreground">{acc.upiId}</span>
                          </div>
                        )}
                        {acc.bankName && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Bank</span>
                            <span className="font-medium text-foreground">{acc.bankName}</span>
                          </div>
                        )}
                        {acc.accountNumber && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Account No.</span>
                            <span className="font-medium text-foreground font-mono">{acc.accountNumber}</span>
                          </div>
                        )}
                        {acc.ifsc && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">IFSC</span>
                            <span className="font-medium text-foreground font-mono">{acc.ifsc}</span>
                          </div>
                        )}
                        {acc.holderName && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Holder</span>
                            <span className="font-medium text-foreground">{acc.holderName}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Payment History */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Rent Collection Overview</CardTitle>
                  <CardDescription>Current month payment status for all tenants</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {propTenants.map(t => (
                        <TableRow key={t.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-primary">{t.name.charAt(0)}</span>
                              </div>
                              <span className="font-medium">{t.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{t.room}</TableCell>
                          <TableCell className="font-semibold">₹{t.rentAmount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={t.rentStatus === "Paid" ? "default" : "destructive"}>{t.rentStatus}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setSelectedTenant(t)}>
                              <Calendar className="w-3 h-3" /> History
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Edit Hostel Details Tab */}
          {activeTab === "edit" && (
            <div className="space-y-6 max-w-3xl">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Edit className="w-5 h-5 text-primary" /> Edit Property Details
                  </CardTitle>
                  <CardDescription>Update your hostel/PG information. Changes will reflect across the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6" onSubmit={e => { e.preventDefault(); /* Save logic */ }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Property Name *</label>
                        <Input value={editForm.name || ""} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Property Type *</label>
                        <select value={editForm.type || "hostel"} onChange={e => setEditForm(p => ({ ...p, type: e.target.value as OwnerProperty["type"] }))} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
                          <option value="hostel">Hostel</option>
                          <option value="pg">PG</option>
                          <option value="apartment">Apartment</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-foreground">Full Address *</label>
                        <Textarea value={editForm.address || ""} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} className="rounded-xl" rows={2} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Location / Area</label>
                        <Input value={editForm.location || ""} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Monthly Rent (₹)</label>
                        <Input type="number" value={editForm.monthlyRent || ""} onChange={e => setEditForm(p => ({ ...p, monthlyRent: parseInt(e.target.value) || 0 }))} className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Contact Phone</label>
                        <Input value={editForm.contactPhone || ""} onChange={e => setEditForm(p => ({ ...p, contactPhone: e.target.value }))} className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Contact Email</label>
                        <Input type="email" value={editForm.contactEmail || ""} onChange={e => setEditForm(p => ({ ...p, contactEmail: e.target.value }))} className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Total Rooms</label>
                        <Input type="number" value={editForm.totalRooms || ""} onChange={e => setEditForm(p => ({ ...p, totalRooms: parseInt(e.target.value) || 0 }))} className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Total Beds</label>
                        <Input type="number" value={editForm.totalBeds || ""} onChange={e => setEditForm(p => ({ ...p, totalBeds: parseInt(e.target.value) || 0 }))} className="rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Amenities (comma separated)</label>
                      <Input
                        value={(editForm.amenities || []).join(", ")}
                        onChange={e => setEditForm(p => ({ ...p, amenities: e.target.value.split(",").map(a => a.trim()).filter(Boolean) }))}
                        className="rounded-xl"
                        placeholder="Wi-Fi, AC, Laundry, Gym..."
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditForm(property)}>Reset</Button>
                      <Button type="submit" className="rounded-xl gap-2"><CheckCircle2 className="w-4 h-4" /> Save Changes</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Tenant Payment History Dialog */}
      <Dialog open={!!selectedTenant} onOpenChange={() => setSelectedTenant(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Payment History — {selectedTenant?.name}
            </DialogTitle>
            <DialogDescription>
              Room {selectedTenant?.room} · ₹{selectedTenant?.rentAmount.toLocaleString()}/month
            </DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {generatePaymentHistory(selectedTenant).map(ph => (
                <div key={ph.id} className={`flex items-center justify-between p-3 rounded-xl border ${ph.status === "Paid" ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900" : "bg-destructive/5 border-destructive/20"}`}>
                  <div>
                    <p className="font-medium text-foreground text-sm">{ph.month} {ph.year}</p>
                    {ph.paidDate && <p className="text-xs text-muted-foreground">Paid on {ph.paidDate}</p>}
                    {ph.transactionId && <p className="text-xs text-muted-foreground font-mono">TXN: {ph.transactionId}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-semibold text-sm text-foreground">₹{ph.amount.toLocaleString()}</p>
                      <Badge variant={ph.status === "Paid" ? "default" : "destructive"} className="text-xs">{ph.status}</Badge>
                    </div>
                    {ph.status === "Paid" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleDownloadReceipt(selectedTenant, ph.month, ph.year, ph.amount, ph.transactionId)}
                        title="Download Receipt"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

    {/* New Multi-step Allocation Dialog */}
      {selectedRequest && (
      <AllocationDialog
      open={showAllocation}
      onClose={() => {
        setShowAllocation(false);
        setSelectedRequest(null);
      }}
      studentName={selectedRequest.studentName}
      studentPhone={selectedRequest.phone}
      studentEmail={""} // Pass empty string or add email to BookingRequest type
      paymentAccounts={accounts}
     availableRooms={freeRooms as any[]} // This passes only the vacant rooms
      onConfirm={handleAllocationConfirm}
      />
      )}

      {/* Add Payment Account Dialog */}
      <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Add Payment Account
            </DialogTitle>
            <DialogDescription>Add a new UPI or bank account for rent collection</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAccount} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewAccount(p => ({ ...p, type: "upi" }))}
                  className={`p-3 rounded-xl border text-center transition-all ${newAccount.type === "upi" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}
                >
                  <Banknote className="w-5 h-5 mx-auto mb-1 text-violet-600" />
                  <p className="text-sm font-medium">UPI</p>
                </button>
                <button
                  type="button"
                  onClick={() => setNewAccount(p => ({ ...p, type: "bank" }))}
                  className={`p-3 rounded-xl border text-center transition-all ${newAccount.type === "bank" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}
                >
                  <Landmark className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                  <p className="text-sm font-medium">Bank Account</p>
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Label *</label>
              <Input placeholder="e.g. Business GPay" value={newAccount.label} onChange={e => setNewAccount(p => ({ ...p, label: e.target.value }))} required className="rounded-xl" />
            </div>
            {newAccount.type === "upi" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">UPI ID *</label>
                <Input placeholder="e.g. owner@okicici" value={newAccount.upiId} onChange={e => setNewAccount(p => ({ ...p, upiId: e.target.value }))} required className="rounded-xl" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Account Holder Name *</label>
                  <Input placeholder="Full name" value={newAccount.holderName} onChange={e => setNewAccount(p => ({ ...p, holderName: e.target.value }))} required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Bank Name *</label>
                  <Input placeholder="e.g. State Bank of India" value={newAccount.bankName} onChange={e => setNewAccount(p => ({ ...p, bankName: e.target.value }))} required className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Account No. *</label>
                    <Input placeholder="Account number" value={newAccount.accountNumber} onChange={e => setNewAccount(p => ({ ...p, accountNumber: e.target.value }))} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">IFSC *</label>
                    <Input placeholder="e.g. SBIN0001234" value={newAccount.ifsc} onChange={e => setNewAccount(p => ({ ...p, ifsc: e.target.value }))} required className="rounded-xl" />
                  </div>
                </div>
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddAccount(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" className="rounded-xl gap-1"><Plus className="w-4 h-4" /> Add Account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyDashboard;
