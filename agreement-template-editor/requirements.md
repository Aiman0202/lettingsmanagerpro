# Requirements Document

## Introduction

LettingsPro currently stores the default Assured Shorthold Tenancy (AST) agreement template as a raw HTML blob in the `agreement_defaults` table (`key: 'default_ast'`, column: `body_html`). Staff who need to update clause wording, headings, or layout must do so by editing raw HTML directly in the database — an error-prone and inaccessible workflow.

This feature replaces that raw-HTML workflow with a visual WYSIWYG document editor, built on the already-installed TipTap 3.x library, embedded within the Agreements section of the application. The editor must support rich document formatting (headings, paragraphs, bold/italic, tables, lists), render `{{merge_field}}` placeholders as styled chips rather than raw text, allow staff to insert new merge fields from a searchable panel, and save the updated HTML back to `agreement_defaults`. The editor should feel like editing a Word document — not writing code.

---

## Glossary

- **Template_Editor**: The WYSIWYG TipTap-based editor component used to edit the AST template.
- **Agreement_Defaults**: The `agreement_defaults` Supabase table, holding the canonical AST template HTML under `key = 'default_ast'`.
- **Merge_Field**: A placeholder token in the format `{{field_name}}` (e.g. `{{tenant_name}}`, `{{rent_amount}}`) that is substituted with real tenancy data when an agreement is generated.
- **Merge_Field_Chip**: A visually styled, non-editable inline element rendered inside the editor to represent a Merge_Field token, instead of displaying the raw `{{field_name}}` text.
- **Merge_Field_Panel**: A sidebar or popover listing all available Merge_Fields, with search and insert functionality.
- **Template_Body**: The complete HTML string stored in `agreement_defaults.body_html` for `key = 'default_ast'`.
- **Toolbar**: The formatting controls rendered above the Template_Editor (bold, italic, headings, lists, tables, undo/redo, etc.).
- **TipTap**: The open-source headless rich text editor framework (version 3.x) already installed in the project (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`).
- **Agreements_Page**: The `/agreements` route (`AgreementsPage.tsx`) where the Template_Editor will be surfaced.
- **Staff_User**: An authenticated user with write permissions who uses LettingsPro to manage tenancy data.
- **Admin_User**: A Staff_User with the `admin` role, who has full access including system settings.

---

## Requirements

### Requirement 1: Access the Template Editor

**User Story:** As a Staff_User, I want to access the AST template editor from the Agreements page, so that I can edit the default agreement template without leaving the application.

#### Acceptance Criteria

1. WHEN a Staff_User navigates to the Agreements page, THE Agreements_Page SHALL display a control labelled "Edit Template" that opens the Template_Editor.
2. WHEN the Template_Editor is opened, THE Template_Editor SHALL load the current Template_Body from Agreement_Defaults and display it as a rich-text editor supporting bold, italic, headings, lists, tables, and paragraph structure.
3. WHEN the Template_Body is being fetched, THE Template_Editor SHALL display a loading indicator until the content is ready.
4. IF the Template_Body cannot be fetched from Agreement_Defaults, THEN THE Template_Editor SHALL display an error message indicating the content could not be loaded, and SHALL provide a retry control that re-attempts the fetch.
5. WHEN the Template_Editor is open, THE Agreements_Page SHALL continue to display the agreements list, preserving the current page number, applied filters, and sort order without resetting them.
6. WHEN a Staff_User closes or dismisses the Template_Editor without saving, THE Template_Editor SHALL discard all unsaved changes and return the user to the Agreements_Page with the agreements list state preserved.

---

### Requirement 2: Rich Text Editing

**User Story:** As a Staff_User, I want to format the agreement template with headings, paragraphs, bold/italic, lists, and tables, so that the generated agreement looks professionally structured without requiring HTML knowledge.

#### Acceptance Criteria

1. THE Template_Editor SHALL support these formatting operations: heading levels H1–H3, bold, italic, unordered list, ordered list, and paragraph.
2. THE Template_Editor SHALL support inserting and editing tables, with a maximum of 20 columns and 200 rows per table, and SHALL provide controls to add and remove individual rows and columns.
3. THE Template_Editor SHALL provide a Toolbar displaying controls for all supported formatting operations.
4. WHEN a Staff_User applies a formatting operation, THE Template_Editor SHALL reflect the formatting change in the document view within 300 milliseconds.
5. THE Template_Editor SHALL maintain an undo history of at least 50 operations. WHEN a Staff_User activates undo (via Toolbar button or Ctrl+Z / Cmd+Z), THE Template_Editor SHALL revert the most recent change. WHEN a Staff_User activates redo (via Toolbar button or Ctrl+Y / Cmd+Y), THE Template_Editor SHALL reapply the most recently undone change.
6. WHEN the Template_Editor content is serialised for saving, THE Template_Editor SHALL produce well-formed HTML whose element structure accurately reflects the formatting operations applied (e.g. bold text wrapped in `<strong>`, H2 headings in `<h2>`, list items in `<li>` within `<ul>` or `<ol>`).
7. WHEN the undo history is empty, THE Toolbar undo button SHALL be rendered in a disabled state. WHEN no operations have been undone, THE Toolbar redo button SHALL be rendered in a disabled state.

---

### Requirement 3: Merge Field Rendering

**User Story:** As a Staff_User, I want merge field placeholders to appear as readable highlighted chips rather than raw `{{field_name}}` text, so that I can clearly see where dynamic data will be inserted without the template looking like code.

#### Acceptance Criteria

1. WHEN the Template_Editor loads Template_Body content containing `{{field_name}}` tokens, THE Template_Editor SHALL render each token as a Merge_Field_Chip instead of displaying the raw `{{field_name}}` string.
2. THE Merge_Field_Chip SHALL display the field name with underscores replaced by spaces and curly braces removed (e.g. `{{tenant_name}}` renders as "tenant name"), inside an inline element with a visually distinct background colour and border that differs from surrounding body text.
3. WHEN a Staff_User navigates with keyboard arrow keys, THE Template_Editor SHALL treat each Merge_Field_Chip as a single atomic unit, such that one keypress moves the cursor fully before or fully after the chip — never positioning the cursor inside it. The chip's internal text SHALL NOT be editable.
4. WHEN a Staff_User selects and deletes a Merge_Field_Chip, THE Template_Editor SHALL remove the entire chip and its underlying `{{field_name}}` token as a single operation.
5. WHEN the Template_Editor serialises content for saving, THE Template_Editor SHALL convert each Merge_Field_Chip back to its original `{{field_name}}` token format in the output HTML.
6. WHEN the Template_Body is round-tripped through load then serialise with no edits, THE Template_Editor SHALL produce output HTML that contains the identical set of `{{field_name}}` tokens as the original Template_Body, preserving their exact token strings, count, and order.
7. WHEN the Template_Editor loads a `{{field_name}}` token that does not correspond to any known Merge_Field, THE Template_Editor SHALL render it as a visually differentiated error chip (e.g. using a red or warning colour scheme distinct from a valid chip). WHEN the content is serialised, that unrecognised token SHALL be written back as its original `{{field_name}}` string.

---

### Requirement 4: Merge Field Insertion

**User Story:** As a Staff_User, I want to browse all available merge fields and insert them at my cursor position, so that I can build or extend clause text with dynamic placeholders without having to remember or type field names manually.

#### Acceptance Criteria

1. THE Template_Editor SHALL provide a Merge_Field_Panel accessible from the Toolbar that lists all available Merge_Fields.
2. WHEN the Merge_Field_Panel is open, THE Merge_Field_Panel SHALL display Merge_Fields organised into the following categories, each expanded by default: Tenancy, Property, Landlord, Tenant, Agency, Financial, Inventory, HMO.
3. WHEN a Staff_User types in the Merge_Field_Panel search input, THE Merge_Field_Panel SHALL filter the displayed Merge_Fields to those whose name or category contains the search text, case-insensitively.
4. WHEN a Staff_User selects a Merge_Field from the Merge_Field_Panel and the editor has an active cursor position, THE Template_Editor SHALL insert a Merge_Field_Chip for that field at the current cursor position. IF no cursor position is active in the editor, THE Template_Editor SHALL insert the Merge_Field_Chip at the end of the document.
5. WHEN a Merge_Field is inserted via the Merge_Field_Panel, THE Merge_Field_Panel SHALL remain open so the Staff_User can insert additional fields without reopening it.
6. WHEN the Merge_Field_Panel search input is cleared, THE Merge_Field_Panel SHALL display the full categorised list of Merge_Fields with all categories expanded.
7. IF a Staff_User's search query returns no matching Merge_Fields, THE Merge_Field_Panel SHALL display a message indicating no results were found for the entered search term.

---

### Requirement 5: Saving the Template

**User Story:** As a Staff_User, I want to save changes to the agreement template, so that future agreements generated from any tenancy will use the updated template content.

#### Acceptance Criteria

1. THE Template_Editor SHALL provide a clearly labelled "Save Template" control.
2. WHEN a Staff_User activates the save control and validation passes, THE Template_Editor SHALL serialise the current editor content to HTML and write it to `agreement_defaults.body_html` where `key = 'default_ast'` via a Supabase upsert.
3. WHEN the save operation is in progress, THE Template_Editor SHALL disable the save control and display a saving indicator to prevent duplicate submissions.
4. WHEN the save operation completes successfully, THE Template_Editor SHALL display a toast notification confirming the template was saved.
5. IF the save operation fails, THEN THE Template_Editor SHALL display a toast notification describing the failure, and SHALL leave the editor content unchanged.
6. WHEN the Template_Editor has unsaved changes and a Staff_User attempts to navigate away or close the editor, THE Template_Editor SHALL present a confirmation prompt warning that unsaved changes will be lost, and SHALL only discard changes if the Staff_User confirms.

---

### Requirement 6: Template Validation

**User Story:** As a Staff_User, I want the editor to warn me if the template contains obvious structural problems before I save, so that I can avoid generating broken agreements.

#### Acceptance Criteria

1. WHEN a Staff_User activates the save control, THE Template_Editor SHALL validate that the serialised HTML is non-empty before proceeding with the save. The empty check SHALL run before the tenant_name check.
2. IF the serialised HTML is empty or contains only whitespace, THEN THE Template_Editor SHALL prevent the save operation, display an inline validation error message in the editor area, and SHALL NOT proceed to the tenant_name check.
3. WHEN a Staff_User activates the save control and the serialised HTML is non-empty, THE Template_Editor SHALL validate that at least one Merge_Field_Chip for `{{tenant_name}}` is present in the document.
4. IF the `{{tenant_name}}` Merge_Field is absent, THEN THE Template_Editor SHALL display a toast warning notification. The save operation SHALL then require a second activation of the save control to proceed, allowing the Staff_User to confirm they intend to save without the tenant name field.

---

### Requirement 7: Editor Toolbar

**User Story:** As a Staff_User, I want a clear and accessible toolbar above the editor, so that I can apply formatting without needing to know keyboard shortcuts.

#### Acceptance Criteria

1. THE Toolbar SHALL display formatting buttons for: bold, italic, Heading 1, Heading 2, Heading 3, unordered list, ordered list, insert table, undo, and redo.
2. WHEN a formatting option is active at the current cursor position, THE Toolbar SHALL render the corresponding button with a visually distinct background colour or border that differs from the inactive state of that button.
3. WHEN a formatting button is not applicable at the current cursor position (e.g. a heading inside a table cell), THE Toolbar SHALL render that button with reduced opacity and SHALL NOT respond to click or keyboard activation. WHEN the undo history is empty, the undo button SHALL be in this disabled state. WHEN no operations have been undone, the redo button SHALL be in this disabled state.
4. WHEN a Staff_User activates the "Insert Merge Field" Toolbar button, THE Merge_Field_Panel SHALL open. WHEN the Staff_User activates the same button while the Merge_Field_Panel is already open, THE Merge_Field_Panel SHALL close.
5. THE Toolbar SHALL remain fixed at the top of the editor area so that it stays visible when the Staff_User scrolls through document content. Scrolling the editor content SHALL NOT cause the Toolbar to scroll out of view.
6. All Toolbar buttons SHALL have accessible labels (e.g. `aria-label` attributes) so they can be identified by keyboard navigation and screen readers.

---

### Requirement 8: Editor Layout and Presentation

**User Story:** As a Staff_User, I want the editor to look and feel like a proper document editor, so that editing the agreement template feels intuitive and professional rather than like working in a code box.

#### Acceptance Criteria

1. THE Template_Editor SHALL render within a white content area with 40px of padding on all sides to simulate a document page.
2. THE Template_Editor SHALL apply a typographic hierarchy where H1 text is at least 1.5× the base paragraph font size, H2 text is at least 1.25× the base, and H3 text is at least 1.1× the base, so that heading levels are visually distinguishable from each other and from body text.
3. WHEN the Template_Editor content exceeds the visible area, THE Template_Editor SHALL allow vertical scrolling within the editor content area. The Toolbar SHALL remain visible during scrolling and SHALL NOT scroll with the content.
4. THE Template_Editor SHALL style Merge_Field_Chips with a background colour that provides sufficient contrast against the white editor background and against body text, and SHALL render the chip label in a font weight or style that differentiates it from surrounding prose.
5. THE Template_Editor content area SHALL have a minimum height of 600px.
6. THE Template_Editor content area SHALL reflect the same heading sizes, list indentation, and table border styles that are applied when the agreement is printed, so that the editor view is a faithful WYSIWYG representation of the printed output.

---

### Requirement 9: Access Control

**User Story:** As a system administrator, I want template editing to be restricted to users with appropriate permissions, so that staff without write access cannot accidentally modify the agreement template.

#### Acceptance Criteria

1. WHEN a Staff_User whose role resolves `can_write = false` for the agreements resource navigates to the Agreements page, THE Agreements_Page SHALL NOT render the "Edit Template" control.
2. WHEN a user whose role resolves `can_write = true` for the agreements resource (including Admin_User and any other role with write permission on agreements) navigates to the Agreements page, THE Agreements_Page SHALL render the "Edit Template" control.
3. IF a user without write permission on the agreements resource attempts to submit an upsert to `agreement_defaults.body_html` directly (bypassing the UI), THEN the Supabase RLS policy on the `agreement_defaults` table SHALL reject the write operation and return an error to the caller, leaving the existing `body_html` record unchanged.
