/**
 * Professional Signature Section Generator
 * Generates consistent signature layouts across all agreement outputs
 */

import type { AgreementStyleConfig } from './agreement-styles'

export interface SignatureData {
  signatoryName: string
  signatoryType: 'landlord' | 'tenant' | 'witness' | 'agent'
  signedAt?: string
  signatureUrl?: string | null
  witnessName?: string | null
  witnessAddress?: string | null
  witnessOccupation?: string | null
}

export interface DeclarationOptions {
  showDeclaration?: boolean
  declarationTitle?: string
  declarationPoints?: string[]
  showWarningNotice?: boolean
}

/**
 * Generate signatures section HTML
 */
export function generateSignaturesSection(
  signatures: SignatureData[],
  styles: AgreementStyleConfig,
  declaration?: DeclarationOptions
): string {
  if (signatures.length === 0) return ''

  const {
    showDeclaration = true,
    declarationTitle = 'By signing this agreement, all parties acknowledge and agree to the following:',
    declarationPoints = [
      'This is an <strong>Assured Periodic Tenancy Agreement</strong> governed by the Housing Act 1988 (as amended)',
      'All parties have read and understood the terms and conditions contained in this agreement',
      'The tenant(s) agree to pay the rent on the dates specified and to comply with all tenant obligations',
      'The landlord(s) agree to comply with all legal obligations including property maintenance and deposit protection',
      'This agreement constitutes a legally binding contract between all parties',
      'Each party has received a copy of this agreement or will receive one upon execution'
    ],
    showWarningNotice = true
  } = declaration || {}

  return `
    <div class="signatures-section">
      <h2>Signatures</h2>
      
      ${showDeclaration ? generateDeclaration(declarationTitle, declarationPoints, showWarningNotice) : ''}
      
      <p class="signature-intro">
        By signing below, all parties agree to the terms and conditions outlined in this tenancy agreement.
      </p>
      
      <div class="signatures-grid">
        ${signatures.map(sig => generateSignatureBlock(sig, styles)).join('')}
      </div>
    </div>
  `
}

/**
 * Generate declaration text before signatures
 */
function generateDeclaration(
  title: string,
  points: string[],
  showNotice: boolean
): string {
  return `
    <div class="signature-declaration">
      <p class="declaration-text">${title}</p>
      <ul class="declaration-list">
        ${points.map(point => `<li>${point}</li>`).join('')}
      </ul>
      ${showNotice ? `
        <p class="declaration-notice">
          <strong>Important:</strong> By signing below, you are entering into a legally binding agreement. 
          All parties should seek independent legal advice if uncertain about any terms.
        </p>
      ` : ''}
    </div>
  `
}

/**
 * Generate individual signature block HTML
 */
function generateSignatureBlock(
  sig: SignatureData,
  styles: AgreementStyleConfig
): string {
  const roleLabel = getRoleLabel(sig.signatoryType)

  return `
    <div class="signature-block">
      <div class="signature-image">
        ${sig.signatureUrl 
          ? `<img src="${sig.signatureUrl}" alt="Signature" />`
          : '<span class="signature-placeholder">Signature</span>'
        }
      </div>
      
      <p class="signature-name">${sig.signatoryName}</p>
      <p class="signature-role">${roleLabel}</p>
      <p class="signature-date">Date: ${formatDate(sig.signedAt)}</p>
      
      ${sig.witnessName ? generateWitnessSection(sig, styles) : ''}
    </div>
  `
}

/**
 * Generate witness section HTML (if applicable)
 */
function generateWitnessSection(
  sig: SignatureData,
  styles: AgreementStyleConfig
): string {
  return `
    <div class="witness-section">
      <p style="font-weight: 600; margin: 0 0 5px; font-size: 10pt;">Witness:</p>
      <p style="margin: 0 0 5px; font-size: 10pt;">${sig.witnessName}</p>
      ${sig.witnessAddress 
        ? `<p style="margin: 0 0 5px; font-size: 9pt; color: ${styles.secondaryColor};">${sig.witnessAddress}</p>`
        : ''
      }
      ${sig.witnessOccupation
        ? `<p style="margin: 0; font-size: 9pt; color: ${styles.secondaryColor};">${sig.witnessOccupation}</p>`
        : ''
      }
    </div>
  `
}

/**
 * Get human-readable role label
 */
function getRoleLabel(type: string): string {
  switch (type) {
    case 'landlord':
      return 'Landlord'
    case 'tenant':
      return 'Tenant'
    case 'witness':
      return 'Witness'
    case 'agent':
      return 'Letting Agent'
    default:
      return type
  }
}

/**
 * Format date for signature display
 */
function formatDate(dateString?: string | null): string {
  if (!dateString) return 'Not signed'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateString
  }
}
