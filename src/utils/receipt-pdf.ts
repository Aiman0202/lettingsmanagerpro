/**
 * Generate a self-contained HTML receipt for printing or saving as PDF.
 */
import type { ReceiptData } from '@/utils/receipt'

export function generateReceiptHTML(r: ReceiptData): string {
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const fmtCurrency = (n: number) =>
    n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Payment Receipt — ${r.receiptNumber}</title>
<style>
  @page { margin: 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 40px; max-width: 700px; margin: 0 auto; }
  .header { border-bottom: 3px solid #1e40af; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { font-size: 24px; color: #1e40af; margin-bottom: 4px; }
  .company { font-size: 14px; color: #555; }
  .receipt-no { float: right; font-size: 18px; font-weight: bold; color: #1e40af; text-align: right; }
  .title { font-size: 20px; font-weight: bold; text-transform: uppercase; text-align: center; margin: 20px 0 24px; letter-spacing: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
  th { width: 160px; color: #555; font-weight: 600; background: #f9fafb; }
  td { color: #1a1a1a; }
  .balance-section { background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0; }
  .balance-section h3 { font-size: 14px; color: #1e40af; margin-bottom: 10px; }
  .balance-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .balance-item { text-align: center; }
  .balance-item .label { font-size: 11px; color: #666; text-transform: uppercase; }
  .balance-item .value { font-size: 18px; font-weight: bold; margin-top: 2px; }
  .balance-item .value.green { color: #16a34a; }
  .balance-item .value.red { color: #dc2626; }
  .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 11px; color: #999; text-align: center; }
  .stamp { display: inline-block; border: 2px solid #16a34a; color: #16a34a; padding: 4px 16px; border-radius: 4px; font-weight: bold; font-size: 12px; text-transform: uppercase; transform: rotate(-5deg); }
  @media print {
    body { padding: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <div class="header">
    <div class="receipt-no">${r.receiptNumber}</div>
    <h1>${r.companyName}</h1>
    <div class="company">${r.companyAddress}<br>${r.companyPhone} · ${r.companyEmail}</div>
  </div>

  <div class="title">Payment Receipt</div>

  <table>
    <tr><th>Tenant</th><td>${r.tenantName}</td></tr>
    <tr><th>Property</th><td>${r.propertyAddress}</td></tr>
    <tr><th>Tenancy Reference</th><td>${r.tenancyRef}</td></tr>
    <tr><th>Payment Date</th><td>${fmtDate(r.paidDate)}</td></tr>
    <tr><th>Period Covered</th><td>${fmtDate(r.periodStart)} – ${fmtDate(r.periodEnd)}</td></tr>
    <tr><th>Payment Method</th><td>${r.paymentMethod || '—'}</td></tr>
  </table>

  <table>
    <tr><th>Rent Due</th><td style="font-weight:bold">${fmtCurrency(r.amount)}</td></tr>
    <tr><th>Amount Paid</th><td style="font-weight:bold; color:#16a34a">${fmtCurrency(r.amountPaid)}</td></tr>
    ${r.amountPaid < r.amount ? `<tr><th>Outstanding</th><td style="font-weight:bold; color:#dc2626">${fmtCurrency(r.amount - r.amountPaid)}</td></tr>` : ''}
  </table>

  <div class="balance-section">
    <h3>Account Summary</h3>
    <div class="balance-grid">
      <div class="balance-item">
        <div class="label">Balance Before</div>
        <div class="value ${r.balanceBefore > 0 ? 'red' : 'green'}">${fmtCurrency(r.balanceBefore)}</div>
      </div>
      <div class="balance-item">
        <div class="label">This Payment</div>
        <div class="value" style="color:#1e40af">${fmtCurrency(r.amountPaid)}</div>
      </div>
      <div class="balance-item">
        <div class="label">Balance After</div>
        <div class="value ${r.balanceAfter > 0 ? 'red' : 'green'}">${fmtCurrency(r.balanceAfter)}</div>
      </div>
    </div>
  </div>

  <table>
    <tr><th>Total Rent Due (tenancy)</th><td>${fmtCurrency(r.totalDue)}</td></tr>
    <tr><th>Total Paid (tenancy)</th><td>${fmtCurrency(r.totalPaid)}</td></tr>
  </table>

  <div style="text-align:center; margin:24px 0">
    <span class="stamp">${r.balanceAfter <= 0 ? 'PAID IN FULL' : 'PARTIAL PAYMENT'}</span>
  </div>

  <div class="footer">
    ${r.companyName} · Receipt generated on ${fmtDate(new Date().toISOString())}
    <br>This is a computer-generated receipt and does not require a signature.
  </div>
</body>
</html>`
}

/**
 * Open the receipt in a new window and trigger print (user can Save as PDF).
 */
export function printReceipt(data: ReceiptData): void {
  const html = generateReceiptHTML(data)
  const win = window.open('', '_blank', 'width=800,height=900')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 300)
}
