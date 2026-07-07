import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UtensilsCrossed, Star, Clock, MapPin, Phone, Mail, Search,
  ShoppingCart, Plus, Minus, ChefHat, Leaf, CheckCircle2,
  ArrowLeft, Home, User, Store, FileText, Truck, X, BadgeCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { foodService, type FoodProvider, type FoodItem } from "@/lib/dataService";
import { categoryLabels } from "@/data/foodDeliveryData";

type View = "browse" | "provider" | "register" | "cart";

interface CartItem {
  item: FoodItem;
  qty: number;
}

const FoodDelivery = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("browse");
  const [selectedProvider, setSelectedProvider] = useState<FoodProvider | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<FoodItem["category"] | "all">("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [orderForm, setOrderForm] = useState({ hostelName: "", roomNumber: "", phone: "", notes: "" });

  // Register form
  const [regForm, setRegForm] = useState({
    name: "", phone: "", email: "", address: "", speciality: "",
    availableFrom: "08:00", availableTo: "20:00", deliveryRadius: "5"
  });

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [registerDone, setRegisterDone] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  // Load from persistent storage
  const allProviders = useMemo(() => foodService.getProviders(), []);

  const filteredProviders = allProviders.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.speciality.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const providerItems = useMemo(() => {
    if (!selectedProvider) return [];
    let items = foodService.getItems(selectedProvider.id);
    if (categoryFilter !== "all") items = items.filter(i => i.category === categoryFilter);
    return items;
  }, [selectedProvider, categoryFilter]);

  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

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

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderLoading(true);
    await new Promise(r => setTimeout(r, 800));
    // Persist order to storage
    if (selectedProvider) {
      foodService.placeOrder({
        studentId: "",
        studentName: "",
        providerId: selectedProvider.id,
        providerName: selectedProvider.name,
        items: cart.map(c => ({ itemId: c.item.id, name: c.item.name, qty: c.qty, price: c.item.price })),
        totalAmount: cartTotal,
        hostelName: orderForm.hostelName,
        roomNumber: orderForm.roomNumber,
      });
    }
    setOrderLoading(false);
    setOrderPlaced(true);
  };

  const handleOrderClose = () => {
    setShowOrderDialog(false);
    setOrderPlaced(false);
    setCart([]);
    setOrderForm({ hostelName: "", roomNumber: "", phone: "", notes: "" });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    await new Promise(r => setTimeout(r, 800));
    // Persist cook registration to storage
    foodService.registerProvider({
      name: regForm.name,
      phone: regForm.phone,
      email: regForm.email,
      address: regForm.address,
      speciality: regForm.speciality,
      image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=300&h=200&fit=crop",
      availableFrom: regForm.availableFrom,
      availableTo: regForm.availableTo,
      deliveryRadius: `${regForm.deliveryRadius} km`,
    });
    setRegLoading(false);
    setRegisterDone(true);
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
              }}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <button onClick={() => navigate("/")} className="flex items-center gap-2 font-bold text-lg text-foreground">
              <img src="/iconn.png" alt="HostelAI Logo" className="w-8 h-8 object-contain" />
                Home Delivery
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={() => setView("register")}>
              <ChefHat className="w-4 h-4" /> Register Your Kitchen
            </Button>
            {cartCount > 0 && (
              <Button size="sm" className="rounded-xl gap-1 relative" onClick={() => setShowOrderDialog(true)}>
                <ShoppingCart className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center font-bold">{cartCount}</span>
                ₹{cartTotal}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Browse Providers */}
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
                      {prov.isVerified && (
                        <Badge className="absolute top-3 right-3 gap-1 bg-emerald-600">
                          <BadgeCheck className="w-3 h-3" /> Verified
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{prov.name}</h3>
                          <p className="text-sm text-muted-foreground">{prov.speciality}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950 px-2 py-1 rounded-lg">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{prov.rating}</span>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-3">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {prov.availableFrom}–{prov.availableTo}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {prov.deliveryRadius}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{prov.totalOrders} orders completed</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Provider Menu */}
        {view === "provider" && selectedProvider && (
          <div className="space-y-6">
            {/* Provider Info */}
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
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedProvider.availableFrom}–{selectedProvider.availableTo}</span>
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
                            <Badge variant="outline" className="text-xs">{categoryLabels[item.category]}</Badge>
                          </div>
                          <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-foreground">₹{item.price}</span>
                          {qty === 0 ? (
                            <Button size="sm" variant="outline" className="rounded-xl gap-1 h-8 text-xs" onClick={() => addToCart(item)}>
                              <Plus className="w-3 h-3" /> Add
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button size="icon" variant="outline" className="h-7 w-7 rounded-lg" onClick={() => removeFromCart(item.id)}><Minus className="w-3 h-3" /></Button>
                              <span className="text-sm font-semibold w-4 text-center">{qty}</span>
                              <Button size="icon" className="h-7 w-7 rounded-lg" onClick={() => addToCart(item)}><Plus className="w-3 h-3" /></Button>
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
                  <UtensilsCrossed className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No items in this category</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Register as Cook */}
        {view === "register" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">🧑‍🍳 Register as a Home Cook</h2>
              <p className="text-muted-foreground">Start serving homemade food to hostel students and earn</p>
            </div>

            {registerDone ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Registration Submitted!</h3>
                  <p className="text-muted-foreground mb-1">Thank you, <strong>{regForm.name}</strong>!</p>
                  <p className="text-sm text-muted-foreground mb-6">Our team will verify your kitchen details and get back to you within 2-3 business days.</p>
                  <Button className="rounded-xl" onClick={() => { setView("browse"); setRegisterDone(false); setRegForm({ name: "", phone: "", email: "", address: "", speciality: "", availableFrom: "08:00", availableTo: "20:00", deliveryRadius: "5" }); }}>
                    Back to Browse
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-foreground">Kitchen / Business Name *</label>
                        <Input placeholder="e.g. Amma's Kitchen" value={regForm.name} onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))} required className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Phone Number *</label>
                        <Input placeholder="+91 XXXXX XXXXX" value={regForm.phone} onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))} required className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Email *</label>
                        <Input type="email" placeholder="email@example.com" value={regForm.email} onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} required className="rounded-xl" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-foreground">Kitchen Address *</label>
                        <Textarea placeholder="Full address of your kitchen" value={regForm.address} onChange={e => setRegForm(p => ({ ...p, address: e.target.value }))} required className="rounded-xl" rows={2} />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-foreground">Speciality / Cuisine *</label>
                        <Input placeholder="e.g. South Indian, North Indian Thali, Healthy Food..." value={regForm.speciality} onChange={e => setRegForm(p => ({ ...p, speciality: e.target.value }))} required className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Available From *</label>
                        <Input type="time" value={regForm.availableFrom} onChange={e => setRegForm(p => ({ ...p, availableFrom: e.target.value }))} required className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Available To *</label>
                        <Input type="time" value={regForm.availableTo} onChange={e => setRegForm(p => ({ ...p, availableTo: e.target.value }))} required className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Delivery Radius (km) *</label>
                        <Input type="number" min={1} max={20} placeholder="e.g. 5" value={regForm.deliveryRadius} onChange={e => setRegForm(p => ({ ...p, deliveryRadius: e.target.value }))} required className="rounded-xl" />
                      </div>
                    </div>
                    <Separator />
                    <div className="bg-muted/50 rounded-xl p-4">
                      <h4 className="font-medium text-foreground text-sm mb-2">📋 What happens next?</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Our team will verify your kitchen details</li>
                        <li>• Once approved, you can add your menu items</li>
                        <li>• Start receiving orders from hostel students</li>
                        <li>• Payments are settled weekly to your account</li>
                      </ul>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" className="rounded-xl" onClick={() => setView("browse")}>Cancel</Button>
                      <Button type="submit" className="rounded-xl gap-2" disabled={regLoading}>
                        {regLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                            Submitting...
                          </span>
                        ) : (
                          <><CheckCircle2 className="w-4 h-4" /> Submit Registration</>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={v => { if (!v) handleOrderClose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" /> Your Order
            </DialogTitle>
            <DialogDescription>Review items and enter delivery details</DialogDescription>
          </DialogHeader>
          {orderPlaced ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Order Placed!</h3>
              <p className="text-sm text-muted-foreground mb-1">
                Your order of ₹{cartTotal} has been sent to <strong>{selectedProvider?.name}</strong>.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Delivery to Room {orderForm.roomNumber}, {orderForm.hostelName}
              </p>
              <Button className="w-full rounded-xl" onClick={handleOrderClose}>Done</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {cart.map(c => (
                  <div key={c.item.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.item.name}</p>
                      <p className="text-xs text-muted-foreground">₹{c.item.price} × {c.qty}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">₹{c.item.price * c.qty}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeFromCart(c.item.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-foreground">
                <span>Total</span><span>₹{cartTotal}</span>
              </div>
              <Separator />
              <form onSubmit={handlePlaceOrder} className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Hostel / PG Name *</label>
                  <Input placeholder="e.g. Sunrise Student Haven" value={orderForm.hostelName} onChange={e => setOrderForm(p => ({ ...p, hostelName: e.target.value }))} required className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Room No. *</label>
                    <Input placeholder="e.g. 101-A" value={orderForm.roomNumber} onChange={e => setOrderForm(p => ({ ...p, roomNumber: e.target.value }))} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Phone *</label>
                    <Input placeholder="+91 XXXXX" value={orderForm.phone} onChange={e => setOrderForm(p => ({ ...p, phone: e.target.value }))} required className="rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Special Instructions</label>
                  <Textarea placeholder="Dietary preferences or delivery notes..." value={orderForm.notes} onChange={e => setOrderForm(p => ({ ...p, notes: e.target.value }))} className="rounded-xl" rows={2} />
                </div>
                <Button type="submit" className="w-full rounded-xl gap-2" disabled={orderLoading}>
                  {orderLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                      Placing Order...
                    </span>
                  ) : (
                    <><Truck className="w-4 h-4" /> Place Order — ₹{cartTotal}</>
                  )}
                </Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FoodDelivery;