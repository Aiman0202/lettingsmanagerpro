# Design Document: Agreement Template Editor

## Overview

The Agreement Template Editor adds a WYSIWYG rich-text editing experience to the Agreements page, allowing staff with write permissions to edit the default AST (Assured Shorthold Tenancy) template stored in `agreement_defaults.body_html` (key: `'default_ast'`). The editor is built on the already-installed TipTap 3.x library and opens as a full-screen dialog. It renders `{{merge_field}}` tokens as styled chip nodes, provides a searchable merge field insertion panel, and saves the updated HTML back to Supabase via an upsert.

The design avoids introducing new dependencies beyond TipTap's table extension packages. It reuses the established patterns in the codebase: the custom `Dialog` component, `useQuery`/`useMutation` from TanStack React Query, `useAuth` for RBAC, and `useToast` for notifications.

---

## Architecture

### High-Level Component Tree

```
AgreementsPage
└── TemplateEditorDialog          (dialog wrapper, data-fetch + save mutation)
    └── DialogContent             (full-screen, max-w-[95vw] max-h-[92vh])
        ├── DialogHeader          (title, Save button, Close button)
        └── TemplateEditor        (editor + panel layout)
            ├── EditorToolbar     (fixed formatting controls)
            ├── EditorContent     (TipTap ProseMirror area, scrollable)
            └── MergeFieldPanel   (collapsible right sidebar, w-72)
```

### Data Flow

```
Supabase (agreement_defaults)
    │  useQuery('template-default-ast')
    ▼
TemplateEditorDialog
    │  body_html string
    │  parseHTMLtoTipTap()        ← MergeFieldNode.parseHTML converts {{...}} to Node
    ▼
TipTap Editor State
    │  user edits
    ▼
EditorToolbar ─── formatting commands
MergeFieldPanel ─ insertMergeField(fieldKey) → insertContent(MergeFieldNode)
    │
    │  onSave: generateHTML() + MergeFieldNode.renderHTML → {{...}} back in output
    ▼
useMutation (supabase upsert)
    │  success/error → useToast
    ▼
Supabase (agreement_defaults.body_html updated)
```

### State Management

All editor state lives in `useTemplateEditor.ts` (a custom hook). The hook owns:
- `isDirty` — tracks whether the editor content differs from the loaded snapshot
- `saveAttempts` — integer for the two-strike tenant_name validation
- `validationError` — inline error string for empty-check failure
- `isPanelOpen` — controls MergeFieldPanel visibility

The TipTap editor instance is created inside `TemplateEditor.tsx` with `useEditor()` and passed down as a prop or via context.

---

## Components and Interfaces

### `TemplateEditorDialog.tsx`

Top-level wrapper. Manages the dialog open state and wires up data fetching/saving.

```typescript
interface TemplateEditorDialogProps {
  open: boolean
  onClose: () => void
}
```

Responsibilities:
- Runs `useQuery` to fetch the template on open
- Provides save handler to `TemplateEditor` via `useTemplateEditor`
- Renders the custom `Dialog` + `DialogContent` with `max-w-[95vw] w-full max-h-[92vh] overflow-hidden p-0 flex flex-col` (matching `AgreementPreviewDialog` layout)
- Intercepts the `onOpenChange` event: if `isDirty`, shows an unsaved-changes confirm dialog before calling `onClose`

### `TemplateEditor.tsx`

Editor layout component. Owns the TipTap `useEditor()` instance.

```typescript
interface TemplateEditorProps {
  initialHTML: string
  onSave: (html: string) => Promise<void>
  isSaving: boolean
  isDirty: boolean
  onDirtyChange: (dirty: boolean) => void
}
```

Responsibilities:
- Initialises TipTap with the extension set (see Extensions section)
- Exposes a `serialise()` function that calls `generateHTML()` and post-processes the output so `MergeFieldNode.renderHTML` emits `{{field_name}}`
- Renders a fixed toolbar at top and a scrollable editor content area below
- Conditionally renders `MergeFieldPanel` on the right when open

### `EditorToolbar.tsx`

```typescript
interface EditorToolbarProps {
  editor: Editor
  isPanelOpen: boolean
  onTogglePanel: () => void
  onSave: () => void
  isSaving: boolean
  isDirty: boolean
}
```

