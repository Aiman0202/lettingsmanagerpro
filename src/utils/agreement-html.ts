/**
 * Generate a self-contained HTML agreement for printing or saving as PDF.
 */

interface AgreementPrintData {
  agreement: any
  propertyAddress?: string
  propertyPostcode?: string
  landlordName?: string
  tenantNames?: string[]
  startDate?: string
  endDate?: string
  rentAmount?: string
  depositAmount?: string
  complianceAttachments?: any[]
  signatures?: any[]
  companyLogo?: string | null
  companyName?: string
}

export function generateAgreementHTML(data: AgreementPrintData): string {
  const {
    agreement,
    propertyAddress = 'Property Address',
    propertyPostcode,
    landlordName = 'Landlord Name',
    tenantNames = [],
    startDate,
    endDate,
    rentAmount,
    depositAmount,
    complianceAttachments = [],
    signatures = [],
    companyLogo,
    companyName = 'Property Management'
  } = data

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const tenantList = tenantNames.length > 0 ? tenantNames.join(', ') : 'Tenant(s)'
  const fullAddress = propertyPostcode 
    ? `${propertyAddress}, ${propertyPostcode}`
    : propertyAddress

  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Tenancy Agreement — ${fullAddress}</title>
<style>
  @page { 
    size: A4 portrait; 
    margin: 20mm 15mm 25mm 15mm;
    @bottom-center { 
      content: "Page " counter(page) " of " counter(pages); 
      font-size: 10pt; 
      color: #666; 
    }
  }
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body { 
    font-family: 'Times New Roman', Times, serif; 
    color: #000; 
    line-height: 1.6;
    font-size: 11pt;
  }
  
  /* Cover Page */
  .cover-page { 
    page-break-after: always; 
    padding: 60px 40px;
    text-align: center;
  }
  
  .cover-page img { 
    max-height: 80px; 
    max-width: 250px; 
    margin-bottom: 40px; 
  }
  
  .cover-page h1 { 
    font-size: 28pt; 
    font-weight: bold; 
    margin: 30px 0 20px;
    color: #1a1a1a;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  
  .cover-page .subtitle {
    font-size: 14pt;
    color: #666;
    margin-bottom: 50px;
  }
  
  .cover-details {
    text-align: left;
    max-width: 600px;
    margin: 0 auto;
    background: #f9f9f9;
    padding: 30px;
    border: 2px solid #333;
    border-radius: 4px;
  }
  
  .cover-details table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .cover-details td {
    padding: 10px;
    font-size: 12pt;
    border-bottom: 1px solid #ddd;
  }
  
  .cover-details td:first-child {
    font-weight: bold;
    width: 40%;
    color: #333;
  }
  
  /* Agreement Body */
  .agreement-body { 
    padding: 20px 40px;
  }
  
  .agreement-content {
    line-height: 1.8;
    font-size: 11pt;
  }
  
  .agreement-content h1 {
    font-size: 18pt;
    font-weight: bold;
    margin: 30px 0 20px;
    page-break-after: avoid;
  }
  
  .agreement-content h2 {
    font-size: 14pt;
    font-weight: bold;
    margin: 25px 0 15px;
    page-break-after: avoid;
  }
  
  .agreement-content h3 {
    font-size: 12pt;
    font-weight: bold;
    margin: 20px 0 10px;
    page-break-after: avoid;
  }
  
  .agreement-content p {
    margin: 10px 0;
    text-align: justify;
  }
  
  .agreement-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    page-break-inside: avoid;
  }
  
  .agreement-content table th,
  .agreement-content table td {
    border: 1px solid #333;
    padding: 8px 12px;
    text-align: left;
    font-size: 10pt;
  }
  
  .agreement-content table th {
    background: #f0f0f0;
    font-weight: bold;
  }
  
  .agreement-content ul,
  .agreement-content ol {
    margin: 10px 0 10px 30px;
  }
  
  .agreement-content li {
    margin: 5px 0;
  }
  
  /* Signature Page */
  .signature-page {
    page-break-before: always;
    padding: 40px;
  }
  
  .signature-page h2 {
    font-size: 18pt;
    font-weight: bold;
    margin-bottom: 40px;
    text-align: center;
  }
  
  .signature-block {
    page-break-inside: avoid;
    margin: 40px 0;
    padding: 20px;
    border: 1px solid #ccc;
    background: #fafafa;
  }
  
  .signature-block h3 {
    font-size: 13pt;
    font-weight: bold;
    margin-bottom: 20px;
    color: #333;
  }
  
  .signature-line {
    margin: 30px 0 10px;
    border-top: 1px solid #000;
    padding-top: 5px;
    font-size: 10pt;
    color: #666;
  }
  
  .signature-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin: 15px 0;
  }
  
  .signature-grid p {
    font-size: 10pt;
    margin: 5px 0;
  }
  
  /* Appendices */
  .appendices {
    page-break-before: always;
    padding: 40px;
  }
  
  .appendices h2 {
    font-size: 18pt;
    font-weight: bold;
    margin-bottom: 30px;
    color: #1a1a1a;
  }
  
  .compliance-list {
    list-style: none;
    padding: 0;
  }
  
  .compliance-list li {
    padding: 15px;
    margin: 10px 0;
    border-left: 4px solid #1e40af;
    background: #f9fafb;
  }
  
  .compliance-list li strong {
    display: block;
    margin-bottom: 5px;
    color: #1e40af;
  }
  
  /* Footer */
  .footer {
    margin-top: 60px;
    padding-top: 20px;
    border-top: 2px solid #333;
    text-align: center;
    font-size: 9pt;
    color: #666;
  }
  
  @media print {
    body { 
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
</style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    ${companyLogo 
      ? `<img src="${companyLogo}" alt="Company Logo" style="max-height: 80px; max-width: 250px; margin-bottom: 40px;" />`
      : `<h1 style="font-size: 24pt; margin-bottom: 40px; color: #1a1a1a;">${companyName}</h1>`
    }
    
    <h1>Assured Shorthold Tenancy Agreement</h1>
    <p class="subtitle">Housing Act 1988 (as amended)</p>
    
    <div class="cover-details">
      <table>
        <tr>
          <td><strong>Property:</strong></td>
          <td>${fullAddress}</td>
        </tr>
        <tr>
          <td><strong>Landlord:</strong></td>
          <td>${landlordName}</td>
        </tr>
        <tr>
          <td><strong>Tenant(s):</strong></td>
          <td>${tenantList}</td>
        </tr>
        <tr>
          <td><strong>Term:</strong></td>
          <td>${fmtDate(startDate)} to ${fmtDate(endDate)}</td>
        </tr>
        <tr>
          <td><strong>Rent:</strong></td>
          <td>£${rentAmount || '—'} per calendar month</td>
        </tr>
        <tr>
          <td><strong>Deposit:</strong></td>
          <td>£${depositAmount || '—'}</td>
        </tr>
        <tr>
          <td><strong>Date:</strong></td>
          <td>${fmtDate(agreement?.created_at)}</td>
        </tr>
      </table>
    </div>
    
    <div class="footer">
      <p>This agreement is generated on ${generatedDate}</p>
      <p style="margin-top: 10px; font-size: 8pt; color: #999;">
        This is a legally binding document. All parties should read and understand the terms before signing.
      </p>
    </div>
  </div>

  <!-- Agreement Body -->
  <div class="agreement-body">
    <div class="agreement-content">
      ${agreement?.merged_html || '<p style="color: #999; text-align: center; padding: 40px;">No agreement content available.</p>'}
    </div>
    
    <!-- Signatures in Agreement Body -->
    ${signatures && signatures.length > 0 ? `
    <div class="inline-signatures" style="page-break-before: auto; margin: 40px 0; padding: 30px; border-top: 2px solid #333;">
      <h2 style="font-size: 16pt; font-weight: bold; margin-bottom: 30px; text-align: center; color: #1a1a1a;">
        Executed as a Deed
      </h2>
      <p style="text-align: center; margin-bottom: 30px; color: #666; font-size: 10pt;">
        This agreement has been executed by the parties on the dates shown below
      </p>
      
      ${signatures.filter((s: any) => s.signatory_type === 'tenant').map((sig: any) => `
        <div style="display: inline-block; width: 48%; margin: 10px 1%; vertical-align: top; padding: 20px; border: 1px solid #ddd; background: #fafafa;">
          <p style="font-size: 11pt; font-weight: bold; margin-bottom: 15px; color: #333;">Tenant</p>
          ${sig.signature_image_base64 ? `
            <img src="${sig.signature_image_base64}" alt="Tenant Signature" style="max-width: 200px; max-height: 80px; margin: 10px 0; border-bottom: 1px solid #999;" />
          ` : '<p style="color: #999; font-style: italic;">No signature captured</p>'}
          <p style="font-size: 10pt; margin: 10px 0 5px;"><strong>Name:</strong> ${sig.signatory_name || '—'}</p>
          <p style="font-size: 10pt; color: #666;"><strong>Date:</strong> ${fmtDate(sig.signed_at)}</p>
        </div>
      `).join('')}
      
      ${signatures.filter((s: any) => s.signatory_type === 'landlord' || s.signatory_type === 'agent').map((sig: any) => `
        <div style="display: inline-block; width: 48%; margin: 10px 1%; vertical-align: top; padding: 20px; border: 1px solid #ddd; background: #fafafa;">
          <p style="font-size: 11pt; font-weight: bold; margin-bottom: 15px; color: #333;">Landlord / Agent</p>
          ${sig.signature_image_base64 ? `
            <img src="${sig.signature_image_base64}" alt="Landlord Signature" style="max-width: 200px; max-height: 80px; margin: 10px 0; border-bottom: 1px solid #999;" />
          ` : '<p style="color: #999; font-style: italic;">No signature captured</p>'}
          <p style="font-size: 10pt; margin: 10px 0 5px;"><strong>Name:</strong> ${sig.signatory_name || '—'}</p>
          <p style="font-size: 10pt; color: #666;"><strong>Date:</strong> ${fmtDate(sig.signed_at)}</p>
        </div>
      `).join('')}
    </div>
    ` : ''}
  </div>

  <!-- Signature Page -->
  <div class="signature-page">
    <h2>Signatures</h2>
    <p style="text-align: center; margin-bottom: 40px; color: #666;">
      By signing below, all parties agree to the terms and conditions outlined in this tenancy agreement.
    </p>
    
    <!-- Tenant Signature -->
    ${signatures?.filter((s: any) => s.signatory_type === 'tenant').map((sig: any) => `
      <div class="signature-block">
        <h3>Tenant Signature</h3>
        <div class="signature-grid">
          <div>
            <p><strong>Name:</strong> ${sig.signatory_name || tenantList}</p>
            <p><strong>Date:</strong> ${fmtDate(sig.signed_at)}</p>
          </div>
          <div>
            ${sig.signature_image_base64 
              ? `<img src="${sig.signature_image_base64}" alt="Signature" style="max-width: 200px; max-height: 80px;" />`
              : '<div class="signature-line">Signature</div>'
            }
          </div>
        </div>
      </div>
    `).join('') || `
      <div class="signature-block">
        <h3>Tenant Signature</h3>
        <div class="signature-grid">
          <div>
            <p><strong>Name:</strong> ${tenantList}</p>
            <p><strong>Date:</strong> _______________</p>
          </div>
          <div>
            <div class="signature-line">Signature</div>
          </div>
        </div>
      </div>
    `}
    
    <!-- Landlord Signature -->
    ${signatures?.filter((s: any) => s.signatory_type === 'landlord' || s.signatory_type === 'agent').map((sig: any) => `
      <div class="signature-block">
        <h3>Landlord / Agent Signature</h3>
        <div class="signature-grid">
          <div>
            <p><strong>Name:</strong> ${sig.signatory_name || landlordName}</p>
            <p><strong>Date:</strong> ${fmtDate(sig.signed_at)}</p>
          </div>
          <div>
            ${sig.signature_image_base64 
              ? `<img src="${sig.signature_image_base64}" alt="Signature" style="max-width: 200px; max-height: 80px;" />`
              : '<div class="signature-line">Signature</div>'
            }
          </div>
        </div>
      </div>
    `).join('') || `
      <div class="signature-block">
        <h3>Landlord / Agent Signature</h3>
        <div class="signature-grid">
          <div>
            <p><strong>Name:</strong> ${landlordName}</p>
            <p><strong>Date:</strong> _______________</p>
          </div>
          <div>
            <div class="signature-line">Signature</div>
          </div>
        </div>
      </div>
    `}
    
    <!-- Witness Signature -->
    ${signatures?.filter((s: any) => s.signatory_type === 'witness').map((sig: any) => `
      <div class="signature-block">
        <h3>Witness Signature</h3>
        <div class="signature-grid">
          <div>
            <p><strong>Name:</strong> ${sig.signatory_name || '—'}</p>
            <p><strong>Date:</strong> ${fmtDate(sig.signed_at)}</p>
          </div>
          <div>
            ${sig.signature_image_base64 
              ? `<img src="${sig.signature_image_base64}" alt="Witness Signature" style="max-width: 200px; max-height: 80px;" />`
              : '<div class="signature-line">Signature</div>'
            }
          </div>
        </div>
      </div>
    `).join('') || ''}
  </div>

  <!-- Compliance Appendices -->
  ${complianceAttachments && complianceAttachments.length > 0 ? `
    <div class="appendices">
      <h2>Appendix A: Property Compliance Certificates</h2>
      <p style="margin-bottom: 20px; color: #666;">
        The following compliance certificates and documents are attached to this agreement:
      </p>
      <ul class="compliance-list">
        ${complianceAttachments.map((att: any) => `
          <li>
            <strong>${att.name || 'Document'}</strong>
            ${att.type ? `<p style="margin: 5px 0; font-size: 10pt;">Type: ${att.type}</p>` : ''}
            ${att.expiry_date ? `<p style="margin: 5px 0; font-size: 10pt;">Valid until: ${fmtDate(att.expiry_date)}</p>` : ''}
            ${att.status ? `<p style="margin: 5px 0; font-size: 10pt;">Status: ${att.status}</p>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  ` : ''}
</body>
</html>`
}
