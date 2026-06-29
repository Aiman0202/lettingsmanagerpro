/**
 * Generate a self-contained HTML statement for printing or saving as PDF.
 * Includes XSS protection and modern professional design.
 */

interface StatementPrintData {
  statement: any
  tenancies: any[]
  rentTransactions: any[]
  expenses: any[]
  companyLogo?: string | null
  companyName?: string
}

// XSS Protection: Escape HTML entities
function escapeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Sanitize URL (only allow http/https/data URIs)
function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed
  }
  return '' // Block javascript:, data:, and other potentially dangerous protocols
}

export function generateStatementHTML(data: StatementPrintData): string {
  const { statement, tenancies, rentTransactions, expenses, companyLogo, companyName = 'Property Management' } = data

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const fmtCurrency = (n: number | null | undefined) => {
    if (n == null) return '£0.00'
    return n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })
  }

  const landlord = statement.landlords || {}
  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const totalExpenses = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0)

  // Calculate per-property breakdown
  const propertyMap = new Map<string, { address: string; rent: number; expense: number }>()
  
  (tenancies || []).forEach(t => {
    const propId = t.property_id
    const address = t.properties?.address || 'Unknown Property'
    if (!propertyMap.has(propId)) {
      propertyMap.set(propId, { address, rent: 0, expense: 0 })
    }
  })

  (rentTransactions || []).forEach(tx => {
    const tenancy = tenancies.find(t => t.id === tx.tenancy_id)
    if (tenancy) {
      const propId = tenancy.property_id
      const existing = propertyMap.get(propId) || { address: 'Unknown', rent: 0, expense: 0 }
      existing.rent += (tx.amount || 0)
      propertyMap.set(propId, existing)
    }
  })

  (expenses || []).forEach(exp => {
    const propId = exp.property_id
    const existing = propertyMap.get(propId) || { address: 'Unknown', rent: 0, expense: 0 }
    existing.expense += (exp.amount || 0)
    propertyMap.set(propId, existing)
  })

  const properties = Array.from(propertyMap.entries()).map(([id, data]) => ({ id, ...data }))

  // Generate property breakdown table rows
  const propertyRows = properties.map(p => {
    return `<tr>
      <td>${escapeHtml(p.address)}</td>
      <td class="text-right">${fmtCurrency(p.rent)}</td>
      <td class="text-right">${fmtCurrency(p.expense)}</td>
      <td class="text-right">${fmtCurrency(p.rent - p.expense)}</td>
    </tr>`
  }).join('')

  // Generate rent transaction table rows
  const transactionRows = (rentTransactions || []).map(tx => {
    const tenancy = tenancies.find(t => t.id === tx.tenancy_id)
    const property = tenancy?.properties?.address || 'Unknown'
    return `<tr>
      <td>${fmtDate(tx.paid_date)}</td>
      <td>${escapeHtml(property)}</td>
      <td>${escapeHtml(tx.tenant_name || '—')}</td>
      <td>${escapeHtml(tx.reference || '—')}</td>
      <td class="text-right">${fmtCurrency(tx.amount || 0)}</td>
    </tr>`
  }).join('')

  // Generate expense table rows
  const expenseRows = (expenses || []).map(exp => {
    const property = exp.properties?.address || 'Unknown'
    return `<tr>
      <td>${fmtDate(exp.date)}</td>
      <td>${escapeHtml(property)}</td>
      <td>${escapeHtml(exp.category || '—')}</td>
      <td>${escapeHtml(exp.description || '—')}</td>
      <td class="text-right">${fmtCurrency(exp.amount || 0)}</td>
    </tr>`
  }).join('')

  const safeCompanyLogo = sanitizeUrl(companyLogo)
  const safeCompanyName = escapeHtml(companyName)
  const safeLandlordName = escapeHtml(landlord.full_name || 'Landlord')
  const safeLandlordEmail = escapeHtml(landlord.email)
  const safeLandlordPhone = escapeHtml(landlord.phone)
  const safeLandlordAddress = escapeHtml(landlord.address_line1)
  const safeLandlordAddress2 = escapeHtml(landlord.address_line2)
  const safeLandlordCity = escapeHtml(landlord.city)
  const safeLandlordPostcode = escapeHtml(landlord.postcode)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Landlord Statement — ${safeLandlordName}</title>
