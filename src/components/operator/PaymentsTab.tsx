import { useState, useEffect } from "react";
import { CreditCard, Plus, IndianRupee, CalendarClock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { paymentApi, residentApi, type Payment, type Resident } from "@/lib/nexus";
import { useToast } from "@/hooks/use-toast";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function PaymentsTab({ propertyId }: { propertyId: string }) {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecord, setShowRecord] = useState(false);
  const [form, setForm] = useState({ residentId: "", type: "rent", amount: "", paymentMethod: "cash", transactionId: "", notes: "" });

  const load = () => {
    Promise.all([paymentApi.byProperty(propertyId), residentApi.listByProperty(propertyId)])
      .then(([p, r]) => { setPayments(p); setResidents(r); })
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, [propertyId]);

  const totalCollected = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.paidAmount, 0);
  const totalPending = payments.filter(p => p.status === "pending" || p.status === "overdue").reduce((s, p) => s + (p.amount - p.paidAmount), 0);
  const overdueCount = payments.filter(p => p.status === "overdue").length;

  const handleGenerateRent = async () => {
    const now = new Date();
    const result = await paymentApi.generateRent(propertyId, { month: now.getMonth() + 1, year: now.getFullYear() });
    load();
    toast({ title: "Rent generated!", description: `${result.created} new rent record(s) created for ${MONTHS[now.getMonth()]} ${now.getFullYear()}` });
  };

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    await paymentApi.record({
      residentId: form.residentId, type: form.type, amount: Number(form.amount),
      dueDate: new Date().toISOString().slice(0, 10), paymentMethod: form.paymentMethod,
      transactionId: form.transactionId, notes: form.notes,
    });
    setForm({ residentId: "", type: "rent", amount: "", paymentMethod: "cash", transactionId: "", notes: "" });
    setShowRecord(false);
    load();
    toast({ title: "Payment recorded!" });
  };

  const handleMarkPaid = async (payment: Payment) => {
    await paymentApi.update(payment.id, { status: "paid", paymentMethod: "cash", transactionId: `CASH-${Date.now()}` });
    load();
    toast({ title: "Marked as paid" });
  };

  if (loading) return <div className="py-12 text-center text-muted-foreground">Loading payments...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-emerald-600" />
            </div>
            <div><p className="text-xl font-bold">₹{totalCollected.toLocaleString()}</p><p className="text-xs text-muted-foreground">Collected</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-destructive" />
            </div>
            <div><p className="text-xl font-bold">₹{totalPending.toLocaleString()}</p><p className="text-xs text-muted-foreground">Pending</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div><p className="text-xl font-bold">{overdueCount}</p><p className="text-xs text-muted-foreground">Overdue</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Payment Ledger</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateRent} className="rounded-xl gap-2">
            <Zap className="w-4 h-4" /> Generate Monthly Rent
          </Button>
          <Button onClick={() => setShowRecord(true)} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Record Payment
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resident</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.resident ? `${p.resident.firstName} ${p.resident.lastName || ""}` : "—"}</TableCell>
                  <TableCell className="capitalize">{p.type}</TableCell>
                  <TableCell>₹{p.amount.toLocaleString()}</TableCell>
                  <TableCell>{p.dueDate}</TableCell>
                  <TableCell>{p.paidDate || "—"}</TableCell>
                  <TableCell className="capitalize">{p.paymentMethod || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "paid" ? "default" : p.status === "overdue" ? "destructive" : "secondary"}>{p.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {p.status !== "paid" && (
                      <Button size="sm" variant="ghost" className="text-xs" onClick={() => handleMarkPaid(p)}>Mark Paid</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No payments yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showRecord} onOpenChange={setShowRecord}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <form onSubmit={handleRecord} className="space-y-3">
            <div><Label>Resident *</Label>
              <Select value={form.residentId} onValueChange={v => setForm(p => ({ ...p, residentId: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select resident" /></SelectTrigger>
                <SelectContent>{residents.map(r => <SelectItem key={r.id} value={r.id}>{r.firstName} {r.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Amount (₹) *</Label><Input type="number" min={0} value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required className="rounded-xl" /></div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="rent">Rent</SelectItem><SelectItem value="deposit">Deposit</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="mess">Mess</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Payment Method</Label>
              <Select value={form.paymentMethod} onValueChange={v => setForm(p => ({ ...p, paymentMethod: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="upi">UPI</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="card">Card</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Transaction ID</Label><Input value={form.transactionId} onChange={e => setForm(p => ({ ...p, transactionId: e.target.value }))} className="rounded-xl" /></div>
            <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="rounded-xl" /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowRecord(false)}>Cancel</Button><Button type="submit" className="rounded-xl">Record</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
