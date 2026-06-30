/**
 * Generate a self-contained HTML agreement for printing or saving as PDF.
 * Uses centralized style system for consistency across all outputs.
 */

import type { AgreementLayoutSettings, getDefaultSettings, generateSettingsCSS } from './agreement-settings'
import { getDefaultSettings as getDefaultSettingsFn, generateSettingsCSS as generateSettingsCSSFn } from './agreement-settings'
import type { AgreementComparison } from './agreement-comparison'
import { generateAgreementCSS, defaultAgreementStyles, type AgreementStyleConfig } from './agreement-styles'
import { generateCoverPage, type CoverPageData } from './agreement-cover-page'
import { generateSignaturesSection, type SignatureData } from './agreement-signatures'

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
  settings?: AgreementLayoutSettings
  isRenewal?: boolean
  comparison?: AgreementComparison
  previousAgreement?: any
  // New unified style system options
  includeCoverPage?: boolean
  includeSignatures?: boolean
  includePageBreaks?: boolean
}

/**
 * Extract the inner body content from merged_html.
 * Older records store a full HTML document (<!DOCTYPE html><html>...<body>...</body></html>).
 * When embedding inside another HTML document we must extract only the body's
 * inner content, otherwise nested <body>/<html> tags break the browser parser.
 */
function extractBodyContent(html: string): string {
  if (!html) return ''
  // If it's a fragment (no <body> tag), return as-is
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  if (bodyMatch) return bodyMatch[1].trim()
  // Fallback: strip DOCTYPE and <html> wrapper if present
  return html
    .replace(/<!DOCTYPE[^>]*>/i, '')
    .replace(/<\/?(html|head|body)[^>]*>/gi, '')
    .trim()
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
    companyName = 'Property Management',
    settings,
    isRenewal = false,
    comparison,
    previousAgreement
  } = data

  const layoutSettings = settings || getDefaultSettingsFn()
  const settingsCSS = generateSettingsCSSFn(layoutSettings)

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

  const footerText = layoutSettings.footer_text.replace('{date}', generatedDate)

  // Watermark CSS — position:fixed repeats on every printed page
  const watermarkCSS = layoutSettings.show_watermark_logo && companyLogo ? `
    .page-watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 60%;
      max-width: 400px;
      opacity: ${layoutSettings.watermark_opacity || 0.08};
      z-index: -1;
      pointer-events: none;
      page-break-after: always;
    }
    .page-watermark img {
      width: 100%;
      height: auto;
    }
  ` : ''

  const watermarkHTML = layoutSettings.show_watermark_logo && companyLogo ? `
  <div class="page-watermark">
    <img src="${companyLogo}" alt="" />
  </div>
` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Tenancy Agreement — ${fullAddress}</title>
<style>
  ${settingsCSS}
  ${watermarkCSS}
