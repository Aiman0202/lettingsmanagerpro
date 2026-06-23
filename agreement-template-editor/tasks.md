# Implementation Plan: Agreement Template Editor

## Overview

Implement a WYSIWYG TipTap 3.x-based editor for the default AST agreement template, surfaced as a full-screen dialog on the Agreements page. The implementation introduces a custom `MergeFieldNode` TipTap extension to render `{{field_name}}` tokens as styled chips, a searchable merge field insertion panel, validation logic with two-strike tenant_name confirmation, Supabase fetch/upsert wiring, and RBAC gating. All components follow existing project conventions (TanStack Query, `useAuth`, `useToast`, the custom `Dialog` component).

---

## Tasks

- [ ] 1. Install dependencies and define data types
  - [ ] 1.1 Install TipTap table packages and fast-check
    - Run `npm install @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header`
    - Run `npm install --save-dev fast-check`
    - Verify both appear in `package.json` under the correct dependency sections
    - _Requirements: 2.2_

  - [ ] 1.2 Create `mergeFields.ts` with the full merge field registry
    - Define `MergeField` interface (`key`, `label`, `category`)
    - Define `MergeFieldCategory` union type covering all 8 categories
    - Export `MERGE_FIELDS` array (40+ entries derived from the table in the design document)
    - Export `MERGE_FIELDS_BY_CATEGORY` record grouped by category
    - Export `MERGE_FIELD_KEYS` Set for O(1) lookup
    - Labels must have underscores replaced by spaces and be title-cased
    - _Requirements: 4.1, 4.2, 3.2_

- [ ] 2. Build the `MergeFieldNode` TipTap extension and HTML pre-processor
  - [ ] 2.1 Implement `preprocessTemplateHTML()` utility
    - Create `src/features/agreements/editor/utils/preprocessTemplateHTML.ts`
    - Use regex `/\{\{([a-z0-9_]+)\}\}/g` to wrap every matched token with `<span data-merge-field="fieldKey">{{fieldKey}}</span>`
    - Leave unmatched or malformed brace patterns as raw text
    - Export the function
    - _Requirements: 3.1_

  - [ ]* 2.2 Write unit tests for `preprocessTemplateHTML()`
    - Test: empty string → empty string
    - Test: string with no tokens → unchanged
    - Test: string with one token → wrapped correctly
    - Test: string with multiple tokens → all wrapped, order preserved
    - Test: string with adjacent tokens → both wrapped independently
    - Test: malformed braces (e.g. `{tenant_name}`, `{{}}`) → left as raw text
    - _Requirements: 3.1_

  - [ ] 2.3 Implement `MergeFieldNode` TipTap custom Node extension
    - Create `src/features/agreements/editor/extensions/MergeFieldNode.ts`
    - Configure: `group: 'inline'`, `inline: true`, `atom: true`
    - `addAttributes()`: `fieldKey` (default null), `isUnknown` (default false)
    - `parseHTML()`: match `span[data-merge-field]`; set `fieldKey` from the attribute, derive `isUnknown` by checking against `MERGE_FIELD_KEYS`
    - `renderHTML()`: emit `<span data-merge-field="fieldKey" class="merge-field-chip [merge-field-chip--unknown]">{{fieldKey}}</span>`
    - `addCommands()`: expose `insertMergeField(fieldKey: string)` command
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7_

  - [ ]* 2.4 Write property test PT-1 for merge field round-trip fidelity
    - **Property 1: Merge field round-trip fidelity**
    - **Validates: Requirements 3.5, 3.6**
    - Use `fc.array(fc.constantFrom(...MERGE_FIELD_KEYS), {minLength: 0, maxLength: 20})` to build template HTML with random tokens and surrounding text
    - `preprocessTemplateHTML()` + `generateHTML()` round-trip must produce the same ordered set of `{{field_name}}` tokens
    - `numRuns: 100`
    - _Requirements: 3.5, 3.6_

  - [ ]* 2.5 Write property test PT-2 for chip label transformation
    - **Property 2: Merge field chip label transformation**
    - **Validates: Requirements 3.2**
    - For any snake_case field key, the derived label must equal the key with underscores replaced by spaces, containing no `{{` or `}}`
    - `numRuns: 100`
    - _Requirements: 3.2_

  - [ ]* 2.6 Write property test PT-3 for unknown token preservation
    - **Property 3: Unknown token preservation**
    - **Validates: Requirements 3.7**
    - For any key not in `MERGE_FIELD_KEYS`, loading into the editor and serialising must recover the exact original `{{unknown_field}}` string, and `isUnknown` must be `true`
    - `numRuns: 100`
    - _Requirements: 3.7_

