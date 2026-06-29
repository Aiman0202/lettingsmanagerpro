/**
 * Agreement Comparison Utility
 * Compares two agreements and identifies changes for renewal tracking.
 */

import { formatDate } from '@/lib/utils'

export interface AgreementComparison {
  rentChanged: boolean
  datesChanged: boolean
  tenantsChanged: boolean
  termsChanged: boolean
  changes: Array<{
    section: string
    oldValue: string
    newValue: string
    type: 'added' | 'removed' | 'modified'
  }>
}

/**
 * Compare old and new agreements to identify all changes.
 */
export function compareAgreements(
  oldAgreement: any,
  newAgreement: any,
  amendments: any[] = []
): AgreementComparison {
  const changes: AgreementComparison['changes'] = []

  // Check rent change
  const oldRent = oldAgreement?.tenancies?.rent_amount
  const newRent = newAgreement?.tenancies?.rent_amount
  if (oldRent !== newRent) {
    changes.push({
      section: 'Rent Amount',
      oldValue: oldRent ? `£${Number(oldRent).toLocaleString()}` : 'Not set',
      newValue: newRent ? `£${Number(newRent).toLocaleString()}` : 'Not set',
      type: 'modified',
    })
  }

  // Check end date change
  const oldEndDate = oldAgreement?.tenancies?.end_date
  const newEndDate = newAgreement?.tenancies?.end_date
  if (oldEndDate !== newEndDate) {
    changes.push({
      section: 'Tenancy End Date',
      oldValue: oldEndDate ? formatDate(oldEndDate) : 'Not set',
      newValue: newEndDate ? formatDate(newEndDate) : 'Not set',
      type: 'modified',
    })
  }

  // Check tenant changes
  const oldTenants = (oldAgreement?.tenancies?.tenancy_tenants ?? [])
    .map((tt: any) => tt?.tenants)
    .filter(Boolean)
  const newTenants = (newAgreement?.tenancies?.tenancy_tenants ?? [])
    .map((tt: any) => tt?.tenants)
    .filter(Boolean)

  const oldTenantNames = oldTenants.map((t: any) => t.full_name).sort()
  const newTenantNames = newTenants.map((t: any) => t.full_name).sort()

  if (JSON.stringify(oldTenantNames) !== JSON.stringify(newTenantNames)) {
    changes.push({
      section: 'Tenants',
      oldValue: oldTenantNames.join(', ') || 'None',
      newValue: newTenantNames.join(', ') || 'None',
      type: 'modified',
    })
  }

  // Include amendments as changes
  amendments.forEach((a) => {
    const typeLabel = a.amendment_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    changes.push({
      section: typeLabel,
      oldValue: a.old_value || 'N/A',
      newValue: a.new_value || 'N/A',
      type: 'modified',
    })
  })

  return {
    rentChanged: changes.some((c) => c.section === 'Rent Amount'),
    datesChanged: changes.some((c) => c.section === 'Tenancy End Date'),
    tenantsChanged: changes.some((c) => c.section === 'Tenants'),
    termsChanged: changes.some(
      (c) => !['Rent Amount', 'Tenancy End Date', 'Tenants'].includes(c.section)
    ),
    changes,
  }
}

/**
 * Generate a summary of changes for display.
 */
export function getChangeSummary(comparison: AgreementComparison): string {
  if (comparison.changes.length === 0) {
    return 'No changes detected'
  }

  const parts: string[] = []

  if (comparison.rentChanged) {
    const change = comparison.changes.find((c) => c.section === 'Rent Amount')
    parts.push(`Rent: ${change?.oldValue} → ${change?.newValue}`)
  }

  if (comparison.datesChanged) {
    const change = comparison.changes.find((c) => c.section === 'Tenancy End Date')
    parts.push(`End date: ${change?.oldValue} → ${change?.newValue}`)
  }

  if (comparison.tenantsChanged) {
    parts.push('Tenant list updated')
  }

  if (comparison.termsChanged) {
    const termChanges = comparison.changes.filter(
      (c) => !['Rent Amount', 'Tenancy End Date', 'Tenants'].includes(c.section)
    )
    parts.push(`${termChanges.length} other change(s)`)
  }

  return parts.join('; ')
}
