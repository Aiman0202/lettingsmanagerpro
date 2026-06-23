import { useEffect, forwardRef, useImperativeHandle } from 'react'
import { EditorContent } from '@tiptap/react'
import EditorToolbar from './EditorToolbar'
import MergeFieldPanel from './MergeFieldPanel'
import { useTemplateEditor } from '../hooks/useTemplateEditor'
import { preprocessTemplateHTML } from '../utils/preprocessTemplateHTML'

export interface TemplateEditorHandle {
  getHTML: () => string
  validate: () => { valid: boolean; error: string | null }
}

interface TemplateEditorProps {
  initialHtml?: string
  onHtmlChange?: (html: string) => void
  placeholder?: string
}

const TemplateEditor = forwardRef<TemplateEditorHandle, TemplateEditorProps>(function TemplateEditor({
  initialHtml = '',
  onHtmlChange,
  placeholder,
}, ref) {
  const { editor, insertMergeField, getHTML, validate } = useTemplateEditor({
    initialHtml,
    placeholder,
  })

  // Expose getHTML and validate to parent via ref
  useImperativeHandle(ref, () => ({ getHTML, validate }), [getHTML, validate])

  // Sync editor content when initialHtml changes (e.g. after template loads from DB)
  useEffect(() => {
    if (editor && initialHtml) {
      const processed = preprocessTemplateHTML(initialHtml)
      editor.commands.setContent(processed)
    }
  }, [editor, initialHtml])

  const handleInsert = (fieldKey: string) => {
    insertMergeField(fieldKey)
    onHtmlChange?.(getHTML())
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main editor area */}
      <div className="flex flex-col flex-1 min-w-0">
        <EditorToolbar editor={editor} />
        <div className="flex-1 overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Side panel */}
      <MergeFieldPanel onInsert={handleInsert} />
    </div>
  )
})

export default TemplateEditor
