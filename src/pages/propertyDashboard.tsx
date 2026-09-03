import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, LayoutDashboard, BedDouble, Users, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { dashboardApi, propertyApi } from "@/lib/nexus";
import InventoryTab from "@/components/operator/InventoryTab";
import ResidentsTab from "@/components/operator/ResidentsTab";
import PaymentsTab from "@/components/operator/PaymentsTab";
import ComplaintsTab from "@/components/operator/ComplaintsTab";

type Tab = "overview" | "inventory" | "residents" | "payments" | "complaints";

const TAB_ITEMS: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "inventory", label: "Inventory", icon: BedDouble },
  { id: "residents", label: "Residents", icon: Users },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "complaints", label: "Complaints", icon: AlertCircle },
];

export default function PropertyDashboard() {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();
  const [tab, setTab] = useState<Tab>("overview");
  const [property, setProperty] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) return;
    Promise.all([propertyApi.get(propertyId), dashboardApi.property(propertyId)])
      .then(([p, s]) => { setProperty(p); setStats(s); })
      .catch(console.error).finally(() => setLoading(false));
  }, [propertyId, tab === "overview"]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-12 h-12 border-4 border-primary border-r-transparent rounded-full animate-spin" /></div>;
  if (!property) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
        <Button onClick={() => navigate("/owner")} className="rounded-xl gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
      </div>
    </div>
  );

  const tabItems = TAB_ITEMS;

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card shrink-0">
        <div className="p-6 border-b">
          <button onClick={() => navigate("/owner")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Properties
          </button>
          <h2 className="font-bold text-foreground text-sm truncate">{property.name}</h2>
          <p className="text-xs text-muted-foreground truncate">{property.city}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {tabItems.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === item.id ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted text-muted-foreground"}`}>
              <item.icon className="w-5 h-5" /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b bg-card px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/owner")} className="rounded-xl lg:hidden"><ArrowLeft className="w-5 h-5" /></Button>
            <h1 className="text-lg font-semibold text-foreground">{tabItems.find(t => t.id === tab)?.label}</h1>
          </div>
        </header>

        <div className="flex lg:hidden gap-2 overflow-x-auto p-4 pb-2">
          {tabItems.map(item => (
            <Button key={item.id} variant={tab === item.id ? "default" : "outline"} size="sm" onClick={() => setTab(item.id)} className="rounded-xl gap-1 shrink-0 text-xs">
              <item.icon className="w-3 h-3" /> {item.label}
            </Button>
          ))}
        </div>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {tab === "overview" && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: "Total Beds", value: stats.totalBeds, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950", icon: BedDouble },
                  { label: "Occupied", value: stats.occupiedBeds, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950", icon: BedDouble },
                  { label: "Available", value: stats.availableBeds, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950", icon: BedDouble },
                  { label: "Collected", value: `₹${stats.totalCollected.toLocaleString()}`, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950", icon: CreditCard },
                  { label: "Pending", value: `₹${stats.totalPending.toLocaleString()}`, color: "text-destructive", bg: "bg-destructive/10", icon: CreditCard },
                ].map((s, i) => (
                  <Card key={i} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                        <s.icon className={`w-5 h-5 ${s.color}`} />
                      </div>
                      <p className="text-xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Occupancy Rate</span>
                    <span className="text-muted-foreground">{stats.occupiedBeds}/{stats.totalBeds} beds ({stats.occupancyRate}%)</span>
                  </div>
                  <Progress value={stats.occupancyRate} className="h-3" />
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div><span className="text-muted-foreground">Active Residents: </span><span className="font-medium">{stats.activeResidents}</span></div>
                    <div><span className="text-muted-foreground">Open Complaints: </span><span className="font-medium">{stats.openComplaints}</span></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {tab === "inventory" && <InventoryTab propertyId={propertyId!} />}
          {tab === "residents" && <ResidentsTab propertyId={propertyId!} />}
          {tab === "payments" && <PaymentsTab propertyId={propertyId!} />}
          {tab === "complaints" && <ComplaintsTab propertyId={propertyId!} />}
        </main>
      </div>
    </div>
  );
}
