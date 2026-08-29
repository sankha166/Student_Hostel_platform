import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BedDouble, IndianRupee, AlertCircle, User, LogOut, CreditCard, MessageSquare, Home, Bell, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { residentPortalApi, type Resident, type Payment, type Complaint } from "@/lib/nexus";
import { useAuth } from "@/contexts/AuthContext";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [resident, setResident] = useState<Resident | null>(null);
  const [property, setProperty] = useState<any>(null);
  const [bed, setBed] = useState<any>(null);
  const [stay, setStay] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([residentPortalApi.profile(), residentPortalApi.payments(), residentPortalApi.complaints()])
      .then(([profile, pays, comps]) => {
        setResident(profile.resident);
        setProperty(profile.property);
        setBed(profile.bed);
        setStay(profile.activeStay);
        setPayments(pays);
        setComplaints(comps);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-12 h-12 border-4 border-primary border-r-transparent rounded-full animate-spin" /></div>;

  const pendingPayments = payments.filter(p => p.status === "pending" || p.status === "overdue");
  const nextDue = pendingPayments[0];
  const openComplaints = complaints.filter(c => c.status === "open" || c.status === "in_progress");

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass-card border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 font-bold text-xl text-foreground">
            <img src="/iconn.png" alt="Logo" className="w-8 h-8 object-contain" /> Residential Nexus
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/student/rent")} className="text-muted-foreground">My Rent</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/student/complaints")} className="text-muted-foreground">Complaints</Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/student/profile")} className="rounded-full bg-primary/10"><User size={18} className="text-primary" /></Button>
            <Button variant="ghost" size="icon" onClick={() => { logout(); navigate("/"); }}><LogOut size={18} /></Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">Hi, {user?.firstName}! 👋</h1>
          <p className="text-muted-foreground">Welcome to your resident portal</p>
        </motion.div>

        {!resident ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Home className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No accommodation assigned yet</h3>
              <p className="text-muted-foreground mb-4">Your property manager will assign you a bed. Once assigned, your details will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Top cards: My Room + Next Rent Due */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><BedDouble className="w-6 h-6 text-primary" /></div>
                      <div>
                        <p className="text-sm text-muted-foreground">My Room</p>
                        <p className="font-bold text-foreground">{bed ? `Bed ${bed.bedNumber} · Room ${bed.room.roomNumber}` : "Not assigned"}</p>
                      </div>
                    </div>
                    {property && (
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">{property.name}</p>
                        <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {property.address}</p>
                        {stay && <p>Rent: ₹{stay.rentAmount.toLocaleString()}/mo</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center"><IndianRupee className="w-6 h-6 text-destructive" /></div>
                      <div>
                        <p className="text-sm text-muted-foreground">Next Rent Due</p>
                        <p className="font-bold text-foreground">{nextDue ? `₹${nextDue.amount.toLocaleString()}` : "All paid 🎉"}</p>
                      </div>
                    </div>
                    {nextDue ? (
                      <>
                        <p className="text-sm text-muted-foreground">Due: {nextDue.dueDate}</p>
                        <Button size="sm" className="rounded-xl mt-3 gap-1" onClick={() => navigate("/student/rent")}><CreditCard className="w-3 h-3" /> Pay Now</Button>
                      </>
                    ) : (
                      <p className="text-sm text-emerald-600">No pending payments</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Pay Rent", icon: CreditCard, path: "/student/rent", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950" },
                { label: "Raise Complaint", icon: MessageSquare, path: "/student/complaints", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950" },
                { label: "My Profile", icon: User, path: "/student/profile", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
                { label: "Payment History", icon: IndianRupee, path: "/student/rent", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950" },
              ].map((a, i) => (
                <motion.button key={a.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(a.path)} className="text-left">
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center mb-2`}><a.icon className={`w-5 h-5 ${a.color}`} /></div>
                      <p className="text-sm font-medium">{a.label}</p>
                    </CardContent>
                  </Card>
                </motion.button>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><IndianRupee className="w-4 h-4 text-primary" /> Recent Payments</h3>
                  <div className="space-y-2">
                    {payments.slice(0, 4).map(p => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{p.notes || p.type}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">₹{p.amount.toLocaleString()}</span>
                          <Badge variant={p.status === "paid" ? "default" : p.status === "overdue" ? "destructive" : "secondary"} className="text-xs">{p.status}</Badge>
                        </div>
                      </div>
                    ))}
                    {payments.length === 0 && <p className="text-sm text-muted-foreground">No payments yet</p>}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-primary" /> Complaints</h3>
                  <div className="space-y-2">
                    {complaints.slice(0, 4).map(c => (
                      <div key={c.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate">{c.title}</span>
                        <Badge variant={c.status === "resolved" ? "default" : "secondary"} className="text-xs capitalize">{c.status.replace("_", " ")}</Badge>
                      </div>
                    ))}
                    {complaints.length === 0 && <p className="text-sm text-muted-foreground">No complaints raised</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {openComplaints.length > 0 && (
              <div className="mt-4">
                <Badge variant="secondary" className="gap-1"><Bell className="w-3 h-3" /> {openComplaints.length} open complaint(s)</Badge>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
