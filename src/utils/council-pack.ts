/**
 * Council Submission Pack HTML Generator
 *
 * Generates a self-contained HTML document for city council submission
 * including: cover page, signed agreement, compliance certs, tenant IDs,
 * references, and signature verification log.
 */

export interface CouncilPackData {
  councilName: string
  councilReference: string
  propertyAddress: string
  propertyPostcode: string
  tenancyStart: string
  tenancyEnd: string
  rentAmount: string
  landlordName: string
  agentName: string
  agentAddress: string
  agentPhone?: string
  agentEmail?: string
  tenantNames: string[]
  agreementHtml: string
  complianceAttachments: Array<{
    name: string
    type: string
    expiryDate?: string | null
    imageUrl?: string | null
  }>
  idAttachments: Array<{
    tenantName: string
    type: string
    number?: string | null
    expiryDate?: string | null
    imageUrl?: string | null
  }>
  references: Array<{
    tenantName: string
    type: string
    status: string
  }>
  signatures: Array<{
    name: string
    type: string
    signedAt: string
    method: string
    witnessName?: string | null
    witnessAddress?: string | null
    witnessOccupation?: string | null
  }>
  generatedAt: string
}

export function generateCouncilPackHTML(data: CouncilPackData): string {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  const complianceRows = data.complianceAttachments.length > 0
    ? data.complianceAttachments.map((a) => `
        <tr>
          <td>${escapeHtml(a.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()))}</td>
          <td>${escapeHtml(a.name)}</td>
          <td>${a.expiryDate ? formatDateUK(a.expiryDate) : '—'}</td>
          <td>${a.imageUrl ? `<img src="${a.imageUrl}" class="appendix-doc-image" />` : 'Document not attached'}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" style="text-align: center; color: #666;">No compliance certificates on record</td></tr>'

  const idRows = data.idAttachments.length > 0
    ? data.idAttachments.map((a) => `
        <tr>
          <td>${escapeHtml(a.tenantName)}</td>
          <td>${escapeHtml(a.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()))}</td>
          <td>${a.number ? escapeHtml(a.number) : '—'}</td>
          <td>${a.expiryDate ? formatDateUK(a.expiryDate) : '—'}</td>
        </tr>
        ${a.imageUrl ? `<tr><td colspan="4"><img src="${a.imageUrl}" class="appendix-doc-image" /></td></tr>` : ''}
      `).join('')
    : '<tr><td colspan="4" style="text-align: center; color: #666;">No tenant ID documents on record</td></tr>'

  const refRows = data.references.length > 0
    ? data.references.map((r) => `
        <tr>
          <td>${escapeHtml(r.tenantName)}</td>
          <td>${escapeHtml(r.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()))}</td>
          <td><span style="padding: 2px 8px; border-radius: 4px; font-size: 9pt; background: ${r.status === 'verified' ? '#d1fae5; color: #065f46' : r.status === 'pending' ? '#fef3c7; color: #92400e' : '#fee2e2; color: #991b1b'};">${escapeHtml(r.status)}</span></td>
        </tr>
      `).join('')
    : '<tr><td colspan="3" style="text-align: center; color: #666;">No tenant references on record</td></tr>'

  const sigRows = data.signatures.map((s) => `
    <tr>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.type === 'agent' ? 'Letting Agent' : 'Tenant')}</td>
      <td>${formatDateUK(s.signedAt)}</td>
      <td>${escapeHtml(s.method === 'topaz' ? 'Topaz Pad' : 'Touch/Mouse')}</td>
      <td>${s.witnessName ? escapeHtml(s.witnessName) : '—'}</td>
      <td>${s.witnessAddress ? escapeHtml(s.witnessAddress) : '—'}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Council Submission Pack — ${escapeHtml(data.councilReference)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 20mm 15mm 25mm 15mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Georgia, serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-before: always; }
      .avoid-break { page-break-inside: avoid; }
    }
    .cover-page { text-align: center; padding: 40px 20px; }
    .cover-page h1 { font-size: 20pt; margin-bottom: 8px; }
    .cover-page h2 { font-size: 14pt; font-weight: normal; color: #555; margin-bottom: 24px; }
    .cover-table { margin: 24px auto; border-collapse: collapse; font-size: 11pt; }
    .cover-table td { border: none; padding: 5px 14px; }
    .cover-table td:first-child { font-weight: bold; text-align: right; color: #555; }
    .cover-table td:last-child { text-align: left; }
    .council-address { margin: 20px 0; font-size: 11pt; }
    h2.section-heading {
      font-size: 13pt;
      border-bottom: 1.5pt solid #333;
      padding-bottom: 4px;
      margin-top: 28px;
      margin-bottom: 12px;
    }
    h3 { font-size: 11pt; font-weight: bold; margin-top: 16px; margin-bottom: 6px; }
    p { margin-bottom: 8px; }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
      margin: 12px 0;
    }
    table.data-table th {
      background: #f5f5f5;
      border: 1px solid #ccc;
      padding: 6px 10px;
      text-align: left;
      font-weight: 600;
    }
    table.data-table td {
      border: 1px solid #ddd;
      padding: 6px 10px;
      vertical-align: top;
    }
    .appendix-doc-image {
      max-width: 100%;
      max-height: 280px;
      border: 1px solid #ddd;
      margin: 8px 0;
      display: block;
    }
    .footer-note {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid #ccc;
      font-size: 9pt;
      color: #666;
      text-align: center;
    }
    .signature-block {
      margin: 16px 0;
      padding: 12px;
      border: 1px solid #e5e5e5;
    }
    .signature-block .witness-sig {
      max-width: 140px;
      max-height: 45px;
    }
    .pack-stamp {
      margin-top: 20px;
      padding: 12px;
      background: #f8f9fa;
      border: 1px solid #e5e5e5;
      font-size: 9pt;
      color: #555;
    }
    /* Agreement body styles (when embedded) */
    .agreement-body h1 { font-size: 16pt; text-align: center; margin-bottom: 16px; }
    .agreement-body h2 { font-size: 12pt; border-bottom: 1pt solid #333; padding-bottom: 3px; margin-top: 20px; }
    .agreement-body h3 { font-size: 11pt; font-weight: bold; margin-top: 12px; }
    .agreement-body p { margin-bottom: 6px; text-align: justify; }
    .agreement-body ul, .agreement-body ol { margin-bottom: 8px; padding-left: 20px; }
    .agreement-body table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    .agreement-body table th, .agreement-body table td { border: 1px solid #333; padding: 5px 8px; font-size: 10pt; }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <h1>CITY COUNCIL SUBMISSION PACK</h1>
    <h2>Assured Shorthold Tenancy — Supporting Documents</h2>

    <div class="council-address" style="text-align: left; max-width: 400px; margin: 20px auto;">
      <p><strong>To:</strong> ${escapeHtml(data.councilName)}</p>
      <p><strong>Reference:</strong> ${escapeHtml(data.councilReference)}</p>
      <p><strong>Date:</strong> ${today}</p>
    </div>

    <table class="cover-table">
      <tr><td>Property:</td><td>${escapeHtml(data.propertyAddress)}${data.propertyPostcode ? ', ' + escapeHtml(data.propertyPostcode) : ''}</td></tr>
      <tr><td>Landlord:</td><td>${escapeHtml(data.landlordName)}</td></tr>
      <tr><td>Tenant(s):</td><td>${data.tenantNames.map(escapeHtml).join(', ')}</td></tr>
      <tr><td>Term:</td><td>${formatDateUK(data.tenancyStart)} to ${formatDateUK(data.tenancyEnd)}</td></tr>
      <tr><td>Rent:</td><td>${escapeHtml(data.rentAmount)} per calendar month</td></tr>
      <tr><td>Managing Agent:</td><td>${escapeHtml(data.agentName)}</td></tr>
      ${data.agentAddress ? `<tr><td>Agent Address:</td><td>${escapeHtml(data.agentAddress)}</td></tr>` : ''}
      ${data.agentPhone ? `<tr><td>Agent Phone:</td><td>${escapeHtml(data.agentPhone)}</td></tr>` : ''}
      ${data.agentEmail ? `<tr><td>Agent Email:</td><td>${escapeHtml(data.agentEmail)}</td></tr>` : ''}
    </table>

    <div class="pack-stamp" style="max-width: 500px; margin: 20px auto; text-align: left;">
      <p><strong>Pack Contents:</strong></p>
      <ol style="margin: 0; padding-left: 20px; font-size: 9pt;">
        <li>Signed Assured Shorthold Tenancy Agreement</li>
        <li>Appendix A — Property Compliance Certificates</li>
        <li>Appendix B — Tenant Identification Documents</li>
        <li>Appendix C — Tenant References</li>
        <li>Appendix D — Signature Verification Log</li>
      </ol>
    </div>
  </div>

  <!-- SIGNED AGREEMENT -->
  <div class="page-break">
    <h2 class="section-heading">Signed Tenancy Agreement</h2>
    <div class="agreement-body">
      ${data.agreementHtml}
    </div>
  </div>

  <!-- APPENDIX A: Compliance Certificates -->
  <div class="page-break">
    <h2 class="section-heading">Appendix A: Property Compliance Certificates</h2>
    <p>Property: <strong>${escapeHtml(data.propertyAddress)}</strong></p>
    <table class="data-table">
      <thead>
        <tr>
          <th>Certificate Type</th>
          <th>Document</th>
          <th>Expiry Date</th>
          <th>Certificate</th>
        </tr>
      </thead>
      <tbody>${complianceRows}</tbody>
    </table>
  </div>

  <!-- APPENDIX B: Tenant ID Documents -->
  <div class="page-break">
    <h2 class="section-heading">Appendix B: Tenant Identification Documents</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Tenant</th>
          <th>Document Type</th>
          <th>Document Number</th>
          <th>Expiry Date</th>
        </tr>
      </thead>
      <tbody>${idRows}</tbody>
    </table>
  </div>

  <!-- APPENDIX C: Tenant References -->
  <div class="page-break">
    <h2 class="section-heading">Appendix C: Tenant References</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Tenant</th>
          <th>Reference Type</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${refRows}</tbody>
    </table>
  </div>

  <!-- APPENDIX D: Signature Verification Log -->
  <div class="page-break">
    <h2 class="section-heading">Appendix D: Signature Verification Log</h2>
    <p>All signatures were captured electronically on ${formatDateUK(data.generatedAt)} using ${data.signatures.some(s => s.method === 'topaz') ? 'Topaz signature pad' : 'touch/mouse input'}.</p>
    <table class="data-table">
      <thead>
        <tr>
          <th>Signatory</th>
          <th>Role</th>
          <th>Signed Date</th>
          <th>Method</th>
          <th>Witness</th>
          <th>Witness Address</th>
        </tr>
      </thead>
      <tbody>${sigRows}</tbody>
    </table>
  </div>

  <!-- FOOTER -->
  <div class="footer-note">
    <p>This pack was generated automatically by ${escapeHtml(data.agentName)} on ${today}.</p>
    <p>Reference: ${escapeHtml(data.councilReference)} | Property: ${escapeHtml(data.propertyAddress)}</p>
  </div>

</body>
</html>`
}

function escapeHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDateUK(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}
