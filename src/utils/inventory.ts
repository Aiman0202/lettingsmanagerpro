/**
 * Inventory management utility functions
 */

export interface ReadinessItem {
  task: string
  completed: boolean
  completed_at?: string
  notes?: string
  photos?: string[]
}

export interface ReadinessChecklist {
  id?: string
  property_id: string
  tenancy_id?: string
  checklist_type: 'pre_tenancy' | 'check_in' | 'check_out'
  items: ReadinessItem[]
  overall_status: 'not_started' | 'in_progress' | 'completed'
  completed_at?: string
  tenant_signature?: string
  agent_signature?: string
}

/**
 * Calculate readiness percentage
 */
export function calculateReadinessPercentage(items: ReadinessItem[]): number {
  if (items.length === 0) return 0
  const completed = items.filter(item => item.completed).length
  return Math.round((completed / items.length) * 100)
}

/**
 * Get readiness status based on items
 */
export function getReadinessStatus(items: ReadinessItem[]): 'not_started' | 'in_progress' | 'completed' {
  if (items.length === 0) return 'not_started'
  const completed = items.filter(item => item.completed).length
  if (completed === 0) return 'not_started'
  if (completed === items.length) return 'completed'
  return 'in_progress'
}

/**
 * Format condition label with color
 */
export function formatConditionLabel(condition: string): { label: string; color: string; bgColor: string } {
  switch (condition) {
    case 'new':
      return { label: 'New', color: 'text-green-700', bgColor: 'bg-green-100' }
    case 'good':
      return { label: 'Good', color: 'text-blue-700', bgColor: 'bg-blue-100' }
    case 'fair':
      return { label: 'Fair', color: 'text-amber-700', bgColor: 'bg-amber-100' }
    case 'poor':
      return { label: 'Poor', color: 'text-orange-700', bgColor: 'bg-orange-100' }
    case 'damaged':
      return { label: 'Damaged', color: 'text-red-700', bgColor: 'bg-red-100' }
    default:
      return { label: condition, color: 'text-gray-700', bgColor: 'bg-gray-100' }
  }
}

/**
 * Validate if readiness checklist is complete
 */
export function validateReadinessComplete(items: ReadinessItem[]): boolean {
  return items.length > 0 && items.every(item => item.completed)
}

/**
 * Format key type label
 */
export function formatKeyType(keyType: string): string {
  return keyType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get key status
 */
export function getKeyStatus(key: any): { label: string; color: string; bgColor: string } {
  if (key.returned_at) {
    return { label: 'Returned', color: 'text-green-700', bgColor: 'bg-green-100' }
  }
  if (key.handed_to_tenant) {
    return { label: 'Handed Out', color: 'text-amber-700', bgColor: 'bg-amber-100' }
  }
  return { label: 'Available', color: 'text-blue-700', bgColor: 'bg-blue-100' }
}

/**
 * Format meter type label
 */
export function formatMeterType(meterType: string): string {
  return meterType.charAt(0).toUpperCase() + meterType.slice(1)
}

/**
 * Format reading type label
 */
export function formatReadingType(readingType: string): { label: string; color: string; bgColor: string } {
  switch (readingType) {
    case 'check_in':
      return { label: 'Check-In', color: 'text-green-700', bgColor: 'bg-green-100' }
    case 'check_out':
      return { label: 'Check-Out', color: 'text-red-700', bgColor: 'bg-red-100' }
    case 'interim':
      return { label: 'Interim', color: 'text-blue-700', bgColor: 'bg-blue-100' }
    default:
      return { label: readingType, color: 'text-gray-700', bgColor: 'bg-gray-100' }
  }
}