Renders buttons for: Bold, Italic, H1, H2, H3, Bullet List, Ordered List, Insert Table, Undo, Redo, and a "Merge Fields" toggle. Uses `editor.isActive(...)` and `editor.can()...run()` to derive active/disabled states per button.

### `MergeFieldPanel.tsx`

```typescript
interface MergeFieldPanelProps {
  editor: Editor
  onClose: () => void
}
```

Renders a right sidebar (`w-72 shrink-0 border-l border-gray-200 bg-white`). Contains:
- A search input (controlled)
- A categorised list of merge fields filtered by search
- Each field renders as a button that calls `editor.commands.insertMergeField(fieldKey)` on click
- A "no results" message when the filtered list is empty

### `MergeFieldNode.ts`

A TipTap custom Node extension. Key configuration:

```typescript
// Atom inline node — cursor cannot enter it
group: 'inline'
inline: true
atom: true  // single keypress moves cursor past the whole node

// Attributes
addAttributes() {
  return {
    fieldKey: { default: null },   // raw key e.g. "tenant_name"
    isUnknown: { default: false }, // true if not in MERGE_FIELDS registry
  }
}

// Parse {{field_name}} tokens from input HTML
parseHTML() {
  return [
    { tag: 'span[data-merge-field]' },  // for round-tripped editor HTML
    // Custom parser rule to scan text nodes for {{...}} patterns is applied
    // at the document level via a custom HTML pre-processor before loading
  ]
}

// Serialise chip back to {{field_name}} for saving
renderHTML({ node }) {
  return ['span', {
    'data-merge-field': node.attrs.fieldKey,
    class: node.attrs.isUnknown
      ? 'merge-field-chip merge-field-chip--unknown'
      : 'merge-field-chip',
  }, `{{${node.attrs.fieldKey}}}`]
}
```

> **HTML pre-processing note**: TipTap's `parseHTML` rules match DOM elements, not raw text patterns. To handle `{{...}}` tokens in the input HTML, the template HTML is pre-processed by `preprocessTemplateHTML()` before being passed to `editor.commands.setContent()`. This function uses a regex to replace all `{{field_name}}` occurrences with `<span data-merge-field="field_name">{{field_name}}</span>`, which the `parseHTML` rule then matches.

### `mergeFields.ts`

Exports:

```typescript
export interface MergeField {
  key: string       // e.g. "tenant_name"
  label: string     // e.g. "Tenant Name" (underscores → spaces, title-cased)
  category: MergeFieldCategory
}

export type MergeFieldCategory =
  | 'Tenancy' | 'Property' | 'Landlord' | 'Tenant'
  | 'Agency' | 'Financial' | 'Inventory' | 'HMO'

export const MERGE_FIELDS: MergeField[] = [ /* ... 40+ entries ... */ ]

export const MERGE_FIELDS_BY_CATEGORY: Record<MergeFieldCategory, MergeField[]>

// Fast lookup set for isUnknown check
export const MERGE_FIELD_KEYS = new Set<string>(MERGE_FIELDS.map(f => f.key))
```

### `useTemplateEditor.ts`

Custom hook that abstracts data fetching, saving, dirty tracking, and validation state.

```typescript
interface UseTemplateEditorReturn {
  templateHTML: string | undefined
  isLoading: boolean
  fetchError: Error | null
  refetch: () => void
  save: (html: string) => Promise<void>
  isSaving: boolean
  isDirty: boolean
  setDirty: (dirty: boolean) => void
  validationError: string | null
  clearValidationError: () => void
}
```

The `save` function implements the two-strike validation logic:
1. If `html` is empty or whitespace-only → set `validationError`, return early
2. If no `{{tenant_name}}` present and `saveAttempts === 0` → show `toast.warning(...)`, increment `saveAttempts`, return
3. Otherwise → call the mutation, reset `saveAttempts`

---

## Data Models

### `agreement_defaults` Row (from `database.ts`)

```typescript
{
  id: string
  key: string         // always 'default_ast' for this feature
  name: string        // 'Default AST'
  body_html: string   // the template HTML with {{...}} tokens
  created_at: string
  updated_at: string
}
```

### Supabase Query (fetch)

```typescript
const { data } = await supabase
  .from('agreement_defaults')
  .select('id, body_html')
  .eq('key', 'default_ast')
  .single()
```

### Supabase Mutation (save)

