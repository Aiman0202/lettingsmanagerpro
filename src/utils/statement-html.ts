/**
 * Generate a self-contained HTML statement for printing or saving as PDF.
 */

interface StatementPrintData {
  statement: any
  tenancies: any[]
  rentTransactions: any[]
  expenses: any[]
  companyLogo?: string | null
  companyName?: string
}

export function generateStatementHTML(data: StatementPrintData): string {
  const { statement, tenancies, rentTransactions, expenses, companyLogo, companyName = 'Property Management' } = data

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const fmtCurrency = (n: number) =>
    n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })

  const landlord = statement.landlords || {}
  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // Calculate per-property breakdown
  const propertyMap = new Map<string, { address: string; rent: number; expense: number }>()
  
  tenancies.forEach(t => {
    const propId = t.property_id
    const address = t.properties?.address || 'Unknown Property'
    if (!propertyMap.has(propId)) {
      propertyMap.set(propId, { address, rent: 0, expense: 0 })
    }
  })

  rentTransactions.forEach(tx => {
    const tenancy = tenancies.find(t => t.id === tx.tenancy_id)
    if (tenancy) {
      const propId = tenancy.property_id
      const existing = propertyMap.get(propId) || { address: 'Unknown', rent: 0, expense: 0 }
      existing.rent += tx.amount
      propertyMap.set(propId, existing)
    }
  })

  expenses.forEach(exp => {
    const propId = exp.property_id
    const existing = propertyMap.get(propId) || { address: 'Unknown', rent: 0, expense: 0 }
    existing.expense += exp.amount
    propertyMap.set(propId, existing)
  })

  const properties = Array.from(propertyMap.entries()).map(([id, data]) => ({ id, ...data }))

  // Generate property breakdown table rows
  const propertyRows = properties.map(p => `
    <tr>
      <td>${p.address}</td>
      <td class="text-right">${fmtCurrency(p.rent)}</td>
      <td class="text-right">${fmtCurrency(p.expense)}</td>
      <td class="text-right">${fmtCurrency(p.rent - p.expense)}</td>
    </tr>
  `).join('')

  // Generate rent transaction table rows
  const transactionRows = rentTransactions.map(tx => {
    const tenancy = tenancies.find(t => t.id === tx.tenancy_id)
    const property = tenancy?.properties?.address || 'Unknown'
    return `
    <tr>
      <td>${fmtDate(tx.paid_date)}</td>
      <td>${property}</td>
      <td>${tx.tenant_name || '—'}</td>
      <td>${tx.reference || '—'}</td>
      <td class="text-right">${fmtCurrency(tx.amount)}</td>
    </tr>`
  }).join('')

  // Generate expense table rows
  const expenseRows = expenses.map(exp => {
    const property = exp.properties?.address || 'Unknown'
    return `
    <tr>
      <td>${fmtDate(exp.date)}</td>
      <td>${property}</td>
      <td>${exp.category || '—'}</td>
      <td>${exp.description || '—'}</td>
      <td class="text-right">${fmtCurrency(exp.amount)}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Landlord Statement — ${landlord.full_name || 'Landlord'}</title>
<style>
  @page { size: A4 portrait; margin: 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
  
  .header { border-bottom: 3px solid #1e40af; padding-bottom: 16px; margin-bottom: 24px; }
  .header img { max-height: 60px; max-width: 200px; margin-bottom: 8px; }
  .header h1 { font-size: 24px; color: #1e40af; margin-bottom: 8px; }
  .header h2 { font-size: 18px; color: #374151; margin-bottom: 4px; }
  .header p { font-size: 14px; color: #6b7280; }
  
  .landlord-info { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .landlord-info h3 { font-size: 14px; color: #374151; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  .landlord-info p { font-size: 14px; color: #1a1a1a; margin: 2px 0; }
  .landlord-info .label { color: #6b7280; }
  
  .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; margin: 24px 0; }
  .summary-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; }
  .summary-card .label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
  .summary-card .value { font-size: 24px; font-weight: bold; color: #1e40af; }
  .summary-card .value.green { color: #16a34a; }
  .summary-card .value.red { color: #dc2626; }
  
  .section-title { font-size: 18px; font-weight: bold; color: #1e40af; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
  
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
  th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
  th { background: #f3f4f6; font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase; }
  td { color: #1a1a1a; }
  .text-right { text-align: right; }
  tfoot { font-weight: bold; background: #f9fafb; }
  tfoot td { border-top: 2px solid #1e40af; border-bottom: none; }
  
  .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 11px; color: #999; text-align: center; }
  
  .no-data { text-align: center; padding: 24px; color: #999; font-style: italic; }
  
  @media print {
    body { padding: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <div class="header">
    ${companyLogo 
      ? `<img src="${companyLogo}" alt="Company Logo" />`
      : `<h1>${companyName}</h1>`
    }
    <h2>Landlord Statement</h2>
    <p>Statement Period: ${fmtDate(statement.period_start)} – ${fmtDate(statement.period_end)}</p>
  </div>

  <div class="landlord-info">
    <h3>Landlord Details</h3>
    <p><span class="label">Name:</span> ${landlord.full_name || '—'}</p>
    ${landlord.email ? `<p><span class="label">Email:</span> ${landlord.email}</p>` : ''}
    ${landlord.phone ? `<p><span class="label">Phone:</span> ${landlord.phone}</p>` : ''}
    ${landlord.address_line1 ? `<p><span class="label">Address:</span> ${landlord.address_line1}${landlord.address_line2 ? ', ' + landlord.address_line2 : ''}${landlord.city ? ', ' + landlord.city : ''}${landlord.postcode ? ', ' + landlord.postcode : ''}</p>` : ''}
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="label">Gross Rent</div>
      <div class="value">${fmtCurrency(statement.total_rent)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Agency Fees</div>
      <div class="value red">-${fmtCurrency(statement.fees_deducted)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Expenses</div>
      <div class="value red">-${fmtCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}</div>
    </div>
    <div class="summary-card">
      <div class="label">Net Payout</div>
      <div class="value green">${fmtCurrency(statement.net_payout)}</div>
    </div>
  </div>

  <div class="section-title">Property Breakdown</div>
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
        <td class="text-right"><strong>${fmtCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}</strong></td>
        <td class="text-right"><strong>${fmtCurrency(statement.total_rent - expenses.reduce((sum, e) => sum + e.amount, 0))}</strong></td>
      </tr>
    </tfoot>
  </table>

  <div class="section-title">Rent Transactions</div>
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

  <div class="section-title">Property Expenses</div>
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
        <td class="text-right"><strong>${fmtCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}</strong></td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    <p>Generated on ${generatedDate} | This is an official landlord statement</p>
    <p style="margin-top: 8px;">Status: ${statement.paid_at ? '✓ PAID on ' + fmtDate(statement.paid_at) : '⏳ UNPAID'}</p>
  </div>
</body>
</html>`
}
