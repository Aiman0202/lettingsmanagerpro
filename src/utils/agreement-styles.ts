/**
 * Centralized Agreement Style Configuration
 * Single source of truth for all agreement styling (print, preview, PDF, council pack)
 */

export interface AgreementStyleConfig {
  // Page layout
  pageWidth: string
  marginTop: string
  marginRight: string
  marginBottom: string
  marginLeft: string
  
  // Typography
  fontFamily: string
  fontSize: string
  lineHeight: string
  headingFontFamily: string
  headingFontSize: string
  
  // Colors
  primaryColor: string
  secondaryColor: string
  textColor: string
  borderColor: string
  
  // Cover page
  showCoverPage: boolean
  coverPageLogo: string | null
  coverPageTitle: string
  
  // Headers/Footers
  showHeader: boolean
  showFooter: boolean
  showPageNumbers: boolean
  
  // Signatures
  signatureLayout: 'side-by-side' | 'stacked'
}

/**
 * Default style configuration for agreements
 */
export const defaultAgreementStyles: AgreementStyleConfig = {
  pageWidth: '210mm',
  marginTop: '20mm',
  marginRight: '15mm',
  marginBottom: '20mm',
  marginLeft: '15mm',
  fontFamily: 'Times New Roman, Times, serif',
  fontSize: '12pt',
  lineHeight: '1.6',
  headingFontFamily: 'Arial, Helvetica, sans-serif',
  headingFontSize: '14pt',
  primaryColor: '#1e40af',
  secondaryColor: '#64748b',
  textColor: '#0f172a',
  borderColor: '#e2e8f0',
  showCoverPage: true,
  coverPageLogo: null,
  coverPageTitle: 'Assured Shorthold Tenancy Agreement',
  showHeader: true,
  showFooter: true,
  showPageNumbers: true,
  signatureLayout: 'side-by-side',
}

/**
 * Generate comprehensive CSS string from style configuration
 * Used in all agreement outputs for consistency
 */
export function generateAgreementCSS(styles: AgreementStyleConfig): string {
  return `
    /* Page Setup */
    @page {
      size: A4;
      margin: ${styles.marginTop} ${styles.marginRight} ${styles.marginBottom} ${styles.marginLeft};
    }
    
    /* Print Optimization */
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
    
    /* Document Base */
    .agreement-document {
      font-family: ${styles.fontFamily};
      font-size: ${styles.fontSize};
      line-height: ${styles.lineHeight};
      color: ${styles.textColor};
      max-width: ${styles.pageWidth};
      margin: 0 auto;
    }
    
    /* Headings */
    .agreement-document h1,
    .agreement-document h2,
    .agreement-document h3 {
      font-family: ${styles.headingFontFamily};
      color: ${styles.primaryColor};
      page-break-after: avoid;
      break-after: avoid-page;
    }
    
    .agreement-document h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 20px;
    }
    
    .agreement-document h2 {
      font-size: ${styles.headingFontSize};
      font-weight: bold;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    
    .agreement-document h3 {
      font-size: 13pt;
      font-weight: 600;
      margin-top: 18px;
      margin-bottom: 10px;
    }
    
    /* Paragraphs */
    .agreement-document p {
      margin-bottom: 12px;
      text-align: justify;
    }
    
    /* Page Breaks */
    .page-break {
      page-break-after: always;
      break-after: page;
      height: 0;
      margin: 0;
      padding: 0;
    }
    
    .page-break-before {
      page-break-before: always;
      break-before: page;
    }
    
    .avoid-page-break {
      page-break-inside: avoid;
      break-inside: avoid-page;
    }
    
    /* Cover Page */
    .cover-page {
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 250mm;
      text-align: center;
      padding: 40px;
    }
    
    .cover-logo {
      max-width: 200px;
      max-height: 100px;
      object-fit: contain;
      margin-bottom: 40px;
    }
    
    .cover-title {
      font-size: 28pt;
      font-weight: bold;
      color: ${styles.primaryColor};
      margin-bottom: 10px;
      font-family: ${styles.headingFontFamily};
    }
    
    .cover-subtitle {
      font-size: 14pt;
      color: ${styles.secondaryColor};
      margin-bottom: 50px;
    }
    
    .cover-divider {
      width: 100px;
      height: 3px;
      background-color: ${styles.primaryColor};
      margin: 30px auto;
    }
    
    .cover-details {
      width: 100%;
      max-width: 500px;
      text-align: left;
      margin: 40px 0;
    }
    
    .cover-detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid ${styles.borderColor};
    }
    
    .cover-label {
      font-weight: 600;
      color: ${styles.secondaryColor};
    }
    
    .cover-value {
      color: ${styles.textColor};
      text-align: right;
    }
    
    /* Signatures Section */
    .signatures-section {
      page-break-before: always;
      break-before: page;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid ${styles.primaryColor};
    }
    
    .signatures-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 40px;
      margin-bottom: 40px;
    }
    
    .signature-block {
      padding: 20px;
      border: 1px solid ${styles.borderColor};
      border-radius: 8px;
      background-color: #fafafa;
    }
    
    .signature-image {
      min-height: 80px;
      margin-bottom: 15px;
      border-bottom: 2px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .signature-image img {
      max-height: 80px;
      max-width: 100%;
    }
    
    .signature-placeholder {
      color: #999;
      font-style: italic;
    }
    
    .signature-name {
      font-weight: 600;
      font-size: ${styles.fontSize};
      margin: 10px 0 5px;
    }
    
    .signature-role {
      font-size: 10pt;
      color: ${styles.secondaryColor};
      margin: 0 0 10px;
    }
    
    .signature-date {
      font-size: 10pt;
      color: ${styles.secondaryColor};
      margin: 0;
    }
    
    .witness-section {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px dashed ${styles.borderColor};
    }
    
    /* Tables */
    .agreement-document table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    
    .agreement-document th,
    .agreement-document td {
      border: 1px solid ${styles.borderColor};
      padding: 8px 12px;
      text-align: left;
    }
    
    .agreement-document th {
      background-color: #f8fafc;
      font-weight: 600;
    }
    
    /* Lists */
    .agreement-document ul,
    .agreement-document ol {
      margin: 12px 0;
      padding-left: 24px;
    }
    
    .agreement-document li {
      margin-bottom: 6px;
    }
    
    /* Merge Fields */
    .merge-field {
      background-color: #fef3c7;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 11pt;
    }
    
    /* Compliance Attachments */
    .compliance-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid ${styles.borderColor};
    }
    
    .compliance-item {
      padding: 8px 0;
      border-bottom: 1px solid ${styles.borderColor};
    }
  `
}

/**
 * Merge custom settings with default styles
 */
export function mergeStyles(
  defaultStyles: AgreementStyleConfig,
  customStyles?: Partial<AgreementStyleConfig>
): AgreementStyleConfig {
  return { ...defaultStyles, ...customStyles }
}