```typescript
await supabase
  .from('agreement_defaults')
  .upsert({ key: 'default_ast', name: 'Default AST', body_html: serialisedHTML })
  .eq('key', 'default_ast')
```

### MergeFieldNode ProseMirror Schema

```
Node {
  type: 'mergeField'
  attrs: {
    fieldKey: string   // raw snake_case key without braces
    isUnknown: boolean
  }
  inline: true
  atom: true
}
```

### Internal State Shape (inside `useTemplateEditor`)

```typescript
{
  saveAttempts: number   // 0 = fresh, 1 = tenant_name warned once
  isDirty: boolean
  validationError: string | null
}
```

---

## TipTap Extensions Configuration

The editor is initialised with:

```typescript
useEditor({
  extensions: [
    StarterKit.configure({
      // StarterKit includes: Bold, Italic, Heading, BulletList, OrderedList,
      // ListItem, Paragraph, HardBreak, History (undo/redo), etc.
      heading: { levels: [1, 2, 3] },
      history: { depth: 50 },     // requirement 2.5: at least 50 ops
    }),
    Placeholder.configure({
      placeholder: 'Start editing the agreement template…',
    }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    MergeFieldNode,   // custom extension (see above)
  ],
  content: preprocessTemplateHTML(initialHTML),
  onUpdate: ({ editor }) => {
    onDirtyChange(true)
  },
})
```

**Table packages**: `@tiptap/extension-table`, `@tiptap/extension-table-row`, `@tiptap/extension-table-cell`, `@tiptap/extension-table-header` must be added to `package.json`. These are first-party TipTap packages consistent with the existing TipTap 3.x installation.

---

## Merge Field Panel — Category and Field Listing

The `MERGE_FIELDS` constant is derived from the keys in `agreements.ts` `mergeContext`:

| Category  | Fields (keys)                                                                                                     |
|-----------|-------------------------------------------------------------------------------------------------------------------|
| Tenancy   | tenancy_reference, start_date, end_date, rent_amount, deposit_amount, deposit_scheme, rent_frequency, rent_day, rent_due_day, today_date |
| Property  | property_address, property_postcode, property_type                                                                |
| Landlord  | landlord_name, landlord_address, landlord_email, landlord_phone, bank_name, bank_sort_code, bank_account_number, payment_reference |
| Tenant    | tenant_name, tenant_dob, tenant_phone, tenant_email, tenant_id_number, lead_tenant_name                           |
| Agency    | agency_name, agency_address, agency_phone, agency_email, agency_reg_number, agent_name, agency_emergency_phone, agency_website, principal_contact |
| Financial | rent_amount, deposit_amount, deposit_scheme, bank_name, bank_sort_code, bank_account_number                       |
| Inventory | inventory_living_room, inventory_kitchen, inventory_electrical_items, inventory_bedroom_1, inventory_bedroom_2, inventory_bedroom_3 |
| HMO       | hmo_status, hmo_licence_status, hmo_licence_details, hmo_max_individuals, hmo_max_families                        |

Search filtering applies case-insensitively to both the field `label` (human-readable) and `category` name.

---

## Unsaved Changes Guard

`isDirty` is set to `true` on the first TipTap `onUpdate` event after loading, and reset to `false` after a successful save. When the user clicks the dialog close button or the backdrop:

1. If `isDirty === false` → close immediately
2. If `isDirty === true` → show a native `window.confirm()` (or a small inline confirm modal) asking "You have unsaved changes. Close without saving?" — close only if confirmed

---

## Validation Logic (Detailed)

```
onSaveAttempt(html):
  1. trimmed = html.trim() with HTML tags stripped to get text content
     IF text content is empty:
       → set validationError = "Template content cannot be empty"
       → return (do NOT proceed)

  2. IF html does not contain "{{tenant_name}}":
       IF saveAttempts === 0:
         → toast.warning("Missing tenant name field",
             "The template does not include {{tenant_name}}. Save again to confirm.")
         → saveAttempts = 1
         → return
       ELSE:
         → saveAttempts = 0 (reset for next save cycle)
         → proceed to step 3

  3. Call supabase upsert mutation
     ON success → toast.success("Template saved"), isDirty = false
     ON error   → toast.error("Failed to save template", error.message)
```

The empty check (step 1) always runs first, satisfying Requirement 6.1.

---

## Access Control

The "Edit Template" button in `AgreementsPage` is conditionally rendered:

