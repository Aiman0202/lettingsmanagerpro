import { Node, mergeAttributes } from '@tiptap/core'

/**
 * MergeFieldNode – a TipTap custom inline node that renders `{{field_key}}`
 * tokens as non-editable inline chips in the WYSIWYG editor.
 *
 * Attributes:
 *   - fieldKey (string): the lookup key, e.g. "tenant_name"
 *   - known   (bool):   whether this key exists in MERGE_FIELD_KEYS
 *
 * parseHTML(): matches `<span data-merge-field="...">`
 * renderHTML(): emits a `<span data-merge-field="..." data-known="...">`
 *   containing the human-readable label (or key if unknown).
 */
export interface MergeFieldNodeAttrs {
  fieldKey: string
  known: boolean
}

export const MergeFieldNode = Node.create<Record<string, never>, MergeFieldNodeAttrs>({
  name: 'mergeField',

  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      fieldKey: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-merge-field'),
        renderHTML: (attrs) => ({ 'data-merge-field': attrs.fieldKey as string }),
      },
      known: {
        default: true,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-known') === 'true',
        renderHTML: (attrs) => ({ 'data-known': String(!!attrs.known) }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-merge-field]' }]
  },

  renderHTML({ node }) {
    const { fieldKey, known } = node.attrs as MergeFieldNodeAttrs
    const label = fieldKey.replace(/_/g, ' ')
    return [
      'span',
      mergeAttributes({
        'data-merge-field': fieldKey,
        'data-known': String(known),
        class: known
          ? 'inline-flex items-center gap-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 mx-0.5 cursor-default select-none'
          : 'inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 mx-0.5 cursor-default select-none',
        'data-type': 'merge-field',
      }),
      label,
    ]
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () => false,
      Delete: () => false,
    }
  },
})
