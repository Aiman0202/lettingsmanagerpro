/**
 * CSS Class-based TipTap Extensions
 *
 * These extensions replace inline style attributes with CSS class names
 * in the serialised HTML output.  This keeps stored template HTML clean,
 * maintainable, and easy to re-style globally.
 *
 * Class naming convention:
 *   tc-<hex>   → text colour   (e.g. tc-ff0000)
 *   hl-<name>  → highlight      (e.g. hl-yellow)
 *   ff-<name>  → font family    (e.g. ff-arial)
 *   fs-<size>  → font size      (e.g. fs-14pt)
 *   ta-<align> → text alignment (e.g. ta-center)
 */

import { mergeAttributes } from '@tiptap/core'
import { TextStyle } from '@tiptap/extension-text-style'
import { TextAlign } from '@tiptap/extension-text-align'
import { Highlight } from '@tiptap/extension-highlight'

// ─── Value → Class Maps ─────────────────────────────────────────────

export const COLOR_CLASS_MAP: Record<string, string> = {
  '#000000': 'tc-000000',
  '#434343': 'tc-434343',
  '#666666': 'tc-666666',
  '#999999': 'tc-999999',
  '#b7b7b7': 'tc-b7b7b7',
  '#cccccc': 'tc-cccccc',
  '#d9d9d9': 'tc-d9d9d9',
  '#efefef': 'tc-efefef',
  '#f3f3f3': 'tc-f3f3f3',
  '#ffffff': 'tc-ffffff',
  '#980000': 'tc-980000',
  '#ff0000': 'tc-ff0000',
  '#ff9900': 'tc-ff9900',
  '#ffff00': 'tc-ffff00',
  '#00ff00': 'tc-00ff00',
  '#00ffff': 'tc-00ffff',
  '#4a86e8': 'tc-4a86e8',
  '#0000ff': 'tc-0000ff',
  '#9900ff': 'tc-9900ff',
  '#ff00ff': 'tc-ff00ff',
}

export const HIGHLIGHT_CLASS_MAP: Record<string, string> = {
  '#ffff00': 'hl-yellow',
  '#00ff00': 'hl-green',
  '#00ffff': 'hl-cyan',
  '#ff00ff': 'hl-magenta',
  '#ff8000': 'hl-orange',
  '#808080': 'hl-gray',
  '#c0c0c0': 'hl-silver',
  '#ff0000': 'hl-red',
  '#00ff80': 'hl-springgreen',
  '#0080ff': 'hl-dodgerblue',
}

export const FONT_FAMILY_CLASS_MAP: Record<string, string> = {
  'Arial': 'ff-arial',
  'Times New Roman': 'ff-times',
  'Courier New': 'ff-courier',
  'Georgia': 'ff-georgia',
  'Verdana': 'ff-verdana',
}

export const FONT_SIZE_CLASS_MAP: Record<string, string> = {
  '8pt': 'fs-8',
  '10pt': 'fs-10',
  '12pt': 'fs-12',
  '14pt': 'fs-14',
  '16pt': 'fs-16',
  '18pt': 'fs-18',
  '24pt': 'fs-24',
  '30pt': 'fs-30',
}

const ALIGNMENT_CLASS_MAP: Record<string, string> = {
  'left': 'ta-left',
  'center': 'ta-center',
  'right': 'ta-right',
  'justify': 'ta-justify',
}

// ─── Reverse Maps (class → value, for parseHTML) ────────────────────

const COLOR_CLASS_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(COLOR_CLASS_MAP).map(([k, v]) => [v, k]),
)
const HIGHLIGHT_CLASS_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(HIGHLIGHT_CLASS_MAP).map(([k, v]) => [v, k]),
)
const FONT_FAMILY_CLASS_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(FONT_FAMILY_CLASS_MAP).map(([k, v]) => [v, k]),
)
const FONT_SIZE_CLASS_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(FONT_SIZE_CLASS_MAP).map(([k, v]) => [v, k]),
)

// ─── Helpers ─────────────────────────────────────────────────────────

/** Extract class-based attribute values from an element's class list */
function parseClassAttrs(element: HTMLElement) {
  const classList = element.className?.split(/\s+/) ?? []
  const attrs: Record<string, any> = {}

  for (const cls of classList) {
    // Text colour: tc-xxxxxx
    if (cls.startsWith('tc-') && COLOR_CLASS_REVERSE[cls]) {
      attrs.color = COLOR_CLASS_REVERSE[cls]
    }
    // Font size: fs-NN
    if (cls.startsWith('fs-') && FONT_SIZE_CLASS_REVERSE[cls]) {
      attrs.fontSize = FONT_SIZE_CLASS_REVERSE[cls]
    }
    // Font family: ff-name
    if (cls.startsWith('ff-') && FONT_FAMILY_CLASS_REVERSE[cls]) {
      attrs.fontFamily = FONT_FAMILY_CLASS_REVERSE[cls]
    }
    // Highlight: hl-name
    if (cls.startsWith('hl-') && HIGHLIGHT_CLASS_REVERSE[cls]) {
      attrs.highlightColor = HIGHLIGHT_CLASS_REVERSE[cls]
    }
    // Alignment: ta-name
    if (cls.startsWith('ta-')) {
      const align = cls.replace('ta-', '')
      if (['left', 'center', 'right', 'justify'].includes(align)) {
        attrs.textAlign = align
      }
    }
  }
  return attrs
}

