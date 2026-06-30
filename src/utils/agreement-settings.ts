/**
 * Agreement Layout Settings Utility
 * 
 * Loads layout settings from database and generates CSS for agreement HTML generation.
 */

import { supabase } from '@/lib/supabase'

export interface AgreementLayoutSettings {
  // Page Setup
  page_size: string
  page_orientation: string
  margin_top: string
  margin_right: string
  margin_bottom: string
  margin_left: string
  
  // Typography
  font_family: string
  base_font_size: string
  line_height: number
  heading1_size: string
  heading2_size: string
  heading3_size: string
  
  // Colors
  heading_color: string
  text_color: string
  border_color: string
  
  // Cover Page
  logo_max_height: string
  logo_max_width: string
  cover_title_size: string
  cover_subtitle_size: string
  show_cover_page: boolean
  
  // Signatures
  signature_image_height: string
  signature_block_spacing: string
  show_signatures_inline: boolean
  show_signature_page: boolean
  
  // Footer
  footer_text: string
  show_page_numbers: boolean
  page_number_position: string

  // Watermark
  show_watermark_logo: boolean
  watermark_opacity: number
}

export function getDefaultSettings(): AgreementLayoutSettings {
  return {
    page_size: 'A4',
    page_orientation: 'portrait',
    margin_top: '20mm',
    margin_right: '15mm',
    margin_bottom: '25mm',
    margin_left: '15mm',
    
    font_family: 'Times New Roman',
    base_font_size: '11pt',
    line_height: 1.8,
    heading1_size: '28pt',
    heading2_size: '16pt',
    heading3_size: '13pt',
    
    heading_color: '#1a1a1a',
    text_color: '#000000',
    border_color: '#333333',
    
    logo_max_height: '80px',
    logo_max_width: '250px',
    cover_title_size: '28pt',
    cover_subtitle_size: '14pt',
    show_cover_page: true,
    
    signature_image_height: '60px',
    signature_block_spacing: '40px',
    show_signatures_inline: false,
    show_signature_page: true,
    
    footer_text: 'This agreement is generated on {date}',
    show_page_numbers: true,
    page_number_position: 'bottom-center',

    // Watermark
    show_watermark_logo: false,
    watermark_opacity: 0.08,
  }
}

/**
 * Load agreement layout settings from database.
 * Falls back to defaults if not found.
 */
export async function loadAgreementSettings(): Promise<AgreementLayoutSettings> {
  try {
    const { data, error } = await supabase
      .from('agreement_layout_settings')
      .select('*')
      .eq('key', 'default')
      .single()
    
    if (error || !data) {
      console.warn('Failed to load agreement settings, using defaults:', error?.message)
      return getDefaultSettings()
    }
    
    // Merge with defaults to ensure new fields always have values
    const defaults = getDefaultSettings()
    const loaded = data as Partial<AgreementLayoutSettings>
    return { ...defaults, ...loaded } as AgreementLayoutSettings
  } catch (err) {
    console.error('Error loading agreement settings:', err)
    return getDefaultSettings()
  }
}

/**
 * Generate CSS string from layout settings.
 */
