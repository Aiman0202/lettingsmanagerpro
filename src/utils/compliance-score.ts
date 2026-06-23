/**
 * Property Readiness Score calculator.
 * Checks mandatory compliance items (gas_safe, eicr, epc) and returns a 0–100 score.
 */

export interface ComplianceItem {
  type: string
  expiry_date: string | null
}

export interface ReadinessResult {
  score: number           // 0–100
  status: 'ready' | 'attention' | 'not_ready'
  items: {
    type: string
    state: 'valid' | 'expiring' | 'expired' | 'missing'
    daysUntilExpiry?: number
  }[]
}

const REQUIRED_TYPES = ['gas_safe', 'eicr', 'epc']

export function calculateReadinessScore(compliance: ComplianceItem[]): ReadinessResult {
  const today = new Date()
  const items: ReadinessResult['items'] = []
  let score = 0
  const perItem = Math.round(100 / REQUIRED_TYPES.length) // ~33

  for (const type of REQUIRED_TYPES) {
    const record = compliance.find((c) => c.type === type)
    if (!record || !record.expiry_date) {
      items.push({ type, state: 'missing' })
      continue
    }
    const expiry = new Date(record.expiry_date)
    const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (days < 0) {
      items.push({ type, state: 'expired', daysUntilExpiry: days })
    } else if (days <= 30) {
      items.push({ type, state: 'expiring', daysUntilExpiry: days })
      score += Math.round(perItem / 2) // ~16
    } else {
      items.push({ type, state: 'valid', daysUntilExpiry: days })
      score += perItem // ~33
    }
  }

  const status: ReadinessResult['status'] =
    score >= 100 ? 'ready' :
    score >= Math.round(100 / REQUIRED_TYPES.length) ? 'attention' : 'not_ready'

  return { score: Math.min(score, 100), status, items }
}

export function readinessColor(status: ReadinessResult['status']): string {
  return status === 'ready' ? 'text-green-600 bg-green-50 border-green-200'
    : status === 'attention' ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-red-600 bg-red-50 border-red-200'
}

export function readinessLabel(status: ReadinessResult['status']): string {
  return status === 'ready' ? 'Ready' : status === 'attention' ? 'Needs Attention' : 'Not Ready'
}
