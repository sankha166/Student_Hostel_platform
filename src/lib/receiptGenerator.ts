/**
 * Receipt Generator
 * Generates downloadable HTML receipts styled as proper invoices.
 */

export interface ReceiptData {
  receiptNo: string;
  propertyName: string;
  propertyAddress?: string;
  tenantName: string;
  roomNumber: string;
  month: string;
  year?: number;
  amount: number;
  transactionId?: string;
  paidDate: string;
  paymentMethod?: string;
  ownerName?: string;
}

/**
 * Generate a receipt and trigger download as an HTML file
 */
export function downloadReceipt(data: ReceiptData): void {
  const html = generateReceiptHTML(data);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Receipt_${data.tenantName.replace(/\s/g, "_")}_${data.month}${data.year ? `_${data.year}` : ""}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateReceiptHTML(data: ReceiptData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Payment Receipt — ${data.receiptNo}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #f5f5f5; padding: 40px; }
  .receipt { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
  .header { background: linear-gradient(135deg, #6d28d9, #7c3aed); color: white; padding: 32px; }
  .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
  .header p { opacity: 0.85; font-size: 14px; }
  .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 100px; font-size: 13px; font-weight: 600; margin-top: 16px; }
  .badge svg { width: 16px; height: 16px; }
  .body { padding: 32px; }
  .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
  .row:last-child { border-bottom: none; }
  .row .label { color: #666; font-size: 14px; }
  .row .value { font-weight: 600; color: #1a1a1a; font-size: 14px; text-align: right; }
  .total-row { background: #f9fafb; margin: 24px -32px; padding: 20px 32px; display: flex; justify-content: space-between; align-items: center; }
  .total-row .label { font-size: 16px; font-weight: 600; color: #333; }
  .total-row .value { font-size: 28px; font-weight: 700; color: #6d28d9; }
  .footer { padding: 24px 32px; background: #f9fafb; border-top: 1px solid #eee; text-align: center; }
  .footer p { font-size: 12px; color: #999; line-height: 1.6; }
  .stamp { display: inline-block; border: 3px solid #10b981; color: #10b981; padding: 8px 24px; border-radius: 8px; font-weight: 700; font-size: 16px; transform: rotate(-5deg); margin-top: 16px; letter-spacing: 2px; }
  @media print { body { padding: 0; background: white; } .receipt { box-shadow: none; } }
</style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <h1>Residential Nexus</h1>
    <p>Payment Receipt</p>
    <div class="badge">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      Payment Confirmed
    </div>
  </div>
  <div class="body">
    <div class="row">
      <span class="label">Receipt No.</span>
      <span class="value">${data.receiptNo}</span>
    </div>
    <div class="row">
      <span class="label">Property</span>
      <span class="value">${data.propertyName}</span>
    </div>
    ${data.propertyAddress ? `<div class="row"><span class="label">Address</span><span class="value">${data.propertyAddress}</span></div>` : ""}
    <div class="row">
      <span class="label">Tenant</span>
      <span class="value">${data.tenantName}</span>
    </div>
    <div class="row">
      <span class="label">Room</span>
      <span class="value">${data.roomNumber}</span>
    </div>
    <div class="row">
      <span class="label">Period</span>
      <span class="value">${data.month}${data.year ? ` ${data.year}` : ""}</span>
    </div>
    <div class="row">
      <span class="label">Payment Date</span>
      <span class="value">${data.paidDate}</span>
    </div>
    <div class="row">
      <span class="label">Payment Method</span>
      <span class="value">${data.paymentMethod || "UPI"}</span>
    </div>
    ${data.transactionId ? `<div class="row"><span class="label">Transaction ID</span><span class="value" style="font-family: monospace; font-size: 13px;">${data.transactionId}</span></div>` : ""}
    <div class="total-row">
      <span class="label">Total Amount</span>
      <span class="value">₹${data.amount.toLocaleString()}</span>
    </div>
    <div style="text-align: center; margin-top: 16px;">
      <div class="stamp">PAID</div>
    </div>
  </div>
  <div class="footer">
    <p>This is a computer-generated receipt and does not require a signature.</p>
    <p>Generated on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} • Residential Nexus</p>
    <p style="margin-top: 8px;">For queries, contact the property owner directly.</p>
  </div>
</div>
<script>window.onload = () => { if(window.location.protocol === 'file:') return; /* auto-print for online */ }</script>
</body>
</html>`;
}
