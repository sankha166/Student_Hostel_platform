import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Smartphone, Building, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PaymentAccount } from "@/data/ownerMockCompat";

interface AddPaymentAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (account: PaymentAccount) => void;
}

const AddPaymentAccountDialog = ({ open, onClose, onAdd }: AddPaymentAccountDialogProps) => {
  const [type, setType] = useState<"upi" | "bank">("upi");
  const [label, setLabel] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [holderName, setHolderName] = useState("");

  const canSubmit = type === "upi"
    ? label && upiId
    : label && bankName && accountNumber && ifsc && holderName;

  const handleSubmit = () => {
    const account: PaymentAccount = {
      id: `pa-${Date.now()}`,
      type,
      label,
      isPrimary: false,
      ...(type === "upi" ? { upiId } : { bankName, accountNumber, ifsc, holderName }),
    };
    onAdd(account);
    onClose();
    setLabel(""); setUpiId(""); setBankName(""); setAccountNumber(""); setIfsc(""); setHolderName("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-md glass-card rounded-2xl p-6 mx-4"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">Add Payment Account</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setType("upi")}
            className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
              type === "upi" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"
            }`}
          >
            <Smartphone size={18} className={type === "upi" ? "text-primary" : "text-muted-foreground"} />
            <span className={`text-sm font-medium ${type === "upi" ? "text-primary" : "text-muted-foreground"}`}>UPI</span>
          </button>
          <button
            onClick={() => setType("bank")}
            className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
              type === "bank" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"
            }`}
          >
            <Building size={18} className={type === "bank" ? "text-primary" : "text-muted-foreground"} />
            <span className={`text-sm font-medium ${type === "bank" ? "text-primary" : "text-muted-foreground"}`}>Bank Account</span>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Account Label</label>
            <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Personal GPay, Business Account" className="rounded-xl" />
          </div>

          {type === "upi" ? (
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">UPI ID</label>
              <Input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi" className="rounded-xl" />
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Account Holder Name</label>
                <Input value={holderName} onChange={e => setHolderName(e.target.value)} placeholder="Full name" className="rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Bank Name</label>
                <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. State Bank of India" className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Account Number</label>
                  <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="XXXX XXXX XXXX" className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">IFSC Code</label>
                  <Input value={ifsc} onChange={e => setIfsc(e.target.value)} placeholder="SBIN0001234" className="rounded-xl" />
                </div>
              </div>
            </>
          )}
        </div>

        <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full mt-5 gradient-primary text-primary-foreground rounded-xl">
          <Plus size={16} className="mr-2" /> Add Account
        </Button>
      </motion.div>
    </div>
  );
};

export default AddPaymentAccountDialog;
