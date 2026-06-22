import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, Search, ClipboardList } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate, formatCurrency } from '@/lib/utils'

export default function TenanciesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: tenancies, isLoading } = useQuery({
    queryKey: ['tenancies', search, statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('tenancies')
        .select(`
          id, reference_number, status, start_date, end_date, rent_amount, deposit_amount,
          properties(address, postcode),
          landlords(full_name),
          tenancy_tenants(tenants(full_name))
        `)
        .order('start_date', { ascending: false })

      if (statusFilter) q = q.eq('status', statusFilter)
      if (search) {
        q = q.or(`reference_number.ilike.%${search}%,properties.address.ilike.%${search}%`)
      }

      const { data } = await q
      return data ?? []
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenancies</h1>
          <p className="text-gray-500 text-sm mt-1">{tenancies?.length ?? 0} records</p>
        </div>
        <Link to="/tenancies/new">
          <Button>
            <Plus className="h-4 w-4" /> New Tenancy
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by property or ref (e.g. TNC-0001)..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="ending_soon">Ending soon</option>
              <option value="expired">Expired</option>
              <option value="ended">Ended</option>
              <option value="draft">Draft</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Tenants</TableHead>
              <TableHead>Landlord</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Rent/mo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-10 text-gray-400">Loading…</TableCell></TableRow>
            ) : (tenancies ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-400">No tenancies found</p>
                </TableCell>
              </TableRow>
            ) : (tenancies ?? []).map((t: any) => (
              <TableRow key={t.id}>
                <TableCell className="text-xs font-mono text-gray-500">{t.reference_number}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900">{t.properties?.address ?? '—'}</p>
                    <p className="text-xs text-gray-400">{t.properties?.postcode}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {(t.tenancy_tenants ?? []).map((tt: any) => tt.tenants?.full_name).join(', ') || '—'}
                </TableCell>
                <TableCell>{t.landlords?.full_name ?? '—'}</TableCell>
                <TableCell>{formatDate(t.start_date)}</TableCell>
                <TableCell>{formatDate(t.end_date)}</TableCell>
                <TableCell>{formatCurrency(t.rent_amount)}</TableCell>
                <TableCell>
                  <Badge variant={
                    t.status === 'active' ? 'success' :
                    t.status === 'ending_soon' ? 'warning' :
                    t.status === 'expired' || t.status === 'ended' ? 'secondary' : 'outline'
                  }>
                    {t.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link to={`/tenancies/${t.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