export function generateSettingsCSS(settings: AgreementLayoutSettings): string {
  const pageNumbersCSS = settings.show_page_numbers 
    ? `@bottom-center { 
        content: "Page " counter(page) " of " counter(pages); 
        font-size: 10pt; 
        color: #666; 
      }`
    : ''

  return `
    @page { 
      size: ${settings.page_size} ${settings.page_orientation}; 
      margin: ${settings.margin_top} ${settings.margin_right} ${settings.margin_bottom} ${settings.margin_left};
      ${pageNumbersCSS}
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body { 
      font-family: '${settings.font_family}', Times, serif; 
      color: ${settings.text_color}; 
      line-height: ${settings.line_height};
      font-size: ${settings.base_font_size};
    }
    
    /* Cover Page */
    .cover-page { 
      page-break-after: ${settings.show_cover_page ? 'always' : 'none'}; 
      padding: 60px 40px;
      text-align: center;
    }
    
    .cover-page img { 
      max-height: ${settings.logo_max_height}; 
      max-width: ${settings.logo_max_width}; 
      margin-bottom: 40px; 
    }
    
    .cover-page h1 { 
      font-size: ${settings.cover_title_size}; 
      font-weight: bold; 
      margin: 30px 0 20px;
      color: ${settings.heading_color};
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .cover-page .subtitle {
      font-size: ${settings.cover_subtitle_size};
      color: #666;
      margin-bottom: 50px;
    }
    
    .cover-details {
      text-align: left;
      max-width: 600px;
      margin: 0 auto;
      background: #f9f9f9;
      padding: 30px;
      border: 2px solid ${settings.border_color};
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
      padding: 30px 50px;
    }
    
    .agreement-content {
      line-height: ${settings.line_height};
      font-size: ${settings.base_font_size};
    }
    
    .agreement-content h1 {
      font-size: ${settings.heading1_size};
      font-weight: bold;
      margin: 35px 0 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid ${settings.border_color};
      page-break-after: avoid;
      page-break-inside: avoid;
      color: ${settings.heading_color};
    }
    
    .agreement-content h2 {
      font-size: ${settings.heading2_size};
      font-weight: bold;
      margin: 30px 0 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid ${settings.border_color};
      page-break-after: avoid;
      page-break-inside: avoid;
      color: ${settings.heading_color};
    }
    
    .agreement-content h3 {
      font-size: ${settings.heading3_size};
      font-weight: bold;
      margin: 25px 0 12px;
      page-break-after: avoid;
      page-break-inside: avoid;
      color: ${settings.heading_color};
    }
    
    .agreement-content p {
      margin: 12px 0;
      text-align: justify;
      line-height: ${settings.line_height};
      orphans: 3;
      widows: 3;
    }
    
    /* Signatures */
    .inline-signatures {
      page-break-before: auto;
      margin: ${settings.signature_block_spacing} 0;
      padding: 30px;
      border-top: 2px solid ${settings.border_color};
    }
    
    .section-title {
      font-size: ${settings.heading2_size};
      font-weight: bold;
      margin-bottom: 30px;
      text-align: center;
      color: ${settings.heading_color};
    }
    
    .section-subtitle {
      text-align: center;
      margin-bottom: 30px;
      color: #666;
      font-size: 10pt;
    }
    
    .signature-card {
      display: inline-block;
      width: 48%;
      margin: 8px 1%;
      vertical-align: top;
      padding: 12px;
      border: 1px solid #ddd;
      background: #fafafa;
    }
    
    .signature-role {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 15px;
      color: #333;
    }
    
    .signature-image {
      max-width: 100px;
      max-height: ${settings.signature_image_height};
      margin: 8px 0;
      border-bottom: 1px solid #999;
    }
    
    .signature-image-large {
      max-width: 100px;
      max-height: 40px;
    }
    
    .signature-image-witness {
      max-width: 200px;
      max-height: 80px;
    }
    
    .signature-info {
      font-size: 10pt;
      margin: 10px 0 5px;
    }
    
    .signature-date {
      font-size: 10pt;
      color: #666;
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
      color: ${settings.heading_color};
    }
    
    .signature-line {
      margin: 30px 0 10px;
      border-top: 1px solid ${settings.border_color};
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
    
    .signature-page {
      page-break-before: always;
      padding: 40px;
    }
    
    .signature-page h2 {
      font-size: ${settings.heading2_size};
      font-weight: bold;
      margin-bottom: 30px;
      text-align: center;
      color: ${settings.heading_color};
    }
    
    /* Footer */
    .footer {
      margin-top: 40px;
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
      font-size: 11px;
      color: #999;
      text-align: center;
    }
    
    /* Tables */
    .agreement-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
      page-break-inside: avoid;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .agreement-content table th,
    .agreement-content table td {
      border: 1px solid ${settings.border_color};
      padding: 12px;
      text-align: left;
      font-size: ${settings.base_font_size};
    }
    
    .agreement-content table th {
      background: #f3f4f6;
      font-weight: 600;
      color: #374151;
    }
    
    /* Appendices */
    .appendices {
      page-break-before: always;
      padding: 30px 50px;
    }
    
    .appendices h2 {
      font-size: ${settings.heading2_size};
      font-weight: bold;
      margin: 30px 0 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid ${settings.border_color};
      color: ${settings.heading_color};
    }
    
    .compliance-list {
      list-style: none;
      padding: 0;
    }
    
    .compliance-list li {
      padding: 15px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      margin-bottom: 12px;
      background: #f9fafb;
    }
    
    .compliance-detail {
      margin: 5px 0;
      font-size: 10pt;
    }
    
    /* Close Button (Screen Only) */
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
      transition: all 0.2s;
    }
    
    .close-button:hover {
      background: #dc2626;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.4);
    }
    
    /* Renewal Notice */
    .renewal-notice {
      margin: 30px 0;
      padding: 20px;
      background: #fffbeb;
      border: 2px solid #f59e0b;
      border-radius: 8px;
    }
    
    .renewal-notice h3 {
      font-size: 14pt;
      font-weight: bold;
      color: #92400e;
      margin-bottom: 10px;
    }
    
    .renewal-notice p {
      font-size: 10pt;
      color: #78350f;
      margin-bottom: 15px;
    }
    
    .changes-list {
      background: white;
      padding: 15px;
      border-radius: 4px;
    }
    
    .change-item {
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
      font-size: 10pt;
    }
    
    .change-item:last-child {
      border-bottom: none;
    }
    
    .old-value {
      text-decoration: line-through;
      color: #999;
      margin-right: 5px;
    }
    
    .new-value {
      color: #059669;
      font-weight: bold;
    }
    
    .change-item.added .new-value {
      color: #059669;
    }
    
    .change-item.removed .old-value {
      color: #dc2626;
    }
    
    .change-item.modified .new-value {
      color: #059669;
    }
    
    /* Page Break Controls */
    hr {
      border: none;
      border-top: 2px dashed #999;
      margin: 20px 0;
      page-break-after: always;
    }
    
    .no-page-break {
      page-break-inside: avoid;
    }
    
    .page-break-before {
      page-break-before: always;
    }
    
    .page-break-after {
      page-break-after: always;
    }
    
    /* ── CSS Class-based Formatting ── */
    
    /* Text colours */
    .tc-000000 { color: #000000; } .tc-434343 { color: #434343; }
    .tc-666666 { color: #666666; } .tc-999999 { color: #999999; }
    .tc-b7b7b7 { color: #b7b7b7; } .tc-cccccc { color: #cccccc; }
    .tc-d9d9d9 { color: #d9d9d9; } .tc-efefef { color: #efefef; }
    .tc-f3f3f3 { color: #f3f3f3; } .tc-ffffff { color: #ffffff; }
    .tc-980000 { color: #980000; } .tc-ff0000 { color: #ff0000; }
    .tc-ff9900 { color: #ff9900; } .tc-ffff00 { color: #ffff00; }
    .tc-00ff00 { color: #00ff00; } .tc-00ffff { color: #00ffff; }
    .tc-4a86e8 { color: #4a86e8; } .tc-0000ff { color: #0000ff; }
    .tc-9900ff { color: #9900ff; } .tc-ff00ff { color: #ff00ff; }
    
    /* Highlight colours */
    .hl-yellow { background-color: #ffff00; } .hl-green { background-color: #00ff00; }
    .hl-cyan { background-color: #00ffff; }   .hl-magenta { background-color: #ff00ff; }
    .hl-orange { background-color: #ff8000; } .hl-gray { background-color: #808080; }
    .hl-silver { background-color: #c0c0c0; } .hl-red { background-color: #ff0000; }
    .hl-springgreen { background-color: #00ff80; } .hl-dodgerblue { background-color: #0080ff; }
    
    /* Font families */
    .ff-arial { font-family: 'Arial', sans-serif; }
    .ff-times { font-family: 'Times New Roman', serif; }
    .ff-courier { font-family: 'Courier New', monospace; }
    .ff-georgia { font-family: 'Georgia', serif; }
    .ff-verdana { font-family: 'Verdana', sans-serif; }
    
    /* Font sizes */
    .fs-8 { font-size: 8pt; }   .fs-10 { font-size: 10pt; }
    .fs-12 { font-size: 12pt; } .fs-14 { font-size: 14pt; }
    .fs-16 { font-size: 16pt; } .fs-18 { font-size: 18pt; }
    .fs-24 { font-size: 24pt; } .fs-30 { font-size: 30pt; }
    
    /* Text alignment */
    .ta-left { text-align: left; }    .ta-center { text-align: center; }
    .ta-right { text-align: right; }  .ta-justify { text-align: justify; }
    
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
      .close-button { display: none !important; }
      /* Preserve highlight colours when printing */
      .hl-yellow, .hl-green, .hl-cyan, .hl-magenta,
      .hl-orange, .hl-gray, .hl-silver, .hl-red,
      .hl-springgreen, .hl-dodgerblue {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  `
}

