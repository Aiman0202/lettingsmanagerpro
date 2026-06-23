import { useMemo, useCallback } from 'react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { MergeFieldNode } from '../extensions/MergeFieldNode'
import { preprocessTemplateHTML } from '../utils/preprocessTemplateHTML'

/**
 * Two-strike validation:
 * 1. Check that the raw HTML contains `{{tenant_name}}` after de-serialisation.
 * 2. Also check after serialise(editor).
 */
function validateTemplate(html: string): { valid: boolean; error: string | null } {
  if (!html || html.trim().length === 0) {
    return { valid: false, error: 'Template body cannot be empty.' }
  }
  // Check {{tenant_name}} is present (as raw token or as data-merge-field)
  if (
    !html.includes('{{tenant_name}}') &&
    !html.includes('data-merge-field="tenant_name"')
  ) {
    return { valid: false, error: 'Template must include the {{tenant_name}} merge field.' }
  }
  return { valid: true, error: null }
}

export interface UseTemplateEditorOptions {
  initialHtml?: string
  placeholder?: string
}

export function useTemplateEditor({
  initialHtml = '',
  placeholder = 'Start typing…',
}: UseTemplateEditorOptions = {}) {
  const processedInitialHtml = useMemo(
    () => preprocessTemplateHTML(initialHtml),
    [initialHtml],
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      MergeFieldNode,
    ],
    content: processedInitialHtml,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-3',
      },
      // Allow tab to indent lists
      handleKeyDown: (_view, event) => {
        if (event.key === 'Tab') {
          return false // let TipTap default handle list indentation
        }
        return false
      },
    },
  })

  /**
   * Insert a merge field token at the current cursor position.
   */
  const insertMergeField = useCallback(
    (fieldKey: string) => {
      if (!editor) return
      editor.chain().focus().insertContent({
        type: 'mergeField',
        attrs: { fieldKey, known: true },
      }).run()
    },
    [editor],
  )

  /**
   * Serialise editor content back to HTML.
   * Converts `<span data-merge-field="X">Y</span>` back to `{{X}}`.
   */
  const getHTML = useCallback((): string => {
    if (!editor) return ''
    const rawHtml = editor.getHTML()
    // Convert merge field spans back to {{token}} format
    return rawHtml.replace(
      /<span[^>]*data-merge-field="([a-z0-9_]+)"[^>]*>[^<]*<\/span>/gi,
      '{{\$1}}'
    )
  }, [editor])

  /**
   * Validate the current template content.
   */
  const validate = useCallback((): { valid: boolean; error: string | null } => {
    const html = getHTML()
    return validateTemplate(html)
  }, [getHTML])

  return {
    editor,
    insertMergeField,
    getHTML,
    validate,
  }
}