```tsx
const { can } = useAuth()
// ...
{can('agreements', 'write') && (
  <Button onClick={() => setEditorOpen(true)}>
    Edit Template
  </Button>
)}
```

Supabase RLS on `agreement_defaults` should have a policy rejecting `UPDATE` for users whose JWT does not correspond to a role with `can_write = true` on the `agreements` resource. This provides a defence-in-depth layer independent of the UI gate.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Merge field round-trip fidelity

*For any* template HTML string containing N `{{field_name}}` tokens (in any positions, with any surrounding content), loading it into the editor and immediately serialising with no edits SHALL produce output HTML that contains the same N `{{field_name}}` token strings in the same order, with no tokens added, removed, or mutated.

**Validates: Requirements 3.5, 3.6**

---

### Property 2: Merge field chip label transformation

*For any* field key string of the form `some_snake_case_key`, the Merge_Field_Chip rendered for that key SHALL display a label equal to the key with all underscores replaced by spaces (e.g., `tenant_name` → `"tenant name"`), with no `{{` or `}}` characters present in the label.

**Validates: Requirements 3.2**

---

### Property 3: Unknown token preservation

*For any* `{{unknown_field}}` token whose key is not present in the `MERGE_FIELD_KEYS` registry, loading it into the editor SHALL render an error chip, and serialising the document SHALL recover the exact original `{{unknown_field}}` string unchanged.

**Validates: Requirements 3.7**

---

### Property 4: Validation ordering — empty always fails first

*For any* template content string (whether empty, whitespace-only, or non-empty but missing `{{tenant_name}}`), invoking the save handler SHALL check emptiness before evaluating the `{{tenant_name}}` presence. Specifically: if the content is empty or whitespace-only, the save SHALL be blocked with an inline error and the `{{tenant_name}}` check SHALL NOT fire (saveAttempts SHALL remain 0 and no tenant_name warning toast SHALL be shown).

**Validates: Requirements 6.1, 6.2**

---

### Property 5: Whitespace content is always invalid

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines, or an empty string), submitting it as template content SHALL prevent the save operation and produce an inline validation error, leaving the Supabase `body_html` record unchanged.

**Validates: Requirements 6.2**

---

### Property 6: Non-empty content missing tenant_name triggers warning

*For any* non-empty template content string that does not contain a `{{tenant_name}}` merge field chip, the first save attempt SHALL produce a `toast.warning` notification and SHALL NOT call the Supabase upsert. A second consecutive save attempt with the same content SHALL proceed to call the upsert.

**Validates: Requirements 6.3, 6.4**

---

### Property 7: RBAC visibility invariant

*For any* user whose role resolves `can('agreements', 'write') = false`, the "Edit Template" button SHALL NOT be present in the rendered Agreements page. *For any* user whose role resolves `can('agreements', 'write') = true`, the "Edit Template" button SHALL be present. The button's presence is a pure deterministic function of the RBAC result and SHALL hold for all possible role configurations.

**Validates: Requirements 9.1, 9.2**

---

### Property 8: Toolbar active state reflects editor state

*For any* editor state where a formatting mark or node type (bold, italic, H1, H2, H3, bullet list, ordered list) is active at the current cursor position, the corresponding Toolbar button SHALL report an active state (`isActive = true`). Conversely, when a format is not active at the cursor, the button SHALL not report an active state.

**Validates: Requirements 7.2, 7.3**

---

### Property 9: Toolbar accessibility — all buttons have aria-label

*For any* rendered state of the Toolbar component, every interactive button element SHALL have a non-empty `aria-label` attribute that describes its action.

**Validates: Requirements 7.6**

---

### Property 10: Merge field search filter correctness

*For any* non-empty search string S and any backing field list, the MergeFieldPanel SHALL display only fields whose `label` or `category` contains S as a case-insensitive substring. No field that does not match S SHALL appear in the filtered results, and no field that does match S SHALL be absent from the results.

**Validates: Requirements 4.3**

---

## Error Handling

### Fetch Errors

If the `useQuery` fetch for the template fails:
- The `TemplateEditorDialog` renders an error state within the dialog body with the message and a "Retry" button that calls `refetch()`
- The editor is not mounted during the error state

### Save Errors

If the `useMutation` upsert call throws or returns a Supabase error:
- `toast.error("Failed to save template", error.message)` is called
- The editor content is left unchanged
- `isDirty` remains `true`
- The save button is re-enabled

