/**
 * Generate a self-contained HTML tenant statement for printing or saving as PDF.
 * Includes XSS protection and professional design.
 */

interface TenantStatementData {
  statement: any
  tenant?: any
  tenancy?: any
  transactions?: any[]
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
  return ''
}

export async function generateTenantStatementHTML(statement: any): Promise<string> {
  // Fetch related data
  const supabase = (await import('@/lib/supabase')).supabase
  
  const [tenantRes, tenancyRes, transactionsRes, companyRes] = await Promise.all([
    supabase.from('tenants').select('*').eq('id', statement.tenant_id).single(),
    supabase.from('tenancies').select('*, properties(address, postcode, type)').eq('id', statement.tenancy_id).single(),
    supabase.from('rent_transactions')
      .select('*')
      .eq('tenancy_id', statement.tenancy_id)
      .gte('due_date', statement.period_start)
      .lte('due_date', statement.period_end)
      .order('due_date', { ascending: true }),
    supabase.from('company_settings').select('company_name, logo_url').single()
  ])

  const companyData = companyRes.data as any
  const data: TenantStatementData = {
    statement,
    tenant: tenantRes.data,
    tenancy: tenancyRes.data,
    transactions: transactionsRes.data ?? [],
    companyLogo: companyData ? companyData.logo_url : null,
    companyName: companyData ? companyData.company_name : 'Property Management'
  }

  return buildTenantStatementHTML(data)
}

