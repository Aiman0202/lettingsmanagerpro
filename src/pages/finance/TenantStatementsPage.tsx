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
import { PoundSterling, Plus, Calendar, FileText, ChevronLeft, Eye, Printer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { generateTenantStatementHTML } from '@/utils/tenant-statement-html'

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

export default function TenantStatementsPage() {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [showGenerate, setShowGenerate] = useState(false)
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // All tenants with active tenancies
  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants-with-tenancies'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenants')
        .select(`
          id,
          full_name,
          email,
          phone,
          tenancy_tenants(
            tenancy_id,
            tenancies(
              id,
              reference_number,
              start_date,
              end_date,
              rent_amount,
              status,
              properties(address, postcode)
            )
          )
        `)
        .order('full_name')
      return data ?? []
    },
  })

  // All tenant statements
  const { data: statements, isLoading: statementsLoading } = useQuery({
    queryKey: ['tenant-statements'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenant_statements')
        .select(`
          *,
          tenants(full_name, email),
          tenancies(reference_number, properties(address))
        `)
        .order('created_at', { ascending: false })
      return data ?? []
    },
  })

  // Summary
  const totalOutstanding = (statements ?? [])
    .filter((s: any) => s.balance > 0)
    .reduce((sum: number, s: any) => sum + s.balance, 0)

  const totalPaidThisMonth = (statements ?? [])
    .filter((s: any) => {
      const createdDate = new Date(s.created_at)
      const now = new Date()
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum: number, s: any) => sum + s.total_paid, 0)

  // Generate statement mutation
  const generateMutation = useMutation({
    mutationFn: async ({ tenantId, month, year }: { tenantId: string; month: number; year: number }) => {
      const dateRange = getMonthDateRange(year, month)
      
      // Get tenant's tenancy
      const { data: tenantData } = await supabase
        .from('tenants')
        .select(`
          id,
          full_name,
          email,
          phone,
          tenancy_tenants(
            tenancy_id,
            tenancies(
              id,
              reference_number,
              start_date,
              end_date,
              rent_amount,
              properties(address, postcode)
            )
          )
        `)
        .eq('id', tenantId)
        .single()

      if (!tenantData || !(tenantData as any).tenancy_tenants?.[0]) {
        throw new Error('Tenant has no active tenancy')
      }

      const tenancy = (tenantData as any).tenancy_tenants[0].tenancies

      // Get rent transactions for the period
      const { data: transactions } = await supabase
        .from('rent_transactions')
        .select('*')
        .eq('tenancy_id', tenancy.id)
        .gte('due_date', dateRange.start)
        .lte('due_date', dateRange.end)
        .order('due_date', { ascending: true })

      const transactionsList = transactions ?? []
      
      // Calculate totals
      const totalRent = transactionsList.reduce((sum: number, t: any) => sum + t.amount, 0)
      const totalPaid = transactionsList
        .filter((t: any) => t.status === 'paid')
        .reduce((sum: number, t: any) => sum + (t.amount_paid || t.amount), 0)
      const balance = totalRent - totalPaid

      // Create statement
      const { data: statement, error } = await (supabase.from('tenant_statements') as any)
        .insert({
          tenant_id: tenantId,
          tenancy_id: tenancy.id,
          period_start: dateRange.start,
          period_end: dateRange.end,
          total_rent: totalRent,
          total_paid: totalPaid,
          balance: balance,
          transaction_count: transactionsList.length,
        })
        .select()
        .single()

      if (error) throw error
      return statement
    },
    onSuccess: () => {
      success('Statement generated successfully')
      qc.invalidateQueries({ queryKey: ['tenant-statements'] })
      setShowGenerate(false)
      setSelectedTenantId('')
    },
    onError: (err) => {
      showError('Generation failed', handleApiError(err))
    },
  })

  const handleGenerate = () => {
    if (!selectedTenantId) return showError('Missing tenant', 'Please select a tenant')
    generateMutation.mutate({
      tenantId: selectedTenantId,
      month: selectedMonth,
      year: selectedYear,
    })
  }

  // View statement handler
  const handleView = async (statement: any) => {
    try {
      const html = await generateTenantStatementHTML(statement)
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        showError('Popup blocked', 'Please allow popups for this site to view statements')
        return
      }
      printWindow.document.write(html)
      printWindow.document.close()
    } catch (err: any) {
      showError('View failed', err.message || 'Failed to open statement')
    }
  }

  // Print statement handler
  const handlePrint = async (statement: any) => {
    try {
      const html = await generateTenantStatementHTML(statement)
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        showError('Popup blocked', 'Please allow popups for this site to print statements')
        return
      }
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
      }
    } catch (err: any) {
      showError('Print failed', err.message || 'Failed to print statement')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/finance">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Statements</h1>
          <p className="text-gray-500 text-sm mt-1">Generate and manage tenant rent account statements</p>
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
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <PoundSterling className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Outstanding Balance</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
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

      {/* Statements list */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Statements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Rent Due</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statementsLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (statements ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                    No statements generated yet
                  </TableCell>
                </TableRow>
              ) : (
                (statements ?? []).map((statement: any) => {
                  const balanceColor = statement.balance > 0 ? 'text-red-600' : 'text-green-600'
                  return (
                    <TableRow key={statement.id}>
                      <TableCell className="font-medium">
                        {statement.tenants?.full_name ?? '—'}
                      </TableCell>
                      <TableCell>{statement.tenancies?.properties?.address ?? '—'}</TableCell>
                      <TableCell>
                        {formatDate(statement.period_start)} - {formatDate(statement.period_end)}
                      </TableCell>
                      <TableCell>{formatCurrency(statement.total_rent)}</TableCell>
                      <TableCell>{formatCurrency(statement.total_paid)}</TableCell>
                      <TableCell className={`font-semibold ${balanceColor}`}>
                        {formatCurrency(statement.balance)}
                      </TableCell>
                      <TableCell>{formatDate(statement.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(statement)}
                            title="View statement"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePrint(statement)}
                            title="Print statement"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Generate statement dialog */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Tenant Statement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Tenant *</Label>
              <Select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
              >
                <option value="">Select tenant...</option>
                {(tenants ?? [])
                  .filter((t: any) => t.tenancy_tenants?.length > 0)
                  .map((tenant: any) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.full_name} - {tenant.tenancy_tenants[0].tenancies?.reference_number}
                    </option>
                  ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Month *</Label>
                <Select
                  value={selectedMonth.toString()}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {getMonthName(i)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Year *</Label>
                <Select
                  value={selectedYear.toString()}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    )
                  })}
                </Select>
              </div>
            </div>

            {selectedTenantId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Statement will include:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4 list-disc">
                  <li>All rent transactions for the selected period</li>
                  <li>Payment history and status</li>
                  <li>Outstanding balance calculation</li>
                  <li>Tenancy and property details</li>
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerate(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={generateMutation.isPending || !selectedTenantId}>
              {generateMutation.isPending ? 'Generating...' : 'Generate Statement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