- [ ] 3. Implement `useTemplateEditor` custom hook
  - [ ] 3.1 Create `useTemplateEditor.ts` with fetch, save, dirty tracking, and validation state
    - Create `src/features/agreements/editor/hooks/useTemplateEditor.ts`
    - `useQuery('template-default-ast')`: fetch `id, body_html` from `agreement_defaults` where `key = 'default_ast'`
    - `useMutation`: upsert `{ key: 'default_ast', name: 'Default AST', body_html }` to `agreement_defaults`
    - Track `isDirty`, `saveAttempts`, `validationError` in local state
    - `save(html)` implements the three-step validation logic from the design document:
      1. Strip HTML tags and trim; if empty → set `validationError`, return
      2. If no `{{tenant_name}}` and `saveAttempts === 0` → `toast.warning(...)`, increment `saveAttempts`, return
      3. Call upsert; on success → `toast.success(...)`, reset `isDirty` + `saveAttempts`; on error → `toast.error(...)`
    - Expose `refetch`, `isLoading`, `fetchError`, `isSaving`, `setDirty`, `clearValidationError`
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 3.2 Write property test PT-4 for validation ordering (empty always fails first)
    - **Property 4: Validation ordering — empty always fails first**
    - **Validates: Requirements 6.1, 6.2**
    - For any empty or whitespace-only string, `save()` must set `validationError` and leave `saveAttempts === 0` with no `toast.warning` fired
    - `numRuns: 100`
    - _Requirements: 6.1, 6.2_

  - [ ]* 3.3 Write property test PT-5 for whitespace content rejection
    - **Property 5: Whitespace content is always invalid**
    - **Validates: Requirements 6.2**
    - Use `fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'))` including the empty string
    - All such inputs must block save with `validationError` set and no Supabase upsert called
    - `numRuns: 100`
    - _Requirements: 6.2_

  - [ ]* 3.4 Write property test PT-6 for tenant_name two-strike behaviour
    - **Property 6: Non-empty content missing tenant_name triggers warning**
    - **Validates: Requirements 6.3, 6.4**
    - Use `fc.string().filter(s => s.trim() !== '' && !s.includes('{{tenant_name}}'))`
    - First call must invoke `toast.warning` and not call upsert; second consecutive call with same content must call upsert
    - `numRuns: 100`
    - _Requirements: 6.3, 6.4_

  - [ ]* 3.5 Write unit tests for `useTemplateEditor` validation
    - Test: empty content → validationError set, upsert not called
    - Test: whitespace-only content → validationError set, upsert not called
    - Test: missing tenant_name first attempt → toast.warning, saveAttempts becomes 1, upsert not called
    - Test: missing tenant_name second attempt → upsert called, saveAttempts reset
    - Test: valid content with tenant_name → upsert called immediately
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 4. Build `EditorToolbar` component
  - [ ] 4.1 Implement `EditorToolbar.tsx`
    - Create `src/features/agreements/editor/components/EditorToolbar.tsx`
    - Render buttons: Bold, Italic, H1, H2, H3, Bullet List, Ordered List, Insert Table, Undo, Redo, Merge Fields toggle
    - Use `editor.isActive(...)` to apply active styling (distinct background/border) per button
    - Use `editor.can()...run()` to derive disabled state; render disabled buttons at reduced opacity, non-interactive
    - Undo disabled when `!editor.can().undo()`; Redo disabled when `!editor.can().redo()`
    - "Merge Fields" button toggles `isPanelOpen`; uses `aria-pressed` to reflect open state
    - Insert Table command: `editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()`
    - All buttons must have `aria-label` attributes
    - Apply `position: sticky; top: 0` (or Tailwind `sticky top-0 z-10 bg-white`) so toolbar stays visible on scroll
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 2.1, 2.3, 2.5_

  - [ ]* 4.2 Write property test PT-8 for toolbar active state reflecting editor state
    - **Property 8: Toolbar active state reflects editor state**
    - **Validates: Requirements 7.2, 7.3**
    - For each format type (`bold`, `italic`, `h1`, `h2`, `h3`, `bulletList`, `orderedList`), programmatically apply the format and assert that the corresponding button reports `isActive = true`; remove it and assert `isActive = false`
    - `numRuns: 100`
    - _Requirements: 7.2, 7.3_

  - [ ]* 4.3 Write property test PT-9 for toolbar accessibility (aria-label)
    - **Property 9: Toolbar accessibility — all buttons have aria-label**
    - **Validates: Requirements 7.6**
    - Render the Toolbar in all meaningful states (saving, not saving, panel open, panel closed, dirty, not dirty)
    - For every rendered `<button>` element, assert a non-empty `aria-label` attribute is present
    - _Requirements: 7.6_

  - [ ]* 4.4 Write unit tests for toolbar button states
    - Test: undo button disabled when editor history is empty
    - Test: redo button disabled when no operations have been undone
    - Test: bold button active when cursor is within bold text
    - Test: H2 button active when cursor is within an h2 node
    - _Requirements: 2.5, 7.2, 7.3_

