import { MERGE_FIELD_KEYS } from '../mergeFields'
import {
  COLOR_CLASS_MAP,
  HIGHLIGHT_CLASS_MAP,
  FONT_FAMILY_CLASS_MAP,
  FONT_SIZE_CLASS_MAP,
} from '../extensions/ClassExtensions'

/**
 * Pre-process raw template HTML before loading into TipTap:
 * 1. Migrate inline styles → CSS classes (one-way conversion).
 * 2. Wrap each `{{field_key}}` token in a `<span data-merge-field="key">` element
 *    so that MergeFieldNode can parse it.
 *
 * Round-trip contract:
 *   preprocessTemplateHTML(serialise(editor)) === serialise(editor)
 *   i.e. tokens already wrapped are NOT double-wrapped.
 */
const TOKEN_REGEX = /\{\{([a-z0-9_]+)\}\}/g

// ─── Inline-style → class migration ──────────────────────────────────

/** Normalise a CSS value: lowercase, trim, strip quotes */
function norm(v: string): string {
  return v.trim().toLowerCase().replace(/['"]/g, '')
}

/**
 * Convert inline style attributes to CSS class names.
 *
 * Handles:
 *   color              → tc-xxxxxx
 *   font-size          → fs-NN
 *   font-family        → ff-name
 *   text-align         → ta-align
 *   background-color   → hl-name  (on <mark> elements)
 */
function migrateInlineStylesToClasses(html: string): string {
  // Skip if no inline styles at all
  if (!html.includes('style=')) return html

  return html.replace(
    /<([a-z][a-z0-9]*)\s([^>]*?)style="([^"]*)"([^>]*)>/gi,
    (_match, tag: string, before: string, style: string, after: string) => {
      const isMark = tag.toLowerCase() === 'mark'
      const newClasses: string[] = []
      let remainingStyles: string[] = []

      // Split style string into individual declarations
      const declarations = style.split(';').filter(d => d.trim())

      for (const decl of declarations) {
        const colonIdx = decl.indexOf(':')
        if (colonIdx === -1) {
          remainingStyles.push(decl)
          continue
        }
        const prop = decl.substring(0, colonIdx).trim().toLowerCase()
        const val = norm(decl.substring(colonIdx + 1))

        let converted = false

        // Text colour
        if (prop === 'color') {
          const hex = val.replace('#', '')
          const cls = COLOR_CLASS_MAP[`#${hex}`]
          if (cls) {
            newClasses.push(cls)
            converted = true
          }
        }

        // Font size
        if (prop === 'font-size') {
          const size = val.replace(/\s/g, '')
          const cls = FONT_SIZE_CLASS_MAP[size]
          if (cls) {
            newClasses.push(cls)
            converted = true
          }
        }

        // Font family
        if (prop === 'font-family') {
          const family = val.replace(/['"]/g, '').trim()
          // Try exact match first, then case-insensitive
          const cls = FONT_FAMILY_CLASS_MAP[family]
            || Object.entries(FONT_FAMILY_CLASS_MAP).find(
                ([k]) => k.toLowerCase() === family.toLowerCase(),
              )?.[1]
          if (cls) {
            newClasses.push(cls)
            converted = true
          }
        }

        // Text alignment
        if (prop === 'text-align') {
          const align = val.trim()
          if (['left', 'center', 'right', 'justify'].includes(align)) {
            newClasses.push(`ta-${align}`)
            converted = true
          }
        }

        // Highlight / background colour (only on <mark>)
        if (prop === 'background-color' && isMark) {
          const hex = val.replace('#', '')
          const cls = HIGHLIGHT_CLASS_MAP[`#${hex}`]
          if (cls) {
            newClasses.push(cls)
            converted = true
          }
        }

        if (!converted) {
          remainingStyles.push(decl.trim())
        }
      }

      // Build the replacement tag
      const parts: string[] = [`<${tag}`]
      if (before.trim()) parts.push(` ${before.trim()}`)

      // Merge with any existing class attribute
      const existingClassMatch = after.match(/class="([^"]*)"/i)
      if (existingClassMatch) {
        const existingClasses = existingClassMatch[1]
        const allClasses = [...new Set([...existingClasses.split(/\s+/).filter(Boolean), ...newClasses])]
        parts.push(` class="${allClasses.join(' ')}"`)
        // Remove the old class attribute from `after`
        after = after.replace(existingClassMatch[0], '').trim()
      } else if (newClasses.length > 0) {
        parts.push(` class="${newClasses.join(' ')}"`)
      }

      // Keep remaining unconverted styles
      if (remainingStyles.length > 0) {
        parts.push(` style="${remainingStyles.join('; ')}"`)
      }

      if (after.trim()) parts.push(` ${after.trim()}`)
      parts.push('>')

      return parts.join('')
    },
  )
}

// ─── Main export ─────────────────────────────────────────────────────

export function preprocessTemplateHTML(html: string): string {
  // Step 1: migrate any inline styles to CSS classes
  const migrated = migrateInlineStylesToClasses(html)

  // Step 2: wrap merge field tokens for MergeFieldNode
  return migrated.replace(TOKEN_REGEX, (_match, fieldKey: string) => {
    const known = MERGE_FIELD_KEYS.has(fieldKey)
    const label = fieldKey.replace(/_/g, ' ')
    return `<span data-merge-field="${fieldKey}" data-known="${known}">${label}</span>`
  })
}
