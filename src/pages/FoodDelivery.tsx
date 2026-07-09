import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UtensilsCrossed, Star, Clock, MapPin, Phone, Mail, Search,
  ShoppingCart, Plus, Minus, ChefHat, Leaf, CheckCircle2,
  ArrowLeft, Home, User, Store, FileText, Truck, X, BadgeCheck,
  CreditCard, Package, Timer, Receipt, IndianRupee
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { foodService, type FoodProvider, type FoodItem, type FoodOrder } from "@/lib/dataService";
import { categoryLabels } from "@/data/foodDeliveryData";
import { useAuth } from "@/contexts/AuthContext";

type View = "browse" | "provider" | "register" | "orders";

interface CartItem { item: FoodItem; qty: number; }

const STATUS_STEPS = [
  { key: "placed", label: "Order Placed", icon: Package, desc: "Your order has been received" },
  { key: "accepted", label: "Kitchen Accepted", icon: CheckCircle2, desc: "Kitchen is preparing your order" },
  { key: "preparing", label: "Preparing", icon: ChefHat, desc: "Your food is being cooked" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck, desc: "Kitchen is delivering to your room" },
  { key: "delivered", label: "Delivered", icon: CheckCircle2, desc: "Enjoy your meal!" },
];

const FoodDelivery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [view, setView] = useState<View>("browse");
  const [selectedProvider, setSelectedProvider] = useState<FoodProvider | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<FoodItem["category"] | "all">("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderForm, setOrderForm] = useState({ hostelName: "", roomNumber: "", phone: user?.phone || "", notes: "" });

  // Payment & Order flow
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "payment" | "done">("cart");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "COD">("UPI");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [lastOrder, setLastOrder] = useState<FoodOrder | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // My Orders
  const [myOrders, setMyOrders] = useState<FoodOrder[]>([]);
  const [trackingOrder, setTrackingOrder] = useState<FoodOrder | null>(null);

  // Register form
  const [regForm, setRegForm] = useState({ name: "", phone: "", email: "", address: "", speciality: "", availableFrom: "08:00", availableTo: "20:00", deliveryRadius: "5" });
  const [registerDone, setRegisterDone] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  const allProviders = useMemo(() => foodService.getProviders(), []);
  const filteredProviders = allProviders.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.speciality.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const providerItems = useMemo(() => {
    if (!selectedProvider) return [];
    let items = foodService.getItems(selectedProvider.id);
    if (categoryFilter !== "all") items = items.filter(i => i.category === categoryFilter);
    return items;
  }, [selectedProvider, categoryFilter]);

  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.qty, 0);
  const deliveryFee = cartTotal > 199 ? 0 : 20;
  const grandTotal = cartTotal + deliveryFee;
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const loadOrders = useCallback(() => setMyOrders(foodService.getOrders()), []);
  useEffect(() => { loadOrders(); }, [loadOrders]);

  const addToCart = (item: FoodItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) return prev.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === itemId);
      if (existing && existing.qty > 1) return prev.map(c => c.item.id === itemId ? { ...c, qty: c.qty - 1 } : c);
      return prev.filter(c => c.item.id !== itemId);
    });
  };

  const getCartQty = (itemId: string) => cart.find(c => c.item.id === itemId)?.qty || 0;

  // PAYMENT + ORDER FLOW (Swiggy/Zomato style)
  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutStep("cart");
    setShowCheckout(true);
  };

  const handlePlaceOrder = async () => {
    if (!orderForm.hostelName || !orderForm.roomNumber || !orderForm.phone) return;
    setCheckoutStep("payment");
    setPaymentProcessing(true);

    // Simulate payment processing (1.5s like real UPI)
    await new Promise(r => setTimeout(r, 1500));

    // Place order with payment
    if (selectedProvider) {
      const order = foodService.placeOrder({
        studentId: user?.id || "",
        studentName: user?.name || "Student",
        providerId: selectedProvider.id,
        providerName: selectedProvider.name,
        items: cart.map(c => ({ itemId: c.item.id, name: c.item.name, qty: c.qty, price: c.item.price })),
        totalAmount: grandTotal,
        hostelName: orderForm.hostelName,
        roomNumber: orderForm.roomNumber,
        paymentMethod: paymentMethod,
        transactionId: paymentMethod === "UPI" ? `UPI${Date.now().toString(36).toUpperCase()}` : undefined,
      });
      setLastOrder(order);

      // Simulate kitchen accepting after 3s
      setTimeout(() => { foodService.updateOrderStatus(order.id, "accepted"); loadOrders(); }, 3000);
      // Simulate preparing after 8s
      setTimeout(() => { foodService.updateOrderStatus(order.id, "preparing"); loadOrders(); }, 8000);
      // Simulate out for delivery after 15s (compressed for demo)
      setTimeout(() => { foodService.updateOrderStatus(order.id, "out_for_delivery"); loadOrders(); }, 15000);
      // Simulate delivered after 25s
      setTimeout(() => { foodService.updateOrderStatus(order.id, "delivered"); loadOrders(); }, 25000);
    }

    setPaymentProcessing(false);
    setCheckoutStep("done");
    loadOrders();
  };

  const handleCheckoutClose = () => {
    setShowCheckout(false);
    if (checkoutStep === "done") {
      setCart([]);
      setOrderForm({ hostelName: "", roomNumber: "", phone: user?.phone || "", notes: "" });
      setCheckoutStep("cart");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    await new Promise(r => setTimeout(r, 800));
    foodService.registerProvider({
      name: regForm.name, phone: regForm.phone, email: regForm.email,
      address: regForm.address, speciality: regForm.speciality,
      image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=300&h=200&fit=crop",
      availableFrom: regForm.availableFrom, availableTo: regForm.availableTo,
      deliveryRadius: `${regForm.deliveryRadius} km`,
    });
    setRegLoading(false);
    setRegisterDone(true);
  };

  const getStatusIndex = (status: string) => STATUS_STEPS.findIndex(s => s.key === status);

  const getEstimatedTime = (order: FoodOrder) => {
    if (order.status === "delivered") return "Delivered";
    if (order.deliveryTime) {
      const eta = new Date(order.deliveryTime);
      const now = new Date();
      const mins = Math.max(0, Math.round((eta.getTime() - now.getTime()) / 60000));
      if (mins <= 0) return "Arriving now";
      return `${mins} min`;
    }
    return "25-35 min";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view !== "browse" && (
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => {
                if (view === "provider") { setSelectedProvider(null); setView("browse"); }
                else setView("browse");
              }}><ArrowLeft className="w-5 h-5" /></Button>
            )}
            <button onClick={() => navigate("/")} className="flex items-center gap-2 font-bold text-lg text-foreground">
              🍽️ Home Delivery
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={() => { setView("orders"); loadOrders(); }}>
              <Package className="w-4 h-4" /> My Orders
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={() => setView("register")}>
              <ChefHat className="w-4 h-4" /> Register Kitchen
            </Button>
            {cartCount > 0 && (
              <Button size="sm" className="rounded-xl gap-1 relative gradient-primary text-primary-foreground" onClick={handleProceedToCheckout}>
                <ShoppingCart className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center font-bold">{cartCount}</span>
                ₹{cartTotal}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* ═══════════ BROWSE PROVIDERS ═══════════ */}
        {view === "browse" && (
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl font-bold text-foreground mb-2">🍽️ Home-Cooked Food for Hostellers</h1>
              <p className="text-muted-foreground">Fresh, homemade meals delivered to your hostel room by local home cooks</p>
            </div>
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search cooks or cuisines..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 rounded-xl" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProviders.map((prov, i) => (
                <motion.div key={prov.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="border-0 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedProvider(prov); setView("provider"); }}>
                    <div className="relative h-40">
                      <img src={prov.image} alt={prov.name} className="w-full h-full object-cover" />
                      {prov.isVerified && <Badge className="absolute top-3 right-3 gap-1 bg-emerald-600"><BadgeCheck className="w-3 h-3" /> Verified</Badge>}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <p className="text-white text-xs flex items-center gap-1"><Timer className="w-3 h-3" /> 25-35 min delivery</p>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{prov.name}</h3>
                          <p className="text-sm text-muted-foreground">{prov.speciality}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-lg">
                          <Star className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{prov.rating}</span>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-3">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {prov.availableFrom}–{prov.availableTo}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {prov.deliveryRadius}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">{prov.totalOrders} orders</p>
                        <Badge variant="outline" className="text-xs">Free delivery above ₹199</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════ PROVIDER MENU ═══════════ */}
        {view === "provider" && selectedProvider && (
          <div className="space-y-6">
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="relative h-48 md:h-56">
                <img src={selectedProvider.image} alt={selectedProvider.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold">{selectedProvider.name}</h2>
                    {selectedProvider.isVerified && <BadgeCheck className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <p className="text-sm text-white/80">{selectedProvider.speciality}</p>
                  <div className="flex gap-4 mt-2 text-xs text-white/70">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {selectedProvider.rating}</span>
                    <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> 25-35 min</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedProvider.address}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button variant={categoryFilter === "all" ? "default" : "outline"} size="sm" className="rounded-xl shrink-0" onClick={() => setCategoryFilter("all")}>All</Button>
              {(Object.entries(categoryLabels) as [FoodItem["category"], string][]).map(([key, label]) => (
                <Button key={key} variant={categoryFilter === key ? "default" : "outline"} size="sm" className="rounded-xl shrink-0" onClick={() => setCategoryFilter(key)}>{label}</Button>
              ))}
            </div>

            {/* Menu Items */}
            <div className="grid md:grid-cols-2 gap-4">
              {providerItems.map(item => {
                const qty = getCartQty(item.id);
                return (
                  <Card key={item.id} className="border-0 shadow-sm overflow-hidden">
                    <div className="flex">
                      <img src={item.image} alt={item.name} className="w-28 h-28 object-cover shrink-0" />
                      <CardContent className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-xs ${item.type === "veg" ? "text-emerald-600 border-emerald-300" : item.type === "non-veg" ? "text-red-600 border-red-300" : "text-green-700 border-green-300"}`}>
                              {item.type === "veg" ? "🟢" : item.type === "non-veg" ? "🔴" : "🌱"} {item.type}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-foreground">₹{item.price}</span>
                          {qty === 0 ? (
                            <Button size="sm" variant="outline" className="rounded-xl gap-1 h-8 text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => addToCart(item)}>
                              <Plus className="w-3 h-3" /> ADD
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2 bg-primary rounded-lg px-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-primary-foreground hover:bg-white/20" onClick={() => removeFromCart(item.id)}><Minus className="w-3 h-3" /></Button>
                              <span className="text-sm font-semibold w-4 text-center text-primary-foreground">{qty}</span>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-primary-foreground hover:bg-white/20" onClick={() => addToCart(item)}><Plus className="w-3 h-3" /></Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                );
              })}
              {providerItems.length === 0 && (
                <div className="col-span-2 text-center py-12 text-muted-foreground">
                  <UtensilsCrossed className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No items in this category</p>
                </div>
              )}
            </div>

            {/* Sticky Cart Bar */}
            {cartCount > 0 && (
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg p-4 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{cartCount} item{cartCount > 1 ? "s" : ""} — ₹{cartTotal}</p>
                    <p className="text-xs text-muted-foreground">{deliveryFee === 0 ? "Free delivery" : `+₹${deliveryFee} delivery`}</p>
                  </div>
                  <Button className="gradient-primary text-primary-foreground rounded-xl gap-2" onClick={handleProceedToCheckout}>
                    Proceed to Pay <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ═══════════ MY ORDERS ═══════════ */}
        {view === "orders" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground">My Orders</h2>
            {myOrders.length === 0 ? (
              <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No orders yet</p><p className="text-sm">Order delicious home-cooked food!</p>
                <Button className="mt-4 rounded-xl" onClick={() => setView("browse")}>Browse Kitchens</Button>
              </CardContent></Card>
            ) : (
              myOrders.map(order => {
                const statusIdx = getStatusIndex(order.status);
                const isActive = order.status !== "delivered" && order.status !== "cancelled";
                return (
                  <Card key={order.id} className={`border-0 shadow-sm ${isActive ? "border-l-4 border-l-primary" : ""}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{order.providerName}</h3>
                          <p className="text-xs text-muted-foreground">{new Date(order.orderTime).toLocaleString("en-IN")}</p>
                          <p className="text-xs text-muted-foreground">Order #{order.id.slice(-6).toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₹{order.totalAmount}</p>
                          {isActive && (
                            <Badge className="bg-primary text-primary-foreground border-0 gap-1 mt-1">
                              <Timer className="w-3 h-3" /> {getEstimatedTime(order)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="text-sm text-muted-foreground mb-3">
                        {order.items.map((item, i) => (
                          <span key={i}>{item.name} × {item.qty}{i < order.items.length - 1 ? ", " : ""}</span>
                        ))}
                      </div>

                      {/* Status Tracker */}
                      <div className="flex items-center gap-1 mb-2">
                        {STATUS_STEPS.map((step, i) => (
                          <div key={step.key} className="flex items-center flex-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${i <= statusIdx ? "bg-emerald-500" : "bg-muted"}`}>
                              {i <= statusIdx ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`h-0.5 flex-1 mx-1 ${i < statusIdx ? "bg-emerald-500" : "bg-muted"}`} />
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {STATUS_STEPS[statusIdx]?.label} — {STATUS_STEPS[statusIdx]?.desc}
                      </p>

                      <Separator className="my-3" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>📍 Room {order.roomNumber}, {order.hostelName}</span>
                        <Badge variant="secondary">{order.paymentStatus === "paid" ? "✅ Paid" : "⏳ Pending"}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* ═══════════ REGISTER KITCHEN ═══════════ */}
        {view === "register" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">🧑‍🍳 Register as a Home Cook</h2>
              <p className="text-muted-foreground">Start serving homemade food to hostel students and earn</p>
            </div>
            {registerDone ? (
              <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8 text-emerald-600" /></div>
                <h3 className="text-xl font-bold text-foreground mb-2">Registration Submitted!</h3>
                <p className="text-muted-foreground mb-1">Thank you, <strong>{regForm.name}</strong>!</p>
                <p className="text-sm text-muted-foreground mb-6">Our team will verify your kitchen and get back within 2-3 business days.</p>
                <Button className="rounded-xl" onClick={() => { setView("browse"); setRegisterDone(false); }}>Back to Browse</Button>
              </CardContent></Card>
            ) : (
              <Card className="border-0 shadow-sm"><CardContent className="p-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2"><label className="text-sm font-medium">Kitchen Name *</label><Input placeholder="e.g. Amma's Kitchen" value={regForm.name} onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))} required className="rounded-xl" /></div>
                    <div className="space-y-2"><label className="text-sm font-medium">Phone *</label><Input placeholder="+91 XXXXX XXXXX" value={regForm.phone} onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))} required className="rounded-xl" /></div>
                    <div className="space-y-2"><label className="text-sm font-medium">Email *</label><Input type="email" placeholder="email@example.com" value={regForm.email} onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} required className="rounded-xl" /></div>
                    <div className="md:col-span-2 space-y-2"><label className="text-sm font-medium">Address *</label><Textarea placeholder="Full address" value={regForm.address} onChange={e => setRegForm(p => ({ ...p, address: e.target.value }))} required className="rounded-xl" rows={2} /></div>
                    <div className="md:col-span-2 space-y-2"><label className="text-sm font-medium">Speciality *</label><Input placeholder="South Indian, Thali..." value={regForm.speciality} onChange={e => setRegForm(p => ({ ...p, speciality: e.target.value }))} required className="rounded-xl" /></div>
                    <div className="space-y-2"><label className="text-sm font-medium">Available From</label><Input type="time" value={regForm.availableFrom} onChange={e => setRegForm(p => ({ ...p, availableFrom: e.target.value }))} className="rounded-xl" /></div>
                    <div className="space-y-2"><label className="text-sm font-medium">Available To</label><Input type="time" value={regForm.availableTo} onChange={e => setRegForm(p => ({ ...p, availableTo: e.target.value }))} className="rounded-xl" /></div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" className="rounded-xl" onClick={() => setView("browse")}>Cancel</Button>
                    <Button type="submit" className="rounded-xl gap-2" disabled={regLoading}>
                      {regLoading ? <><span className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" /> Submitting...</> : <><CheckCircle2 className="w-4 h-4" /> Submit</>}
                    </Button>
                  </div>
                </form>
              </CardContent></Card>
            )}
          </div>
        )}
      </main>

      {/* ═══════════ CHECKOUT DIALOG (Swiggy style) ═══════════ */}
      <Dialog open={showCheckout} onOpenChange={v => { if (!v) handleCheckoutClose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {checkoutStep === "done" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <ShoppingCart className="w-5 h-5 text-primary" />}
              {checkoutStep === "cart" ? "Checkout" : checkoutStep === "payment" ? "Processing Payment..." : "Order Confirmed!"}
            </DialogTitle>
          </DialogHeader>

          {/* STEP 1: Review Cart + Delivery */}
          {checkoutStep === "cart" && (
            <div className="space-y-4">
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {cart.map(c => (
                  <div key={c.item.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.item.name}</p>
                      <p className="text-xs text-muted-foreground">₹{c.item.price} × {c.qty}</p>
                    </div>
                    <span className="font-semibold text-sm">₹{c.item.price * c.qty}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{cartTotal}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span><span>{deliveryFee === 0 ? <span className="text-emerald-600">FREE</span> : `₹${deliveryFee}`}</span></div>
                <Separator />
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>₹{grandTotal}</span></div>
              </div>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Delivery Details</h4>
                <Input placeholder="Hostel / PG Name *" value={orderForm.hostelName} onChange={e => setOrderForm(p => ({ ...p, hostelName: e.target.value }))} required className="rounded-xl" />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Room No. *" value={orderForm.roomNumber} onChange={e => setOrderForm(p => ({ ...p, roomNumber: e.target.value }))} required className="rounded-xl" />
                  <Input placeholder="Phone *" value={orderForm.phone} onChange={e => setOrderForm(p => ({ ...p, phone: e.target.value }))} required className="rounded-xl" />
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Payment Method</h4>
                <div className="grid grid-cols-2 gap-2">
                  {(["UPI", "COD"] as const).map(m => (
                    <button key={m} onClick={() => setPaymentMethod(m)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${paymentMethod === m ? "border-primary bg-primary/5 text-primary" : "border-muted text-muted-foreground hover:border-primary/30"}`}>
                      {m === "UPI" ? <CreditCard className="w-4 h-4" /> : <IndianRupee className="w-4 h-4" />}
                      {m === "UPI" ? "UPI Payment" : "Cash on Delivery"}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full gradient-primary text-primary-foreground rounded-xl gap-2 h-12" disabled={!orderForm.hostelName || !orderForm.roomNumber || !orderForm.phone} onClick={handlePlaceOrder}>
                <CreditCard className="w-4 h-4" /> Pay ₹{grandTotal} & Place Order
              </Button>
            </div>
          )}

          {/* STEP 2: Payment Processing */}
          {checkoutStep === "payment" && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
              <p className="font-semibold text-lg">Processing Payment...</p>
              <p className="text-sm text-muted-foreground mt-1">₹{grandTotal} via {paymentMethod}</p>
              <div className="w-full h-1 bg-muted rounded-full mt-4 overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.5 }} />
              </div>
            </div>
          )}

          {/* STEP 3: Order Confirmed */}
          {checkoutStep === "done" && lastOrder && (
            <div className="text-center py-4">
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </motion.div>
              <h3 className="text-xl font-bold text-foreground mb-1">Order Confirmed! 🎉</h3>
              <p className="text-sm text-muted-foreground mb-1">Order #{lastOrder.id.slice(-6).toUpperCase()}</p>
              <p className="text-sm text-muted-foreground mb-4">
                ₹{lastOrder.totalAmount} • {paymentMethod === "UPI" ? "✅ Paid via UPI" : "💵 Cash on Delivery"}
              </p>

              <Card className="border-0 shadow-sm bg-muted/50 text-left mb-4">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2"><Timer className="w-4 h-4 text-primary" /> <span className="text-sm font-medium">Estimated delivery: 25-35 min</span></div>
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /> <span className="text-sm">Room {orderForm.roomNumber}, {orderForm.hostelName}</span></div>
                  <div className="flex items-center gap-2"><ChefHat className="w-4 h-4 text-muted-foreground" /> <span className="text-sm">Kitchen will prepare & deliver directly</span></div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={handleCheckoutClose}>Done</Button>
                <Button className="flex-1 rounded-xl gap-1" onClick={() => { handleCheckoutClose(); setView("orders"); loadOrders(); }}>
                  <Package className="w-4 h-4" /> Track Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FoodDelivery;