</style>
</head>
<body>
  ${watermarkHTML}
  <!-- Close Button (Screen Only) -->
  <button class="close-button" onclick="window.close()" title="Close and return to app">
    ✕ Close Window
  </button>
  
  <!-- Cover Page -->
  <div class="cover-page">
    ${companyLogo 
      ? `<img src="${companyLogo}" alt="Company Logo" style="max-height: 80px; max-width: 250px; margin-bottom: 40px;" />`
      : `<h1 style="font-size: 24pt; margin-bottom: 40px; color: #1a1a1a;">${companyName}</h1>`
    }
    
    <h1>Assured Periodic Tenancy Agreement</h1>
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
    
    ${isRenewal && comparison && comparison.changes.length > 0 ? `
    <div class="renewal-notice">
      <h3>🔄 Renewed Agreement</h3>
      <p>This is a renewed tenancy agreement. The following changes have been made from the previous agreement:</p>
      
      <div class="changes-list">
        ${comparison.changes.map((change: any) => `
          <div class="change-item ${change.type}">
            <strong>${change.section}:</strong>
            ${change.oldValue ? `<span class="old-value">${change.oldValue}</span> → ` : ''}
            <span class="new-value">${change.newValue}</span>
          </div>
        `).join('')}
      </div>
      
      ${previousAgreement ? `
      <p style="margin-top: 20px; font-size: 10pt; color: #666;">
        <strong>Previous Agreement:</strong> Generated on ${fmtDate(previousAgreement.created_at)}
      </p>
      ` : ''}
    </div>
    ` : ''}
    
    <div class="footer">
      <p>${footerText}</p>
      <p style="margin-top: 10px; font-size: 8pt; color: #999;">
        This is a legally binding document. All parties should read and understand the terms before signing.
      </p>
    </div>
  </div>

  <!-- Agreement Body -->
  <div class="agreement-body">
    <div class="agreement-content">
      ${extractBodyContent(agreement?.merged_html) || '<p style="color: #999; text-align: center; padding: 40px;">No agreement content available.</p>'}
    </div>
    
    <!-- Signatures in Agreement Body -->
    ${signatures && signatures.length > 0 && layoutSettings.show_signatures_inline && !layoutSettings.show_signature_page ? `
    <div class="inline-signatures">
      <h2 class="section-title">Executed as a Deed</h2>
      <p class="section-subtitle">
        This agreement has been executed by the parties on the dates shown below
      </p>
      
      ${signatures.filter((s: any) => s.signatory_type === 'tenant').map((sig: any) => `
        <div class="signature-card">
          <p class="signature-role">Tenant</p>
          ${sig.signature_image_base64 ? `
            <img src="${sig.signature_image_base64}" alt="Tenant Signature" class="signature-image" />
          ` : '<p style="color: #999; font-style: italic;">No signature captured</p>'}
          <p class="signature-info"><strong>Name:</strong> ${sig.signatory_name || '—'}</p>
          <p class="signature-date"><strong>Date:</strong> ${fmtDate(sig.signed_at)}</p>
        </div>
      `).join('')}
      
      ${signatures.filter((s: any) => s.signatory_type === 'landlord' || s.signatory_type === 'agent').map((sig: any) => `
        <div class="signature-card">
          <p class="signature-role">Landlord / Agent</p>
          ${sig.signature_image_base64 ? `
            <img src="${sig.signature_image_base64}" alt="Landlord Signature" class="signature-image" />
          ` : '<p style="color: #999; font-style: italic;">No signature captured</p>'}
          <p class="signature-info"><strong>Name:</strong> ${sig.signatory_name || '—'}</p>
          <p class="signature-date"><strong>Date:</strong> ${fmtDate(sig.signed_at)}</p>
        </div>
      `).join('')}
    </div>
    ` : ''}
  </div>

  <!-- Signature Page -->
  ${layoutSettings.show_signature_page ? `
  <div class="signature-page">
    <h2>Signatures</h2>
    
    <!-- Declaration Text -->
    <div class="signature-declaration">
      <p class="declaration-text">
        By signing this agreement, all parties acknowledge and agree to the following:
      </p>
      <ul class="declaration-list">
        <li>This is an <strong>Assured Periodic Tenancy Agreement</strong> governed by the Housing Act 1988 (as amended)</li>
        <li>All parties have read and understood the terms and conditions contained in this agreement</li>
        <li>The tenant(s) agree to pay the rent on the dates specified and to comply with all tenant obligations</li>
        <li>The landlord(s) agree to comply with all legal obligations including property maintenance and deposit protection</li>
        <li>This agreement constitutes a legally binding contract between all parties</li>
        <li>Each party has received a copy of this agreement or will receive one upon execution</li>
      </ul>
      <p class="declaration-notice">
        <strong>Important:</strong> By signing below, you are entering into a legally binding agreement. 
        All parties should seek independent legal advice if uncertain about any terms.
      </p>
    </div>
    
    <p class="signature-intro">
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
              ? `<img src="${sig.signature_image_base64}" alt="Signature" style="max-width: 100px; max-height: 40px;" />`
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
              ? `<img src="${sig.signature_image_base64}" alt="Signature" style="max-width: 100px; max-height: 40px;" />`
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
              ? `<img src="${sig.signature_image_base64}" alt="Witness Signature" class="signature-image-witness" />`
              : '<div class="signature-line">Signature</div>'
            }
          </div>
        </div>
      </div>
    `).join('') || ''}
  </div>
  ` : ''}

  <!-- Compliance Appendices -->
  ${complianceAttachments && complianceAttachments.length > 0 ? `
    <div class="appendices">
      <h2>Appendix A: Property Compliance Certificates</h2>
      <p class="section-subtitle">
        The following compliance certificates and documents are attached to this agreement:
      </p>
      <ul class="compliance-list">
        ${complianceAttachments.map((att: any) => `
          <li>
            <strong>${att.name || 'Document'}</strong>
            ${att.type ? `<p class="compliance-detail">Type: ${att.type}</p>` : ''}
            ${att.expiry_date ? `<p class="compliance-detail">Valid until: ${fmtDate(att.expiry_date)}</p>` : ''}
            ${att.status ? `<p class="compliance-detail">Status: ${att.status}</p>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  ` : ''}
</body>
</html>`
}
