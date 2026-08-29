import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Users, TrendingUp, IndianRupee, Plus, BedDouble, UserCheck, AlertCircle, LogOut, Bell, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { dashboardApi } from "@/lib/nexus";
import { useAuth } from "@/contexts/AuthContext";

export default function OwnerMainDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.overview().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-r-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: "Properties", value: data?.totalProperties ?? 0, icon: Building2, color: "text-primary", bg: "bg-primary/10" },
    { label: "Active Residents", value: data?.activeResidents ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
    { label: "Occupancy", value: `${data?.occupancyRate ?? 0}%`, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950" },
    { label: "Collected", value: `₹${(data?.totalCollected ?? 0).toLocaleString()}`, icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950" },
    { label: "Pending", value: `₹${(data?.totalPending ?? 0).toLocaleString()}`, icon: IndianRupee, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Open Issues", value: data?.openComplaints ?? 0, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950" },
  ];

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "add", label: "Add Property", icon: Plus },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card shrink-0">
        <div className="p-6 border-b">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 font-bold text-xl text-foreground">
            <img src="/iconn.png" alt="Logo" className="w-12 h-12 object-contain" />
            Residential Nexus
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => (
            <button key={item.id} onClick={() => item.id === "add" && navigate("/owner/add-property")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted text-muted-foreground">
              <item.icon className="w-5 h-5" /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Button variant="outline" onClick={() => { logout(); navigate("/"); }} className="w-full rounded-xl gap-2">
            <LogOut className="w-4 h-4" /> Log Out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b bg-card px-4 md:px-8 py-3 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Welcome back, {user?.firstName}! 👋</h1>
            <p className="text-sm text-muted-foreground">Your property portfolio overview</p>
          </div>
          <Button onClick={() => navigate("/owner/add-property")} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Add Property
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
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
          </div>

          <h2 className="text-lg font-semibold text-foreground mb-4">Your Properties</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.properties ?? []).map((p: any, i: number) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-all border-0 shadow-sm" onClick={() => navigate(`/owner/property/${p.id}`)}>
                  {p.imageUrl && <div className="relative h-32 overflow-hidden">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground">{p.type?.toUpperCase()}</Badge>
                  </div>}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{p.city}</p>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Occupancy</span>
                        <span className="font-medium text-foreground">{p.occupiedBeds}/{p.totalBeds} beds</span>
                      </div>
                      <Progress value={p.occupancyRate} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            <Card className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 cursor-pointer transition-all flex items-center justify-center min-h-[200px]"
              onClick={() => navigate("/owner/add-property")}>
              <CardContent className="text-center p-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Add New Property</h3>
                <p className="text-sm text-muted-foreground mt-1">List a new hostel or PG</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
