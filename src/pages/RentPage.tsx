import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, IndianRupee, CheckCircle2, Clock, Download, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { residentPortalApi, type Payment } from "@/lib/nexus";
import { useToast } from "@/hooks/use-toast";

export default function RentPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payTarget, setPayTarget] = useState<Payment | null>(null);
  const [method, setMethod] = useState("upi");

  const load = () => {
    residentPortalApi.payments().then(setPayments).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handlePay = async () => {
    if (!payTarget) return;
    await residentPortalApi.payPayment(payTarget.id, { paymentMethod: method, transactionId: `${method.toUpperCase()}-${Date.now()}` });
    setPayTarget(null);
    load();
    toast({ title: "Payment successful!", description: `₹${payTarget.amount.toLocaleString()} paid via ${method.toUpperCase()}` });
  };

  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.paidAmount, 0);
  const totalDue = payments.filter(p => p.status !== "paid").reduce((s, p) => s + p.amount, 0);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-12 h-12 border-4 border-primary border-r-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 md:px-8 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/student")} className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
        <h1 className="text-xl font-bold text-foreground">Rent & Payments</h1>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
              <div><p className="text-2xl font-bold">₹{totalPaid.toLocaleString()}</p><p className="text-sm text-muted-foreground">Total Paid</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center"><Clock className="w-6 h-6 text-destructive" /></div>
              <div><p className="text-2xl font-bold">₹{totalDue.toLocaleString()}</p><p className="text-sm text-muted-foreground">Total Due</p></div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.notes || p.type}</TableCell>
                    <TableCell>₹{p.amount.toLocaleString()}</TableCell>
                    <TableCell>{p.dueDate}</TableCell>
                    <TableCell>{p.paidDate || "—"}</TableCell>
                    <TableCell><Badge variant={p.status === "paid" ? "default" : p.status === "overdue" ? "destructive" : "secondary"}>{p.status}</Badge></TableCell>
                    <TableCell>
                      {p.status !== "paid" ? (
                        <Button size="sm" className="rounded-xl gap-1" onClick={() => setPayTarget(p)}><CreditCard className="w-3 h-3" /> Pay</Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="rounded-xl gap-1" onClick={() => toast({ title: "Receipt", description: `Transaction: ${p.transactionId}` })}><Download className="w-3 h-3" /> Receipt</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payments yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!payTarget} onOpenChange={() => setPayTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Pay Rent</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-secondary rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="text-3xl font-bold text-foreground">₹{payTarget?.amount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{payTarget?.notes}</p>
            </div>
            <div><Label>Payment Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="upi">UPI</SelectItem><SelectItem value="card">Card</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)}>Cancel</Button>
            <Button onClick={handlePay} className="rounded-xl gap-2"><IndianRupee className="w-4 h-4" /> Pay ₹{payTarget?.amount.toLocaleString()}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
