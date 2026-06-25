import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/contexts/ToastContext'
import { handleApiError } from '@/utils/validation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PoundSterling, Plus, CheckCircle, Calculator, FileText, ChevronLeft, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'

// ============================================================
// HELPERS
// ============================================================

function getMonthName(month: number): string {
  return new Date(2024, month, 1).toLocaleString('en-GB', { month: 'long' })
}

function getMonthDateRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function LandlordStatementsPage() {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [showGenerate, setShowGenerate] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [payingStatement, setPayingStatement] = useState<any>(null)

  // Company settings for default fee %
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings-fee'],
    queryFn: async () => {
      const { data } = await supabase.from('company_settings').select('default_fee_percentage').single()
      return data as any
    },
  })

  // All statements
  const { data: statements, isLoading } = useQuery({
    queryKey: ['landlord-statements'],
    queryFn: async () => {
      const { data } = await supabase
        .from('landlord_statements')
        .select('*, landlords(full_name, email)')
        .order('created_at', { ascending: false })
      return data ?? []
    },
  })

  // Summary
  const totalOutstanding = (statements ?? [])
    .filter((s: any) => !s.paid_at)
    .reduce((sum: number, s: any) => sum + s.net_payout, 0)

  const totalPaidThisMonth = (statements ?? [])
    .filter((s: any) => {
      if (!s.paid_at) return false
      const paidDate = new Date(s.paid_at)
      const now = new Date()
      return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum: number, s: any) => sum + s.net_payout, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/finance"><Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Landlord Statements</h1>
          <p className="text-gray-500 text-sm mt-1">Generate and manage landlord payout statements</p>
        </div>
        <div className="ml-auto">
          <Button onClick={() => setShowGenerate(true)}>
            <Plus className="h-4 w-4 mr-1" /> Generate Statement
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <PoundSterling className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Outstanding to Landlords</p>
              <p className="text-xl font-bold text-amber-600">{formatCurrency(totalOutstanding)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <PoundSterling className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Paid This Month</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalPaidThisMonth)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Statements</p>
              <p className="text-xl font-bold text-blue-600">{(statements ?? []).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statements table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Landlord</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Gross Rent</TableHead>
              <TableHead className="text-right">Fees</TableHead>
              <TableHead className="text-right">Net Payout</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Paid Date</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">Loading…</TableCell></TableRow>
            ) : (statements ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">No statements yet. Generate your first one.</TableCell></TableRow>
            ) : (statements ?? []).map((s: any) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.landlords?.full_name ?? '—'}</TableCell>
                <TableCell className="text-sm">
                  {formatDate(s.period_start)} – {formatDate(s.period_end)}
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(s.total_rent)}</TableCell>
                <TableCell className="text-right text-red-600">{formatCurrency(s.fees_deducted)}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(s.net_payout)}</TableCell>
                <TableCell>
                  {s.paid_at ? (
                    <Badge variant="success">Paid</Badge>
                  ) : (
                    <Badge variant="outline">Unpaid</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">{s.paid_at ? formatDate(s.paid_at) : '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" asChild>
                      <Link to={`/finance/statements/${s.id}`}>
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Link>
                    </Button>
                    {!s.paid_at && (
                      <Button size="sm" variant="outline" onClick={() => { setPayingStatement(s); setShowPay(true); }}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Mark Paid
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Dialogs */}
      <GenerateStatementDialog
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
        companyFeePct={companySettings?.default_fee_percentage ?? 10}
        onGenerated={() => { setShowGenerate(false); qc.invalidateQueries({ queryKey: ['landlord-statements'] }) }}
      />

      <MarkPaidDialog
        open={showPay}
        onClose={() => setShowPay(false)}
        statement={payingStatement}
        onPaid={() => { setShowPay(false); qc.invalidateQueries({ queryKey: ['landlord-statements'] }) }}
      />
    </div>
  )
}

// ============================================================
// GENERATE STATEMENT DIALOG
// ============================================================

function GenerateStatementDialog({ open, onClose, companyFeePct, onGenerated }: {
  open: boolean; onClose: () => void; companyFeePct: number; onGenerated: () => void
}) {
  const { success, error: showError } = useToast()

  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const [form, setForm] = useState({
    landlord_id: '',
    period: 'last_month' as 'last_month' | 'this_month' | 'custom',
    period_start: getMonthDateRange(lastMonth.getFullYear(), lastMonth.getMonth()).start,
    period_end: getMonthDateRange(lastMonth.getFullYear(), lastMonth.getMonth()).end,
    fee_percentage: String(companyFeePct),
  })
  const [calculating, setCalculating] = useState(false)
  const [preview, setPreview] = useState<{ grossRent: number; fees: number; expenses: number; net: number } | null>(null)
  const [saving, setSaving] = useState(false)

  const { data: landlords } = useQuery({
    queryKey: ['landlords-dropdown-st'],
    queryFn: async () => {
      const { data } = await supabase.from('landlords').select('id, full_name').order('full_name')
      return data ?? []
    },
  })

  function updatePeriod(type: string) {
    const today = new Date()
    let start: string, end: string
    if (type === 'last_month') {
      const m = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const range = getMonthDateRange(m.getFullYear(), m.getMonth())
      start = range.start; end = range.end
    } else if (type === 'this_month') {
      const range = getMonthDateRange(today.getFullYear(), today.getMonth())
      start = range.start; end = range.end
    } else {
      start = form.period_start; end = form.period_end
    }
    setForm(f => ({ ...f, period: type as any, period_start: start, period_end: end }))
  }

  async function handleCalculate() {
    if (!form.landlord_id) return
    setCalculating(true)
    try {
      // Get all tenancies for this landlord
      const { data: tenancies } = await supabase
        .from('tenancies')
        .select('id, property_id')
        .eq('landlord_id', form.landlord_id)

      const tenancyIds = (tenancies ?? []).map((t: any) => t.id)
      const propertyIds = [...new Set((tenancies ?? []).map((t: any) => t.property_id))]

      let grossRent = 0
      if (tenancyIds.length > 0) {
        // Sum paid rent in period
        const { data: rentData } = await supabase
          .from('rent_transactions')
          .select('amount')
          .in('tenancy_id', tenancyIds)
          .eq('status', 'paid')
          .gte('paid_date', form.period_start)
          .lte('paid_date', form.period_end)
        grossRent = (rentData ?? []).reduce((sum: number, r: any) => sum + r.amount, 0)
      }

      let expenses = 0
      if (propertyIds.length > 0) {
        const { data: expData } = await supabase
          .from('expenses')
          .select('amount')
          .in('property_id', propertyIds)
          .gte('date', form.period_start)
          .lte('date', form.period_end)
        expenses = (expData ?? []).reduce((sum: number, e: any) => sum + e.amount, 0)
      }

      const feePct = parseFloat(form.fee_percentage) / 100
      const fees = grossRent * feePct
      const net = grossRent - fees - expenses

      setPreview({ grossRent, fees, expenses, net })
    } catch (err) {
      showError('Calculation failed', handleApiError(err, 'calculate'))
    } finally {
      setCalculating(false)
    }
  }

  async function handleGenerate() {
    if (!preview) return
    setSaving(true)
    try {
      const { error } = await supabase.from('landlord_statements').insert({
        landlord_id: form.landlord_id,
        period_start: form.period_start,
        period_end: form.period_end,
        total_rent: preview.grossRent,
        fees_deducted: preview.fees + preview.expenses,
        net_payout: preview.net,
      } as any)

      if (error) throw error
      success('Statement generated', `Net payout: ${formatCurrency(preview.net)}`)
      onGenerated()
    } catch (err) {
      showError('Failed', handleApiError(err, 'generate statement'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-lg">
        <DialogHeader><DialogTitle>Generate Landlord Statement</DialogTitle></DialogHeader>
        <div className="p-6 space-y-4">
          {/* Landlord */}
          <div className="space-y-1.5">
            <Label>Landlord *</Label>
            <Select value={form.landlord_id} onChange={e => setForm({ ...form, landlord_id: e.target.value })}>
              <option value="">Select landlord…</option>
              {(landlords ?? []).map((l: any) => (
                <option key={l.id} value={l.id}>{l.full_name}</option>
              ))}
            </Select>
          </div>

          {/* Period */}
          <div className="space-y-1.5">
            <Label>Period</Label>
            <div className="flex gap-2">
              {(['last_month', 'this_month', 'custom'] as const).map(p => (
                <Button
                  key={p}
                  variant={form.period === p ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updatePeriod(p)}
                >
                  {p === 'last_month' ? 'Last Month' : p === 'this_month' ? 'This Month' : 'Custom'}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom date range */}
          {form.period === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start</Label>
                <Input type="date" value={form.period_start} onChange={e => setForm({ ...form, period_start: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>End</Label>
                <Input type="date" value={form.period_end} onChange={e => setForm({ ...form, period_end: e.target.value })} />
              </div>
            </div>
          )}

          {/* Fee percentage */}
          <div className="space-y-1.5">
            <Label>Agency Fee (%)</Label>
            <Input type="number" step="0.1" min="0" max="100" value={form.fee_percentage} onChange={e => setForm({ ...form, fee_percentage: e.target.value })} />
          </div>

          {/* Calculate button */}
          <Button onClick={handleCalculate} disabled={!form.landlord_id || calculating} className="w-full" variant="outline">
            <Calculator className="h-4 w-4 mr-2" /> {calculating ? 'Calculating…' : 'Calculate'}
          </Button>

          {/* Preview */}
          {preview && (
            <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Statement Preview</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gross Rent Collected</span>
                <span className="font-medium">{formatCurrency(preview.grossRent)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Agency Fee ({form.fee_percentage}%)</span>
                <span className="text-red-600">−{formatCurrency(preview.fees)}</span>
              </div>
              {preview.expenses > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Property Expenses</span>
                  <span className="text-red-600">−{formatCurrency(preview.expenses)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-2 border-t">
                <span>Net Payout to Landlord</span>
                <span className="text-green-700">{formatCurrency(preview.net)}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={!preview || saving}>
            {saving ? 'Generating…' : 'Generate Statement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// MARK AS PAID DIALOG
// ============================================================

function MarkPaidDialog({ open, onClose, statement, onPaid }: {
  open: boolean; onClose: () => void; statement: any; onPaid: () => void
}) {
  const { success, error: showError } = useToast()
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  async function handleMarkPaid() {
    if (!statement) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('landlord_statements')
        .update({ paid_at: new Date(paidDate).toISOString() } as any)
        .eq('id', statement.id)

      if (error) throw error
      success('Marked as paid', `Statement for ${statement.landlords?.full_name ?? 'landlord'} marked as paid`)
      onPaid()
    } catch (err) {
      showError('Failed', handleApiError(err, 'mark paid'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <DialogHeader><DialogTitle>Mark Statement as Paid</DialogTitle></DialogHeader>
        <div className="p-6 space-y-4">
          {statement && (
            <div className="border rounded p-3 bg-gray-50 text-sm space-y-1">
              <p><span className="text-gray-500">Landlord:</span> <span className="font-medium">{statement.landlords?.full_name ?? '—'}</span></p>
              <p><span className="text-gray-500">Period:</span> {formatDate(statement.period_start)} – {formatDate(statement.period_end)}</p>
              <p><span className="text-gray-500">Net Payout:</span> <span className="font-bold text-green-700">{formatCurrency(statement.net_payout)}</span></p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Payment Date *</Label>
            <Input type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleMarkPaid} disabled={saving}>
            <CheckCircle className="h-4 w-4 mr-1" /> {saving ? 'Saving…' : 'Confirm Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
