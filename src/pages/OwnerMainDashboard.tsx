import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Users, IndianRupee, TrendingUp, Plus, UserCheck, Bell, LogOut,
  LayoutDashboard, Home, ArrowRight, Star, MapPin, BedDouble, User,
  BarChart3, PieChart, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { propertyService, tenantService, profileService } from "@/lib/dataService";
import { useAuth } from "@/contexts/AuthContext";

const mockNotifications = [
  { id: "n1", text: "New booking request at Sunrise Student Haven", time: "2 hours ago", read: false },
  { id: "n2", text: "Rent payment received from Rahul Kumar — ₹5,500", time: "5 hours ago", read: false },
  { id: "n3", text: "Room 102-B maintenance completed at Urban Nest", time: "1 day ago", read: true },
  { id: "n4", text: "New tenant Pooja Nair joined GreenView PG", time: "2 days ago", read: true },
  { id: "n5", text: "Monthly revenue report generated", time: "3 days ago", read: true },
];

const OwnerMainDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState<"overview" | "properties" | "add" | "profile">("overview");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Read from persistent storage
  const ownerProperties = useMemo(() => propertyService.getAll(), []);
  const allTenants = useMemo(() => tenantService.getAll(), []);
  const ownerProfile = useMemo(() => profileService.getOwnerProfile(), []);

  // Aggregate stats
  const totalProperties = ownerProperties.length;
  const totalOccupied = ownerProperties.reduce((sum, p) => sum + p.occupiedBeds, 0);
  const totalBeds = ownerProperties.reduce((sum, p) => sum + p.totalBeds, 0);
  const totalRevenue = ownerProperties.reduce((sum, p) => sum + p.totalRevenue, 0);
  const totalDue = ownerProperties.reduce((sum, p) => sum + p.dueAmount, 0);
  const occupancyRate = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;
  const totalTenants = allTenants.length;

  const stats = [
    { label: "Total Properties", value: totalProperties.toString(), icon: Building2, color: "text-primary", bg: "bg-primary/10" },
    { label: "Total Tenants", value: totalTenants.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
    { label: "Overall Occupancy", value: `${occupancyRate}%`, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950" },
    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950" },
    { label: "Due Rent", value: `₹${totalDue.toLocaleString()}`, icon: IndianRupee, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Total Beds", value: `${totalOccupied}/${totalBeds}`, icon: BedDouble, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950" },
  ];

  const sidebarItems = [
    { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
    { id: "properties" as const, label: "My Properties", icon: Building2 },
    { id: "add" as const, label: "Add Property", icon: Plus },
    { id: "profile" as const, label: "Profile", icon: User },
  ];

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card shrink-0">
        <div className="p-6 border-b">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 font-bold text-xl text-foreground">
            <img src="/iconn.png" alt="HostelAI Logo" className="w-12 h-12 object-contain" />
            Residential Nexus
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "add") navigate("/owner/add-property");
                else if (item.id === "profile") navigate("/owner/profile");
                else setActiveSection(item.id);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeSection === item.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Button variant="outline" onClick={() => { logout(); navigate("/"); }} className="w-full rounded-xl gap-2">
            <LogOut className="w-4 h-4" /> Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header with Notification */}
        <header className="border-b bg-card px-4 md:px-8 py-3 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Welcome back, {ownerProfile?.fullName?.split(" ")[0] || "Owner"}! 👋
            </h1>
            <p className="text-sm text-muted-foreground">Here's your property portfolio overview</p>
          </div>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </Button>
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
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
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

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {/* Mobile nav */}
          <div className="flex lg:hidden gap-2 mb-6 overflow-x-auto pb-2">
            {sidebarItems.map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (item.id === "add") navigate("/owner/add-property");
                  else if (item.id === "profile") navigate("/owner/profile");
                  else setActiveSection(item.id);
                }}
                className="rounded-xl gap-1 shrink-0"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            ))}
          </div>

          {/* Stats Grid */}
          {(activeSection === "overview" || activeSection === "properties") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
            >
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
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
            </motion.div>
          )}

          {/* Overview Section */}
          {activeSection === "overview" && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Your Properties</h2>
                  <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={() => setActiveSection("properties")}>
                    View All <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ownerProperties.map((property, i) => {
                    const propOccupancy = property.totalBeds > 0 ? Math.round((property.occupiedBeds / property.totalBeds) * 100) : 0;
                    return (
                      <motion.div key={property.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <Card
                          className="overflow-hidden cursor-pointer hover:shadow-lg transition-all border-0 shadow-sm group"
                          onClick={() => navigate(`/owner/property/${property.id}`)}
                        >
                          <div className="relative h-40 overflow-hidden">
                            <img src={property.image} alt={property.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <Badge className="absolute top-3 right-3 bg-background/90 text-foreground backdrop-blur-sm">
                              <Star className="w-3 h-3 mr-1 text-yellow-500" /> {property.rating}
                            </Badge>
                            <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground">
                              {property.type.toUpperCase()}
                            </Badge>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-foreground text-lg">{property.name}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" /> {property.location}
                            </p>
                            <div className="mt-3 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Occupancy</span>
                                <span className="font-medium text-foreground">{property.occupiedBeds}/{property.totalBeds} beds</span>
                              </div>
                              <Progress value={propOccupancy} className="h-2" />
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                              <div className="bg-emerald-50 dark:bg-emerald-950 rounded-lg p-2 text-center">
                                <p className="font-semibold text-emerald-700 dark:text-emerald-400">₹{property.totalRevenue.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Revenue</p>
                              </div>
                              <div className="bg-destructive/10 rounded-lg p-2 text-center">
                                <p className="font-semibold text-destructive">₹{property.dueAmount.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Due</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card
                      className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 cursor-pointer transition-all flex items-center justify-center min-h-[320px]"
                      onClick={() => navigate("/owner/add-property")}
                    >
                      <CardContent className="text-center p-6">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <Plus className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground">Add New Property</h3>
                        <p className="text-sm text-muted-foreground mt-1">List a new hostel or PG</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" /> Revenue Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {ownerProperties.map((p) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.location}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">₹{p.totalRevenue.toLocaleString()}</p>
                          {p.dueAmount > 0 && (
                            <p className="text-xs text-destructive">₹{p.dueAmount.toLocaleString()} due</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-3 flex justify-between font-semibold">
                      <span className="text-foreground">Total</span>
                      <span className="text-foreground">₹{totalRevenue.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-primary" /> Occupancy Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {ownerProperties.map((p) => {
                      const occ = p.totalBeds > 0 ? Math.round((p.occupiedBeds / p.totalBeds) * 100) : 0;
                      return (
                        <div key={p.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-foreground font-medium">{p.name}</span>
                            <span className="text-muted-foreground">{p.occupiedBeds}/{p.totalBeds} beds ({occ}%)</span>
                          </div>
                          <Progress value={occ} className="h-2" />
                        </div>
                      );
                    })}
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-foreground">Overall</span>
                        <span className="text-muted-foreground">{totalOccupied}/{totalBeds} beds ({occupancyRate}%)</span>
                      </div>
                      <Progress value={occupancyRate} className="h-3" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { text: "New booking request at Sunrise Student Haven", time: "2 hours ago", color: "bg-blue-500" },
                      { text: "Rent payment received from Rahul Kumar — ₹5,500", time: "5 hours ago", color: "bg-emerald-500" },
                      { text: "Room 102-B maintenance completed at Urban Nest", time: "1 day ago", color: "bg-amber-500" },
                      { text: "New tenant Pooja Nair joined GreenView PG", time: "2 days ago", color: "bg-violet-500" },
                      { text: "Monthly revenue report generated", time: "3 days ago", color: "bg-primary" },
                    ].map((activity, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${activity.color}`} />
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{activity.text}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Properties List View */}
          {activeSection === "properties" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">All Properties</h2>
                <Button onClick={() => navigate("/owner/add-property")} className="rounded-xl gap-2">
                  <Plus className="w-4 h-4" /> Add Property
                </Button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownerProperties.map((property) => {
                  const propTenants = propertyTenants.filter(t => t.propertyId === property.id);
                  const propOccupancy = property.totalBeds > 0 ? Math.round((property.occupiedBeds / property.totalBeds) * 100) : 0;
                  return (
                    <Card
                      key={property.id}
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all border-0 shadow-sm"
                      onClick={() => navigate(`/owner/property/${property.id}`)}
                    >
                      <div className="relative h-44">
                        <img src={property.image} alt={property.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-3 left-3 text-white">
                          <h3 className="font-bold text-lg">{property.name}</h3>
                          <p className="text-sm opacity-90 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {property.location}
                          </p>
                        </div>
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          <div>
                            <p className="font-bold text-foreground">{propTenants.length}</p>
                            <p className="text-xs text-muted-foreground">Tenants</p>
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{property.totalRooms}</p>
                            <p className="text-xs text-muted-foreground">Rooms</p>
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{propOccupancy}%</p>
                            <p className="text-xs text-muted-foreground">Occupancy</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm text-emerald-600 font-semibold">₹{property.totalRevenue.toLocaleString()}</span>
                          <Button variant="ghost" size="sm" className="gap-1 text-primary">
                            View Dashboard <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OwnerMainDashboard;
