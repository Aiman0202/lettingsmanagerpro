/**
 * Payment receipt utilities — balance calculator and period helpers.
 */

export interface RentTxn {
  id: string
  due_date: string
  amount: number
  amount_paid: number | null
  paid_date: string | null
  status: string
  payment_method?: string | null
  period_start?: string | null
  period_end?: string | null
  receipt_number?: string | null
  balance_after?: number | null
}

export interface ReceiptData {
  receiptNumber: string
  tenantName: string
  propertyAddress: string
  tenancyRef: string
  amount: number
  amountPaid: number
  periodStart: string
  periodEnd: string
  paidDate: string
  paymentMethod: string
  balanceAfter: number
  balanceBefore: number
  totalDue: number
  totalPaid: number
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  logoUrl: string | null
}

/**
 * Calculate the payment period (first-to-last day of month) from a due date.
 */
export function calculatePeriod(dueDate: string): { start: string; end: string } {
  const d = new Date(dueDate)
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

/**
 * Calculate running balance across an array of rent transactions.
 * Positive balance = arrears (tenant owes money).
 * Zero or negative = fully paid / credit.
 */
export function calculateRunningBalance(
  transactions: RentTxn[],
): { balance: number; map: Map<string, { balanceBefore: number; balanceAfter: number }> } {
  const sorted = [...transactions].sort((a, b) =>
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
  )
  let running = 0
  const map = new Map<string, { balanceBefore: number; balanceAfter: number }>()
  for (const txn of sorted) {
    const before = running
    const paid = txn.amount_paid ?? (txn.status === 'paid' ? txn.amount : 0)
    running += txn.amount - paid
    map.set(txn.id, { balanceBefore: before, balanceAfter: running })
  }
  return { balance: running, map }
}

/**
 * Format a period as a human-readable string.
 */
export function formatPeriod(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}
