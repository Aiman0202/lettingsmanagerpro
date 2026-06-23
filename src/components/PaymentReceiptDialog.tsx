import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Printer, Download, FileText } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { calculatePeriod, formatPeriod, type ReceiptData } from '@/utils/receipt'
import { printReceipt } from '@/utils/receipt-pdf'

interface Props {
  open: boolean
  onClose: () => void
  transaction: any
  tenantName?: string
  propertyAddress?: string
  tenancyRef?: string
  balanceBefore?: number
  balanceAfter?: number
  totalDue?: number
  totalPaid?: number
}

export default function PaymentReceiptDialog({
  open, onClose, transaction, tenantName, propertyAddress, tenancyRef,
  balanceBefore = 0, balanceAfter = 0, totalDue = 0, totalPaid = 0,
}: Props) {
  const { data: company } = useQuery({
    queryKey: ['company-settings-receipt'],
    queryFn: async () => {
      const { data } = await supabase
        .from('company_settings')
        .select('company_name, address_line1, city, postcode, phone, email, logo_storage_path')
        .single()
      return data as any
    },
  })

  const { data: logoUrl } = useQuery({
    queryKey: ['company-logo-receipt', company?.logo_storage_path],
    queryFn: async () => {
      if (!company?.logo_storage_path) return null
      const { data } = await supabase.storage
        .from('company-assets')
        .createSignedUrl(company.logo_storage_path, 3600)
      return data?.signedUrl ?? null
    },
    enabled: !!company?.logo_storage_path,
  })

  if (!transaction) return null

  const t = transaction as any
  const period = t.period_start && t.period_end
    ? { start: t.period_start, end: t.period_end }
    : calculatePeriod(t.due_date)
  const amountPaid = t.amount_paid ?? (t.status === 'paid' ? t.amount : 0)
  const receiptNumber = t.receipt_number || 'PENDING'

  const companyAddress = company
    ? [company.address_line1, company.city, company.postcode].filter(Boolean).join(', ')
    : ''

  const receiptData: ReceiptData = {
    receiptNumber,
    tenantName: tenantName ?? '',
    propertyAddress: propertyAddress ?? '',
    tenancyRef: tenancyRef ?? '',
    amount: t.amount,
    amountPaid,
    periodStart: period.start,
    periodEnd: period.end,
    paidDate: t.paid_date ?? t.due_date,
    paymentMethod: t.payment_method ?? '',
    balanceBefore,
    balanceAfter,
    totalDue,
    totalPaid,
    companyName: company?.company_name ?? 'LettingsPro',
    companyAddress,
    companyPhone: company?.phone ?? '',
    companyEmail: company?.email ?? '',
    logoUrl: logoUrl ?? null,
  }

  function handlePrint() {
    printReceipt(receiptData)
  }

  function handleDownloadPDF() {
    // Same as print — user selects "Save as PDF" from the print dialog
    printReceipt(receiptData)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" /> Payment Receipt
            <Badge variant="outline" className="ml-auto font-mono text-xs">{receiptNumber}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4 no-print">
          {/* Company + Tenant header */}
          <div className="bg-gray-50 rounded-lg p-3 border">
            <p className="font-semibold text-gray-900">{company?.company_name ?? 'LettingsPro'}</p>
            <p className="text-xs text-gray-500">{companyAddress}</p>
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-sm"><span className="text-gray-500">Tenant:</span> {tenantName}</p>
              <p className="text-sm"><span className="text-gray-500">Property:</span> {propertyAddress}</p>
              {tenancyRef && <p className="text-sm"><span className="text-gray-500">Ref:</span> {tenancyRef}</p>}
            </div>
          </div>

          {/* Payment details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Payment Date</p>
              <p className="font-medium">{formatDate(t.paid_date ?? t.due_date)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Method</p>
              <p className="font-medium capitalize">{(t.payment_method ?? '—').replace('_', ' ')}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500 text-xs">Period Covered</p>
              <p className="font-medium">{formatPeriod(period.start, period.end)}</p>
            </div>
          </div>

          {/* Amount table */}
          <div className="border rounded-lg overflow-hidden text-sm">
            <div className="flex justify-between p-2 bg-gray-50 border-b">
              <span className="text-gray-600">Rent Due</span>
              <span className="font-semibold">{formatCurrency(t.amount)}</span>
            </div>
            <div className="flex justify-between p-2 border-b">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-semibold text-green-600">{formatCurrency(amountPaid)}</span>
            </div>
            {amountPaid < t.amount && (
              <div className="flex justify-between p-2 border-b bg-red-50">
                <span className="text-red-700">Outstanding</span>
                <span className="font-semibold text-red-600">{formatCurrency(t.amount - amountPaid)}</span>
              </div>
            )}
          </div>

          {/* Balance summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-800 mb-2">Account Summary</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Before</p>
                <p className={`text-lg font-bold ${balanceBefore > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(balanceBefore)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Payment</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(amountPaid)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">After</p>
                <p className={`text-lg font-bold ${balanceAfter > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(balanceAfter)}
                </p>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-between text-sm pt-2 border-t">
            <div><span className="text-gray-500">Total Due:</span> <span className="font-medium">{formatCurrency(totalDue)}</span></div>
            <div><span className="text-gray-500">Total Paid:</span> <span className="font-medium text-green-600">{formatCurrency(totalPaid)}</span></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-1" /> Save as PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
