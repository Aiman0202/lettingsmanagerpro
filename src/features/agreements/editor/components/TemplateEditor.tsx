import { EditorContent } from '@tiptap/react'
import EditorToolbar from './EditorToolbar'
import MergeFieldPanel from './MergeFieldPanel'
import { useTemplateEditor } from '../hooks/useTemplateEditor'

interface TemplateEditorProps {
  initialHtml?: string
  onHtmlChange?: (html: string) => void
  placeholder?: string
  /** Provide an external editor if using the hook externally (e.g. from dialog) */
  editor?: ReturnType<typeof useTemplateEditor>
}

export default function TemplateEditor({
  initialHtml = '',
  onHtmlChange,
  placeholder,
  editor: externalEditor,
}: TemplateEditorProps) {
  const internalEditor = useTemplateEditor({ initialHtml, placeholder })
  const { editor, insertMergeField, getHTML } = externalEditor ?? internalEditor

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

        {/* Live HTML preview row */}
        {onHtmlChange && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
            <button
              type="button"
              onClick={() => onHtmlChange(getHTML())}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Sync HTML output
            </button>
          </div>
        )}
      </div>

      {/* Side panel */}
      <MergeFieldPanel onInsert={handleInsert} />
    </div>
  )
}