function buildTenantStatementHTML(data: TenantStatementData): string {
  const { statement, tenant, tenancy, transactions, companyLogo, companyName } = data

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const fmtCurrency = (n: number | null | undefined) => {
    if (n == null) return '£0.00'
    return n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })
  }

  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const propertyAddress = tenancy?.properties 
    ? `${tenancy.properties.address}, ${tenancy.properties.postcode}`
    : '—'

  // Generate transaction table rows
  const transactionRows = (transactions ?? []).map(tx => {
    const statusColor = tx.status === 'paid' ? 'color: #059669;' : 
                       tx.status === 'overdue' ? 'color: #dc2626;' : 
                       'color: #d97706;'
    return `<tr>
      <td>${fmtDate(tx.due_date)}</td>
      <td>${fmtCurrency(tx.amount)}</td>
      <td style="${statusColor} font-weight: 600; text-transform: capitalize;">${escapeHtml(tx.status)}</td>
      <td>${tx.paid_date ? fmtDate(tx.paid_date) : '—'}</td>
      <td>${escapeHtml(tx.payment_method || '—')}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tenant Statement - ${escapeHtml(tenant?.full_name || 'Tenant')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #1a1a1a;
      padding: 40px;
      max-width: 210mm;
      margin: 0 auto;
    }
    
    /* Header */
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start;
      padding-bottom: 30px;
      border-bottom: 3px solid #2563eb;
      margin-bottom: 30px;
    }
    .company-logo { max-height: 60px; max-width: 200px; margin-bottom: 10px; }
    .company-name { font-size: 18pt; font-weight: bold; color: #1a1a1a; margin-bottom: 5px; }
    .statement-title { 
      font-size: 24pt; 
      font-weight: bold; 
      color: #2563eb;
      text-align: right;
    }
    .statement-subtitle {
      font-size: 10pt;
      color: #6b7280;
      text-align: right;
      margin-top: 5px;
    }
    
    /* Info Grid */
    .info-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    .info-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
    }
    .info-box-title {
      font-size: 9pt;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #6b7280; font-size: 9pt; }
    .info-value { font-weight: 600; color: #1a1a1a; }
    
    /* Summary Cards */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .summary-card.outstanding {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    }
    .summary-card.paid {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
    }
    .summary-label {
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.9;
      margin-bottom: 8px;
    }
    .summary-value {
      font-size: 20pt;
      font-weight: bold;
    }
    
    /* Table */
    .table-section { margin-bottom: 30px; }
    .table-title {
      font-size: 14pt;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }
    thead th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #d1d5db;
    }
    thead th.text-right { text-align: right; }
    tbody td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    tbody td.text-right { text-align: right; }
    tbody tr:hover { background: #f9fafb; }
    
    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 8pt;
    }
    .footer-note {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 20px;
      font-size: 9pt;
      color: #92400e;
    }
    
    /* Print styles */
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
      @page { margin: 15mm; size: A4; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div>
      ${companyLogo 
        ? `<img src="${sanitizeUrl(companyLogo)}" alt="Company Logo" class="company-logo" />`
        : `<div class="company-name">${escapeHtml(companyName)}</div>`
      }
    </div>
    <div>
      <div class="statement-title">TENANT STATEMENT</div>
      <div class="statement-subtitle">Rent Account Statement</div>
    </div>
  </div>

  <!-- Tenant & Property Info -->
  <div class="info-section">
    <div class="info-box">
      <div class="info-box-title">Tenant Details</div>
      <div class="info-row">
        <span class="info-label">Name</span>
        <span class="info-value">${escapeHtml(tenant?.full_name || '—')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email</span>
        <span class="info-value">${escapeHtml(tenant?.email || '—')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Phone</span>
        <span class="info-value">${escapeHtml(tenant?.phone || '—')}</span>
      </div>
    </div>

    <div class="info-box">
      <div class="info-box-title">Property & Tenancy</div>
      <div class="info-row">
        <span class="info-label">Property</span>
        <span class="info-value">${escapeHtml(propertyAddress)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Reference</span>
        <span class="info-value">${escapeHtml(tenancy?.reference_number || '—')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Monthly Rent</span>
        <span class="info-value">${fmtCurrency(tenancy?.rent_amount)}</span>
      </div>
    </div>
  </div>

  <!-- Statement Period -->
  <div class="info-box" style="margin-bottom: 30px;">
    <div class="info-box-title">Statement Period</div>
    <div class="info-row">
      <span class="info-label">From</span>
      <span class="info-value">${fmtDate(statement.period_start)}</span>
    </div>
    <div class="info-row">
      <span class="info-label">To</span>
      <span class="info-value">${fmtDate(statement.period_end)}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Generated</span>
      <span class="info-value">${generatedDate}</span>
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="summary-cards">
    <div class="summary-card">
      <div class="summary-label">Total Rent Due</div>
      <div class="summary-value">${fmtCurrency(statement.total_rent)}</div>
    </div>
    <div class="summary-card paid">
      <div class="summary-label">Total Paid</div>
      <div class="summary-value">${fmtCurrency(statement.total_paid)}</div>
    </div>
    <div class="summary-card ${statement.balance > 0 ? 'outstanding' : 'paid'}">
      <div class="summary-label">Balance</div>
      <div class="summary-value">${fmtCurrency(statement.balance)}</div>
    </div>
  </div>

  <!-- Transaction Details -->
  <div class="table-section">
    <div class="table-title">Transaction Details</div>
    <table>
      <thead>
        <tr>
          <th>Due Date</th>
          <th class="text-right">Amount</th>
          <th>Status</th>
          <th>Paid Date</th>
          <th>Payment Method</th>
        </tr>
      </thead>
      <tbody>
        ${transactionRows || '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #9ca3af;">No transactions for this period</td></tr>'}
      </tbody>
    </table>
  </div>

  <!-- Important Notice -->
  <div class="footer-note">
    <strong>Important:</strong> This statement shows your rent account activity for the period indicated above. 
    ${statement.balance > 0 
      ? `You have an outstanding balance of <strong>${fmtCurrency(statement.balance)}</strong>. Please contact us to arrange payment.`
      : 'Your account is up to date. Thank you for your timely payments.'
    }
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>This is a computer-generated statement. For queries, please contact ${escapeHtml(companyName)}.</p>
    <p style="margin-top: 5px;">Generated on ${generatedDate}</p>
  </div>

  <!-- Print Button -->
  <div class="no-print" style="text-align: center; margin-top: 30px;">
    <button onclick="window.print()" style="
      background: #2563eb;
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 6px;
      font-size: 11pt;
      cursor: pointer;
      font-weight: 600;
    ">
      🖨️ Print / Save as PDF
    </button>
  </div>
</body>
</html>`
}