// ─── ClassBasedTextStyle ─────────────────────────────────────────────
//
// Replaces the default TextStyle mark.  Instead of emitting
//   <span style="color:#ff0000;font-size:14pt;font-family:Arial;">
// it emits:
//   <span class="tc-ff0000 fs-14 ff-arial">
//
// The internal attribute model (color, fontSize, fontFamily) is
// preserved so that toolbar commands like setColor() continue to work.
// ─────────────────────────────────────────────────────────────────────

export const ClassBasedTextStyle = TextStyle.extend({
  parseHTML() {
    return [
      { tag: 'span[style]' },   // legacy inline-style HTML
      { tag: 'span[class]' },   // new class-based HTML
    ]
  },

  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: parseClassAttrs,
        renderHTML: () => ({}), // merged via renderHTML below
      },
      color: {
        default: null,
        parseHTML: parseClassAttrs,
        rendered: false,
      },
      fontSize: {
        default: null,
        parseHTML: parseClassAttrs,
        rendered: false,
      },
      fontFamily: {
        default: null,
        parseHTML: parseClassAttrs,
        rendered: false,
      },
    }
  },

  renderHTML({ mark, HTMLAttributes }) {
    const classes: string[] = []

    if (mark.attrs.color) {
      const key = mark.attrs.color.toLowerCase()
      classes.push(COLOR_CLASS_MAP[key] || `tc-${key.replace('#', '')}`)
    }
    if (mark.attrs.fontSize) {
      classes.push(FONT_SIZE_CLASS_MAP[mark.attrs.fontSize] || `fs-${mark.attrs.fontSize.replace('pt', '')}`)
    }
    if (mark.attrs.fontFamily) {
      const key = mark.attrs.fontFamily.replace(/['"]/g, '')
      classes.push(FONT_FAMILY_CLASS_MAP[key] || `ff-${key.toLowerCase().replace(/\s+/g, '-')}`)
    }

    return [
      'span',
      mergeAttributes(HTMLAttributes, classes.length > 0 ? { class: classes.join(' ') } : {}),
      0,
    ]
  },
})

// ─── ClassBasedTextAlign ─────────────────────────────────────────────
//
// Replaces TextAlign.  Instead of:
//   <p style="text-align:center;">
// emits:
//   <p class="ta-center">
// ─────────────────────────────────────────────────────────────────────

export const ClassBasedTextAlign = TextAlign.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      types: ['heading', 'paragraph'],
    }
  },

  parseHTML() {
    return [
      { tag: 'span[style]' },
      { tag: 'p[style]' },
      { tag: 'h1[style]' },
      { tag: 'h2[style]' },
      { tag: 'h3[style]' },
      { tag: 'span[class]' },
      { tag: 'p[class]' },
      { tag: 'h1[class]' },
      { tag: 'h2[class]' },
      { tag: 'h3[class]' },
    ]
  },

  addAttributes() {
    return {
      textAlign: {
        default: null,
        parseHTML: parseClassAttrs,
        rendered: false,
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    const align = HTMLAttributes.textAlign as string | null
    const cls = align ? ALIGNMENT_CLASS_MAP[align] : null

    // Strip non-HTML attributes before merging
    const { textAlign: _, ...htmlAttrs } = HTMLAttributes
    return ['p', mergeAttributes(htmlAttrs, cls ? { class: cls } : {}), 0]
  },
})

// ─── ClassBasedHighlight ─────────────────────────────────────────────
//
// Replaces Highlight.  Instead of:
//   <mark style="background-color:#ffff00;">
// emits:
//   <mark class="hl-yellow">
// ─────────────────────────────────────────────────────────────────────

export const ClassBasedHighlight = Highlight.extend({
  parseHTML() {
    return [
      { tag: 'mark[style]' },
      { tag: 'mark[class]' },
    ]
  },

  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: parseClassAttrs,
        renderHTML: () => ({}),
      },
      color: {
        default: null,
        parseHTML: parseClassAttrs,
        rendered: false,
      },
    }
  },

  renderHTML({ mark, HTMLAttributes }) {
    const classes: string[] = []

    if (mark.attrs.color) {
      const key = mark.attrs.color.toLowerCase()
      classes.push(HIGHLIGHT_CLASS_MAP[key] || `hl-${key.replace('#', '')}`)
    }

    return [
      'mark',
      mergeAttributes(HTMLAttributes, classes.length > 0 ? { class: classes.join(' ') } : {}),
      0,
    ]
  },
})
