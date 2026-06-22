import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, X } from 'lucide-react'
import AgreementPrintView from './AgreementPrintView'

interface AgreementPreviewDialogProps {
  agreementId: string
  open: boolean
  onClose: () => void
}

export default function AgreementPreviewDialog({ agreementId, open, onClose }: AgreementPreviewDialogProps) {
  function handlePrint() {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Agreement Print Preview</DialogTitle>
            <div className="flex gap-2">
              <Button onClick={handlePrint} size="sm">
                <Printer className="h-4 w-4 mr-2" /> Print / Save PDF
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Preview how the agreement will appear when printed. Use browser print dialog to save as PDF.
          </p>
        </DialogHeader>

        <div className="bg-gray-100 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          <AgreementPrintView agreementId={agreementId} showPreview={true} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