- [ ] 5. Checkpoint — Core extension and toolbar complete
  - Ensure all tests pass. Ask the user if questions arise before continuing.

- [ ] 6. Build `MergeFieldPanel` component
  - [ ] 6.1 Implement `MergeFieldPanel.tsx`
    - Create `src/features/agreements/editor/components/MergeFieldPanel.tsx`
    - Right sidebar: `w-72 shrink-0 border-l border-gray-200 bg-white overflow-y-auto`
    - Controlled search input; filter `MERGE_FIELDS` by `label` or `category` containing search text (case-insensitive)
    - When search is cleared, show all categories expanded
    - Group fields under their category headings; each category expanded by default
    - Each field renders as a button calling `editor.commands.insertMergeField(fieldKey)` on click
    - Panel stays open after insertion (no auto-close)
    - Display "No results found for '…'" when filtered list is empty
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 6.2 Write property test PT-10 for merge field search filter correctness
    - **Property 10: Merge field search filter correctness**
    - **Validates: Requirements 4.3**
    - Use `fc.string()` for search query and `fc.array` of `MergeField` objects
    - Assert: every field in the filtered result contains the search string (case-insensitive) in label or category
    - Assert: no field matching the search string is absent from the result
    - `numRuns: 100`
    - _Requirements: 4.3_

  - [ ]* 6.3 Write unit tests for `MergeFieldPanel` search filtering
    - Test: exact label match
    - Test: partial label match
    - Test: case-insensitive match (uppercase search against lowercase label)
    - Test: category name match (searching "Agency" shows all Agency fields)
    - Test: no match → "no results" message shown
    - Test: clearing search → full list with all categories shown
    - _Requirements: 4.3, 4.6, 4.7_

- [ ] 7. Build `TemplateEditor` layout component
  - [ ] 7.1 Implement `TemplateEditor.tsx` with TipTap editor instance
    - Create `src/features/agreements/editor/components/TemplateEditor.tsx`
    - Initialise TipTap `useEditor()` with: `StarterKit` (heading levels 1–3, history depth 50), `Placeholder`, `Table` (resizable: false), `TableRow`, `TableHeader`, `TableCell`, `MergeFieldNode`
    - Set `content: preprocessTemplateHTML(initialHTML)` on init
    - Wire `onUpdate` to call `onDirtyChange(true)` on first edit
    - Expose `serialise()`: call `generateHTML(editor.schema, editor.state.doc)` — the output HTML from `MergeFieldNode.renderHTML` will already contain `{{fieldKey}}` strings
    - Layout: flex column with `EditorToolbar` (sticky top), then a flex row containing `EditorContent` (scrollable, `flex-1`) and conditionally `MergeFieldPanel` (`w-72`) when `isPanelOpen`
    - Editor content area: white background, `p-10` (40px padding), minimum height 600px, vertical scroll
    - Apply typographic hierarchy via CSS/Tailwind: H1 ≥ 1.5× base, H2 ≥ 1.25× base, H3 ≥ 1.1× base
    - Style `.merge-field-chip` and `.merge-field-chip--unknown` in the global/scoped stylesheet
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 7.2 Write unit tests for `TemplateEditor` serialisation
    - Test: `serialise()` converts chip nodes back to `{{field_name}}` tokens
    - Test: unknown chip serialises back to its original `{{unknown_key}}` string
    - Test: round-trip (load then serialise with no edits) produces identical token set
    - _Requirements: 3.5, 3.6, 3.7_

