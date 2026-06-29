import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Save, AlertCircle, FileText, Code, Eye, Settings } from 'lucide-react'
import TemplateEditor, { type TemplateEditorHandle } from './TemplateEditor'
import AgreementLayoutSettings from '@/components/AgreementLayoutSettings'
import { useToast } from '@/contexts/ToastContext'

interface TemplateEditorDialogProps {
  open: boolean
  onClose: () => void
}

export default function TemplateEditorDialog({ open, onClose }: TemplateEditorDialogProps) {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const editorRef = useRef<TemplateEditorHandle>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'visual' | 'html'>('visual')
  const [htmlContent, setHtmlContent] = useState('')
  const [activeTab, setActiveTab] = useState<'editor' | 'layout-settings'>('editor')

  // Clear errors when dialog opens
  useEffect(() => {
    if (open) setSaveError(null)
  }, [open])

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

  // Sync HTML content when template loads
  useEffect(() => {
    if (existingTemplate?.body_html) {
      setHtmlContent(existingTemplate.body_html)
    }
  }, [existingTemplate])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (html: string) => {
      // First try to update existing row (must add .select() to get data back)
      const { error: updateError, data: updateData } = await (supabase.from('agreement_defaults') as any)
        .update({ body_html: html, updated_at: new Date().toISOString() })
        .eq('key', 'default_ast')
        .select('*')
      
      // If update succeeded and returned data, we're done
      if (!updateError && updateData && updateData.length > 0) {
        return
      }
      
      // If update found no rows, insert new one
      const insertPayload = { key: 'default_ast', name: 'Assured Periodic Tenancy Agreement', body_html: html }
      
      const { error: insertError } = await (supabase.from('agreement_defaults') as any)
        .insert(insertPayload)
      if (insertError) {
        throw insertError
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agreement_defaults'] })
      qc.invalidateQueries({ queryKey: ['agreements'] })
      success('Template Saved', 'The agreement template has been saved successfully.')
      onClose()
    },
    onError: (err: Error) => {
      console.error('Template save error:', err)
      const msg = err.message || 'Failed to save template. Please try again.'
      setSaveError(msg)
      showError('Save Failed', msg)
    },
  })

  const handleSave = () => {
    setSaveError(null)
    
    let htmlToSave = ''
    
    if (viewMode === 'html') {
      // Save directly from HTML source
      htmlToSave = htmlContent
      if (!htmlToSave || htmlToSave.length < 10) {
        const msg = 'Template content is too short. Please add some content before saving.'
        setSaveError(msg)
        showError('Save Failed', msg)
        return
      }
    } else {
      // Save from WYSIWYG editor
      if (!editorRef.current) {
        const msg = 'Editor is not ready yet. Please wait a moment and try again.'
        setSaveError(msg)
        showError('Save Failed', msg)
        return
      }
      const { valid, error } = editorRef.current.validate()
      if (!valid) {
        const msg = error ?? 'Validation failed'
        setSaveError(msg)
        showError('Validation Error', msg)
        return
      }
      htmlToSave = editorRef.current.getHTML()
      if (!htmlToSave || htmlToSave.length < 10) {
        const msg = 'Template content is too short. Please add some content before saving.'
        setSaveError(msg)
        showError('Save Failed', msg)
        return
      }
    }
    
    saveMutation.mutate(htmlToSave)
  }

  const handleToggleView = () => {
    if (viewMode === 'visual' && editorRef.current) {
      // Switch to HTML: get current HTML from editor
      setHtmlContent(editorRef.current.getHTML())
      setViewMode('html')
    } else {
      // Switch back to visual
      setViewMode('visual')
    }
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
              {viewMode === 'html' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleView}
                  disabled={saveMutation.isPending}
                  className="gap-1.5"
                >
                  <Eye className="h-4 w-4" />
                  Visual Editor
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleView}
                  disabled={saveMutation.isPending}
                  className="gap-1.5"
                >
                  <Code className="h-4 w-4" />
                  HTML Source
                </Button>
              )}
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
            {activeTab === 'editor' ? (
              viewMode === 'html' 
                ? 'Edit HTML source code directly. Use merge fields like {{tenant_name}} for dynamic data.'
                : 'Use merge fields from the right panel to insert dynamic data. The template is used when generating new agreements.'
            ) : (
              'Customize how agreements look when printed. Configure margins, fonts, colors, headers, footers, and signature layout. Settings are saved to the database.'
            )}
          </p>
          {saveError && (
            <div className="mt-2 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Template Editor
            </div>
          </button>
          <button
            onClick={() => setActiveTab('layout-settings')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'layout-settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Layout Settings
            </div>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-[450px]">
          {loadingTemplate ? (
            <div className="flex items-center justify-center w-full">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : activeTab === 'layout-settings' ? (
            <div className="flex-1 overflow-y-auto">
              <AgreementLayoutSettings />
            </div>
          ) : viewMode === 'html' ? (
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">HTML Source Code</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{htmlContent.length} characters</span>
                </div>
              </div>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ tabSize: 2 }}
                spellCheck={false}
                placeholder="Enter HTML template code..."
              />
            </div>
          ) : (
            <TemplateEditor
              ref={editorRef}
              initialHtml={existingTemplate?.body_html ?? ''}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
