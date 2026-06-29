import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Pencil } from 'lucide-react'

interface AmendmentHistoryProps {
  tenancyId: string
}

export default function AmendmentHistory({ tenancyId }: AmendmentHistoryProps) {
  const { data: amendments, isLoading } = useQuery({
    queryKey: ['tenancy-amendments', tenancyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenancy_amendments')
        .select('*')
        .eq('tenancy_id', tenancyId)
        .order('effective_date', { ascending: true })
      return data ?? []
    },
  })

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 py-2">Loading amendments...</div>
    )
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      rent_change: 'Rent Change',
      tenant_add: 'Tenant Added',
      tenant_remove: 'Tenant Removed',
      other: 'Other',
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      rent_change: 'bg-blue-100 text-blue-800',
      tenant_add: 'bg-green-100 text-green-800',
      tenant_remove: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Pencil className="h-4 w-4 text-gray-500" />
        <h4 className="text-sm font-semibold">Amendments During This Tenancy</h4>
        {amendments && amendments.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {amendments.length}
          </Badge>
        )}
      </div>
      
      {!amendments || amendments.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No amendments recorded during this tenancy</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {amendments.map((a: any) => (
            <div key={a.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Badge className={`text-xs ${getTypeColor(a.amendment_type)}`}>
                  {getTypeLabel(a.amendment_type)}
                </Badge>
                <span className="text-xs text-gray-500">{formatDate(a.effective_date)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <span className="line-through text-red-600 font-medium">{a.old_value}</span>
                <span className="text-gray-400">→</span>
                <span className="text-green-600 font-semibold">{a.new_value}</span>
              </div>
              
              {a.reason && (
                <p className="text-xs text-gray-600 mt-2 italic">"{a.reason}"</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
