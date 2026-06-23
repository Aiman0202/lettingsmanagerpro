export interface PrintOptions {
  appendices: {
    compliance: boolean    // Appendix A
    tenantId: boolean      // Appendix B
    references: boolean    // Appendix C
    signatureLog: boolean  // Appendix D
  }
  pageNumbering: 'arabic' | 'roman' | 'none'
  headerText: string       // Custom header (default: company + property + ref)
  footerText: string       // Custom footer (default: page number + company)
  fontSize: 'small' | 'medium' | 'large'  // 10pt / 12pt / 14pt
}

export const DEFAULT_PRINT_OPTIONS: PrintOptions = {
  appendices: { compliance: true, tenantId: true, references: true, signatureLog: true },
  pageNumbering: 'arabic',
  headerText: '',
  footerText: '',
  fontSize: 'medium',
}

const FONT_SIZE_MAP: Record<PrintOptions['fontSize'], string> = {
  small: '10pt',
  medium: '12pt',
  large: '14pt',
}

export function printOptionsToCssVars(opts: PrintOptions): Record<string, string> {
  return {
    '--agreement-font-size': FONT_SIZE_MAP[opts.fontSize],
    '--agreement-header-text': opts.headerText ? `"${opts.headerText}"` : '""',
    '--agreement-footer-text': opts.footerText ? `"${opts.footerText}"` : '""',
  }
}
