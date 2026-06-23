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
import { Plus, PoundSterling, FileText, AlertTriangle, Receipt } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ColumnVisibility } from '@/components/ui/ColumnVisibility'
import { useColumnVisibility, type ColumnConfig } from '@/hooks/useColumnVisibility'
import { FormField } from '@/components/ui/FormField'
import { paymentSchema, expenseSchema, zodErrors } from '@/schemas/forms'
import PaymentReceiptDialog from '@/components/PaymentReceiptDialog'
import { calculateRunningBalance, calculatePeriod } from '@/utils/receipt'

const statusVariant: Record<string, any> = {
  paid: 'success', pending: 'outline', overdue: 'destructive', partial: 'warning',
}

const RENT_COLUMNS: ColumnConfig[] = [
  { key: 'property', label: 'Property', defaultVisible: true },
  { key: 'due_date', label: 'Due Date', defaultVisible: true },
  { key: 'amount', label: 'Amount', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'paid_date', label: 'Paid Date', defaultVisible: true },
  { key: 'method', label: 'Method', defaultVisible: true },
  { key: 'receipt', label: 'Receipt', defaultVisible: true },
]

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<'rent' | 'expenses' | 'fees'>('rent')
  const [showPayment, setShowPayment] = useState(false)
  const [receiptTxn, setReceiptTxn] = useState<any>(null)
  const [selectedTenancyId, setSelectedTenancyId] = useState('')
  const { isVisible, toggle } = useColumnVisibility('finance-rent', RENT_COLUMNS)

  const { data: rentTransactions, isLoading } = useQuery({
    queryKey: ['rent-transactions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('rent_transactions')
        .select('*, tenancies(properties(address), landlords(full_name), tenancy_tenants(tenants(full_name)))')
        .order('due_date', { ascending: false })
        .limit(50)
      return data ?? []
    },
  })

  const { data: overdueSummary } = useQuery({
    queryKey: ['overdue-summary'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('rent_transactions')
        .select('amount')
        .eq('status', 'overdue')
        .lte('due_date', today)
      return (data ?? []).reduce((sum: number, t: any) => sum + t.amount, 0)
    },
  })

  const { data: expenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('expenses')
        .select('*, properties(address)')
        .order('date', { ascending: false })
        .limit(50)
      return data ?? []
    },
  })

  const { data: fees } = useQuery({
    queryKey: ['agency-fees'],
    queryFn: async () => {
      const { data } = await supabase
        .from('agency_fees')
        .select('*, tenancies(properties(address))')
        .order('charged_at', { ascending: false })
        .limit(50)
      return data ?? []
    },
  })

  const qc = useQueryClient()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-gray-500 text-sm mt-1">Rent collection, expenses & fees</p>
        </div>
        <div className="flex gap-2">
          <Link to="/finance/statements">
            <Button variant="outline"><FileText className="h-4 w-4 mr-1" /> Landlord Statements</Button>
          </Link>
          <Link to="/finance/arrears">
            <Button variant="outline"><AlertTriangle className="h-4 w-4 mr-1" /> Arrears</Button>
          </Link>
          <Button onClick={() => setShowPayment(true)}><Plus className="h-4 w-4" /> Record Payment</Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <PoundSterling className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Overdue Rent</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(overdueSummary ?? 0)}</p>
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
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(
                  (rentTransactions ?? [])
                    .filter((t: any) => t.status === 'paid' && new Date(t.paid_date ?? '').getMonth() === new Date().getMonth())
                    .reduce((sum: number, t: any) => sum + t.amount, 0)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <PoundSterling className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Agency Fees (All)</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency((fees ?? []).reduce((sum: number, f: any) => sum + f.amount, 0))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['rent', 'expenses', 'fees'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'fees' ? 'Agency Fees' : tab === 'rent' ? 'Rent Ledger' : 'Expenses'}
          </button>
        ))}
      </div>

      {activeTab === 'rent' && (
        <Card>
          <div className="flex justify-end p-3 no-print">
            <ColumnVisibility columns={RENT_COLUMNS} onToggle={toggle} isVisible={isVisible} />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                {isVisible('property') && <TableHead>Property</TableHead>}
                {isVisible('due_date') && <TableHead>Due Date</TableHead>}
                {isVisible('amount') && <TableHead>Amount</TableHead>}
                {isVisible('status') && <TableHead>Status</TableHead>}
                {isVisible('paid_date') && <TableHead>Paid Date</TableHead>}
                {isVisible('method') && <TableHead>Method</TableHead>}
                {isVisible('receipt') && <TableHead>Receipt</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Loading…</TableCell></TableRow>
              ) : (rentTransactions ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No transactions</TableCell></TableRow>
              ) : (rentTransactions ?? []).map((t: any) => (
                <TableRow key={t.id}>
                  {isVisible('property') && <TableCell>{t.tenancies?.properties?.address ?? '—'}</TableCell>}
                  {isVisible('due_date') && <TableCell>{formatDate(t.due_date)}</TableCell>}
                  {isVisible('amount') && <TableCell className="font-medium">{formatCurrency(t.amount)}</TableCell>}
                  {isVisible('status') && <TableCell><Badge variant={statusVariant[t.status]}>{t.status}</Badge></TableCell>}
                  {isVisible('paid_date') && <TableCell>{formatDate(t.paid_date)}</TableCell>}
                  {isVisible('method') && <TableCell>{t.payment_method ?? '—'}</TableCell>}
                  {isVisible('receipt') && (
                    <TableCell>
                      {t.status === 'paid' && (
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => setReceiptTxn(t)}
                          title="View receipt"
                        >
                          <Receipt className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {activeTab === 'expenses' && (
        <ExpensesTab expenses={expenses ?? []} onRefresh={() => qc.invalidateQueries({ queryKey: ['expenses'] })} />
      )}

      {activeTab === 'fees' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Fee Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(fees ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-400">No fees recorded</TableCell></TableRow>
              ) : (fees ?? []).map((f: any) => (
                <TableRow key={f.id}>
                  <TableCell>{f.tenancies?.properties?.address ?? '—'}</TableCell>
                  <TableCell>{f.fee_type}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(f.amount)}</TableCell>
                  <TableCell>{formatDate(f.charged_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <RecordPaymentDialog
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSaved={() => { setShowPayment(false); qc.invalidateQueries({ queryKey: ['rent-transactions'] }) }}
      />

      {receiptTxn && (
        <PaymentReceiptDialog
          open={!!receiptTxn}
          onClose={() => setReceiptTxn(null)}
          transaction={receiptTxn}
          tenantName={receiptTxn.tenancies?.tenancy_tenants?.[0]?.tenants?.full_name}
          propertyAddress={receiptTxn.tenancies?.properties?.address}
        />
      )}
    </div>
  )
}

function ExpensesTab({ expenses, onRefresh }: { expenses: any[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ property_id: '', category: '', amount: '', date: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: properties } = useQuery({
    queryKey: ['properties-dropdown'],
    queryFn: async () => {
      const { data } = await supabase.from('properties').select('id, address').order('address')
      return data ?? []
    },
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const result = expenseSchema.safeParse(form)
    if (!result.success) {
      setErrors(zodErrors(result))
      return
    }
    setErrors({})
    setSaving(true)
    await supabase.from('expenses').insert({
      property_id: form.property_id,
      category: form.category,
      amount: parseFloat(form.amount),
      date: form.date,
      description: form.description || null,
    })
    setSaving(false)
    onRefresh()
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Add Expense</Button>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">No expenses</TableCell></TableRow>
            ) : expenses.map((e: any) => (
              <TableRow key={e.id}>
                <TableCell>{e.properties?.address ?? '—'}</TableCell>
                <TableCell>{e.category}</TableCell>
                <TableCell className="font-medium">{formatCurrency(e.amount)}</TableCell>
                <TableCell>{formatDate(e.date)}</TableCell>
                <TableCell>{e.description ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent onClose={() => setShowForm(false)}>
          <form onSubmit={handleSave}>
            <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
            <div className="p-6 space-y-3">
              <FormField label="Property" error={errors.property_id} required>
                <Select value={form.property_id} onChange={(e) => { setForm({ ...form, property_id: e.target.value }); setErrors((p) => ({ ...p, property_id: '' })) }}>
                  <option value="">Select property…</option>
                  {(properties ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.address}</option>)}
                </Select>
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Category" error={errors.category} required>
                  <Input value={form.category} onChange={(e) => { setForm({ ...form, category: e.target.value }); setErrors((p) => ({ ...p, category: '' })) }} placeholder="Repairs, Insurance…" />
                </FormField>
                <FormField label="Amount (£)" error={errors.amount} required>
                  <Input type="number" step="0.01" value={form.amount} onChange={(e) => { setForm({ ...form, amount: e.target.value }); setErrors((p) => ({ ...p, amount: '' })) }} />
                </FormField>
                <FormField label="Date" error={errors.date} required>
                  <Input type="date" value={form.date} onChange={(e) => { setForm({ ...form, date: e.target.value }); setErrors((p) => ({ ...p, date: '' })) }} />
                </FormField>
                <FormField label="Description">
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </FormField>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Expense'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RecordPaymentDialog({ open, onClose, onSaved }: {
  open: boolean; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState({
    tenancy_id: '', amount: '', due_date: '', paid_date: '', payment_method: 'bank_transfer', status: 'paid', notes: '',
    period_start: '', period_end: '', amount_paid: '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: tenancies } = useQuery({
    queryKey: ['tenancies-dropdown'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenancies')
        .select('id, properties(address)')
        .eq('status', 'active')
        .order('created_at')
      return data ?? []
    },
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const result = paymentSchema.safeParse(form)
    if (!result.success) {
      setErrors(zodErrors(result))
      return
    }
    setErrors({})
    setSaving(true)
    await supabase.from('rent_transactions').insert({
      tenancy_id: form.tenancy_id,
      amount: parseFloat(form.amount),
      due_date: form.due_date,
      paid_date: form.paid_date || null,
      payment_method: form.payment_method,
      status: form.status as any,
      notes: form.notes || null,
      period_start: form.period_start || null,
      period_end: form.period_end || null,
      amount_paid: form.amount_paid ? parseFloat(form.amount_paid) : parseFloat(form.amount),
    })
    setSaving(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleSave}>
          <DialogHeader><DialogTitle>Record Rent Payment</DialogTitle></DialogHeader>
          <div className="p-6 space-y-4">
            <FormField label="Tenancy" error={errors.tenancy_id} required>
              <Select value={form.tenancy_id} onChange={(e) => { setForm({ ...form, tenancy_id: e.target.value }); setErrors((p) => ({ ...p, tenancy_id: '' })) }}>
                <option value="">Select tenancy…</option>
                {(tenancies ?? []).map((t: any) => (
                  <option key={t.id} value={t.id}>{t.properties?.address ?? t.id}</option>
                ))}
              </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Amount (£)" error={errors.amount} required>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => { setForm({ ...form, amount: e.target.value }); setErrors((p) => ({ ...p, amount: '' })) }} />
              </FormField>
              <FormField label="Due Date" error={errors.due_date} required>
                <Input type="date" value={form.due_date} onChange={(e) => {
                  const dueDate = e.target.value
                  const period = dueDate ? calculatePeriod(dueDate) : { start: '', end: '' }
                  setForm({ ...form, due_date: dueDate, period_start: period.start, period_end: period.end })
                  setErrors((p) => ({ ...p, due_date: '' }))
                }} />
              </FormField>
              <FormField label="Amount Paid (£)">
                <Input type="number" step="0.01" value={form.amount_paid} placeholder={form.amount || '0'} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} />
              </FormField>
              <FormField label="Paid Date">
                <Input type="date" value={form.paid_date} onChange={(e) => setForm({ ...form, paid_date: e.target.value })} />
              </FormField>
              <FormField label="Status">
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="partial">Partial</option>
                </Select>
              </FormField>
              <FormField label="Payment Method">
                <Select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="standing_order">Standing Order</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                </Select>
              </FormField>
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <FormField label="Period Start">
                  <Input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} />
                </FormField>
                <FormField label="Period End">
                  <Input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} />
                </FormField>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Record Payment'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
