import { useEffect, forwardRef, useImperativeHandle, useState } from 'react'
import { EditorContent } from '@tiptap/react'
import EditorToolbar from './EditorToolbar'
import MergeFieldPanel from './MergeFieldPanel'
import ClauseLibraryPanel from './ClauseLibraryPanel'
import ConditionalBlocksPanel from './ConditionalBlocksPanel'
import { useTemplateEditor } from '../hooks/useTemplateEditor'
import { preprocessTemplateHTML } from '../utils/preprocessTemplateHTML'
import { BookOpen, GitBranch, Variable } from 'lucide-react'

export interface TemplateEditorHandle {
  getHTML: () => string
  validate: () => { valid: boolean; error: string | null }
  insertPageBreak: () => void
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
  const { editor, insertMergeField, insertPageBreak, getHTML, validate } = useTemplateEditor({
    initialHtml,
    placeholder,
  })

  const [activePanel, setActivePanel] = useState<'merge-fields' | 'clauses' | 'conditionals'>('merge-fields')

  // Expose getHTML and validate to parent via ref
  useImperativeHandle(ref, () => ({ getHTML, validate, insertPageBreak }), [getHTML, validate, insertPageBreak])

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

  const handleInsertClause = (clauseHtml: string) => {
    if (editor) {
      editor.commands.insertContent(clauseHtml)
      editor.commands.focus()
      onHtmlChange?.(getHTML())
    }
  }

  const handleInsertBlock = (blockHtml: string) => {
    if (editor) {
      editor.commands.insertContent(blockHtml)
      editor.commands.focus()
      onHtmlChange?.(getHTML())
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main editor area */}
      <div className="flex flex-col flex-1 min-w-0">
        <EditorToolbar editor={editor} onInsertPageBreak={insertPageBreak} />
        <div className="flex-1 overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Side panel with tabs */}
      <div className="w-80 border-l border-gray-200 flex flex-col">
        {/* Tab buttons */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActivePanel('merge-fields')}
            className={`flex-1 px-3 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activePanel === 'merge-fields'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Variable className="h-3.5 w-3.5" />
            Fields
          </button>
          <button
            onClick={() => setActivePanel('clauses')}
            className={`flex-1 px-3 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activePanel === 'clauses'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Clauses
          </button>
          <button
            onClick={() => setActivePanel('conditionals')}
            className={`flex-1 px-3 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activePanel === 'conditionals'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            Logic
          </button>
        </div>

        {/* Panel content */}
        {activePanel === 'merge-fields' && <MergeFieldPanel onInsert={handleInsert} />}
        {activePanel === 'clauses' && <ClauseLibraryPanel onInsertClause={handleInsertClause} />}
        {activePanel === 'conditionals' && <ConditionalBlocksPanel onInsertBlock={handleInsertBlock} />}
      </div>
    </div>
  )
})

export default TemplateEditor