<style>
  @page { size: A4 portrait; margin: 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
    color: #1f2937; 
    line-height: 1.6;
    background: #f3f4f6;
  }
  
  .container { 
    max-width: 900px; 
    margin: 0 auto; 
    padding: 20px; 
  }
  
  @media print {
    body { background: white; }
    .container { padding: 0; max-width: none; }
    .no-print { display: none !important; }
  }
  
  /* Header Section */
  .header { 
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    padding: 32px;
    margin-bottom: 24px;
    border-left: 4px solid #3b82f6;
  }
  
  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
  }
  
  .logo img { 
    max-height: 50px; 
    max-width: 180px;
    object-fit: contain;
  }
  
  .company-name {
    font-size: 24px;
    font-weight: 700;
    color: #1e40af;
    margin-bottom: 8px;
  }
  
  .header h1 { 
    font-size: 28px; 
    font-weight: 700;
    color: #111827; 
    margin-bottom: 8px;
  }
  
  .statement-period {
    font-size: 16px;
    color: #6b7280;
    background: #f0f9ff;
    padding: 8px 16px;
    border-radius: 6px;
    display: inline-block;
  }
  
  .status-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .status-paid {
    background: #dcfce7;
    color: #166534;
  }
  
  .status-unpaid {
    background: #fef3c7;
    color: #92400e;
  }
  
  /* Landlord Info */
  .landlord-card { 
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    padding: 24px;
    margin-bottom: 24px;
  }
  
  .landlord-card h2 { 
    font-size: 14px; 
    font-weight: 600;
    color: #6b7280; 
    margin-bottom: 12px; 
    text-transform: uppercase; 
    letter-spacing: 0.5px;
  }
  
  .landlord-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
  
  .landlord-item {
    padding: 8px 0;
  }
  
  .landlord-item .label { 
    font-size: 12px;
    color: #9ca3af;
    margin-bottom: 4px;
  }
  
  .landlord-item .value { 
    font-size: 14px;
    color: #1f2937;
    font-weight: 500;
  }
  
  /* Summary Cards */
  .summary-grid { 
    display: grid; 
    grid-template-columns: repeat(4, 1fr); 
    gap: 16px; 
    margin-bottom: 24px;
  }
  
  @media (max-width: 768px) {
    .summary-grid { grid-template-columns: repeat(2, 1fr); }
  }
  
  .summary-card { 
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    padding: 20px;
    text-align: center;
  }
  
  .summary-card .label { 
    font-size: 11px; 
    color: #6b7280; 
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .summary-card .value { 
    font-size: 24px; 
    font-weight: 700; 
    color: #1e40af;
  }
  
  .summary-card .value.positive { color: #16a34a; }
  .summary-card .value.negative { color: #dc2626; }
  
  /* Tables */
  .section-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    padding: 24px;
    margin-bottom: 24px;
  }
  
  .section-title { 
    font-size: 18px; 
    font-weight: 700; 
    color: #111827; 
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #e5e7eb;
  }
  
  .table-wrapper {
    overflow-x: auto;
  }
  
  table { 
    width: 100%; 
    border-collapse: collapse; 
    font-size: 14px;
  }
  
  th { 
    padding: 12px; 
    text-align: left; 
    background: #f9fafb;
    font-weight: 600; 
    color: #374151; 
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #e5e7eb;
  }
  
  td { 
    padding: 12px; 
    color: #1f2937;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .text-right { text-align: right; }
  
  tfoot { 
    font-weight: 600;
    background: #f9fafb;
  }
  
  tfoot td { 
    border-top: 2px solid #e5e7eb;
    border-bottom: none;
    padding: 12px;
  }
  
  .no-data { 
    text-align: center; 
    padding: 32px; 
    color: #9ca3af; 
    font-style: italic;
  }
  
  /* Footer */
  .footer { 
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    padding: 24px;
    text-align: center;
    font-size: 12px;
    color: #6b7280;
    margin-top: 24px;
  }
  
  .footer p {
    margin: 4px 0;
  }
</style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-top">
        <div class="logo">
          ${safeCompanyLogo 
            ? `<img src="${safeCompanyLogo}" alt="Company Logo" />`
            : `<div class="company-name">${safeCompanyName}</div>`
          }
        </div>
        ${statement.paid_at 
          ? `<span class="status-badge status-paid">✓ Paid</span>`
          : `<span class="status-badge status-unpaid">⏳ Unpaid</span>`
        }
      </div>
      <h1>Landlord Statement</h1>
      <div class="statement-period">
        Period: ${fmtDate(statement.period_start)} – ${fmtDate(statement.period_end)}
      </div>
    </div>

    <!-- Landlord Information -->
    <div class="landlord-card">
      <h2>Landlord Details</h2>
      <div class="landlord-grid">
        <div class="landlord-item">
          <div class="label">Name</div>
          <div class="value">${safeLandlordName}</div>
        </div>
        ${safeLandlordEmail ? `
        <div class="landlord-item">
          <div class="label">Email</div>
          <div class="value">${safeLandlordEmail}</div>
        </div>
        ` : ''}
        ${safeLandlordPhone ? `
        <div class="landlord-item">
          <div class="label">Phone</div>
          <div class="value">${safeLandlordPhone}</div>
        </div>
        ` : ''}
        ${safeLandlordAddress ? `
        <div class="landlord-item" style="grid-column: 1 / -1;">
          <div class="label">Address</div>
          <div class="value">
            ${safeLandlordAddress}
            ${safeLandlordAddress2 ? `, ${safeLandlordAddress2}` : ''}
            ${safeLandlordCity ? `, ${safeLandlordCity}` : ''}
            ${safeLandlordPostcode ? `, ${safeLandlordPostcode}` : ''}
          </div>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="label">Gross Rent</div>
        <div class="value">${fmtCurrency(statement.total_rent)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Agency Fees</div>
        <div class="value negative">-${fmtCurrency(statement.fees_deducted)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Expenses</div>
        <div class="value negative">-${fmtCurrency(totalExpenses)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Net Payout</div>
        <div class="value positive">${fmtCurrency(statement.net_payout)}</div>
      </div>
    </div>

    <!-- Property Breakdown -->
    <div class="section-card">
      <div class="section-title">Property Breakdown</div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Property</th>
              <th class="text-right">Rent Collected</th>
              <th class="text-right">Expenses</th>
              <th class="text-right">Net Income</th>
            </tr>
          </thead>
          <tbody>
            ${propertyRows || '<tr><td colspan="4" class="no-data">No properties in this period</td></tr>'}
          </tbody>
          <tfoot>
            <tr>
              <td><strong>Total</strong></td>
              <td class="text-right"><strong>${fmtCurrency(statement.total_rent)}</strong></td>
              <td class="text-right"><strong>${fmtCurrency(totalExpenses)}</strong></td>
              <td class="text-right"><strong>${fmtCurrency(statement.total_rent - totalExpenses)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Rent Transactions -->
    <div class="section-card">
      <div class="section-title">Rent Transactions</div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Property</th>
              <th>Tenant</th>
              <th>Reference</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${transactionRows || '<tr><td colspan="5" class="no-data">No rent transactions in this period</td></tr>'}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4"><strong>Total Rent Collected</strong></td>
              <td class="text-right"><strong>${fmtCurrency(statement.total_rent)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Expenses -->
    <div class="section-card">
      <div class="section-title">Property Expenses</div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Property</th>
              <th>Category</th>
              <th>Description</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${expenseRows || '<tr><td colspan="5" class="no-data">No expenses in this period</td></tr>'}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4"><strong>Total Expenses</strong></td>
              <td class="text-right"><strong>${fmtCurrency(totalExpenses)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Generated on ${generatedDate}</strong></p>
      <p>This is an official landlord statement | ${statement.paid_at ? '✓ PAID on ' + fmtDate(statement.paid_at) : '⏳ UNPAID'}</p>
    </div>
  </div>
</body>
</html>`
}
