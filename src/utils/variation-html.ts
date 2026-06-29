/**
 * Generate a Deed of Variation HTML for simple tenancy extensions.
 */

import { formatDate } from '@/lib/utils'

interface VariationData {
  tenancy: any
  originalAgreement: any
  oldEndDate: string
  newEndDate: string
  oldRent: number
  newRent: number
  amendments: any[]
  signatures: any[]
  companyLogo?: string | null
  companyName: string
  propertyAddress: string
  propertyPostcode: string
  landlordName: string
  tenantNames: string[]
}

export function generateVariationHTML(data: VariationData): string {
  const {
    tenancy,
    originalAgreement,
    oldEndDate,
    newEndDate,
    oldRent,
    newRent,
    amendments = [],
    companyLogo,
    companyName,
    propertyAddress,
    propertyPostcode,
    landlordName,
    tenantNames,
  } = data

  const tenantList = tenantNames.length > 0 ? tenantNames.join(', ') : 'Tenant(s)'
  const fullAddress = propertyPostcode ? `${propertyAddress}, ${propertyPostcode}` : propertyAddress
  const generatedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const hasRentChange = oldRent !== newRent

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Deed of Variation — ${fullAddress}</title>
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
    line-height: 1.8;
    font-size: 11pt;
  }
  
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
  
  .variation-body { 
    padding: 30px 50px;
  }
  
  .variation-content h1 {
    font-size: 20pt;
    font-weight: bold;
    margin: 35px 0 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #333;
    page-break-after: avoid;
    page-break-inside: avoid;
    color: #1a1a1a;
  }
  
  .variation-content h2 {
    font-size: 16pt;
    font-weight: bold;
    margin: 30px 0 15px;
    padding-bottom: 6px;
    border-bottom: 1px solid #666;
    page-break-after: avoid;
    page-break-inside: avoid;
    color: #2a2a2a;
  }
  
  .variation-content p {
    margin: 12px 0;
    text-align: justify;
    line-height: 1.8;
  }
  
  .variation-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 25px 0;
    page-break-inside: avoid;
  }
  
  .variation-content table th,
  .variation-content table td {
    border: 1px solid #444;
    padding: 10px 14px;
    text-align: left;
    font-size: 10pt;
  }
  
  .variation-content table th {
    background: #e8e8e8;
    font-weight: bold;
  }
  
  .signature-page {
    page-break-before: always;
    padding: 40px;
  }
  
  .signature-block {
    page-break-inside: avoid;
    margin: 25px 0;
    padding: 15px;
    border: 1px solid #ccc;
    background: #fafafa;
  }
  
  .signature-block h3 {
    font-size: 13pt;
    font-weight: bold;
    margin-bottom: 20px;
    color: #333;
  }
  
  .signature-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin: 15px 0;
  }
  
  .signature-line {
    margin: 30px 0 10px;
    border-top: 1px solid #000;
    padding-top: 5px;
    font-size: 10pt;
    color: #666;
  }
  
  .footer {
    margin-top: 60px;
    padding-top: 20px;
    border-top: 2px solid #333;
    text-align: center;
    font-size: 9pt;
    color: #666;
  }
  
  @media print {
    body { padding: 0; }
    .close-button { display: none !important; }
  }
  
  .close-button {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    background: #ef4444;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
</style>
</head>
<body>
  <button class="close-button" onclick="window.close()">✕ Close Window</button>
  
  <!-- Cover Page -->
  <div class="cover-page">
    ${companyLogo 
      ? `<img src="${companyLogo}" alt="Company Logo" style="max-height: 80px; max-width: 250px; margin-bottom: 40px;" />`
      : `<h1 style="font-size: 24pt; margin-bottom: 40px; color: #1a1a1a;">${companyName}</h1>`
    }
    
    <h1>Deed of Variation</h1>
    <p class="subtitle">Tenancy Extension Agreement</p>
    
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
          <td><strong>Original End Date:</strong></td>
          <td>${formatDate(oldEndDate)}</td>
        </tr>
        <tr>
          <td><strong>New End Date:</strong></td>
          <td>${formatDate(newEndDate)}</td>
        </tr>
        ${hasRentChange ? `
        <tr>
          <td><strong>Original Rent:</strong></td>
          <td>£${oldRent.toLocaleString()} per month</td>
        </tr>
        <tr>
          <td><strong>New Rent:</strong></td>
          <td>£${newRent.toLocaleString()} per month</td>
        </tr>
        ` : ''}
        <tr>
          <td><strong>Variation Date:</strong></td>
          <td>${generatedDate}</td>
        </tr>
      </table>
    </div>
    
    <div class="footer">
      <p>This deed of variation is generated on ${generatedDate}</p>
      <p style="margin-top: 10px; font-size: 8pt; color: #999;">
        This is a legally binding document. All parties should read and understand the terms before signing.
      </p>
    </div>
  </div>

  <!-- Variation Body -->
  <div class="variation-body">
    <div class="variation-content">
      <h1>Variation Terms</h1>
      
      <p>This Deed of Variation is made on <strong>${generatedDate}</strong> between:</p>
      <ul style="margin: 15px 0 15px 35px;">
        <li><strong>Landlord:</strong> ${landlordName}</li>
        <li><strong>Tenant(s):</strong> ${tenantList}</li>
      </ul>
      
      <p>Reference is made to the tenancy agreement dated ${formatDate(originalAgreement?.created_at)} for the property at <strong>${fullAddress}</strong>.</p>
      
      <h2>1. Extension of Term</h2>
      <p>The tenancy agreement is hereby extended from <strong>${formatDate(oldEndDate)}</strong> to <strong>${formatDate(newEndDate)}</strong>. All other terms and conditions of the original agreement shall remain in full force and effect during the extended period.</p>
      
      ${hasRentChange ? `
      <h2>2. Rent Adjustment</h2>
      <p>The monthly rent is adjusted from <strong>£${oldRent.toLocaleString()}</strong> to <strong>£${newRent.toLocaleString()}</strong> per calendar month, effective from ${formatDate(newEndDate)}.</p>
      ` : ''}
      
      ${amendments.length > 0 ? `
      <h2>${hasRentChange ? '3' : '2'}. Previous Amendments</h2>
      <p>The following amendments were made during the original tenancy period and are acknowledged by all parties:</p>
      <table>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Change</th>
        </tr>
        ${amendments.map((a: any) => `
          <tr>
            <td>${formatDate(a.effective_date)}</td>
            <td>${a.amendment_type.replace('_', ' ').toUpperCase()}</td>
            <td>${a.old_value} → ${a.new_value}</td>
          </tr>
        `).join('')}
      </table>
      ` : ''}
      
      <h2>${amendments.length > 0 && hasRentChange ? '4' : amendments.length > 0 || hasRentChange ? '3' : '2'}. Continuation of Terms</h2>
      <p>Except as expressly varied by this Deed, all terms and conditions of the original tenancy agreement shall continue to apply during the extended tenancy period. This includes but is not limited to:</p>
      <ul style="margin: 15px 0 15px 35px;">
        <li>Obligation to pay rent on the due dates</li>
        <li>Maintenance and repair responsibilities</li>
        <li>Use of the property as a private residence</li>
        <li>Deposit protection terms</li>
        <li>All covenants and conditions in the original agreement</li>
      </ul>
      
      <h2>${amendments.length > 0 && hasRentChange ? '5' : amendments.length > 0 || hasRentChange ? '4' : '3'}. Governing Law</h2>
      <p>This Deed of Variation shall be governed by and construed in accordance with the laws of England and Wales. Any disputes arising under this Deed shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
    </div>
  </div>

  <!-- Signature Page -->
  <div class="signature-page">
    <h2 style="font-size: 18pt; font-weight: bold; margin-bottom: 30px; text-align: center;">Signatures</h2>
    <p style="text-align: center; margin-bottom: 40px; color: #666;">
      By signing below, all parties agree to the terms of this Deed of Variation.
    </p>
    
    <!-- Tenant Signature -->
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
    
    <!-- Landlord Signature -->
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
  </div>
</body>
</html>`
}
