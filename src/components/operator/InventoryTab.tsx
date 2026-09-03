import { useState, useEffect } from "react";
import { Building2, Plus, Trash2, BedDouble, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { inventoryApi, type Building, type Bed } from "@/lib/nexus";
import { useToast } from "@/hooks/use-toast";

const BED_STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-500", occupied: "bg-red-500", reserved: "bg-blue-500", maintenance: "bg-amber-500", blocked: "bg-gray-500",
};
const BED_STATUS_LABELS: Record<string, string> = {
  available: "Available", occupied: "Occupied", reserved: "Reserved", maintenance: "Maintenance", blocked: "Blocked",
};

export default function InventoryTab({ propertyId }: { propertyId: string }) {
  const { toast } = useToast();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showAddBuilding, setShowAddBuilding] = useState(false);
  const [newBuilding, setNewBuilding] = useState({ name: "", floorsCount: 1 });

  const load = () => {
    inventoryApi.hierarchy(propertyId).then(setBuildings).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, [propertyId]);

  const toggle = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const handleAddBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuilding.name) return;
    await inventoryApi.addBuilding(propertyId, { name: newBuilding.name, floorsCount: Number(newBuilding.floorsCount) });
    setNewBuilding({ name: "", floorsCount: 1 });
    setShowAddBuilding(false);
    load();
    toast({ title: "Building added!" });
  };

  const handleAddFloor = async (buildingId: string) => {
    const count = buildings.find(b => b.id === buildingId)?.floors.length ?? 0;
    await inventoryApi.addFloor(buildingId, { floorNumber: count + 1 });
    load();
    toast({ title: "Floor added!" });
  };

  const handleAddRoom = async (floorId: string) => {
    const num = prompt("Room number? (e.g. 101)");
    if (!num) return;
    const rent = Number(prompt("Monthly rent? (₹)", "4500") || "0");
    const deposit = Number(prompt("Deposit? (₹)", "9000") || "0");
    const type = prompt("Room type? (single/double/triple/dormitory)", "single") || "single";
    const bedCount = Number(prompt("Number of beds?", "1") || "1");
    await inventoryApi.addRoom(floorId, { roomNumber: num, roomType: type, rentAmount: rent, depositAmount: deposit });
    // Add beds
    const hierarchy = await inventoryApi.hierarchy(propertyId);
    const room = hierarchy.flatMap(b => b.floors).flatMap(f => f.rooms).find(r => r.roomNumber === num && r.floorId === floorId);
    if (room) {
      for (let i = 0; i < bedCount; i++) {
        await inventoryApi.addBed(room.id, { bedNumber: `${num}-${String.fromCharCode(65 + i)}`, bedType: "standard" });
      }
    }
    load();
    toast({ title: "Room added!", description: `${num} with ${bedCount} bed(s)` });
  };

  const handleBedStatus = async (bed: Bed) => {
    const newStatus = bed.status === "available" ? "maintenance" : bed.status === "maintenance" ? "blocked" : "available";
    await inventoryApi.updateBed(bed.id, { status: newStatus });
    load();
  };

  const handleDelete = async (type: "building" | "floor" | "room" | "bed", id: string) => {
    if (!confirm(`Delete this ${type}? This will also delete all items under it.`)) return;
    if (type === "building") await inventoryApi.deleteBuilding(id);
    else if (type === "floor") await inventoryApi.deleteFloor(id);
    else if (type === "room") await inventoryApi.deleteRoom(id);
    else await inventoryApi.deleteBed(id);
    load();
    toast({ title: "Deleted" });
  };

  if (loading) return <div className="py-12 text-center text-muted-foreground">Loading inventory...</div>;

  const totalBeds = buildings.flatMap(b => b.floors).flatMap(f => f.rooms).flatMap(r => r.beds).length;
  const occupiedBeds = buildings.flatMap(b => b.floors).flatMap(f => f.rooms).flatMap(r => r.beds).filter(b => b.status === "occupied").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Bed Inventory</h2>
          <p className="text-sm text-muted-foreground">{totalBeds} beds total · {occupiedBeds} occupied · {totalBeds - occupiedBeds} available</p>
        </div>
        <Button onClick={() => setShowAddBuilding(!showAddBuilding)} className="rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Add Building
        </Button>
      </div>

      {showAddBuilding && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <form onSubmit={handleAddBuilding} className="flex gap-3 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium">Building Name</label>
                <Input placeholder="e.g. Block A" value={newBuilding.name} onChange={e => setNewBuilding(p => ({ ...p, name: e.target.value }))} className="rounded-xl" required />
              </div>
              <div className="w-32 space-y-1">
                <label className="text-sm font-medium">Floors</label>
                <Input type="number" min={1} value={newBuilding.floorsCount} onChange={e => setNewBuilding(p => ({ ...p, floorsCount: Number(e.target.value) }))} className="rounded-xl" />
              </div>
              <Button type="submit" className="rounded-xl">Add</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {buildings.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No buildings yet. Add your first building to start managing beds.</p>
          </CardContent>
        </Card>
      ) : (
        buildings.map(building => (
          <Card key={building.id} className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <button onClick={() => toggle(building.id)}>
                    {expanded[building.id] !== false ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <Building2 className="w-4 h-4" /> {building.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => handleAddFloor(building.id)}>
                    <Plus className="w-3 h-3" /> Floor
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs text-destructive" onClick={() => handleDelete("building", building.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {expanded[building.id] !== false && (
              <CardContent className="space-y-3">
                {building.floors.map(floor => (
                  <div key={floor.id} className="border rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Floor {floor.floorNumber}{floor.name ? ` — ${floor.name}` : ""}</span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => handleAddRoom(floor.id)}>
                          <Plus className="w-3 h-3" /> Room
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs text-destructive" onClick={() => handleDelete("floor", floor.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {floor.rooms.map(room => (
                        <div key={room.id} className="bg-secondary/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <BedDouble className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-sm">Room {room.roomNumber}</span>
                              <Badge variant="outline" className="text-xs capitalize">{room.roomType}</Badge>
                              <span className="text-xs text-muted-foreground">₹{room.rentAmount.toLocaleString()}/mo</span>
                            </div>
                            <Button size="sm" variant="ghost" className="text-xs text-destructive" onClick={() => handleDelete("room", room.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {room.beds.map(bed => (
                              <button key={bed.id} onClick={() => handleBedStatus(bed)} title={`${bed.bedNumber} — ${BED_STATUS_LABELS[bed.status]}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:shadow-sm transition-shadow">
                                <span className={`w-2.5 h-2.5 rounded-full ${BED_STATUS_COLORS[bed.status]}`} />
                                {bed.bedNumber}
                                <span className="text-muted-foreground">{BED_STATUS_LABELS[bed.status]}</span>
                              </button>
                            ))}
                            {room.beds.length === 0 && <span className="text-xs text-muted-foreground">No beds</span>}
                          </div>
                        </div>
                      ))}
                      {floor.rooms.length === 0 && <p className="text-xs text-muted-foreground pl-4">No rooms on this floor</p>}
                    </div>
                  </div>
                ))}
                {building.floors.length === 0 && <p className="text-xs text-muted-foreground">No floors yet</p>}
              </CardContent>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
