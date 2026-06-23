import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Settings, X } from 'lucide-react'
import AgreementPrintView from './AgreementPrintView'
import PrintCustomizationPanel from './PrintCustomizationPanel'
import { DEFAULT_PRINT_OPTIONS, printOptionsToCssVars } from '@/utils/print-options'
import type { PrintOptions } from '@/utils/print-options'

interface AgreementPreviewDialogProps {
  agreementId: string
  open: boolean
  onClose: () => void
}

export default function AgreementPreviewDialog({ agreementId, open, onClose }: AgreementPreviewDialogProps) {
  const [printOptions, setPrintOptions] = useState<PrintOptions>(DEFAULT_PRINT_OPTIONS)
  const [showPanel, setShowPanel] = useState(true)

  function handlePrint() {
    // Apply CSS variables to the document root so they persist in print
    const vars = printOptionsToCssVars(printOptions)
    const root = document.documentElement
    Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val))
    root.dataset.pageNumbering = printOptions.pageNumbering
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full max-h-[92vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Agreement Print Preview</DialogTitle>
            <div className="flex gap-2 items-center">
              <Button
                variant={showPanel ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowPanel(!showPanel)}
                title={showPanel ? 'Hide settings panel' : 'Show settings panel'}
                className="gap-1.5"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button onClick={handlePrint} size="sm" className="gap-1.5">
                <Printer className="h-4 w-4" /> Print / Save PDF
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Adjust print settings on the right. Changes apply live to the preview below.
          </p>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Preview area */}
          <div className="flex-1 overflow-y-auto bg-gray-100 py-6">
            <AgreementPrintView
              agreementId={agreementId}
              showPreview={true}
              printOptions={printOptions}
            />
          </div>

          {/* Settings panel */}
          {showPanel && (
            <div className="w-72 shrink-0 overflow-y-auto border-l border-gray-200 bg-white px-4 py-5">
              <PrintCustomizationPanel options={printOptions} onChange={setPrintOptions} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
