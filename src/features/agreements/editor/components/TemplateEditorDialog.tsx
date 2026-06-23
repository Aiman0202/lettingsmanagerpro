import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Save, AlertCircle, FileText } from 'lucide-react'
import TemplateEditor from './TemplateEditor'
import { useTemplateEditor } from '../hooks/useTemplateEditor'

interface TemplateEditorDialogProps {
  open: boolean
  onClose: () => void
}

export default function TemplateEditorDialog({ open, onClose }: TemplateEditorDialogProps) {
  const qc = useQueryClient()
  const [htmlOutput, setHtmlOutput] = useState<string>('')
  const [saveError, setSaveError] = useState<string | null>(null)

  // Fetch existing template
  const { data: existingTemplate, isLoading: loadingTemplate } = useQuery({
    queryKey: ['agreement_defaults', 'default_ast'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agreement_defaults')
        .select('body_html')
        .eq('key', 'default_ast')
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return (data as unknown as { body_html: string } | null) ?? null
    },
    enabled: open,
  })

  const editorHook = useTemplateEditor({
    initialHtml: existingTemplate?.body_html ?? '',
    placeholder: 'Start building your AST template…',
  })

  // Sync editor changes to htmlOutput
  const syncHtml = useCallback(() => {
    const html = editorHook.getHTML()
    setHtmlOutput(html)
    setSaveError(null)
  }, [editorHook])

  // Initial sync when template loads
  useEffect(() => {
    if (existingTemplate) {
      syncHtml()
    }
  }, [existingTemplate, syncHtml])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (html: string) => {
      const { error } = await (supabase.from('agreement_defaults') as any)
        .upsert({ key: 'default_ast', body_html: html }, { onConflict: 'key' })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agreement_defaults'] })
      qc.invalidateQueries({ queryKey: ['agreements'] })
      onClose()
    },
    onError: (err: Error) => {
      setSaveError(err.message)
    },
  })

  const handleSave = () => {
    const { valid, error } = editorHook.validate()
    if (!valid) {
      setSaveError(error ?? 'Validation failed')
      return
    }
    const html = editorHook.getHTML()
    setHtmlOutput(html)
    saveMutation.mutate(html)
  }

  const isLoading = loadingTemplate || saveMutation.isPending

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val && !saveMutation.isPending) onClose() }}>
      <DialogContent className="max-w-[95vw] w-full max-h-[92vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Edit Default AST Template
            </DialogTitle>
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={saveMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isLoading}
                className="gap-1.5"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Template
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Use merge fields from the right panel to insert dynamic data. The template is used when generating new agreements.
          </p>
          {saveError && (
            <div className="mt-2 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-[450px]">
          {loadingTemplate ? (
            <div className="flex items-center justify-center w-full">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <TemplateEditor
              editor={editorHook}
              onHtmlChange={setHtmlOutput}
            />
          )}
        </div>

        {/* Hidden output for debugging */}
        {htmlOutput && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-1.5 shrink-0">
            <details className="text-xs text-gray-400">
              <summary className="cursor-pointer hover:text-gray-600">HTML output ({htmlOutput.length} chars)</summary>
              <pre className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap font-mono text-[10px] text-gray-500">
                {htmlOutput.slice(0, 2000)}{htmlOutput.length > 2000 ? '…' : ''}
              </pre>
            </details>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
