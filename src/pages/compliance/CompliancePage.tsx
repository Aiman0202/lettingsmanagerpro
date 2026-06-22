import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ComplianceFormDialog from '@/components/ComplianceFormDialog'
import HomeSafeLicenceDialog from '@/components/HomeSafeLicenceDialog'
import { formatDate, getComplianceStatus } from '@/lib/utils'
import { ShieldCheck, AlertTriangle, CheckCircle, FileCheck, Plus, Download } from 'lucide-react'

const CERT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'gas_safe', label: 'Gas Safe' },
  { value: 'eicr', label: 'EICR' },
  { value: 'epc', label: 'EPC' },
  { value: 'pat', label: 'PAT' },
  { value: 'fire_risk', label: 'Fire Risk' },
  { value: 'legionella', label: 'Legionella' },
  { value: 'other', label: 'Other' },
]

export default function CompliancePage() {
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [editCert, setEditCert] = useState<any>(null)
  const [showLicence, setShowLicence] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)

  const { data: records, isLoading } = useQuery({
    queryKey: ['compliance-all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('property_compliance')
        .select('*, properties(address)')
        .order('expiry_date', { ascending: true })
      return data ?? []
    },
  })

  const { data: licences } = useQuery({
    queryKey: ['home-safe-licences-all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('property_home_safe_licences')
        .select('*, properties(address)')
        .order('created_at', { ascending: false })
      return (data as any[]) ?? []
    },
  })

  const filtered = useMemo(() => {
    if (!records) return []
    return records.filter((r: any) => {
      if (filterType !== 'all' && r.type !== filterType) return false
      if (filterStatus === 'all') return true
      const status = getComplianceStatus(r.expiry_date)
      if (filterStatus === 'valid' && status !== 'valid') return false
      if (filterStatus === 'expiring' && status !== 'expiring_soon') return false
      if (filterStatus === 'expired' && status !== 'expired') return false
      return true
    })
  }, [records, filterType, filterStatus])

  const stats = useMemo(() => {
    if (!records) return { total: 0, valid: 0, expiring: 0, expired: 0 }
    let valid = 0, expiring = 0, expired = 0
    records.forEach((r: any) => {
      const s = getComplianceStatus(r.expiry_date)
      if (s === 'valid') valid++
      else if (s === 'expiring_soon') expiring++
      else expired++
    })
    return { total: records.length, valid, expiring, expired }
  }, [records])

  async function handleDownloadDoc(documentId: string) {
    const { data: doc } = await supabase.from('documents').select('storage_path').eq('id', documentId).single()
    if (!doc) return
    const { data } = await supabase.storage.from('documents').createSignedUrl((doc as any).storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Tracking</h1>
          <p className="text-gray-500 text-sm">Monitor certificates across all properties</p>
        </div>
        <Button onClick={() => { setEditCert(null); setShowForm(true) }}>
          <Plus className="h-4 w-4 mr-1" /> Add Certificate
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileCheck className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Certificates</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
              <p className="text-xs text-gray-500">Valid</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.expiring}</p>
              <p className="text-xs text-gray-500">Expiring (30d)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              <p className="text-xs text-gray-500">Expired</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Home Safe Licences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Home Safe Licences
          </CardTitle>
          <p className="text-sm text-gray-500">Track licensing status across properties</p>
        </CardHeader>
        <CardContent>
          {(licences ?? []).length === 0 ? (
            <p className="text-center text-gray-400 py-6">No licence records yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Licence #</TableHead>
                  <TableHead>Certificates</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Doc</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(licences as any[]).map((lic) => {
                  const certCount = [
                    lic.has_gas_safe, lic.has_eicr, lic.has_epc,
                    lic.has_fire_risk_assessment, lic.has_legionella_risk, lic.has_smoke_co_alarms
                  ].filter(Boolean).length
                  return (
                    <TableRow key={lic.id}>
                      <TableCell className="font-medium">{lic.properties?.address ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          lic.status === 'granted' ? 'success' :
                          lic.status === 'applied' || lic.status === 'under_review' ? 'default' :
                          lic.status === 'rejected' ? 'destructive' : 'secondary'
                        }>{lic.status.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{lic.licence_number ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="success" className="text-xs">{certCount}/6</Badge>
                      </TableCell>
                      <TableCell>{lic.licence_expiry_date ? formatDate(lic.licence_expiry_date) : '—'}</TableCell>
                      <TableCell>
                        {lic.document_id ? (
                          <Button variant="ghost" size="sm" title="Download licence document" onClick={() => handleDownloadDoc(lic.document_id)}>
                            <Download className="h-4 w-4 text-blue-600" />
                          </Button>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => {
                          setSelectedPropertyId(lic.property_id)
                          setShowLicence(true)
                        }}>Manage</Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Timeline view */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Certificate Timeline</CardTitle>
          <p className="text-sm text-gray-500">Certificates grouped by expiry month</p>
        </CardHeader>
        <CardContent>
          <TimelineView records={filtered as any} />
        </CardContent>
      </Card>

      {/* Filters + Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-3 text-lg">
            <span>Full Register</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              {CERT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="valid">Valid</option>
              <option value="expiring">Expiring</option>
              <option value="expired">Expired</option>
            </select>
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Days Remaining</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Doc</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No certificates found</TableCell></TableRow>
            ) : filtered.map((r: any) => {
              const status = getComplianceStatus(r.expiry_date)
              const days = Math.ceil((new Date(r.expiry_date).getTime() - Date.now()) / 86400000)
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.properties?.address ?? '—'}</TableCell>
                  <TableCell><Badge variant="outline">{r.type.replace(/_/g, ' ').toUpperCase()}</Badge></TableCell>
                  <TableCell>{formatDate(r.expiry_date)}</TableCell>
                  <TableCell>{days > 0 ? `${days} days` : `${Math.abs(days)} days ago`}</TableCell>
                  <TableCell>
                    <Badge variant={status === 'valid' ? 'success' : status === 'expiring_soon' ? 'warning' : 'destructive'}>
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">{r.notes ?? '—'}</TableCell>
                  <TableCell>
                    {r.document_id ? (
                      <Button variant="ghost" size="sm" title="Download certificate" onClick={() => handleDownloadDoc(r.document_id)}>
                        <Download className="h-4 w-4 text-blue-600" />
                      </Button>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      {showForm && (
        <ComplianceFormDialog
          open={showForm}
          onClose={() => setShowForm(false)}
          propertyId={editCert?.property_id ?? ''}
          onSaved={() => setShowForm(false)}
        />
      )}

      {selectedPropertyId && (
        <HomeSafeLicenceDialog
          open={showLicence}
          onClose={() => { setShowLicence(false); setSelectedPropertyId(null) }}
          propertyId={selectedPropertyId}
        />
      )}
    </div>
  )
}

function TimelineView({ records }: { records: any[] }) {
  // Group by month
  const groups: Record<string, any[]> = {}
  records.forEach((r) => {
    const month = new Date(r.expiry_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    if (!groups[month]) groups[month] = []
    groups[month].push(r)
  })

  const sortedMonths = Object.keys(groups).sort((a, b) => {
    const pa = a.split(' ')
    const pb = b.split(' ')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months.indexOf(pa[0]) - months.indexOf(pb[0]) || parseInt(pa[1]) - parseInt(pb[1])
  })

  if (sortedMonths.length === 0) {
    return <p className="text-center text-gray-400 py-4">No certificates to display</p>
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {sortedMonths.map((month) => (
        <div key={month} className="min-w-32 flex-shrink-0 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">{month}</p>
          <div className="space-y-1">
            {groups[month].map((r) => {
              const status = getComplianceStatus(r.expiry_date)
              const color = status === 'valid' ? 'bg-green-100 text-green-700 border-green-200' :
                            status === 'expiring_soon' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            'bg-red-100 text-red-700 border-red-200'
              return (
                <div key={r.id} className={`border rounded px-2 py-1 text-xs ${color}`}>
                  <p className="font-medium">{r.type.replace(/_/g, ' ').toUpperCase()}</p>
                  <p className="text-xs opacity-75 truncate">{r.properties?.address ?? ''}</p>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
