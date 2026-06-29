import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ChevronLeft, Printer, Loader2, Eye } from 'lucide-react'
import { generateStatementHTML } from '@/utils/statement-html'
import { useToast } from '@/contexts/ToastContext'

export default function StatementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { error: showError } = useToast()

  // Query 1: Statement with landlord details
  const { data: statement, isLoading: loadingStatement } = useQuery({
    queryKey: ['statement-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landlord_statements')
        .select('*, landlords(id, full_name, email, phone, address_line1, address_line2, city, postcode)')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as any
    },
    enabled: !!id,
  })

  // Query 2: Tenancies for this landlord
  const { data: tenancies, isLoading: loadingTenancies } = useQuery({
    queryKey: ['statement-tenancies', statement?.landlord_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenancies')
        .select('id, property_id, properties(address, postcode)')
        .eq('landlord_id', statement.landlord_id)
      
      if (error) throw error
      return data ?? []
    },
    enabled: !!statement?.landlord_id,
  })

  // Query 3: Rent transactions in period
  const { data: rentTransactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['statement-rent-tx', id, statement?.period_start, statement?.period_end],
    queryFn: async () => {
      const tenancyIds = (tenancies ?? []).map((t: any) => t.id)
      if (tenancyIds.length === 0) return []

      const { data, error } = await supabase
        .from('rent_transactions')
        .select('*, tenancies(property_id, properties(address))')
        .in('tenancy_id', tenancyIds)
        .eq('status', 'paid')
        .gte('paid_date', statement.period_start)
        .lte('paid_date', statement.period_end)
        .order('paid_date', { ascending: false })

      if (error) throw error
      return data ?? []
    },
    enabled: !!statement && !!tenancies,
  })

  // Query 4: Expenses in period
  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ['statement-expenses', id, statement?.period_start, statement?.period_end],
    queryFn: async () => {
      const propertyIds = [...new Set((tenancies ?? []).map((t: any) => t.property_id))]
      if (propertyIds.length === 0) return []

      const { data, error } = await supabase
        .from('expenses')
        .select('*, properties(address)')
        .in('property_id', propertyIds)
        .gte('date', statement.period_start)
        .lte('date', statement.period_end)
        .order('date', { ascending: false })

      if (error) throw error
      return data ?? []
    },
    enabled: !!statement && !!tenancies,
  })

  const isLoading = loadingStatement || loadingTenancies || loadingTransactions || loadingExpenses

  // Print handler with improved error handling
  const handlePrint = async () => {
    if (!statement) return

    try {
      // Get company logo URL
      let logoUrl = null
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('company_name, logo_storage_path')
        .single()

      if (settingsError) {
        console.warn('Could not fetch company settings:', settingsError)
      }

      const settingsData = settings as any
      if (settingsData?.logo_storage_path) {
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('company-assets')
          .createSignedUrl(settingsData.logo_storage_path, 3600)
        
        if (urlError) {
          console.warn('Could not generate signed URL for logo:', urlError)
        } else if (signedUrlData?.signedUrl) {
          logoUrl = signedUrlData.signedUrl
        }
      }

      const html = generateStatementHTML({
        statement,
        tenancies: tenancies ?? [],
        rentTransactions: rentTransactions ?? [],
        expenses: expenses ?? [],
        companyLogo: logoUrl,
        companyName: settingsData?.company_name || 'Property Management'
      })

      // Open print window
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        showError('Print blocked', 'Please allow popups to print statements')
        return
      }

      // Write HTML content
      printWindow.document.write(html)
      printWindow.document.close()
      
      // Wait for images and content to fully load before printing
      printWindow.onload = () => {
        setTimeout(() => {
          try {
            printWindow.print()
          } catch (printErr) {
            console.error('Print dialog failed:', printErr)
            showError('Print failed', 'Could not open print dialog')
          }
        }, 500)
      }
    } catch (err) {
      console.error('Print preparation failed:', err)
      showError('Print failed', err instanceof Error ? err.message : 'Could not generate statement for printing')
    }
  }

  // View handler - opens in new tab for on-screen viewing
  const handleView = async () => {
    if (!statement) return

    try {
      // Get company logo URL
      let logoUrl = null
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('company_name, logo_storage_path')
        .single()

      if (!settingsError && (settings as any)?.logo_storage_path) {
        const { data: signedUrlData } = await supabase.storage
          .from('company-assets')
          .createSignedUrl((settings as any).logo_storage_path, 3600)
        
        if (signedUrlData?.signedUrl) {
          logoUrl = signedUrlData.signedUrl
        }
      }

      const html = generateStatementHTML({
        statement,
        tenancies: tenancies ?? [],
        rentTransactions: rentTransactions ?? [],
        expenses: expenses ?? [],
        companyLogo: logoUrl,
        companyName: (settings as any)?.company_name || 'Property Management'
      })

      // Open in new tab for viewing
      const viewWindow = window.open('', '_blank')
      if (!viewWindow) {
        showError('View blocked', 'Please allow popups to view statements')
        return
      }

      viewWindow.document.write(html)
      viewWindow.document.close()
    } catch (err) {
      console.error('View preparation failed:', err)
      showError('View failed', err instanceof Error ? err.message : 'Could not generate statement for viewing')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-500">Loading statement…</span>
      </div>
    )
  }

  if (!statement) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Statement not found</p>
        <Link to="/finance/statements">
          <Button variant="link">Back to Statements</Button>
        </Link>
      </div>
    )
  }

  const landlord = statement.landlords || {}
  const totalExpenses = (expenses ?? []).reduce((sum: number, e: any) => sum + e.amount, 0)

  // Calculate per-property breakdown
  const propertyMap = new Map<string, { address: string; rent: number; expense: number }>()
  
  (tenancies ?? []).forEach((t: any) => {
    const propId = t.property_id
    const address = t.properties?.address || 'Unknown Property'
    if (!propertyMap.has(propId)) {
      propertyMap.set(propId, { address, rent: 0, expense: 0 })
    }
  })

  (rentTransactions ?? []).forEach((tx: any) => {
    const tenancy = (tenancies ?? []).find((t: any) => t.id === tx.tenancy_id)
    if (tenancy) {
      const propId = (tenancy as any).property_id
      const existing = propertyMap.get(propId) || { address: 'Unknown', rent: 0, expense: 0 }
      existing.rent += tx.amount
      propertyMap.set(propId, existing)
    }
  })

  (expenses ?? []).forEach((exp: any) => {
    const propId = exp.property_id
    const existing = propertyMap.get(propId) || { address: 'Unknown', rent: 0, expense: 0 }
    existing.expense += exp.amount
    propertyMap.set(propId, existing)
  })

  const properties = Array.from(propertyMap.entries()).map(([id, data]) => ({ id, ...data }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/finance/statements">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Statement Details</h1>
          <p className="text-gray-500 text-sm mt-1">
            {landlord.full_name} • {formatDate(statement.period_start)} – {formatDate(statement.period_end)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleView}>
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Landlord Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Landlord Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Name:</span>
            <p className="font-medium">{landlord.full_name || '—'}</p>
          </div>
          <div>
            <span className="text-gray-500">Email:</span>
            <p className="font-medium">{landlord.email || '—'}</p>
          </div>
          <div>
            <span className="text-gray-500">Phone:</span>
            <p className="font-medium">{landlord.phone || '—'}</p>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>
            <div className="mt-1">
              {statement.paid_at ? (
                <Badge variant="success">Paid on {formatDate(statement.paid_at)}</Badge>
              ) : (
                <Badge variant="outline">Unpaid</Badge>
              )}
            </div>
          </div>
          {landlord.address_line1 && (
            <div className="md:col-span-2">
              <span className="text-gray-500">Address:</span>
              <p className="font-medium">
                {landlord.address_line1}
                {landlord.address_line2 && `, ${landlord.address_line2}`}
                {landlord.city && `, ${landlord.city}`}
                {landlord.postcode && `, ${landlord.postcode}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-xs text-gray-500 mb-1">Gross Rent</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(statement.total_rent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-xs text-gray-500 mb-1">Agency Fees</p>
            <p className="text-2xl font-bold text-red-600">-{formatCurrency(statement.fees_deducted)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-xs text-gray-500 mb-1">Expenses</p>
            <p className="text-2xl font-bold text-red-600">-{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-xs text-gray-500 mb-1">Net Payout</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(statement.net_payout)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Property Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Property Breakdown</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead className="text-right">Rent Collected</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Net Income</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                  No properties in this period
                </TableCell>
              </TableRow>
            ) : (
              properties.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.address}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.rent)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(p.expense)}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(p.rent - p.expense)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Rent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Rent Transactions</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(rentTransactions ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                  No rent transactions in this period
                </TableCell>
              </TableRow>
            ) : (
              (rentTransactions ?? []).map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell>{formatDate(tx.paid_date)}</TableCell>
                  <TableCell>{tx.tenancies?.properties?.address || '—'}</TableCell>
                  <TableCell className="text-sm">{tx.reference || '—'}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(tx.amount)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Property Expenses</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(expenses ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                  No expenses in this period
                </TableCell>
              </TableRow>
            ) : (
              (expenses ?? []).map((exp: any) => (
                <TableRow key={exp.id}>
                  <TableCell>{formatDate(exp.date)}</TableCell>
                  <TableCell>{exp.properties?.address || '—'}</TableCell>
                  <TableCell><Badge variant="outline">{exp.category || '—'}</Badge></TableCell>
                  <TableCell className="text-sm">{exp.description || '—'}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(exp.amount)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