### Content Parsing Edge Cases

If `preprocessTemplateHTML` encounters a malformed `{{...}}` pattern (e.g., unmatched braces):
- The regex only matches well-formed `{{[a-z0-9_]+}}` tokens, so malformed patterns are left as raw text in the editor
- They serialise back as raw text, not as chips — this is acceptable and preserves the original content

### TipTap Hydration

If the editor receives an empty string as `initialHTML`:
- TipTap initialises with an empty document
- The user sees the placeholder text "Start editing the agreement template…"
- The save button is enabled but the empty-check validation will catch any save attempt

---

## Testing Strategy

### Property-Based Testing Library

**Vitest** (already present in the project's dev tooling) with **fast-check** as the property-based testing library. `fast-check` is the standard PBT library for TypeScript/JavaScript projects and integrates cleanly with Vitest.

Install command: `npm install --save-dev fast-check`

Each property test is configured for a minimum of **100 iterations** (`numRuns: 100` in fast-check).

### Property Tests

Each property maps directly to a Correctness Property in this document:

| Test | Property | fast-check Arbitraries |
|------|----------|------------------------|
| PT-1 | Property 1 (round-trip fidelity) | `fc.array(fc.constantFrom(...MERGE_FIELD_KEYS), {minLength: 0, maxLength: 20})` combined with random surrounding HTML text to build a template HTML, then load+serialise |
| PT-2 | Property 2 (chip label transform) | `fc.string()` for snake_case field keys, verify label |
| PT-3 | Property 3 (unknown token preservation) | `fc.string({ minLength: 1 })` filtered to exclude known keys |
| PT-4 | Property 4 (validation ordering) | `fc.oneof(fc.constant(''), fc.string().filter(s => s.trim() === ''), fc.string().filter(s => !s.includes('{{tenant_name}}')))` |
| PT-5 | Property 5 (whitespace rejection) | `fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'))` |
| PT-6 | Property 6 (tenant_name two-strike) | `fc.string().filter(s => s.trim() !== '' && !s.includes('{{tenant_name}}'))` |
| PT-7 | Property 7 (RBAC visibility) | `fc.boolean()` for `can_write` value, verify button presence |
| PT-8 | Property 8 (toolbar active state) | `fc.constantFrom('bold','italic','h1','h2','h3','bulletList','orderedList')` with editor state construction |
| PT-9 | Property 9 (aria-label) | Enumerate all rendered Toolbar buttons, assert each has `aria-label` |
| PT-10 | Property 10 (search filter) | `fc.string()` for search query, `fc.array` of MergeField objects for backing data |

Tag format for each test:
```typescript
// Feature: agreement-template-editor, Property 1: Merge field round-trip fidelity
```

### Unit Tests (Example-Based)

Unit tests cover:
- `preprocessTemplateHTML()` — specific examples: empty string, string with no tokens, string with 1 token, string with multiple tokens, string with adjacent tokens
- `MergeFieldNode` label display: `{{tenant_name}}` → "tenant name", `{{hmo_max_individuals}}` → "hmo max individuals"
- `useTemplateEditor` validation: empty content, whitespace-only content, missing tenant_name first-strike, missing tenant_name second-strike, valid content
- `MergeFieldPanel` search filtering: exact match, partial match, case-insensitive match, no match
- `EditorToolbar` button states: disabled undo on empty history, active bold when bold is applied

### Integration Tests

Integration tests use mocked Supabase client:
- Fetch: mock `agreement_defaults` query returning a template → verify editor initialises with content
- Save: mock successful upsert → verify mutation called with correct `key` and `body_html`
- Save failure: mock upsert error → verify toast.error called, content unchanged
- RLS: verify that a Supabase call with an insufficiently-permissioned auth token is rejected (Requirement 9.3 — requires a real Supabase test environment or policy unit test)

### Accessibility Tests

- All Toolbar buttons have `aria-label` (covered by Property 9 / PT-9)
- Merge field chips should have `aria-label` or `title` attributes with their full label
- Dialog should have proper focus trapping (manual test)

### Manual / Visual Tests

- Toolbar remains fixed during scroll (Requirement 7.5)
- Typographic hierarchy H1/H2/H3 matches design (Requirement 8.2)
- Editor and print output share consistent styles (Requirement 8.6)
- Chip contrast against white background (Requirement 8.4)
