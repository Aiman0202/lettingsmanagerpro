import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Clock, ArrowRight, FileText, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface RenewalHistoryProps {
  tenancyId: string
}

interface RenewalRecord {
  id: string
  tenancy_id: string
  old_end_date: string
  new_end_date: string
  old_rent: number | null
  new_rent: number | null
  renewal_type: 'extension' | 'new_agreement'
  status: 'pending' | 'signed' | 'completed'
  notes: string | null
  amendments_summary: any
  created_at: string
  previous_agreement: { id: string; created_at: string } | null
  new_agreement: { id: string; created_at: string } | null
}

export default function RenewalHistory({ tenancyId }: RenewalHistoryProps) {
  const { data: renewals, isLoading } = useQuery<RenewalRecord[]>({
    queryKey: ['tenancy-renewals', tenancyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenancy_renewals')
        .select(`
          *,
          previous_agreement:previous_agreement_id(id, created_at),
          new_agreement:new_agreement_id(id, created_at)
        `)
        .eq('tenancy_id', tenancyId)
        .order('created_at', { ascending: false })

      return (data as RenewalRecord[]) ?? []
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Clock className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!renewals || renewals.length === 0) {
    return null
  }

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '—'
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'signed':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    return type === 'extension' ? 'Simple Extension' : 'New Agreement'
  }

  const getTypeIcon = (type: string) => {
    return type === 'extension' ? (
      <FileText className="h-4 w-4" />
    ) : (
      <ArrowRight className="h-4 w-4" />
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
        <CheckCircle className="h-4 w-4" />
        Renewal History ({renewals.length})
      </h4>

      <div className="space-y-3">
        {renewals.map((renewal, idx) => (
          <div
            key={renewal.id}
            className="p-4 border border-gray-200 rounded-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  {getTypeIcon(renewal.renewal_type)}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <strong className="text-sm">
                      {getTypeLabel(renewal.renewal_type)}
                    </strong>
                    <Badge className={getStatusColor(renewal.status)}>
                      {renewal.status}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span>{fmtDate(renewal.old_end_date)}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>{fmtDate(renewal.new_end_date)}</span>
                    </div>

                    {(renewal.old_rent || renewal.new_rent) && (
                      <div className="flex items-center gap-2">
                        {renewal.old_rent && (
                          <span className="line-through text-gray-400">
                            {formatCurrency(renewal.old_rent)}
                          </span>
                        )}
                        {renewal.old_rent && renewal.new_rent && (
                          <ArrowRight className="h-3 w-3" />
                        )}
                        {renewal.new_rent && (
                          <span className="font-semibold text-green-700">
                            {formatCurrency(renewal.new_rent)}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">/month</span>
                      </div>
                    )}

                    {renewal.notes && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        {renewal.notes}
                      </p>
                    )}
                  </div>

                  {renewal.amendments_summary && (
                    <div className="mt-2 text-xs text-gray-500">
                      {Array.isArray(renewal.amendments_summary)
                        ? `${renewal.amendments_summary.length} amendment(s) at time of renewal`
                        : 'Amendments recorded'}
                    </div>
                  )}
                </div>
              </div>

              {renewal.new_agreement && (
                <Badge variant="outline" className="text-xs">
                  Agreement #{idx + 1}
                </Badge>
              )}
            </div>

            <div className="mt-2 text-xs text-gray-400">
              Created {fmtDate(renewal.created_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
