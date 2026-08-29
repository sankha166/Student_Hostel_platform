import { useState, useEffect } from "react";
import { Users, Plus, Search, Phone, Mail, BedDouble, UserPlus, LogOut, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { residentApi, stayApi, inventoryApi, type Resident, type Bed } from "@/lib/nexus";
import { useToast } from "@/hooks/use-toast";

export default function ResidentsTab({ propertyId }: { propertyId: string }) {
  const { toast } = useToast();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showAllocate, setShowAllocate] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", gender: "", occupation: "student",
    institution: "", emergencyName: "", emergencyPhone: "", idType: "aadhaar", idNumber: "",
  });

  const load = () => {
    residentApi.listByProperty(propertyId).then(setResidents).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, [propertyId]);

  const filtered = residents.filter(r => {
    const q = search.toLowerCase();
    return !q || `${r.firstName} ${r.lastName || ""}`.toLowerCase().includes(q) || r.phone.includes(q) || (r.email || "").toLowerCase().includes(q);
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await residentApi.create(propertyId, form);
    setForm({ firstName: "", lastName: "", email: "", phone: "", gender: "", occupation: "student", institution: "", emergencyName: "", emergencyPhone: "", idType: "aadhaar", idNumber: "" });
    setShowAdd(false);
    load();
    toast({ title: "Resident added!" });
  };

  const openAllocate = async (resident: Resident) => {
    setSelectedResident(resident);
    const beds = await inventoryApi.availableBeds(propertyId);
    setAvailableBeds(beds);
    setShowAllocate(true);
  };

  const handleAllocate = async (bedId: string) => {
    if (!selectedResident) return;
    const bed = availableBeds.find(b => b.id === bedId);
    if (!bed) return;
    await stayApi.allocate({
      residentId: selectedResident.id, bedId,
      checkInDate: new Date().toISOString().slice(0, 10),
      rentAmount: (bed as any).room?.rentAmount ?? 4500,
      depositAmount: (bed as any).room?.depositAmount ?? 0,
    });
    setShowAllocate(false);
    setSelectedResident(null);
    load();
    toast({ title: "Bed allocated!", description: `${selectedResident.firstName} assigned to ${bed.bedNumber}` });
  };

  const handleCheckOut = async (resident: Resident) => {
    if (!resident.bed) return;
    if (!confirm(`Check out ${resident.firstName}? Bed will be freed.`)) return;
    const stays = await stayApi.byResident(resident.id);
    const active = stays.find(s => s.status === "active");
    if (active) {
      await stayApi.checkOut(active.id, { depositStatus: "refunded" });
      load();
      toast({ title: "Checked out", description: "Bed has been freed." });
    }
  };

  if (loading) return <div className="py-12 text-center text-muted-foreground">Loading residents...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, phone, email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
        </div>
        <Badge variant="outline">{filtered.length} residents</Badge>
        <Button onClick={() => setShowAdd(true)} className="rounded-xl gap-2">
          <UserPlus className="w-4 h-4" /> Add Resident
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Bed</TableHead>
                <TableHead>Occupation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{r.firstName.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{r.firstName} {r.lastName}</p>
                        {r.email && <p className="text-xs text-muted-foreground">{r.email}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><span className="flex items-center gap-1 text-sm"><Phone className="w-3 h-3" /> {r.phone}</span></TableCell>
                  <TableCell>
                    {r.bed ? <Badge variant="secondary">{r.bed.bedNumber} · Rm {r.bed.room.roomNumber}</Badge> : <Badge variant="outline">Unassigned</Badge>}
                  </TableCell>
                  <TableCell className="capitalize">{r.occupation?.replace("_", " ") || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "active" ? "default" : r.status === "checked_out" ? "secondary" : "destructive"}>{r.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {!r.bed && (
                        <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => openAllocate(r)}>
                          <BedDouble className="w-3 h-3" /> Allocate
                        </Button>
                      )}
                      {r.bed && r.status === "active" && (
                        <Button size="sm" variant="ghost" className="text-xs gap-1 text-destructive" onClick={() => handleCheckOut(r)}>
                          <LogOut className="w-3 h-3" /> Check Out
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No residents found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Resident Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New Resident</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First Name *</Label><Input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} required className="rounded-xl" /></div>
              <div><Label>Last Name</Label><Input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>Phone *</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required className="rounded-xl" /></div>
              <div><Label>Gender</Label>
                <Select value={form.gender} onValueChange={v => setForm(p => ({ ...p, gender: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Occupation</Label>
                <Select value={form.occupation} onValueChange={v => setForm(p => ({ ...p, occupation: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="student">Student</SelectItem><SelectItem value="working_professional">Working Professional</SelectItem><SelectItem value="trainee">Trainee</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Institution/Company</Label><Input value={form.institution} onChange={e => setForm(p => ({ ...p, institution: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>ID Type</Label>
                <Select value={form.idType} onValueChange={v => setForm(p => ({ ...p, idType: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="aadhaar">Aadhaar</SelectItem><SelectItem value="passport">Passport</SelectItem><SelectItem value="driving_license">Driving License</SelectItem><SelectItem value="voter_id">Voter ID</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>ID Number</Label><Input value={form.idNumber} onChange={e => setForm(p => ({ ...p, idNumber: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>Emergency Contact</Label><Input value={form.emergencyName} onChange={e => setForm(p => ({ ...p, emergencyName: e.target.value }))} placeholder="Name" className="rounded-xl" /></div>
              <div><Label>Emergency Phone</Label><Input value={form.emergencyPhone} onChange={e => setForm(p => ({ ...p, emergencyPhone: e.target.value }))} className="rounded-xl" /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" className="rounded-xl">Add Resident</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Allocate Bed Dialog */}
      <Dialog open={showAllocate} onOpenChange={setShowAllocate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Allocate Bed — {selectedResident?.firstName}</DialogTitle></DialogHeader>
          {availableBeds.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No available beds. Add beds in the Inventory tab first.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {availableBeds.map(bed => (
                <button key={bed.id} onClick={() => handleAllocate(bed.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-4 h-4 text-primary" />
                    <span className="font-medium">{bed.bedNumber}</span>
                    <span className="text-sm text-muted-foreground">Room {(bed as any).room?.roomNumber}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">₹{(bed as any).room?.rentAmount.toLocaleString()}/mo</span>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
