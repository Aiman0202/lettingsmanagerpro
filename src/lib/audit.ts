import { supabase } from '@/lib/supabase'

/**
 * Log an action to the audit_log table.
 * Fire-and-forget — never throws, never blocks the caller.
 */
export function logAudit(params: {
  action: string           // e.g. 'created', 'updated', 'photo_uploaded', 'compliance_added'
  resource: string         // e.g. 'property', 'tenancy', 'compliance'
  resourceId?: string      // UUID of the affected record
  details?: Record<string, any>
}) {
  // Fire asynchronously — do not await
  ;(async () => {
    try {
      await supabase
        .from('audit_log')
        .insert({
          action: params.action,
          resource: params.resource,
          resource_id: params.resourceId ?? null,
          details: params.details ? (params.details as any) : null,
        } as any)
    } catch (err) {
      // Log to console in development for debugging
      if (import.meta.env.DEV) {
        console.warn('Audit log failed:', err)
      }
      // In production, silently ignore — audit logging should never break the app
    }
  })()
}
