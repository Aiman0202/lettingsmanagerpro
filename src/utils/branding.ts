import { supabase } from '@/lib/supabase'

export interface CompanyBranding {
  logoUrl: string | null
  companyName: string
}

/**
 * Fetch company branding data with signed URL for logo.
 * Returns logo URL (if available) and company name as fallback.
 */
export async function getCompanyBranding(): Promise<CompanyBranding> {
  const { data: settings } = await supabase
    .from('company_settings')
    .select('company_name, logo_storage_path')
    .limit(1)
    .single()

  const settingsAny = settings as any
  const companyName = settingsAny?.company_name ?? 'LettingsPro'
  
  let logoUrl: string | null = null
  if (settingsAny?.logo_storage_path) {
    const { data } = await supabase.storage
      .from('company-assets')
      .createSignedUrl(settingsAny.logo_storage_path, 3600) // 1 hour expiry
    logoUrl = data?.signedUrl ?? null
  }

  return { logoUrl, companyName }
}