/**
 * Validate settings values.
 * Returns array of error messages (empty if valid).
 */
export function validateSettings(settings: Partial<AgreementLayoutSettings>): string[] {
  const errors: string[] = []
  
  // Validate margin/size fields have units
  const unitFields = [
    'margin_top', 'margin_right', 'margin_bottom', 'margin_left',
    'base_font_size', 'heading1_size', 'heading2_size', 'heading3_size',
    'logo_max_height', 'logo_max_width', 'cover_title_size', 'cover_subtitle_size',
    'signature_image_height', 'signature_block_spacing'
  ]
  
  for (const field of unitFields) {
    const value = (settings as any)[field]
    if (value && !/(mm|pt|px|rem|em|%)$/.test(value)) {
      errors.push(`${field} must include units (mm, pt, px, etc.)`)
    }
  }
  
  // Validate line height is a number
  if (settings.line_height !== undefined && (isNaN(settings.line_height) || settings.line_height < 1 || settings.line_height > 3)) {
    errors.push('Line height must be between 1 and 3')
  }
  
  // Validate colors are valid hex
  const colorFields = ['heading_color', 'text_color', 'border_color']
  for (const field of colorFields) {
    const value = (settings as any)[field]
    if (value && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
      errors.push(`${field} must be a valid hex color (e.g., #1a1a1a)`)
    }
  }
  
  return errors
}
