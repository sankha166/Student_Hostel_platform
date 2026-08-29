import { useState, useEffect } from "react";
import { AlertCircle, Plus, Clock, CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { complaintApi, residentApi, type Complaint, type Resident } from "@/lib/nexus";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["plumbing", "electrical", "cleaning", "furniture", "wifi", "food", "security", "other"];
const PRIORITY_COLORS: Record<string, string> = { low: "secondary", medium: "default", high: "default", critical: "destructive" };
const STATUS_COLORS: Record<string, any> = { open: "secondary", in_progress: "default", resolved: "default", closed: "secondary", escalated: "destructive" };

export default function ComplaintsTab({ propertyId }: { propertyId: string }) {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ residentId: "", category: "plumbing", title: "", description: "", priority: "medium" });

  const load = () => {
    Promise.all([complaintApi.byProperty(propertyId), residentApi.listByProperty(propertyId)])
      .then(([c, r]) => { setComplaints(c); setResidents(r); })
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, [propertyId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await complaintApi.create({ propertyId, residentId: form.residentId || undefined, category: form.category, title: form.title, description: form.description, priority: form.priority });
    setForm({ residentId: "", category: "plumbing", title: "", description: "", priority: "medium" });
    setShowCreate(false);
    load();
    toast({ title: "Complaint created!" });
  };

  const handleStatusChange = async (complaint: Complaint, status: string) => {
    await complaintApi.update(complaint.id, { status });
    load();
    toast({ title: `Status → ${status.replace("_", " ")}` });
  };

  const handleResolve = async (complaint: Complaint) => {
    const notes = prompt("Resolution notes?", "") || "";
    await complaintApi.update(complaint.id, { status: "resolved", resolutionNotes: notes });
    load();
    toast({ title: "Complaint resolved" });
  };

  if (loading) return <div className="py-12 text-center text-muted-foreground">Loading complaints...</div>;

  const open = complaints.filter(c => c.status === "open" || c.status === "in_progress").length;
  const breached = complaints.filter(c => c.slaBreached).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Badge variant="secondary" className="gap-1"><AlertCircle className="w-3 h-3" /> {open} open</Badge>
          {breached > 0 && <Badge variant="destructive" className="gap-1"><Clock className="w-3 h-3" /> {breached} SLA breached</Badge>}
        </div>
        <Button onClick={() => setShowCreate(true)} className="rounded-xl gap-2"><Plus className="w-4 h-4" /> New Complaint</Button>
      </div>

      {complaints.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No complaints yet</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {complaints.map(c => {
            const slaDeadline = new Date(c.slaDeadline);
            const slaRemaining = Math.round((slaDeadline.getTime() - Date.now()) / 3600000);
            return (
              <Card key={c.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{c.title}</h3>
                        <Badge variant={PRIORITY_COLORS[c.priority] as any} className="capitalize text-xs">{c.priority}</Badge>
                        <Badge variant={STATUS_COLORS[c.status]} className="capitalize text-xs">{c.status.replace("_", " ")}</Badge>
                        <Badge variant="outline" className="text-xs capitalize">{c.category}</Badge>
                        {c.slaBreached ? (
                          <Badge variant="destructive" className="text-xs gap-1"><Clock className="w-3 h-3" /> SLA breached</Badge>
                        ) : c.status !== "resolved" && c.status !== "closed" && (
                          <span className="text-xs text-muted-foreground">{slaRemaining > 0 ? `${slaRemaining}h remaining` : "Due now"}</span>
                        )}
                      </div>
                      {c.description && <p className="text-sm text-muted-foreground mt-1">{c.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {c.resident && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {c.resident.firstName} {c.resident.lastName}</span>}
                        <span>{new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        {c.resolutionNotes && <span className="text-emerald-600">✓ {c.resolutionNotes}</span>}
                      </div>
                      {c.status !== "resolved" && c.status !== "closed" && (
                        <div className="flex gap-2 mt-3">
                          {c.status === "open" && <Button size="sm" variant="outline" className="text-xs rounded-xl" onClick={() => handleStatusChange(c, "in_progress")}>Start</Button>}
                          {c.status === "in_progress" && <Button size="sm" variant="outline" className="text-xs rounded-xl" onClick={() => handleStatusChange(c, "escalated")}>Escalate</Button>}
                          <Button size="sm" className="text-xs rounded-xl gap-1" onClick={() => handleResolve(c)}><CheckCircle2 className="w-3 h-3" /> Resolve</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Complaint</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div><Label>Resident (optional)</Label>
              <Select value={form.residentId} onValueChange={v => setForm(p => ({ ...p, residentId: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select resident" /></SelectTrigger>
                <SelectContent>{residents.map(r => <SelectItem key={r.id} value={r.id}>{r.firstName} {r.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required className="rounded-xl" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="rounded-xl" rows={3} /></div>
            <div><Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent>
              </Select>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit" className="rounded-xl">Create</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
