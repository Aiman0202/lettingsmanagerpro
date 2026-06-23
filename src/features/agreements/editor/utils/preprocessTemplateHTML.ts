import { MERGE_FIELD_KEYS } from '../mergeFields'

/**
 * Pre-process raw template HTML before loading into TipTap:
 * - Wraps each `{{field_key}}` token in a `<span data-merge-field="key">` element
 *   so that MergeFieldNode can parse it.
 * - If the field key is recognised, it gets the known label.
 * - If the field key is NOT recognised, the chip still renders but labels it as raw key.
 *
 * Round-trip contract:
 *   preprocessTemplateHTML(serialise(editor)) === serialise(editor)
 *   i.e. tokens already wrapped are NOT double-wrapped.
 */
const TOKEN_REGEX = /\{\{([a-z0-9_]+)\}\}/g

export function preprocessTemplateHTML(html: string): string {
  return html.replace(TOKEN_REGEX, (_match, fieldKey: string) => {
    const known = MERGE_FIELD_KEYS.has(fieldKey)
    const label = fieldKey.replace(/_/g, ' ')
    return `<span data-merge-field="${fieldKey}" data-known="${known}">${label}</span>`
  })
}
