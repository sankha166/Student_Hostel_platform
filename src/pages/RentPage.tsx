import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, Clock, CreditCard, Download, IndianRupee,
  Copy, Check, ExternalLink, Home, FileText, Calendar, Shield, AlertCircle,
  MapPin, BedDouble, User, Phone, Banknote, Receipt
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { rentService, bookingAgreementService, paymentAccountService, type RentPayment, type RoomBooking } from "@/lib/dataService";
import { generateUPILink, getQRCodeHTML } from "@/lib/qrcode";
import { downloadReceipt } from "@/lib/receiptGenerator";

type TabType = "overview" | "payments" | "agreement" | "bills";

const RentPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [rentData, setRentData] = useState<RentPayment[]>([]);
  const [booking, setBooking] = useState<RoomBooking | null>(null);

  // Payment dialog state
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [payingMonth, setPayingMonth] = useState<RentPayment | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [txnError, setTxnError] = useState("");

  useEffect(() => {
    setRentData(rentService.getPayments());
    setBooking(bookingAgreementService.getByStudent(user?.id || ""));
  }, [user?.id]);

  const accounts = paymentAccountService.getAll();
  const primaryAccount = accounts.find(a => a.isPrimary) || accounts[0];
  const upiId = primaryAccount?.upiId || "owner@okicici";

  const paidCount = rentData.filter(r => r.status === "Paid").length;
  const pendingCount = rentData.filter(r => r.status === "Pending").length;
  const totalPaid = rentData.filter(r => r.status === "Paid").reduce((s, r) => s + r.amount, 0);

  const handlePayNow = (r: RentPayment) => {
    setPayingMonth(r);
    setPaymentDialog(true);
    setPaymentDone(false);
    setTransactionId("");
    setTxnError("");
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleOpenUPIApp = () => {
    if (!payingMonth) return;
    window.open(generateUPILink({ upiId, payeeName: booking?.ownerName || "Hostel Owner", amount: payingMonth.amount, transactionNote: `${payingMonth.full} Rent` }), "_blank");
  };

  const handleConfirmPayment = () => {
    if (!transactionId.trim()) { setTxnError("Enter UPI transaction ID after making payment"); return; }
    if (transactionId.trim().length < 6) { setTxnError("Transaction ID seems too short"); return; }
    if (payingMonth) {
      rentService.recordPayment(payingMonth.id, transactionId.trim());
      setRentData(rentService.getPayments());
      toast({ title: "Payment recorded!", description: "Owner will verify your payment." });
    }
    setPaymentDone(true);
    setTimeout(() => { setPaymentDialog(false); setPayingMonth(null); setPaymentDone(false); }, 2000);
  };

  const handleDownloadReceipt = (r: RentPayment) => {
    downloadReceipt({
      receiptNo: `RN-${r.id.toUpperCase()}`,
      propertyName: booking?.hostelName || r.hostelName,
      tenantName: user?.name || "Tenant",
      roomNumber: booking?.roomNumber || "101-A",
      month: r.full, amount: r.amount,
      transactionId: r.transactionId,
      paidDate: r.date, paymentMethod: r.paymentMethod || "UPI",
    });
  };

  const qrCodeHtml = payingMonth ? getQRCodeHTML(generateUPILink({ upiId, payeeName: booking?.ownerName || "Owner", amount: payingMonth.amount, transactionNote: `${payingMonth.full} Rent` })) : "";

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: Home },
    { id: "payments" as TabType, label: "Payments", icon: CreditCard },
    { id: "agreement" as TabType, label: "Agreement", icon: FileText },
    { id: "bills" as TabType, label: "Bills", icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-card border-b border-border/50 px-6 h-14 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft size={20} /></Button>
        <h1 className="font-semibold text-foreground">My Room & Rent</h1>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-5xl">
        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center
                ${activeTab === t.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* ═══════════ OVERVIEW TAB ═══════════ */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Room Details Card */}
            {booking && (
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="gradient-primary p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-primary-foreground/70 text-sm">Your Current Hostel</p>
                      <h2 className="text-2xl font-bold text-primary-foreground mt-1">{booking.hostelName}</h2>
                    </div>
                    <Badge className="bg-emerald-500 text-white border-0 rounded-full">
                      {booking.agreementStatus === "active" ? "Active" : booking.agreementStatus}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><BedDouble className="w-5 h-5 text-primary" /></div>
                      <div><p className="text-xs text-muted-foreground">Room</p><p className="font-semibold">{booking.roomNumber}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><Home className="w-5 h-5 text-blue-600" /></div>
                      <div><p className="text-xs text-muted-foreground">Room Type</p><p className="font-semibold">{booking.roomType}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><IndianRupee className="w-5 h-5 text-emerald-600" /></div>
                      <div><p className="text-xs text-muted-foreground">Monthly Rent</p><p className="font-semibold">₹{booking.monthlyRent.toLocaleString()}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><Calendar className="w-5 h-5 text-amber-600" /></div>
                      <div><p className="text-xs text-muted-foreground">Since</p><p className="font-semibold">{new Date(booking.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</p></div>
                    </div>
                  </div>

                  <Separator className="my-5" />

                  {/* Owner Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{booking.ownerName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone size={10} /> {booking.ownerPhone}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => window.open(`tel:${booking.ownerPhone}`)}>
                      <Phone size={14} className="mr-1" /> Call Owner
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Paid", value: `₹${totalPaid.toLocaleString()}`, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950" },
                { label: "Months Paid", value: paidCount.toString(), icon: Calendar, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
                { label: "Pending", value: pendingCount.toString(), icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950" },
                { label: "Security Deposit", value: booking ? `₹${booking.securityDeposit.toLocaleString()}` : "—", icon: Shield, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950" },
              ].map(s => (
                <Card key={s.label} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="font-bold text-lg">{s.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Next Payment Due */}
            {rentData.filter(r => r.status === "Pending").length > 0 && (
              <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Rent Due — {rentData.find(r => r.status === "Pending")?.full}</p>
                      <p className="text-sm text-muted-foreground">₹{rentData.find(r => r.status === "Pending")?.amount.toLocaleString()} • Pay before due date to avoid late fees</p>
                    </div>
                  </div>
                  <Button className="gradient-primary text-primary-foreground rounded-xl gap-2" onClick={() => { const p = rentData.find(r => r.status === "Pending"); if (p) handlePayNow(p); }}>
                    <CreditCard size={16} /> Pay Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* ═══════════ PAYMENTS TAB ═══════════ */}
        {activeTab === "payments" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="font-semibold text-lg">Payment History</h2>
            {rentData.map(r => (
              <Card key={r.id} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {r.status === "Paid" ? (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center"><CheckCircle2 className="text-emerald-500" size={20} /></div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center"><Clock className="text-amber-500" size={20} /></div>
                    )}
                    <div>
                      <p className="font-medium">{r.full}</p>
                      <p className="text-xs text-muted-foreground">{r.date}</p>
                      {r.transactionId && <p className="text-xs text-muted-foreground font-mono">TXN: {r.transactionId}</p>}
                      {r.paymentMethod && r.status === "Paid" && <Badge variant="secondary" className="mt-1 text-[10px] h-4">{r.paymentMethod}</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="font-semibold">₹{r.amount.toLocaleString()}</p>
                      <Badge variant={r.status === "Paid" ? "default" : "secondary"} className={`text-xs ${r.status === "Paid" ? "bg-emerald-500 text-white border-0" : ""}`}>
                        {r.status}
                      </Badge>
                    </div>
                    {r.status === "Pending" ? (
                      <Button size="sm" className="gradient-primary text-primary-foreground rounded-lg gap-1" onClick={() => handlePayNow(r)}>
                        <CreditCard size={14} /> Pay
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadReceipt(r)}>
                        <Download size={14} />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* ═══════════ AGREEMENT TAB ═══════════ */}
        {activeTab === "agreement" && booking && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Room Agreement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground">Hostel</p><p className="font-medium">{booking.hostelName}</p></div>
                  <div><p className="text-muted-foreground">Room</p><p className="font-medium">{booking.roomNumber} ({booking.roomType})</p></div>
                  <div><p className="text-muted-foreground">Start Date</p><p className="font-medium">{new Date(booking.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p></div>
                  <div><p className="text-muted-foreground">End Date</p><p className="font-medium">{new Date(booking.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p></div>
                  <div><p className="text-muted-foreground">Duration</p><p className="font-medium">{booking.agreementDuration} months</p></div>
                  <div><p className="text-muted-foreground">Monthly Rent</p><p className="font-medium">₹{booking.monthlyRent.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Security Deposit</p><p className="font-medium">₹{booking.securityDeposit.toLocaleString()} {booking.advanceRefundable ? "(Refundable)" : "(Non-refundable)"}</p></div>
                  <div><p className="text-muted-foreground">Owner</p><p className="font-medium">{booking.ownerName}</p></div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Terms & Conditions</h3>
                  <div className="space-y-2">
                    {booking.terms.map((term, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                        <span>{term}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">⚠️ Early Termination</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    You can vacate anytime with 1 month notice. Security deposit will be refunded after property inspection.
                    If vacating without notice, advance/deposit will be adjusted against the rent.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══════════ BILLS TAB ═══════════ */}
        {activeTab === "bills" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="font-semibold text-lg">Additional Bills from Owner</h2>
            {[
              { id: "b1", type: "Electricity", amount: 450, month: "April 2026", status: "pending", dueDate: "Apr 30" },
              { id: "b2", type: "Maintenance", amount: 800, month: "Q2 2026", status: "pending", dueDate: "Apr 15" },
              { id: "b3", type: "Water", amount: 200, month: "March 2026", status: "paid", dueDate: "Mar 31" },
            ].map(bill => (
              <Card key={bill.id} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bill.status === "paid" ? "bg-emerald-100 dark:bg-emerald-900" : "bg-amber-100 dark:bg-amber-900"}`}>
                      <Banknote className={`w-5 h-5 ${bill.status === "paid" ? "text-emerald-600" : "text-amber-600"}`} />
                    </div>
                    <div>
                      <p className="font-medium">{bill.type} — {bill.month}</p>
                      <p className="text-xs text-muted-foreground">Due: {bill.dueDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold">₹{bill.amount}</p>
                    <Badge variant={bill.status === "paid" ? "default" : "secondary"} className={bill.status === "paid" ? "bg-emerald-500 text-white border-0" : ""}>
                      {bill.status === "paid" ? "Paid" : "Due"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </div>

      {/* ═══════════ PAYMENT DIALOG ═══════════ */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><IndianRupee className="w-5 h-5 text-primary" /> Pay Rent — {payingMonth?.full}</DialogTitle>
            <DialogDescription>Pay ₹{payingMonth?.amount.toLocaleString()} via UPI</DialogDescription>
          </DialogHeader>
          {paymentDone ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="font-semibold">Payment Recorded!</p>
              <p className="text-sm text-muted-foreground mt-1">Owner will verify your payment shortly.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted rounded-xl p-4 text-center">
                <div className="w-24 h-24 mx-auto mb-3 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: qrCodeHtml }} />
                <p className="text-sm font-medium">Scan to Pay</p>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl border bg-secondary">
                <p className="flex-1 text-sm font-mono">{upiId}</p>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCopyUPI}>
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button variant="outline" className="w-full rounded-xl gap-2" onClick={handleOpenUPIApp}>
                <ExternalLink size={14} /> Open in UPI App
              </Button>
              <div className="text-center">
                <p className="text-2xl font-bold">₹{payingMonth?.amount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{payingMonth?.full} rent</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">UPI Transaction ID *</label>
                <Input placeholder="Enter transaction ID after payment" className="rounded-xl" value={transactionId} onChange={e => { setTransactionId(e.target.value); setTxnError(""); }} />
                {txnError && <p className="text-xs text-destructive">{txnError}</p>}
              </div>
              <Button className="w-full gradient-primary text-primary-foreground rounded-xl gap-2" onClick={handleConfirmPayment}>
                <CheckCircle2 size={16} /> Confirm Payment
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RentPage;