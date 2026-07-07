import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  IndianRupee,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { rentService, paymentAccountService, type RentPayment } from "@/lib/dataService";
import { generateUPILink, getQRCodeHTML } from "@/lib/qrcode";
import { downloadReceipt } from "@/lib/receiptGenerator";

const monthsOrder = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const RentPage = () => {
  const navigate = useNavigate();
  const [localRentData, setLocalRentData] = useState<RentPayment[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<RentPayment | null>(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [payingMonth, setPayingMonth] = useState<RentPayment | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [txnError, setTxnError] = useState("");

  // Load persisted rent data
  useEffect(() => {
    const data = rentService.getPayments();
    setLocalRentData(data);
    if (data.length > 0) {
      setSelectedMonth(data[data.length - 1]);
    }
  }, []);

  // Get primary payment account UPI ID
  const accounts = paymentAccountService.getAll();
  const primaryAccount = accounts.find(a => a.isPrimary) || accounts[0];
  const upiId = primaryAccount?.upiId || "owner@okicici";

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
    const upiLink = generateUPILink({
      upiId,
      payeeName: "Residential Nexus",
      amount: payingMonth.amount,
      transactionNote: `${payingMonth.full} Rent`,
    });
    window.open(upiLink, "_blank");
  };

  const handleConfirmPayment = () => {
    if (!transactionId.trim()) {
      setTxnError("Please enter the UPI transaction ID after making payment");
      return;
    }
    if (transactionId.trim().length < 6) {
      setTxnError("Transaction ID seems too short. Please enter the full ID.");
      return;
    }

    if (payingMonth) {
      // Persist payment to localStorage
      const updated = rentService.recordPayment(payingMonth.id, transactionId.trim());
      if (updated) {
        // Refresh local state from storage
        const refreshed = rentService.getPayments();
        setLocalRentData(refreshed);
        setSelectedMonth(refreshed.find(r => r.month === payingMonth.month) || refreshed[0]);
      }
    }
    setPaymentDone(true);
    setTimeout(() => {
      setPaymentDialog(false);
      setPayingMonth(null);
      setPaymentDone(false);
      setTransactionId("");
    }, 2000);
  };

  const handleDownloadReceipt = (r: RentPayment) => {
    downloadReceipt({
      receiptNo: `RN-${r.month}-${Date.now().toString(36).toUpperCase()}`,
      propertyName: r.hostelName || "Sunrise Student Haven",
      tenantName: "Current Tenant",
      roomNumber: "101-A",
      month: r.full,
      amount: r.amount,
      transactionId: r.transactionId,
      paidDate: r.date,
      paymentMethod: "UPI",
    });
  };

  const getStatus = (month: string) => {
    const data = localRentData.find((m) => m.month === month);
    if (!data) return "empty";
    return data.status;
  };

  const qrCodeHtml = payingMonth
    ? getQRCodeHTML(generateUPILink({
        upiId,
        payeeName: "Residential Nexus",
        amount: payingMonth.amount,
        transactionNote: `${payingMonth.full} Rent`,
      }))
    : "";

  const pendingCount = localRentData.filter(r => r.status === "Pending").length;

  return (
    <div className="min-h-screen bg-background">
      
      {/* HEADER */}
      <div className="sticky top-0 z-50 glass-card border-b border-border/50 px-6 h-14 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-semibold text-foreground">My Rent</h1>
      </div>

      {/* MAIN GRID */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ================= LEFT SIDE ================= */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              
              {/* CURRENT RENT CARD */}
              <div className="glass-card-elevated rounded-2xl p-6 mb-6">
                <p className="text-sm text-muted-foreground mb-1">Current Hostel</p>
                <p className="text-lg font-semibold text-foreground mb-4">
                  Sunrise Student Haven
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Rent</p>
                    <p className="text-2xl font-bold text-foreground">₹3,500</p>
                  </div>

                  {pendingCount > 0 && (
                    <Badge className="bg-destructive/10 text-destructive border-0 rounded-full px-4 py-1">
                      <Clock size={14} className="mr-1" /> {pendingCount} Pending
                    </Badge>
                  )}
                </div>
              </div>

              {/* PAYMENT LIST */}
              <h2 className="font-semibold text-foreground mb-4">Payment History</h2>

              <div className="space-y-3">
                {localRentData.map((r) => (
                  <div key={r.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                    
                    <div className="flex items-center gap-3">
                      {r.status === "Paid" ? (
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <CheckCircle2 className="text-emerald-500" size={20} />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <Clock className="text-blue-400" size={20} />
                        </div>
                      )}

                      <div>
                        <p className="font-medium text-foreground text-sm">{r.full}</p>
                        <p className="text-xs text-muted-foreground">{r.date}</p>
                        {r.transactionId && (
                          <p className="text-xs text-muted-foreground font-mono">TXN: {r.transactionId}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-foreground">₹{r.amount}</p>

                      {r.status === "Pending" ? (
                        <Button size="sm" className="gradient-primary text-primary-foreground rounded-lg gap-1" onClick={() => handlePayNow(r)}>
                          <CreditCard size={14} /> Pay Now
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="rounded-full bg-emerald-500 text-white border-0">
                            Paid
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadReceipt(r)}>
                            <Download size={14} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </motion.div>
          </div>

          {/* ================= RIGHT SIDE ================= */}
          <div className="space-y-6 sticky top-24 h-fit">

            {/* MONTH GRID */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-semibold mb-4">Overview</h3>

              <div className="grid grid-cols-6 gap-2">
                {monthsOrder.map((m) => {
                  const status = getStatus(m);

                  return (
                    <div
                      key={m}
                      onClick={() => {
                        const data = localRentData.find((d) => d.month === m);
                        if (data) setSelectedMonth(data);
                      }}
                      className={`h-10 rounded-lg flex items-center justify-center text-xs cursor-pointer transition-all
                        ${status === "Paid" && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"}
                        ${status === "Pending" && "bg-blue-500/20 text-blue-400 border border-blue-500/30"}
                        ${status === "empty" && "bg-muted text-muted-foreground"}
                        ${selectedMonth?.month === m && "ring-2 ring-primary"}
                      `}
                    >
                      {m}
                    </div>
                  );
                })}
              </div>

              {/* LEGEND */}
              <div className="flex gap-4 mt-4 text-xs">
                <span className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
                  Paid
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 bg-blue-400 rounded-full" />
                  Pending
                </span>
              </div>
            </div>

            {/* INSIGHT */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
              <p className="text-sm text-emerald-400 font-medium">
                👍 On-time payments maintained
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You're consistent with your rent — keep it up!
              </p>
            </div>

            {/* DETAILS */}
            {selectedMonth && (
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-semibold mb-3">{selectedMonth.full}</h3>

                <p className="text-sm">
                  Status:{" "}
                  <span className={selectedMonth.status === "Paid" ? "text-emerald-400" : "text-blue-400"}>
                    {selectedMonth.status}
                  </span>
                </p>

                <p className="text-sm">Amount: ₹{selectedMonth.amount}</p>
                <p className="text-sm">Date: {selectedMonth.date}</p>
                {selectedMonth.transactionId && (
                  <p className="text-sm font-mono text-xs">TXN: {selectedMonth.transactionId}</p>
                )}

                <div className="flex gap-2 mt-4">
                  
                  {selectedMonth.status === "Paid" && (
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleDownloadReceipt(selectedMonth)}>
                      <Download size={14} /> Download Receipt
                    </Button>
                  )}

                  {selectedMonth.status !== "Paid" && (
                    <Button size="sm" className="gradient-primary text-primary-foreground gap-2" onClick={() => handlePayNow(selectedMonth)}>
                      <CreditCard size={14} /> Pay
                    </Button>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-primary" />
              Pay Rent — {payingMonth?.full}
            </DialogTitle>
            <DialogDescription>
              Pay ₹{payingMonth?.amount} to your hostel owner via UPI
            </DialogDescription>
          </DialogHeader>
          {paymentDone ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="font-semibold text-foreground">Payment Recorded!</p>
              <p className="text-sm text-muted-foreground mt-1">Your payment has been noted. The owner will verify it.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted rounded-xl p-4 text-center">
                <div
                  className="w-24 h-24 mx-auto mb-3 [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: qrCodeHtml }}
                />
                <p className="text-sm font-medium text-foreground">Scan to Pay</p>
                <p className="text-xs text-muted-foreground mt-1">or use UPI ID below</p>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl border bg-secondary">
                <p className="flex-1 text-sm font-mono text-foreground">{upiId}</p>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCopyUPI}>
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button variant="outline" className="w-full rounded-xl gap-2" onClick={handleOpenUPIApp}>
                <ExternalLink size={14} /> Open in UPI App
              </Button>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">₹{payingMonth?.amount}</p>
                <p className="text-xs text-muted-foreground">{payingMonth?.full} rent</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">UPI Transaction ID *</label>
                <Input
                  placeholder="Enter transaction ID after payment"
                  className="rounded-xl"
                  value={transactionId}
                  onChange={(e) => { setTransactionId(e.target.value); setTxnError(""); }}
                />
                {txnError && <p className="text-xs text-destructive">{txnError}</p>}
              </div>
              <Button className="w-full gradient-primary text-primary-foreground rounded-xl gap-2" onClick={handleConfirmPayment}>
                <CheckCircle2 size={16} /> Confirm Payment
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                After payment, enter the transaction ID and click confirm. The owner will verify your payment.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RentPage;