import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, AlertCircle, Clock, CheckCircle2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { residentPortalApi, type Complaint } from "@/lib/nexus";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["plumbing", "electrical", "cleaning", "furniture", "wifi", "food", "security", "other"];
const STATUS_BADGE: Record<string, any> = { open: "secondary", in_progress: "default", resolved: "default", closed: "secondary", escalated: "destructive" };

export default function ResidentComplaints() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ category: "plumbing", title: "", description: "", priority: "medium" });

  const load = () => {
    residentPortalApi.complaints().then(setComplaints).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await residentPortalApi.createComplaint(form);
    setForm({ category: "plumbing", title: "", description: "", priority: "medium" });
    setShowCreate(false);
    load();
    toast({ title: "Complaint submitted!", description: "Your property manager has been notified." });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-12 h-12 border-4 border-primary border-r-transparent rounded-full animate-spin" /></div>;

  const open = complaints.filter(c => c.status === "open" || c.status === "in_progress").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/student")} className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="text-xl font-bold text-foreground">My Complaints</h1>
          {open > 0 && <Badge variant="secondary">{open} open</Badge>}
        </div>
        <Button onClick={() => setShowCreate(true)} className="rounded-xl gap-2"><Plus className="w-4 h-4" /> New Complaint</Button>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-8">
        {complaints.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No complaints yet. Need something fixed? Raise a complaint.</p>
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
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{c.title}</h3>
                          <Badge variant={STATUS_BADGE[c.status]} className="capitalize text-xs">{c.status.replace("_", " ")}</Badge>
                          <Badge variant="outline" className="capitalize text-xs">{c.category}</Badge>
                          <Badge variant="outline" className="capitalize text-xs">{c.priority}</Badge>
                        </div>
                        {c.description && <p className="text-sm text-muted-foreground mt-1">{c.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                          {c.status !== "resolved" && c.status !== "closed" && (
                            c.slaBreached
                              ? <Badge variant="destructive" className="text-xs gap-1"><Clock className="w-3 h-3" /> SLA breached</Badge>
                              : <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {slaRemaining > 0 ? `${slaRemaining}h remaining` : "Due now"}</span>
                          )}
                          {c.status === "resolved" && <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Resolved</span>}
                        </div>
                        {c.resolutionNotes && <div className="mt-2 text-xs bg-emerald-50 dark:bg-emerald-950 rounded-lg p-2 text-emerald-700 dark:text-emerald-400">Resolution: {c.resolutionNotes}</div>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Raise a Complaint</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div><Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Brief summary of the issue" required className="rounded-xl" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the issue in detail" className="rounded-xl" rows={3} /></div>
            <div><Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent>
              </Select>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit" className="rounded-xl">Submit</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