- [ ] 8. Build `TemplateEditorDialog` wrapper and wire everything together
  - [ ] 8.1 Implement `TemplateEditorDialog.tsx`
    - Create `src/features/agreements/editor/components/TemplateEditorDialog.tsx`
    - Props: `open: boolean`, `onClose: () => void`
    - Use `useTemplateEditor()` to obtain `templateHTML`, `isLoading`, `fetchError`, `refetch`, `save`, `isSaving`, `isDirty`, `setDirty`, `validationError`, `clearValidationError`
    - Render the existing `Dialog` + `DialogContent` at `max-w-[95vw] w-full max-h-[92vh] overflow-hidden p-0 flex flex-col`
    - Loading state: show a loading spinner centred in the dialog body
    - Error state: show error message and a "Retry" button that calls `refetch()`; do not mount `TemplateEditor` during error state
    - Loaded state: render `TemplateEditor` with `initialHTML={templateHTML}`, wired `onSave`, `isSaving`, `isDirty`, `onDirtyChange`
    - Dialog header: title "Edit Agreement Template", Save button (calls `serialise()` then `save(html)`, disabled when `isSaving`), saving indicator when `isSaving`, Close button
    - Unsaved-changes guard on `onOpenChange`: if `isDirty`, show `window.confirm("You have unsaved changes. Close without saving?")` before calling `onClose`
    - Display `validationError` as an inline error below the toolbar when set; clear on next edit
    - _Requirements: 1.2, 1.3, 1.4, 1.6, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 8.2 Write integration tests for `TemplateEditorDialog`
    - Test: mock successful fetch → editor mounts with template content
    - Test: mock fetch error → error message and Retry button rendered, editor not mounted
    - Test: Retry button calls `refetch()`
    - Test: mock successful upsert → `toast.success` called, `isDirty` reset
    - Test: mock upsert error → `toast.error` called, editor content unchanged
    - Test: closing dialog with `isDirty = true` → confirm prompt shown; if cancelled, dialog stays open
    - _Requirements: 1.3, 1.4, 1.6, 5.4, 5.5, 5.6_

- [ ] 9. Integrate the editor into `AgreementsPage` with RBAC gating
  - [ ] 9.1 Add "Edit Template" button and RBAC gate to `AgreementsPage.tsx`
    - Import `TemplateEditorDialog`
    - Add `editorOpen` state (`useState(false)`)
    - Use `const { can } = useAuth()` to check `can('agreements', 'write')`
    - Render `<Button onClick={() => setEditorOpen(true)}>Edit Template</Button>` only when `can('agreements', 'write')` is true
    - Render `<TemplateEditorDialog open={editorOpen} onClose={() => setEditorOpen(false)} />` unconditionally (dialog manages its own open state internally)
    - Ensure the agreements list pagination, filters, and sort order are not reset when the dialog opens or closes (no state changes to list state on dialog toggle)
    - _Requirements: 1.1, 1.5, 1.6, 9.1, 9.2_

  - [ ]* 9.2 Write property test PT-7 for RBAC visibility invariant
    - **Property 7: RBAC visibility invariant**
    - **Validates: Requirements 9.1, 9.2**
    - Use `fc.boolean()` for `can_write` value
    - Mock `useAuth` to return `can('agreements', 'write') = canWrite`
    - When `canWrite = false`: assert "Edit Template" button is NOT in the rendered output
    - When `canWrite = true`: assert "Edit Template" button IS in the rendered output
    - `numRuns: 100`
    - _Requirements: 9.1, 9.2_

  - [ ]* 9.3 Write integration tests for RBAC and agreements list state preservation
    - Test: user with `can_write = false` → "Edit Template" button not rendered
    - Test: user with `can_write = true` → "Edit Template" button rendered
    - Test: opening then closing editor dialog does not reset agreements list pagination/filters
    - _Requirements: 1.1, 1.5, 9.1, 9.2_

- [ ] 10. Checkpoint — Full feature wired and integrated
  - Ensure all tests pass. Ask the user if questions arise before continuing.

- [ ] 11. Add Supabase RLS policy for `agreement_defaults`
  - [ ] 11.1 Write and apply RLS migration for `agreement_defaults`
    - Create a new Supabase migration file under `supabase/migrations/`
    - Add an `UPDATE` policy on `agreement_defaults` that permits only JWT tokens whose role resolves `can_write = true` for the `agreements` resource
    - Add a corresponding `SELECT` policy allowing authenticated reads (staff need to fetch the template)
    - Verify that an upsert attempt with an insufficient-permission token is rejected by the policy
    - _Requirements: 9.3_

- [ ] 12. Final checkpoint — All tests pass, RLS verified
  - Ensure all unit, property-based, and integration tests pass. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements from `requirements.md` for full traceability
- Property tests use **fast-check** with `numRuns: 100`; they must be installed in task 1.1 before running
- Checkpoints at tasks 5 and 10 provide natural integration milestones
- The `MergeFieldNode` uses `atom: true` to guarantee single-keypress cursor movement past chips (Requirement 3.3)
- HTML pre-processing via `preprocessTemplateHTML()` is the bridge between raw stored HTML and TipTap DOM parsing
- The two-strike validation for `{{tenant_name}}` is implemented entirely in `useTemplateEditor.ts` (Requirement 6.3, 6.4)
- Table support requires the four first-party TipTap table packages installed in task 1.1

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.3"] },
    { "id": 2, "tasks": ["2.2", "2.4", "2.5", "2.6", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4", "3.5", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "6.1", "7.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "7.2"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["8.2", "9.1"] },
    { "id": 8, "tasks": ["9.2", "9.3"] },
    { "id": 9, "tasks": ["11.1"] }
  ]
}
```
