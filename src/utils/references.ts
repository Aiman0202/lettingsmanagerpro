import { supabase } from '@/lib/supabase'

/**
 * Generate the next sequential reference number for a table.
 * Queries existing references, extracts numeric suffix, increments by 1.
 * Format: PRP-0001, TNC-0001, etc. (4-digit zero-padded).
 */
export async function generateNextReference(
  prefix: string,
  table: 'properties' | 'tenancies',
): Promise<string> {
  const { data } = await (supabase
    .from(table)
    .select('reference_number')
    .order('reference_number', { ascending: false })
    .limit(1) as any)

  const rows = data as any[] | null

  if (!rows || rows.length === 0) {
    return `${prefix}-0001`
  }

  const lastRef = rows[0].reference_number as string
  // Extract numeric portion after the prefix and hyphen
  const match = lastRef.match(new RegExp(`^${prefix}-(\\d+)$`))
  const lastNum = match ? parseInt(match[1], 10) : 0
  const nextNum = lastNum + 1

  return `${prefix}-${String(nextNum).padStart(4, '0')}`
}
