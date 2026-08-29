import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { propertyApi, inventoryApi } from "@/lib/nexus";
import { AMENITY_OPTIONS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

export default function AddProperty() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", type: "hostel", address: "", city: "", state: "Karnataka", pincode: "",
    contactPhone: "", contactEmail: "", imageUrl: "", amenities: [] as string[],
  });
  // Inventory setup
  const [buildingName, setBuildingName] = useState("Main Building");
  const [floorCount, setFloorCount] = useState(2);
  const [roomsPerFloor, setRoomsPerFloor] = useState(3);
  const [bedsPerRoom, setBedsPerRoom] = useState(2);
  const [baseRent, setBaseRent] = useState(4500);

  const toggleAmenity = (a: string) => {
    setForm(p => ({ ...p, amenities: p.amenities.includes(a) ? p.amenities.filter(x => x !== a) : [...p.amenities, a] }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Create property
      const property = await propertyApi.create({
        name: form.name, type: form.type, address: form.address, city: form.city,
        state: form.state, pincode: form.pincode, contactPhone: form.contactPhone,
        contactEmail: form.contactEmail, imageUrl: form.imageUrl || undefined,
        amenities: form.amenities,
      });

      // 2. Create building + floors + rooms + beds
      const building = await inventoryApi.addBuilding(property.id, { name: buildingName, floorsCount: floorCount });
      for (let f = 1; f <= floorCount; f++) {
        const floor = await inventoryApi.addFloor(building.id, { floorNumber: f, name: `Floor ${f}` });
        for (let r = 1; r <= roomsPerFloor; r++) {
          const roomNum = `${f}${String(r).padStart(2, "0")}`;
          const room = await inventoryApi.addRoom(floor.id, {
            roomNumber: roomNum, roomType: bedsPerRoom === 1 ? "single" : bedsPerRoom === 2 ? "double" : "triple",
            rentAmount: baseRent + (f - 1) * 500, depositAmount: (baseRent + (f - 1) * 500) * 2,
            amenities: ["Wi-Fi"],
          });
          for (let b = 0; b < bedsPerRoom; b++) {
            await inventoryApi.addBed(room.id, { bedNumber: `${roomNum}-${String.fromCharCode(65 + b)}`, bedType: "standard" });
          }
        }
      }

      toast({ title: "Property created!", description: `${form.name} with ${floorCount * roomsPerFloor * bedsPerRoom} beds` });
      navigate(`/owner/property/${property.id}`);
    } catch (err) {
      toast({ title: "Failed to create property", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 md:px-8 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/owner")} className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
        <h1 className="text-xl font-bold text-foreground">Add New Property</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{s}</div>
              {s < 3 && <div className={`w-16 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Property Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Property Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Sunrise Student Haven" className="rounded-xl" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Type</Label>
                    <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="hostel">Hostel</SelectItem><SelectItem value="pg">PG</SelectItem><SelectItem value="coliving">Co-Living</SelectItem><SelectItem value="dormitory">Dormitory</SelectItem><SelectItem value="workforce">Workforce Housing</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Pincode</Label><Input value={form.pincode} onChange={e => setForm(p => ({ ...p, pincode: e.target.value }))} className="rounded-xl" /></div>
                </div>
                <div><Label>Full Address *</Label><Textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Complete property address" className="rounded-xl" rows={2} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>City *</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className="rounded-xl" /></div>
                  <div><Label>State *</Label><Input value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} className="rounded-xl" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Contact Phone</Label><Input value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))} className="rounded-xl" /></div>
                  <div><Label>Contact Email</Label><Input type="email" value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} className="rounded-xl" /></div>
                </div>
                <div><Label>Amenities</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {AMENITY_OPTIONS.map(a => (
                      <button key={a} type="button" onClick={() => toggleAmenity(a)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.amenities.includes(a) ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-transparent"}`}>{a}</button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end pt-2"><Button disabled={!form.name || !form.address || !form.city} onClick={() => setStep(2)} className="rounded-xl">Next: Inventory Setup →</Button></div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Inventory Setup</CardTitle>
                <CardDescription>Quickly set up buildings, floors, rooms and beds. You can fine-tune later.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Building Name</Label><Input value={buildingName} onChange={e => setBuildingName(e.target.value)} className="rounded-xl" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Number of Floors</Label><Input type="number" min={1} value={floorCount} onChange={e => setFloorCount(Number(e.target.value))} className="rounded-xl" /></div>
                  <div><Label>Rooms per Floor</Label><Input type="number" min={1} value={roomsPerFloor} onChange={e => setRoomsPerFloor(Number(e.target.value))} className="rounded-xl" /></div>
                  <div><Label>Beds per Room</Label><Input type="number" min={1} max={4} value={bedsPerRoom} onChange={e => setBedsPerRoom(Number(e.target.value))} className="rounded-xl" /></div>
                  <div><Label>Base Rent (₹/month)</Label><Input type="number" min={0} value={baseRent} onChange={e => setBaseRent(Number(e.target.value))} className="rounded-xl" /></div>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">This will create {floorCount * roomsPerFloor * bedsPerRoom} beds</p>
                    <p className="text-muted-foreground">{floorCount} floors × {roomsPerFloor} rooms × {bedsPerRoom} beds in "{buildingName}"</p>
                  </div>
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">← Back</Button>
                  <Button onClick={() => setStep(3)} className="rounded-xl">Review →</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Review & Create</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Name</span><span className="font-medium">{form.name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Type</span><span className="font-medium capitalize">{form.type}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Address</span><span className="font-medium text-right">{form.address}, {form.city}, {form.state}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Building</span><span className="font-medium">{buildingName}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Beds</span><span className="font-medium">{floorCount * roomsPerFloor * bedsPerRoom}</span></div>
                  <div className="flex justify-wrap gap-1 pt-2">{form.amenities.map(a => <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>)}</div>
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">← Back</Button>
                  <Button onClick={handleSubmit} disabled={loading} className="rounded-xl gap-2">
                    {loading ? <><span className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" /> Creating...</> : <><CheckCircle2 className="w-4 h-4" /> Create Property</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
