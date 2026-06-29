/**
 * Professional Agreement Cover Page Generator
 * Generates consistent cover pages across all agreement outputs
 */

import type { AgreementStyleConfig } from './agreement-styles'

export interface CoverPageData {
  propertyAddress: string
  propertyPostcode?: string
  landlordName: string
  tenantNames: string[]
  startDate: string
  endDate?: string
  rentAmount?: string
  depositAmount?: string
  tenancyReference?: string
  companyName?: string
}

/**
 * Generate professional cover page HTML
 */
export function generateCoverPage(
  data: CoverPageData,
  styles: AgreementStyleConfig
): string {
  return `
    <div class="cover-page">
      ${styles.coverPageLogo ? `
        <div class="cover-logo-container">
          <img src="${styles.coverPageLogo}" class="cover-logo" alt="Company Logo" />
        </div>
      ` : ''}
      
      <h1 class="cover-title">${styles.coverPageTitle}</h1>
      <p class="cover-subtitle">Housing Act 1988 (as amended)</p>
      
      <div class="cover-divider"></div>
      
      <div class="cover-details">
        ${generateDetailRow('Property Address', `${data.propertyAddress}${data.propertyPostcode ? ', ' + data.propertyPostcode : ''}`)}
        ${generateDetailRow('Landlord', data.landlordName)}
        ${generateDetailRow('Tenants', data.tenantNames.join(', '))}
        ${generateDetailRow('Tenancy Start', formatDate(data.startDate))}
        ${data.endDate ? generateDetailRow('Tenancy Type', 'Periodic Tenancy') : ''}
        ${data.rentAmount ? generateDetailRow('Monthly Rent', data.rentAmount) : ''}
        ${data.depositAmount ? generateDetailRow('Deposit', data.depositAmount) : ''}
        ${data.tenancyReference ? generateDetailRow('Reference', data.tenancyReference) : ''}
      </div>
      
      <div class="cover-footer">
        <p>Generated on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        ${data.companyName ? `<p>${data.companyName}</p>` : ''}
      </div>
    </div>
  `
}

/**
 * Generate a single detail row for the cover page
 */
function generateDetailRow(label: string, value: string): string {
  if (!value) return ''
  
  return `
    <div class="cover-detail-row">
      <span class="cover-label">${label}:</span>
      <span class="cover-value">${value}</span>
    </div>
  `
}

/**
 * Format date for display on cover page
 */
function formatDate(dateString: string): string {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateString
  }
}
