import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, FileText, Calendar, PoundSterling, Users, Plus, ClipboardCheck, AlertTriangle, ClipboardList, ChevronDown, ChevronRight, RefreshCw, Pencil, FilePen, PenLine, Send, CheckCircle, Eye, Loader2, Receipt } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { fetchTenancyTimeline } from '@/utils/timeline'
import { generateAgreementForTenancy } from '@/utils/agreements'
import PropertyDossierViewer from '@/components/PropertyDossierViewer'
import ChecklistFormDialog from '@/components/ChecklistFormDialog'
import TerminationFormDialog from '@/components/TerminationFormDialog'
import InspectionFormDialog from '@/components/InspectionFormDialog'
import RenewalFormDialog from '@/components/RenewalFormDialog'
import AmendmentFormDialog from '@/components/AmendmentFormDialog'
import AgreementPreviewDialog from '@/components/AgreementPreviewDialog'
import SignatureCaptureModal from '@/pages/agreements/SignatureCaptureModal'
import CouncilSubmissionDialog from '@/components/CouncilSubmissionDialog'
import PaymentReceiptDialog from '@/components/PaymentReceiptDialog'
import { calculateRunningBalance } from '@/utils/receipt'

export default function TenancyDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'agreement'>('overview')
  const [showDossier, setShowDossier] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)
  const [checklistType, setChecklistType] = useState<'move_in' | 'move_out'>('move_in')
  const [showTermination, setShowTermination] = useState(false)
  const [showInspection, setShowInspection] = useState(false)
  const [showRenewal, setShowRenewal] = useState(false)
  const [showAmendment, setShowAmendment] = useState(false)
  const [showMoveOutAfterTermination, setShowMoveOutAfterTermination] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showSign, setShowSign] = useState(false)
  const [showCouncil, setShowCouncil] = useState(false)
  const [creatingAgreement, setCreatingAgreement] = useState(false)
  const [receiptTxn, setReceiptTxn] = useState<any>(null)

  // Workflow transition dialogs
  const [showSignCompleteDialog, setShowSignCompleteDialog] = useState(false)
  const [showRenewPromptDialog, setShowRenewPromptDialog] = useState(false)

  const { data: companySettings } = useQuery({
    queryKey: ['company-settings-tenancy'],
    queryFn: async () => {
      const { data } = await supabase.from('company_settings').select('company_name, logo_storage_path, address_line1, city, postcode, phone, email').single()
      return data as any
    },
  })

  const companyLogoUrl = companySettings?.logo_storage_path
    ? supabase.storage.from('company-assets').getPublicUrl(companySettings.logo_storage_path).data.publicUrl
    : null

  const { data: tenancy, isLoading } = useQuery({
    queryKey: ['tenancy-detail', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenancies')
        .select(`
          *,
          properties(address, postcode, type, bedrooms, bathrooms, landlords(full_name)),
          landlords(full_name, email, phone),
          tenancy_tenants(tenants(full_name, email, phone))
        `)
        .eq('id', id!)
        .single()
      return data
    },
  })

  const { data: rentTxns } = useQuery({
    queryKey: ['tenancy-rent', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('rent_transactions')
        .select('*')
        .eq('tenancy_id', id!)
        .order('due_date', { ascending: true })
      return data ?? []
    },
  })

  const { data: inspections } = useQuery({
    queryKey: ['tenancy-inspections', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenancy_inspections')
        .select('*')
        .eq('tenancy_id', id!)
        .order('inspection_date', { ascending: false })
      return data ?? []
    },
  })

  const { data: checklists } = useQuery({
    queryKey: ['tenancy-checklists', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenancy_checklists')
        .select('*')
        .eq('tenancy_id', id!)
        .order('created_at', { ascending: false })
      return data ?? []
    },
  })

  const { data: termination } = useQuery({
    queryKey: ['tenancy-termination', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenancy_terminations')
        .select('*')
        .eq('tenancy_id', id!)
        .maybeSingle()
      return data as any
    },
  })

  const { data: timelineEvents } = useQuery({
    queryKey: ['tenancy-timeline', id],
    queryFn: () => fetchTenancyTimeline(id!),
    enabled: !!id,
  })

  const { data: agreement, isLoading: agreementLoading } = useQuery({
    queryKey: ['tenancy-agreement', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('generated_agreements')
        .select('*, agreement_signatures(*), agreement_attachments(*)')
        .eq('tenancy_id', id!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data as any ?? null
    },
    enabled: !!id,
  })

  async function handleCreateAgreement() {
    setCreatingAgreement(true)
    await generateAgreementForTenancy(id!)
    await qc.invalidateQueries({ queryKey: ['tenancy-agreement', id] })
    setCreatingAgreement(false)
  }

  function handleAgreementSigned() {
    setShowSignCompleteDialog(true)
  }

  function handleRenewed() {
    setShowRenewPromptDialog(true)
  }

  if (isLoading) return <div className="p-6 text-gray-400">Loading…</div>
  if (!tenancy) return <div className="p-6 text-gray-400">Tenancy not found.</div>

  const t = tenancy as any
  const tenants = (t.tenancy_tenants ?? []).map((tt: any) => tt.tenants)
  const property = t.properties
  const hasMoveInChecklist = (checklists as any[] ?? []).some((c: any) => c.type === 'move_in')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/tenancies">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenancy Details</h1>
          <p className="text-gray-500 text-sm">
            <span className="font-mono text-xs bg-gray-100 rounded px-1.5 py-0.5 mr-1.5">{t.reference_number}</span>
            {property?.address} — {tenants.map((t: any) => t?.full_name).join(', ')}
          </p>
        </div>
        <Badge variant={t.status === 'active' ? 'success' : t.status === 'expired' || t.status === 'ended' ? 'destructive' : 'warning'} className="ml-auto">
          {t.status}
        </Badge>
        <Button onClick={() => setShowDossier(true)}>
          <FileText className="h-4 w-4 mr-1" /> Property Dossier
        </Button>
        {(t.status === 'ending_soon' || t.status === 'expired') && (
          <Button variant="outline" className="border-green-500 text-green-700 hover:bg-green-50" onClick={() => setShowRenewal(true)}>
            <RefreshCw className="h-4 w-4 mr-1" /> Renew
          </Button>
        )}
        {t.status === 'active' && (
          <Button variant="outline" onClick={() => setShowAmendment(true)}>
            <Pencil className="h-4 w-4 mr-1" /> Amend
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500">Start Date</p>
              <p className="text-sm font-semibold">{formatDate(t.start_date)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">End Date</p>
              <p className="text-sm font-semibold">{formatDate(t.end_date)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <PoundSterling className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-xs text-gray-500">Monthly Rent</p>
              <p className="text-sm font-semibold">{formatCurrency(t.rent_amount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-xs text-gray-500">Deposit</p>
              <p className="text-sm font-semibold">{formatCurrency(t.deposit_amount)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Progress */}
      <Card className="no-print">
        <CardContent className="p-3">
          <div className="flex items-center justify-center gap-0">
            {[
              { key: 'agreement', label: 'Agreement', done: !!agreement },
              { key: 'sign', label: 'Sign', done: agreement?.status === 'signed' },
              { key: 'movein', label: 'Move-In', done: hasMoveInChecklist },
              { key: 'active', label: 'Active', done: t.status === 'active' },
            ].map((step, i, arr) => (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    step.done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.done ? <CheckCircle className="h-4 w-4" /> : <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />}
                  </div>
                  <span className={`text-[11px] mt-1 whitespace-nowrap ${
                    step.done ? 'text-green-700 font-medium' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`w-8 sm:w-16 h-px mx-1 sm:mx-2 mb-5 ${
                    step.done ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
            {(t.status === 'ending_soon' || t.status === 'expired' || t.status === 'active') && agreement?.status === 'signed' && hasMoveInChecklist && (
              <>
                <div className="w-8 sm:w-16 h-px mx-1 sm:mx-2 mb-5 bg-amber-200" />
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center bg-amber-100 text-amber-700">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[11px] mt-1 text-amber-700 font-medium whitespace-nowrap">Renew / End</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-gray-200">
        {([
          { key: 'overview', label: 'Overview' },
          { key: 'agreement', label: 'Agreement' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
            {tab.key === 'agreement' && agreement && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                agreement.status === 'signed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {agreement.status === 'signed' ? 'Signed' : 'Pending'}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========== OVERVIEW TAB ========== */}
      {activeTab === 'overview' && (
      <div className="space-y-6">

      {/* Parties */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Property</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{property?.address}</p>
            <p className="text-gray-500">{property?.postcode}</p>
            <p className="text-gray-500">{property?.type} · {property?.bedrooms} bed · {property?.bathrooms} bath</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Landlord</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{t.landlords?.full_name}</p>
            <p className="text-gray-500">{t.landlords?.email}</p>
            <p className="text-gray-500">{t.landlords?.phone ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Tenants</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            {tenants.length === 0 ? (
              <p className="text-gray-400">No tenants linked</p>
            ) : tenants.map((t: any, i: number) => (
              <div key={t.id} className="border-b pb-2 last:border-0">
                <p className="font-medium">{t.full_name} {i === 0 && <Badge variant="outline" className="text-xs ml-1">Lead</Badge>}</p>
                <p className="text-gray-500 text-xs">{t.email} · {t.phone ?? '—'}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Rent Schedule */}
      <Card>
        <CardHeader><CardTitle>Rent Schedule</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Paid Date</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(() => {
              const txns = (rentTxns as any[] ?? [])
              if (txns.length === 0) {
                return <TableRow><TableCell colSpan={7} className="text-center text-gray-400 py-6">No rent transactions</TableCell></TableRow>
              }
              const { balance, map } = calculateRunningBalance(txns)
              const totalDue = txns.reduce((s, r) => s + r.amount, 0)
              const totalPaid = txns.reduce((s, r) => s + (r.amount_paid ?? (r.status === 'paid' ? r.amount : 0)), 0)
              return (
                <>
                  {txns.map((r: any) => {
                    const bal = map.get(r.id)
                    return (
                      <TableRow key={r.id}>
                        <TableCell>{formatDate(r.due_date)}</TableCell>
                        <TableCell>{formatCurrency(r.amount)}</TableCell>
                        <TableCell>{formatCurrency(r.amount_paid ?? (r.status === 'paid' ? r.amount : 0))}</TableCell>
                        <TableCell>
                          <Badge variant={
                            r.status === 'paid' ? 'success' :
                            r.status === 'overdue' ? 'destructive' :
                            'secondary'
                          }>{r.status}</Badge>
                        </TableCell>
                        <TableCell>{r.paid_date ? formatDate(r.paid_date) : '—'}</TableCell>
                        <TableCell className={bal && bal.balanceAfter > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                          {bal ? formatCurrency(bal.balanceAfter) : '—'}
                        </TableCell>
                        <TableCell>
                          {r.status === 'paid' && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setReceiptTxn(r)} title="View receipt">
                              <Receipt className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow className="bg-gray-50 font-semibold">
                    <TableCell>Totals</TableCell>
                    <TableCell>{formatCurrency(totalDue)}</TableCell>
                    <TableCell>{formatCurrency(totalPaid)}</TableCell>
                    <TableCell colSpan={2}></TableCell>
                    <TableCell className={balance > 0 ? 'text-red-600' : 'text-green-600'}>{formatCurrency(balance)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </>
              )
            })()}
          </TableBody>
        </Table>
      </Card>

      {/* Inspections */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> Inspections
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowInspection(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Inspection
          </Button>
        </CardHeader>
        <CardContent>
          {(inspections as any[] ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No inspections recorded</p>
          ) : (
            <div className="space-y-3">
              {(inspections as any[]).map((insp: any) => (
                <InspectionCard key={insp.id} inspection={insp} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      {timelineEvents && timelineEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 border-l-2 border-gray-200">
              {timelineEvents.slice(0, 15).map((event: any, i: number) => (
                <div key={event.id} className={`relative pb-4 ${i === 0 ? '' : 'pt-1'}`}>
                  <div className={`absolute -left-[25px] w-3 h-3 rounded-full border-2 border-white mt-1.5 ${
                    event.category === 'lifecycle' ? 'bg-blue-500' : 'bg-gray-400'
                  }`} />
                  <p className="text-xs text-gray-400">{formatDate(event.date)}</p>
                  <p className="text-sm text-gray-700">{event.description}</p>
                  {event.amount > 0 && <p className="text-xs text-gray-400">{formatCurrency(event.amount)}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lifecycle Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checklists */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" /> Checklists
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setChecklistType('move_in'); setShowChecklist(true) }}>
                <Plus className="h-4 w-4 mr-1" /> Move-In
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setChecklistType('move_out'); setShowChecklist(true) }}>
                <Plus className="h-4 w-4 mr-1" /> Move-Out
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {(checklists as any[] ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No checklists completed</p>
            ) : (
              <div className="space-y-3">
                {(checklists as any[] ?? []).map((c: any) => (
                  <div key={c.id} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={c.type === 'move_in' ? 'success' : 'default'}>
                        {c.type === 'move_in' ? 'Move-In' : 'Move-Out'}
                      </Badge>
                      <span className="text-xs text-gray-500">{formatDate(c.created_at)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {c.keys_handed_over && <p className="text-gray-600">✓ Keys ({c.keys_count})</p>}
                      {c.meter_electric_reading && <p className="text-gray-600">⚡ Electric: {c.meter_electric_reading}</p>}
                      {c.meter_gas_reading && <p className="text-gray-600">🔥 Gas: {c.meter_gas_reading}</p>}
                      {c.meter_water_reading && <p className="text-gray-600">💧 Water: {c.meter_water_reading}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Termination */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" /> Termination
            </CardTitle>
            {!termination && t.status === 'active' && (
              <Button size="sm" variant="outline" onClick={() => setShowTermination(true)}>
                <Plus className="h-4 w-4 mr-1" /> Record
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!termination ? (
              <p className="text-sm text-gray-400 text-center py-4">No termination recorded</p>
            ) : (
              <div className="space-y-3">
                <div className="border rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="destructive">Terminated</Badge>
                    <span className="text-xs text-gray-500">Initiated by: {termination.initiated_by}</span>
                  </div>
                  <p className="text-sm text-gray-700">{termination.reason}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <p>Notice: {formatDate(termination.notice_date)}</p>
                    <p>Effective: {formatDate(termination.effective_date)}</p>
                    {termination.penalty_amount > 0 && <p>Penalty: £{termination.penalty_amount}</p>}
                    {termination.deposit_deduction > 0 && <p>Deposit Deduction: £{termination.deposit_deduction}</p>}
                    {termination.keys_returned && <p>✓ Keys returned</p>}
                    {termination.property_vacant && <p>✓ Property vacant</p>}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      </div>
      )}

      {/* ========== AGREEMENT TAB ========== */}
      {activeTab === 'agreement' && (
        <AgreementTab
          tenancyId={id!}
          agreement={agreement}
          agreementLoading={agreementLoading}
          onCreateAgreement={handleCreateAgreement}
          creatingAgreement={creatingAgreement}
          showPreview={showPreview}
          setShowPreview={setShowPreview}
          showSign={showSign}
          setShowSign={setShowSign}
          showCouncil={showCouncil}
          setShowCouncil={setShowCouncil}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['tenancy-agreement', id] })}
          onAgreementSigned={handleAgreementSigned}
        />
      )}

      <PropertyDossierViewer
        open={showDossier}
        onClose={() => setShowDossier(false)}
        tenancyId={id!}
        companySettings={companySettings}
        companyLogoUrl={companyLogoUrl}
      />

      <ChecklistFormDialog
        open={showChecklist}
        onClose={() => setShowChecklist(false)}
        tenancyId={id!}
        checklistType={checklistType}
      />

      <TerminationFormDialog
        open={showTermination}
        onClose={() => setShowTermination(false)}
        tenancyId={id!}
        tenancyEndDate={(tenancy as any)?.end_date}
        onTerminationComplete={() => setShowMoveOutAfterTermination(true)}
      />

      <InspectionFormDialog
        open={showInspection}
        onClose={() => setShowInspection(false)}
        tenancyId={id!}
      />

      <RenewalFormDialog
        open={showRenewal}
        onClose={() => setShowRenewal(false)}
        tenancyId={id!}
        currentEndDate={t.end_date}
        currentRentAmount={t.rent_amount}
        onRenewed={handleRenewed}
      />

      <AmendmentFormDialog
        open={showAmendment}
        onClose={() => setShowAmendment(false)}
        tenancyId={id!}
        currentRentAmount={t.rent_amount}
      />

      <ChecklistFormDialog
        open={showMoveOutAfterTermination}
        onClose={() => setShowMoveOutAfterTermination(false)}
        tenancyId={id!}
        checklistType="move_out"
      />

      {receiptTxn && (
        <PaymentReceiptDialog
          open={!!receiptTxn}
          onClose={() => setReceiptTxn(null)}
          transaction={receiptTxn}
          tenantName={(tenancy as any)?.tenancy_tenants?.[0]?.tenants?.full_name}
          propertyAddress={(tenancy as any)?.properties?.address}
        />
      )}

      {/* Sign Complete → Move-In prompt */}
      <Dialog open={showSignCompleteDialog} onOpenChange={() => setShowSignCompleteDialog(false)}>
        <DialogContent onClose={() => setShowSignCompleteDialog(false)} className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" /> Agreement Signed
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center space-y-3">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <p className="text-gray-700">The tenancy agreement has been signed by all parties.</p>
            <p className="text-sm text-gray-500">Would you like to proceed with the Move-In checklist?</p>
          </div>
          <DialogFooter className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setShowSignCompleteDialog(false)}>Later</Button>
            <Button onClick={() => { setShowSignCompleteDialog(false); setChecklistType('move_in'); setShowChecklist(true); setActiveTab('overview') }}>
              Start Move-In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renewal → New Agreement prompt */}
      <Dialog open={showRenewPromptDialog} onOpenChange={() => setShowRenewPromptDialog(false)}>
        <DialogContent onClose={() => setShowRenewPromptDialog(false)} className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-green-600" /> Tenancy Renewed
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center space-y-3">
            <RefreshCw className="h-12 w-12 text-green-500 mx-auto" />
            <p className="text-gray-700">The tenancy has been renewed successfully.</p>
            <p className="text-sm text-gray-500">Would you like to create a new agreement for the renewed period?</p>
          </div>
          <DialogFooter className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setShowRenewPromptDialog(false)}>Skip</Button>
            <Button onClick={async () => {
              setShowRenewPromptDialog(false)
              setActiveTab('agreement')
              await handleCreateAgreement()
            }}>
              Create New Agreement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AgreementTab({
  tenancyId,
  agreement,
  agreementLoading,
  onCreateAgreement,
  creatingAgreement,
  showPreview,
  setShowPreview,
  showSign,
  setShowSign,
  showCouncil,
  setShowCouncil,
  onRefresh,
  onAgreementSigned,
}: {
  tenancyId: string
  agreement: any
  agreementLoading: boolean
  onCreateAgreement: () => void
  creatingAgreement: boolean
  showPreview: boolean
  setShowPreview: (v: boolean) => void
  showSign: boolean
  setShowSign: (v: boolean) => void
  showCouncil: boolean
  setShowCouncil: (v: boolean) => void
  onRefresh: () => void
  onAgreementSigned: () => void
}) {
  if (agreementLoading) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading agreement…</span>
      </div>
    )
  }

  // State A — No agreement yet
  if (!agreement) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <FilePen className="h-12 w-12 text-gray-300" />
          <div>
            <p className="font-medium text-gray-700">No agreement generated yet</p>
            <p className="text-sm text-gray-500 mt-1">Create the tenancy agreement to start the signing process.</p>
          </div>
          <Button onClick={onCreateAgreement} disabled={creatingAgreement}>
            {creatingAgreement ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…</>
            ) : (
              <><FilePen className="h-4 w-4 mr-2" /> Create Agreement</>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isSigned = agreement.status === 'signed'
  const councilStatus = agreement.council_submission_status ?? 'not_submitted'
  const attachments = (agreement.agreement_attachments ?? []) as any[]
  const signatures = (agreement.agreement_signatures ?? []) as any[]

  // State B & C — Agreement exists
  return (
    <div className="space-y-4">
      {/* Action bar */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <Badge variant={isSigned ? 'success' : 'warning'} className="text-sm">
            {isSigned ? 'Signed' : 'Awaiting Signatures'}
          </Badge>
          {isSigned && (
            <Badge variant={councilStatus === 'submitted' ? 'success' : 'outline'} className="text-sm">
              {councilStatus.replace(/_/g, ' ')}
            </Badge>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-1" /> Preview
            </Button>
            {!isSigned && (
              <Button size="sm" onClick={() => setShowSign(true)}>
                <PenLine className="h-4 w-4 mr-1" /> Sign
              </Button>
            )}
            {isSigned && councilStatus === 'not_submitted' && (
              <Button size="sm" variant="outline" onClick={() => setShowCouncil(true)}>
                <Send className="h-4 w-4 mr-1" /> Submit to Council
              </Button>
            )}
            {isSigned && (
              <CheckCircle className="h-5 w-5 text-green-500 self-center" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Signatures */}
      {signatures.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Signatures</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {signatures.map((sig: any) => (
                <div key={sig.id} className="text-center">
                  {sig.signature_image_base64 && (
                    <img
                      src={sig.signature_image_base64}
                      alt={sig.signatory_name}
                      className="h-16 border border-gray-200 rounded mb-1"
                    />
                  )}
                  <p className="text-xs font-medium">{sig.signatory_name}</p>
                  <p className="text-xs text-gray-400 capitalize">{sig.signatory_type}</p>
                  <p className="text-xs text-gray-400">{formatDate(sig.signed_at)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Attached Documents</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attachments.map((att: any) => (
                <div key={att.id} className="flex items-center gap-3 text-sm">
                  <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="flex-1">{att.display_name}</span>
                  <Badge variant="outline" className="text-xs">{att.attachment_type.replace(/_/g, ' ')}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showPreview && (
        <AgreementPreviewDialog
          agreementId={agreement.id}
          open={showPreview}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showSign && (
        <SignatureCaptureModal
          agreementId={agreement.id}
          onClose={() => setShowSign(false)}
          onCompleted={() => { setShowSign(false); onRefresh(); onAgreementSigned() }}
        />
      )}

      {showCouncil && (
        <CouncilSubmissionDialog
          agreementId={agreement.id}
          open={showCouncil}
          onClose={() => setShowCouncil(false)}
          onSubmitted={() => { setShowCouncil(false); onRefresh() }}
        />
      )}

    </div>
  )
}

function InspectionCard({ inspection }: { inspection: any }) {
  const [expanded, setExpanded] = useState(false)

  const typeLabel = inspection.type === 'move_in' ? 'Move-In' : inspection.type === 'move_out' ? 'Move-Out' : 'Mid-Tenancy'

  return (
    <div className="border rounded p-3">
      <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <Badge variant={
            inspection.type === 'move_in' ? 'success' : inspection.type === 'move_out' ? 'default' : 'outline'
          }>{typeLabel}</Badge>
          <span className="text-sm font-medium">{inspection.inspector_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{formatDate(inspection.inspection_date)}</span>
          {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-2">
        <span>Condition: <strong>{inspection.overall_condition}</strong></span>
        {inspection.weather_conditions && <span>Weather: {inspection.weather_conditions}</span>}
        <span>{inspection.tenant_present ? 'Tenant present' : 'Tenant absent'}</span>
      </div>
      {expanded && inspection.general_notes && (
        <p className="text-xs text-gray-500 mb-2">{inspection.general_notes}</p>
      )}
    </div>
  )
}
