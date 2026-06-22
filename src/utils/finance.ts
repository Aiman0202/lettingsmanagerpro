import { supabase } from '@/lib/supabase'

export async function generateRentSchedule(
  tenancyId: string,
  startDate: string,
  endDate: string,
  rentAmount: number,
): Promise<number> {
  const transactions: any[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  let current = new Date(start.getFullYear(), start.getMonth(), 1)

  while (current <= end) {
    const dueDate = new Date(current.getFullYear(), current.getMonth(), Math.min(start.getDate(), 28))
    transactions.push({
      tenancy_id: tenancyId,
      amount: rentAmount,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'pending',
    })
    current.setMonth(current.getMonth() + 1)
  }

  if (transactions.length === 0) return 0

  const { error } = await supabase.from('rent_transactions').insert(transactions as any)
  if (error) {
    console.error('Failed to generate rent schedule:', error)
    return 0
  }

  return transactions.length
}

export async function fetchRentSummary(tenancyId: string) {
  const { data } = await supabase
    .from('rent_transactions')
    .select('amount, status')
    .eq('tenancy_id', tenancyId)

  if (!data) return { totalDue: 0, totalPaid: 0, totalOverdue: 0, totalPending: 0 }

  return (data as any[]).reduce(
    (acc, t) => {
      acc.totalDue += t.amount
      if (t.status === 'paid') acc.totalPaid += t.amount
      else if (t.status === 'overdue') acc.totalOverdue += t.amount
      else if (t.status === 'pending') acc.totalPending += t.amount
      return acc
    },
    { totalDue: 0, totalPaid: 0, totalOverdue: 0, totalPending: 0 },
  )
}
