# LettingsPro — API & Integration Reference

> Utility functions, hooks, shared components, and integration patterns for developers.

---

## Table of Contents

1. [Utility Functions](#1-utility-functions)
2. [Custom Hooks](#2-custom-hooks)
3. [Zod Schemas](#3-zod-schemas)
4. [Shared Components API](#4-shared-components-api)
5. [UI Primitives](#5-ui-primitives)
6. [Context Providers](#6-context-providers)
7. [Supabase Integration Patterns](#7-supabase-integration-patterns)
8. [Storage Integration](#8-storage-integration)

---

## 1. Utility Functions

### `src/utils/agreements.ts`

Core agreement generation engine.

#### `generateAgreementForTenancy(tenancyId: string): Promise<GeneratedAgreement | null>`

Generates a tenancy agreement from a tenancy record.

**Steps:**
1. Fetches tenancy with property, landlord joins
2. Fetches lead tenant(s) via `tenancy_tenants`
3. Fetches company settings
4. Loads default AST template (`agreement_templates WHERE is_default = true`)
5. Builds merge context with 60+ fields
6. Replaces `{{field}}` placeholders in template HTML
7. Inserts `generated_agreements` record
8. Syncs compliance attachments via `syncAgreementAttachments()`
9. Returns the created agreement or `null` on error

**Merge field categories:**

| Prefix | Fields |
|--------|--------|
| `tenancy.` | start_date, end_date, rent_amount, deposit_amount, deposit_scheme, reference_number |
| `property.` | address, postcode, type, bedrooms, bathrooms, epc_rating, reference_number |
| `landlord.` | full_name, email, phone, address, company_name |
| `tenant.` | full_name, email, phone, ni_number, dob |
| `company.` | company_name, address, email, phone, vat_number, website |

---

### `src/utils/agreement-attachments.ts`

Manages automatic attachment syncing when agreements are generated.

#### `syncAgreementAttachments(agreementId: string, propertyId: string, tenantIds: string[]): Promise<void>`

Links compliance certificates and tenant ID documents to a generated agreement.

**Sources:**
- `property_compliance` records for the property → `compliance_certificate` attachments
- `tenant_id_documents` for each tenant → `tenant_id_document` attachments
- `tenant_references` for each tenant → `tenant_reference` attachments

Each attachment is inserted into `agreement_attachments` with:
- `source_table` and `source_id` for provenance
- `display_name` for UI rendering
- `storage_path` for file access
- `included_in_council_pack = true` by default

---

### `src/utils/timeline.ts`

Unified timeline aggregation across multiple event sources.

#### `fetchTenancyTimeline(tenancyId: string): Promise<TimelineEvent[]>`

Fetches and merges events from 8 sources, sorted by date descending:

| Source | Event Type | Fields Used |
|--------|-----------|-------------|
| `tenancies` | tenancy_created | created_at |
| `tenancy_renewals` | renewal | new_end_date, new_rent, notes |
| `tenancy_terminations` | termination | effective_date, reason_category, initiated_by |
| `tenancy_amendments` | amendment | effective_date, amendment_type, old/new_value |
| `tenancy_inspections` | inspection | inspection_date, type, overall_condition |
| `tenancy_checklists` | checklist | created_at, type, keys/meters |
| `rent_transactions` | rent_payment | due_date, amount, status, payment_method |
| `arrears_actions` | arrears_action | action_date, action_type, notes |

**Return type:** `TimelineEvent[]` with `date`, `type`, `title`, `description`, `icon` fields.

#### `fetchPropertyTimeline(propertyId: string): Promise<TimelineEvent[]>`

Aggregates property-level events: tenancies, inspections, maintenance, compliance, tickets.

---

### `src/utils/finance.ts`

Financial calculation helpers.

#### `calculateLandlordStatement(params): StatementBreakdown`

Calculates gross rent, agency fees, expenses, and net payout for a landlord statement period.

---

### `src/utils/references.ts`

Reference number generation.

#### `generatePropertyReference(): Promise<string>`
#### `generateTenancyReference(): Promise<string>`

Calls `generate_next_reference('PRP', 'properties')` and `generate_next_reference('TNC', 'tenancies')` respectively via Supabase RPC.

**Format:** `PRP-0001`, `PRP-0002`, ..., `TNC-0001`, `TNC-0002`, ...

---

### `src/utils/dossier.ts`

Property dossier compilation.

#### `compilePropertyDossier(propertyId: string): Promise<Dossier>`

Aggregates property info, compliance certificates, photos, and tickets into a compiled dossier object for the `PropertyDossierViewer` component.

---

### `src/utils/validation.ts`

Shared validation utilities used across forms.

---

## 2. Custom Hooks

### `src/hooks/useColumnVisibility.ts`

#### `useColumnVisibility(storageKey: string, defaultColumns: ColumnConfig[]): ColumnVisibilityState`

Manages table column visibility state with localStorage persistence.

**Parameters:**
- `storageKey`: Unique key for localStorage (e.g., `'properties-columns'`)
- `defaultColumns`: Array of `{ key: string, label: string, defaultVisible: boolean }`

**Returns:**
```typescript
{
  columns: ColumnConfig[];
  isVisible: (key: string) => boolean;
  toggle: (key: string) => void;
  reset: () => void;
}
```

**Usage:**
```tsx
const colVis = useColumnVisibility('properties-columns', PROPERTY_COLUMNS)

// In table header
<ColumnVisibility {...colVis} />

// In table body
{colVis.isVisible('address') && <TableCell>{row.address}</TableCell>}
```

**Storage keys used in app:**
- `properties-columns`
- `tenants-columns`
- `landlords-columns`
- `maintenance-columns`
- `finance-rent-columns`

---

## 3. Zod Schemas

### `src/schemas/forms.ts`

All form validation schemas using Zod v4.

#### `propertySchema`

| Field | Type | Validation |
|-------|------|------------|
| `address` | string | Required |
| `postcode` | string | Required, UK postcode regex |
| `type` | string | Required |
| `bedrooms` | string | Optional |
| `bathrooms` | string | Optional |
| `status` | string | Required |
| `description` | string | Optional |
| `epc_rating` | string | Optional |
| `landlord_id` | string | Optional |

#### `tenantSchema`

| Field | Type | Validation |
|-------|------|------------|
| `full_name` | string | Required |
| `email` | string | Required, valid email |
| `phone` | string | Optional, UK phone regex |
| `dob` | string | Optional |
| `ni_number` | string | Optional, NI number format |
| `emergency_contact` | string | Optional |

#### `landlordSchema`

| Field | Type | Validation |
|-------|------|------------|
| `full_name` | string | Required |
| `email` | string | Required, valid email |
| `phone` | string | Optional, UK phone regex |
| `company_name` | string | Optional |
| `address` | string | Optional |
| `bank_details` | string | Optional |

#### `paymentSchema`

| Field | Type | Validation |
|-------|------|------------|
| `tenancy_id` | string | Required |
| `amount` | string | Required, positive number |
| `due_date` | string | Required |
| `paid_date` | string | Optional |
| `payment_method` | string | Required |
| `status` | string | Required |
| `notes` | string | Optional |

#### `expenseSchema`

| Field | Type | Validation |
|-------|------|------------|
| `property_id` | string | Required |
| `category` | string | Required |
| `amount` | string | Required, positive number |
| `date` | string | Required |
| `description` | string | Optional |

#### `maintenanceSchema`

| Field | Type | Validation |
|-------|------|------------|
| `property_id` | string | Required |
| `title` | string | Required |
| `description` | string | Optional |
| `priority` | string | Required |
| `status` | string | Required |

#### `zodErrors(result): Record<string, string>`

Converts a Zod `SafeParseResult` into a flat `Record<fieldName, errorMessage>` for inline display.

```typescript
const result = propertySchema.safeParse(formData)
if (!result.success) {
  const errors = zodErrors(result)
  // errors = { address: 'Address is required', postcode: 'Enter a valid UK postcode' }
}
```

### Validation Regex Patterns

| Pattern | Regex | Example Match |
|---------|-------|---------------|
| UK Postcode | `/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i` | SW1A 1AA, M1 1AE |
| UK Phone | `/^(\+44\|0)\s?\d[\d\s]{8,}$/` | +44 7911 123456, 07911123456 |
| NI Number | `/^[A-CEGHJ-PR-TW-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]$/i` | AB123456C |

---

## 4. Shared Components API

### `ColumnVisibility`

Dropdown component for toggling table column visibility.

```tsx
import { ColumnVisibility } from '@/components/ui/ColumnVisibility'

<ColumnVisibility
  columns={colVis.columns}
  isVisible={colVis.isVisible}
  toggle={colVis.toggle}
  reset={colVis.reset}
/>
```

### `FormField`

Label + input wrapper with inline error display.

```tsx
import { FormField } from '@/components/ui/FormField'

<FormField label="Address" error={errors.address}>
  <Input value={form.address} onChange={...} />
</FormField>
```

**Props:** `label: string`, `error?: string`, `children: ReactNode`

### `ActivityFeed`

Collapsible sidebar panel showing recent audit log entries.

```tsx
import { ActivityFeed } from '@/components/ActivityFeed'

// Used in AppLayout — queries audit_log, shows recent entries with navigation links
<ActivityFeed isOpen={showFeed} onClose={() => setShowFeed(false)} />
```

### `AgreementPrintView`

Dedicated A4 print layout for tenancy agreements.

```tsx
import { AgreementPrintView } from '@/components/AgreementPrintView'

<AgreementPrintView agreementId={agreement.id} />
```

Renders: cover page, property/tenancy details table, merged agreement HTML, signature blocks.

### `SignatureCaptureModal`

Multi-signatory digital signature capture.

```tsx
import { SignatureCaptureModal } from '@/pages/agreements/SignatureCaptureModal'

<SignatureCaptureModal
  agreement={agreement}
  open={showSignModal}
  onOpenChange={setShowSignModal}
  onComplete={handleSignComplete}
/>
```

**Features:**
- Signatory queue: all tenants first, then agent
- Topaz signature pad auto-detection
- Fallback: touch/mouse canvas via `signature_pad` library
- Captures: base64 image, signatory type, capture method, IP address

### `CouncilSubmissionDialog`

Council compliance packaging and submission.

```tsx
<CouncilSubmissionDialog
  agreement={agreement}
  open={showCouncilDialog}
  onOpenChange={setShowCouncilDialog}
/>
```

### `PropertyTimeline`

Unified event timeline for a property.

```tsx
<PropertyTimeline propertyId={property.id} />
```

### `PropertyDossierViewer`

Compiled compliance pack viewer for a property.

```tsx
<PropertyDossierViewer propertyId={property.id} />
```

### Form Dialogs

| Dialog | Schema | Purpose |
|--------|--------|---------|
| `ComplianceFormDialog` | — | Property compliance certificate CRUD |
| `InspectionFormDialog` | — | Room-by-room inspection builder |
| `TerminationFormDialog` | — | Tenancy termination with penalties |
| `RenewalFormDialog` | — | Tenancy renewal (date + rent) |
| `AmendmentFormDialog` | — | Mid-tenancy amendments |
| `ChecklistFormDialog` | — | Move-in/move-out checklists |
| `TicketFormDialog` | — | Property ticket CRUD |
| `HomeSafeLicenceDialog` | — | HomeSafe licence application |

---

## 5. UI Primitives

All primitives are in `src/components/ui/` and follow shadcn/ui patterns (Radix + Tailwind + CVA).

| Component | Base | Usage |
|-----------|------|-------|
| `badge.tsx` | CVA variants | Status labels (Active, Pending, Signed, etc.) |
| `breadcrumb.tsx` | Custom | Page navigation breadcrumbs |
| `button.tsx` | CVA + Slot | Primary action buttons with variants |
| `card.tsx` | Custom | Content containers with header/body/footer |
| `dialog.tsx` | Radix Dialog | Modal dialogs |
| `input.tsx` | Custom | Text inputs |
| `label.tsx` | Radix Label | Form labels |
| `loading-button.tsx` | Button + Spinner | Async action buttons |
| `responsive-table.tsx` | Table wrapper | Mobile-responsive table container |
| `select.tsx` | Radix Select | Dropdown selects |
| `table.tsx` | Custom | Table, TableHeader, TableBody, TableRow, TableCell |
| `textarea.tsx` | Custom | Multi-line text inputs |

---

## 6. Context Providers

### `AuthProvider` (`src/contexts/AuthContext.tsx`)

Provides Supabase authentication state to the application.

```tsx
const { session, user, loading, signOut } = useAuth()
```

| Property | Type | Description |
|----------|------|-------------|
| `session` | Supabase Session \| null | Current auth session |
| `user` | User record \| null | Current user from `users` table |
| `loading` | boolean | Session loading state |
| `signOut` | () => Promise | Signs out and clears session |

### `ToastProvider` (`src/contexts/ToastContext.tsx`)

Global toast notification system.

```tsx
const { toast } = useToast()

toast({ title: 'Property saved', variant: 'success' })
toast({ title: 'Error saving', variant: 'destructive' })
```

### `QueryClientProvider` (TanStack Query)

Server-state management with default options:
- `staleTime`: 30 seconds
- `retry`: 1 attempt

```tsx
const queryClient = useQueryClient()

// Invalidate after mutation
queryClient.invalidateQueries({ queryKey: ['properties'] })
```

---

## 7. Supabase Integration Patterns

### Standard Query Pattern

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['properties'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('*, landlords(full_name)')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },
})
```

### Standard Mutation Pattern

```typescript
const mutation = useMutation({
  mutationFn: async (newProperty: PropertyForm) => {
    const { data, error } = await supabase
      .from('properties')
      .insert(newProperty)
      .select()
      .single()
    
    if (error) throw error
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['properties'] })
    toast({ title: 'Property created' })
  },
})
```

### Reference Number Generation

```typescript
// Before inserting a new property
const { data: ref } = await supabase
  .rpc('generate_next_reference', { prefix: 'PRP', tbl: 'properties' })

// Use ref in insert
await supabase.from('properties').insert({ ...form, reference_number: ref })
```

### Storage Upload Pattern

```typescript
const filePath = `${propertyId}/${Date.now()}-${file.name}`

const { error } = await supabase.storage
  .from('property-photos')
  .upload(filePath, file)

if (!error) {
  await supabase.from('property_photos').insert({
    property_id: propertyId,
    storage_path: filePath,
    is_primary: false,
  })
}
```

### Storage URL Retrieval

```typescript
const { data } = supabase.storage
  .from('property-photos')
  .getPublicUrl(photo.storage_path)

// Or for private buckets:
const { data } = await supabase.storage
  .from('documents')
  .createSignedUrl(doc.storage_path, 3600) // 1 hour expiry
```

---

## 8. Storage Integration

### Bucket Summary

| Bucket | Access | Content |
|--------|--------|---------|
| `property-photos` | Auth | Property images |
| `tenant-id-documents` | Auth | Tenant ID verification files |
| `landlord-id-documents` | Auth | Landlord ID verification files |
| `company-assets` | Public read / Auth write | Company logo |
| `inspection-photos` | Auth | Inspection condition photos |
| `documents` | Auth | General documents, compliance certs |
| `agreements` | Auth | Generated agreement PDFs |

### File Path Conventions

| Bucket | Path Pattern | Example |
|--------|-------------|---------|
| `property-photos` | `{propertyId}/{timestamp}-{filename}` | `abc-123/1718000000-front.jpg` |
| `tenant-id-documents` | `{tenantId}/{timestamp}-{filename}` | `def-456/1718000000-passport.pdf` |
| `landlord-id-documents` | `{landlordId}/{timestamp}-{filename}` | `ghi-789/1718000000-licence.jpg` |
| `inspection-photos` | `{inspectionId}/{timestamp}-{filename}` | `jkl-012/1718000000-kitchen.jpg` |
| `documents` | `{entityType}/{entityId}/{timestamp}-{filename}` | `property/abc-123/1718000000-gas.pdf` |
| `company-assets` | `logo.{ext}` or `{filename}` | `logo.png` |

### Upload Flow

```mermaid
graph TB
    SELECT_FILE[User Selects File] --> UPLOAD[supabase.storage.from('bucket').upload(path, file)]
    UPLOAD --> RECORD[supabase.from('table').insert({ storage_path: path, ... })]
    RECORD --> INVALIDATE[queryClient.invalidateQueries]
    INVALIDATE --> RENDER[UI Updates with New File]
```

### Download Flow

```mermaid
graph TB
    CLICK[User Clicks Download] --> GET_URL[supabase.storage.from('bucket').createSignedUrl(path, expiry)]
    GET_URL --> DOWNLOAD[window.open(signedUrl) or anchor download]
```
