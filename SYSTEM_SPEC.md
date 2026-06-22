# LettingsPro — System Specification

> **Version:** 1.0  
> **Last Updated:** June 2026  
> **Scope:** Full application specification covering architecture, database schema, features, and workflows

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Application Architecture](#3-application-architecture)
4. [Database Schema](#4-database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Feature Modules](#6-feature-modules)
   - 6.1 [Dashboard](#61-dashboard)
   - 6.2 [Properties](#62-properties)
   - 6.3 [Landlords](#63-landlords)
   - 6.4 [Tenants](#64-tenants)
   - 6.5 [Tenancies](#65-tenancies)
   - 6.6 [Agreements](#66-agreements)
   - 6.7 [Compliance](#67-compliance)
   - 6.8 [Maintenance](#68-maintenance)
   - 6.9 [Finance](#69-finance)
   - 6.10 [Documents](#610-documents)
   - 6.11 [Settings](#611-settings)
   - 6.12 [Onboarding Wizard](#612-onboarding-wizard)
7. [Cross-Cutting Concerns](#7-cross-cutting-concerns)
8. [Storage Buckets](#8-storage-buckets)
9. [Route Map](#9-route-map)
10. [Component Catalog](#10-component-catalog)

---

## 1. Overview

**LettingsPro** is a progressive web application (PWA) for UK letting agencies to manage their full property portfolio lifecycle — from landlord and property onboarding through tenancy creation, agreement generation with digital signatures, financial tracking, compliance management, and council submission workflows.

### Key Capabilities

- **Portfolio Management** — Properties, landlords, and tenants with full CRUD, search, filtering, and status lifecycle
- **Tenancy Lifecycle** — Draft → Active → Renewal/Amendment → Termination with state-machine enforcement
- **Agreement Generation** — Template-driven AST (Assured Shorthold Tenancy) agreement creation with 60+ merge fields, digital two-signatory capture (tenant + agent), and council compliance packaging
- **Financial Operations** — Rent tracking, expense management, landlord statements with net payout calculation, and arrears workflow with Section 8/21 notice support
- **Compliance & Inspections** — Property compliance certificates (Gas Safe, EICR, EPC, PAT, Fire Risk, Legionella), HomeSafe licence tracking, move-in/out/mid-tenancy inspections with room-by-room condition reporting
- **Progressive Web App** — Offline-capable, installable on desktop and mobile via service worker with app manifest

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend Framework** | React | 19.2 |
| **Build Tool** | Vite | 8.x |
| **Language** | TypeScript | 6.0 |
| **Routing** | react-router-dom | 7.x |
| **Server State** | TanStack Query (React Query) | 5.x |
| **Styling** | Tailwind CSS | 4.x (via `@tailwindcss/vite`) |
| **UI Primitives** | Radix UI | Dialog, Select, Tabs, Toast, Tooltip, Popover, Checkbox, Avatar, Separator |
| **Rich Text** | TipTap | 3.x (agreement template editing) |
| **Form Validation** | Zod | 4.x |
| **Backend / Database** | Supabase | PostgreSQL + Auth + Storage |
| **Client SDK** | @supabase/supabase-js | 2.x |
| **PDF Rendering** | @react-pdf/renderer | 4.x |
| **Digital Signatures** | signature_pad | 5.x (with Topaz pad detection) |
| **Icons** | Lucide React | 1.x |
| **PWA** | vite-plugin-pwa + Workbox | Offline caching, app manifest |

---

## 3. Application Architecture

### Provider Hierarchy

```
ErrorBoundary
  └─ QueryClientProvider (TanStack Query, 30s stale time)
      └─ ToastProvider (global toast notifications)
          └─ AuthProvider (Supabase session context)
              └─ BrowserRouter (react-router-dom)
                  └─ AppRoutes
```

### Routing Pattern

- **Public route:** `/login` — unauthenticated access only
- **Protected routes:** All other pages wrapped in `<ProtectedRoute>` which:
  - Shows a loading spinner during session check
  - Redirects to `/login` if no session exists
  - Wraps children in `<AppLayout>` (sidebar nav, header, activity feed panel)

### State Management

- **Server state:** TanStack Query (`useQuery`, `useMutation`, `useQueryClient` for cache invalidation)
- **Local state:** React `useState` / `useReducer` for form state, UI toggles, and dialog visibility
- **Persistent client state:** `localStorage` via `useColumnVisibility` hook for table column preferences
- **Auth context:** `useAuth()` hook from `AuthProvider` for session and user data

### UI Enhancements (Nice-to-Have Layer)

| Feature | Files | Integration |
|---------|-------|-------------|
| Customizable table columns | `useColumnVisibility.ts`, `ColumnVisibility.tsx` | Properties, Tenants, Landlords, Maintenance, Finance (rent tab) |
| Rich form validation | `forms.ts` (Zod schemas), `FormField.tsx` | All form dialogs with inline error display |
| Activity feed sidebar | `ActivityFeed.tsx` | AppLayout toggle button, queries `audit_log` table |
| Branded login | `LoginPage.tsx` | Fetches `company_settings` for logo, name, color |
| Print-friendly views | `index.css` (`@media print`) | All list pages with `.no-print` classes on action elements |

---

## 4. Database Schema

The database uses a **consolidated declarative schema** defined in two migration files:

- `001_initial_schema.sql` — All table definitions, indexes, RLS policies, storage buckets, and seed roles
- `002_seed_data.sql` — Default permission assignments and agreement clause library seeding

### Schema Sections

| Section | Tables | Purpose |
|---------|--------|---------|
| **Core** | `roles`, `permissions`, `users` | RBAC system |
| **Company** | `company_settings` | White-label agency branding |
| **Landlords** | `landlords`, `landlord_id_documents` | Landlord records + ID verification |
| **Tenants** | `tenants`, `tenant_references`, `tenant_id_documents`, `tenant_family_members` | Tenant records + references + ID + family |
| **Properties** | `properties`, `property_photos`, `property_compliance`, `property_home_safe_licences`, `property_tickets` | Property records + media + compliance + tickets |
| **Documents** | `documents` | Polymorphic document storage |
| **Tenancies** | `tenancies`, `tenancy_tenants`, `tenancy_renewals`, `tenancy_inspections`, `inspection_rooms`, `inspection_room_items`, `inspection_photos`, `tenancy_terminations`, `tenancy_checklists`, `tenancy_status_log`, `tenancy_amendments`, `arrears_actions` | Full tenancy lifecycle |
| **Maintenance** | `maintenance_requests`, `contractors`, `maintenance_jobs` | Repair tracking |
| **Finance** | `rent_transactions`, `landlord_statements`, `expenses`, `agency_fees` | Financial operations |
| **Agreements** | `agreement_templates`, `agreement_clauses`, `template_sections`, `template_section_clauses`, `template_versions`, `generated_agreements`, `agreement_signatures`, `agreement_attachments`, `agreement_defaults` | Agreement generation + signing |
| **System** | `audit_log`, `notifications` | Audit trail + user notifications |

### Key Constraints

- **Single active tenancy per property:** Partial unique index on `tenancies(property_id) WHERE status IN ('active', 'ending_soon')`
- **Property status enum:** `available | let | unavailable | inactive`
- **Tenancy status enum:** `draft | active | ending_soon | expired | ended | terminated`
- **Agreement status enum:** `draft | pending_signatures | signed`
- **Council submission status:** `not_submitted | ready_to_submit | submitted | accepted | rejected`
- **Auto-generated references:** `PRP-0001` for properties, `TNC-0001` for tenancies via `generate_next_reference()` PL/pgSQL function

### Row Level Security

All tables have RLS enabled with a blanket authenticated-user policy:

```sql
CREATE POLICY "Authenticated access on <table>"
  ON <table> FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

---

## 5. Authentication & Authorization

### Authentication

- **Supabase Auth** with email/password
- Session managed via `AuthProvider` context; `ProtectedRoute` guards all pages
- Branded login page pulls company name, logo, and primary color from `company_settings`

### Role-Based Access Control (RBAC)

**Roles** (seeded):

| Role | Description |
|------|-------------|
| `admin` | Full access to all modules including user management |
| `manager` | Access to most modules, no system settings |
| `negotiator` | Properties, tenants, landlords, tenancies |
| `accounts` | Finance and documents only |

**Permission model:**

- `permissions` table stores per-role, per-resource `can_read`, `can_write`, `can_delete` flags
- Admin-only enforcement: Only users with `role === 'admin'` can manage users or modify permissions in Settings

---

## 6. Feature Modules

### 6.1 Dashboard

**Route:** `/`  
**Page:** `DashboardPage.tsx`

| Component | Description |
|-----------|-------------|
| Summary cards | Total properties, tenants, active tenancies, open maintenance |
| Expiring tenancies | 30/60/90-day color-coded buckets for tenancies ending soon |
| Recent activity | Latest audit log entries |
| Quick actions | Shortcut buttons for common tasks |

---

### 6.2 Properties

**Routes:** `/properties`, `/properties/:id`  
**Pages:** `PropertiesPage.tsx`, `PropertyDetailPage.tsx`

#### List Page

- Table with column visibility (Ref, Address, Type, Beds, Landlord, Status, Added)
- Search by address/reference, filter by status (All/Available/Let/Inactive)
- Inline status actions: Deactivate, Activate, Make Available, Mark as Let
- Zod-validated create/edit form dialog (`propertySchema`)

#### Detail Page

- **Tabs:** Overview, Documents, Compliance, Timeline, Tickets
- Photo gallery with primary photo selection
- Property dossier viewer (compiled compliance pack)
- **Tickets system:** 4 types (Enquiry, Notice, Issue, Action Item) with priority, status workflow, due dates, user assignment
- **Property Timeline:** Unified event feed from tenancies, inspections, terminations, renewals, amendments, maintenance, compliance

#### Reference Numbers

Auto-generated `PRP-XXXX` on creation, immutable and sequential.

---

### 6.3 Landlords

**Routes:** `/landlords`, `/landlords/:id`  
**Pages:** `LandlordsPage.tsx`, `LandlordDetailPage.tsx`

- Table with column visibility (Name, Email, Phone, Properties, Status, Added)
- Status filtering (All/Active/Inactive) with activate/deactivate quick actions
- Zod-validated form dialog (`landlordSchema`)
- Detail page: contact info, linked properties, ID documents, bank details

---

### 6.4 Tenants

**Routes:** `/tenants`, `/tenants/:id`  
**Pages:** `TenantsPage.tsx`, `TenantDetailPage.tsx`

- Table with column visibility (Name, Email, Phone, Status, Added)
- Status filtering (All/Current/Past/Inactive)
- Zod-validated form dialog (`tenantSchema`) — validates UK phone and NI number formats
- Detail page: personal info, ID documents (passport, driving licence, right to rent, BRP), family members, reference checks (employer, previous landlord, credit)

---

### 6.5 Tenancies

**Routes:** `/tenancies`, `/tenancies/new`, `/tenancies/:id`  
**Pages:** `TenanciesPage.tsx`, `TenancyCreatePage.tsx`, `TenancyDetailPage.tsx`

#### Status State Machine

```
draft → active → ending_soon → expired/ended/terminated
         ↓                         ↑
       renewal/amendment ──────────┘
```

All transitions logged in `tenancy_status_log`.

#### Detail Page Tabs

| Tab | Features |
|-----|----------|
| **Overview** | Tenancy terms, rent/deposit info, linked tenants, landlord, property |
| **Agreement** | Generate agreement, preview, sign (tenant + agent), submit to council |
| **Inspections** | Move-in/move-out/mid-tenancy inspections with room-by-room reporting |
| **Timeline** | Unified event feed (renewals, terminations, amendments, inspections, rent transactions) |

#### Tenancy Lifecycle Operations

| Operation | Dialog | Description |
|-----------|--------|-------------|
| Renewal | `RenewalFormDialog` | Extend end date, update rent |
| Amendment | `AmendmentFormDialog` | Rent change, tenant add/remove |
| Termination | `TerminationFormDialog` | Notice period, penalties, deposit deductions, keys/checkout |
| Inspection | `InspectionFormDialog` | Room-by-room with photos, condition ratings, signatures |
| Checklist | `ChecklistFormDialog` | Move-in/move-out: keys, meters, alarms, cleaning |

#### Single Active Tenancy Constraint

Only one tenancy per property may have status `active` or `ending_soon` at any time (enforced by partial unique index).

---

### 6.6 Agreements

**Route:** `/agreements`  
**Page:** `AgreementsPage.tsx`

#### Agreement Generation Flow

1. Triggered from tenancy detail page (`generateAgreementForTenancy(tenancyId)`)
2. Fetches tenancy data with property, landlord, tenant, and company settings
3. Loads default AST template from `agreement_templates`
4. Builds merge context with 60+ fields (tenancy dates, rent, deposit, property address, landlord/tenant details, company info)
5. Performs merge field replacement in template HTML
6. Inserts into `generated_agreements` with `merged_html`
7. Syncs compliance attachments (property certificates + tenant ID documents) into `agreement_attachments`

#### Template System

- **Structured templates** with sections (header, parties, property details, financial terms, obligations, requirements, special clauses, signatures, footer)
- **Clause library** (`agreement_clauses`): 18 pre-seeded UK tenancy clauses across 4 categories
- **Conditional clauses** via `condition_expression` JSONB on sections and clauses
- **Template versioning** via `template_versions` with change snapshots
- **TipTap rich text editor** for inline clause editing with placeholder extension

#### Signature Workflow (Two-Signatory)

1. Agreement generated → status `draft`
2. "Sign" button opens `SignatureCaptureModal`
3. Tenant(s) sign first (queue-based multi-signatory)
4. Agent signs second (on behalf of the agency)
5. Topaz signature pad detected if available; falls back to touch/mouse canvas
6. Each signature captured as base64 image with IP address, capture method, signatory type
7. Agreement status → `signed` with `signed_at` timestamp

#### Council Submission

- `CouncilSubmissionDialog` packages signed agreement + all compliance attachments + tenant ID documents
- Updates `council_submission_status` and `council_submitted_at`
- Tracks submission status: `not_submitted → ready_to_submit → submitted → accepted/rejected`

---

### 6.7 Compliance

**Route:** `/compliance`  
**Page:** `CompliancePage.tsx`

- Tracks property compliance certificates: Gas Safe, EICR, EPC, PAT, Fire Risk Assessment, Legionella Risk
- Expiry date monitoring with visual alerts for upcoming/expired certificates
- `ComplianceFormDialog` for creating/editing compliance records with property binding
- Links to uploaded certificate documents via `documents` table
- **HomeSafe Licence** tracking per property with certificate checkboxes, application workflow, and licence lifecycle (`certificates_pending → applied → under_review → granted/rejected/expired`)

---

### 6.8 Maintenance

**Route:** `/maintenance`, `/maintenance/:id`  
**Page:** `MaintenancePage.tsx`

- Table with column visibility (Title, Property, Priority, Status, Reported)
- Priority levels: low, medium, high, urgent
- Status workflow: open → in_progress → resolved → closed
- Zod-validated form dialog (`maintenanceSchema`)
- Contractor assignment via `maintenance_jobs` linking to `contractors` table
- Linked to both property and tenancy contexts

---

### 6.9 Finance

**Routes:** `/finance`, `/finance/statements`, `/finance/arrears`  
**Pages:** `FinancePage.tsx`, `LandlordStatementsPage.tsx`, `ArrearsPage.tsx`

#### Finance Page (Rent & Expenses)

- **Rent tab:** Transaction table with column visibility (Property, Due Date, Amount, Status, Paid Date, Method), record payment dialog
- **Expenses tab:** Expense table with CRUD, Zod-validated form (`expenseSchema`)

#### Landlord Statements (`/finance/statements`)

- Summary cards: Outstanding, Paid This Month, Total Statements
- Statement generation: landlord selection, period choice (last/this/custom month), editable agency fee %, automatic calculation of gross rent, fees, expenses, net payout
- Mark as Paid dialog with payment date capture
- PDF export path stored in `landlord_statements.pdf_path`

#### Arrears Workflow (`/finance/arrears`)

- Summary cards: Total Arrears, Tenancies in Arrears, Follow-ups Due Today
- Grouped tenancy table showing overdue amounts
- **Log Action dialog** with 10 standardized action types:
  - phone_call, email, letter, sms, visit
  - section_8_notice, section_21_notice
  - payment_plan_agreed, payment_received, other
- Action timeline with follow-up date tracking
- Automatic tenancy status updates (arrears, payment_plan, legal_proceedings, terminated)

---

### 6.10 Documents

**Route:** `/documents`  
**Page:** `DocumentsPage.tsx`

- Polymorphic document storage linked to entities (property, tenant, landlord, tenancy, general)
- Upload/download via Supabase Storage
- Category classification and size tracking
- Serves as the backing store for compliance certificates, tenant ID documents, and agreement attachments

---

### 6.11 Settings

**Route:** `/settings`  
**Page:** `SettingsPage.tsx`

- **Company Settings:** Name, logo, address, contact details, bank details, VAT number, default fee percentage
- **User Management (admin-only):** Create/edit users, assign roles, activate/deactivate
- **Role & Permission Management (admin-only):** View roles, edit per-resource read/write/delete permissions
- Pulls from `company_settings`, `users`, `roles`, and `permissions` tables

---

### 6.12 Onboarding Wizard

**Route:** `/onboarding`  
**Page:** `OnboardingPage.tsx` → `OnboardingWizard.tsx`

Two-phase guided setup for new agency onboarding:

#### Phase 1: Property & Landlord Setup (5 steps)

1. Create landlord (with ID documents)
2. Create property (with PRP reference auto-generation)
3. Upload property photos
4. Upload compliance documents (Gas Safe, EICR, EPC, etc.)
5. Review & confirm

#### Phase 2: Tenancy & Agreement (6 steps)

1. Confirm property & landlord
2. Select/create tenant
3. Set tenancy terms (dates, rent, deposit)
4. Generate tenancy agreement
5. Capture signatures (tenant + agent)
6. Final review & submit

Each phase has independent progress tracking, supports pausing between phases, and allows revisiting Phase 1 during Phase 2.

---

## 7. Cross-Cutting Concerns

### Validation Schemas (Zod)

| Schema | Required Fields | Format Validation |
|--------|----------------|-------------------|
| `propertySchema` | address, postcode, type, status | UK postcode regex |
| `tenantSchema` | full_name, email | UK phone regex, NI number format |
| `landlordSchema` | full_name, email | UK phone regex |
| `paymentSchema` | tenancy_id, amount, due_date, payment_method, status | Positive amount |
| `expenseSchema` | property_id, category, amount, date | Positive amount |
| `maintenanceSchema` | property_id, title, priority, status | — |

Errors converted to `Record<string, string>` via `zodErrors()` for inline display in `FormField` wrappers.

### Notifications

- `NotificationsDropdown` in AppLayout header
- Queries `notifications` table for unread count and recent items
- Supports read/unread state, notification types, and deep links

### Global Search

- `GlobalSearch` component in AppLayout header
- Searches across properties, tenants, landlords by name/address/reference
- Navigates to matched entity detail page

### Audit Logging

- All significant operations write to `audit_log` table (action, resource, resource_id, details JSONB, IP address)
- Consumed by ActivityFeed sidebar panel and property/tenancy timeline views

### Print Styles

- `@media print` rules in `index.css`: removes sidebar, header, action buttons
- `.no-print` class applied to search/filter/action elements
- Table borders and headers enhanced for print clarity
- `AgreementPrintView.tsx` provides dedicated A4 print layout with running headers, page numbering, cover page

---

## 8. Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `property-photos` | No | Property images |
| `tenant-id-documents` | No | Tenant passport, licence, right-to-rent docs |
| `landlord-id-documents` | No | Landlord ID verification |
| `company-assets` | Yes | Company logo (public for login page branding) |
| `inspection-photos` | No | Inspection condition photos |
| `documents` | No | General documents, compliance certificates |
| `agreements` | No | Generated agreement PDFs |

All buckets use authenticated-user RLS policies except `company-assets` (public read).

---

## 9. Route Map

| Route | Page | Auth |
|-------|------|------|
| `/login` | LoginPage | Public |
| `/` | DashboardPage | Protected |
| `/properties` | PropertiesPage | Protected |
| `/properties/:id` | PropertyDetailPage | Protected |
| `/landlords` | LandlordsPage | Protected |
| `/landlords/:id` | LandlordDetailPage | Protected |
| `/tenants` | TenantsPage | Protected |
| `/tenants/:id` | TenantDetailPage | Protected |
| `/tenancies` | TenanciesPage | Protected |
| `/tenancies/new` | TenancyCreatePage | Protected |
| `/tenancies/:id` | TenancyDetailPage | Protected |
| `/maintenance` | MaintenancePage | Protected |
| `/maintenance/:id` | MaintenancePage (detail) | Protected |
| `/finance` | FinancePage | Protected |
| `/finance/statements` | LandlordStatementsPage | Protected |
| `/finance/arrears` | ArrearsPage | Protected |
| `/documents` | DocumentsPage | Protected |
| `/compliance` | CompliancePage | Protected |
| `/agreements` | AgreementsPage | Protected |
| `/settings` | SettingsPage | Protected |
| `/onboarding` | OnboardingPage | Protected |
| `*` | Redirect to `/` | — |

---

## 10. Component Catalog

### Pages (21 files)

| File | Lines | Purpose |
|------|-------|---------|
| `AgreementsPage.tsx` | 200 | Agreement list, template editor, clause library |
| `SignatureCaptureModal.tsx` | 292 | Multi-signatory digital signature capture |
| `LoginPage.tsx` | 103 | Branded login with company settings |
| `CompliancePage.tsx` | 356 | Compliance certificate tracking |
| `DashboardPage.tsx` | 391 | Portfolio overview with alerts |
| `DocumentsPage.tsx` | 277 | Document management |
| `ArrearsPage.tsx` | 536 | Arrears workflow with action logging |
| `FinancePage.tsx` | 440 | Rent transactions + expenses |
| `LandlordStatementsPage.tsx` | 469 | Landlord payout statements |
| `LandlordDetailPage.tsx` | 396 | Landlord detail with linked properties |
| `LandlordsPage.tsx` | 307 | Landlord list with CRUD |
| `MaintenancePage.tsx` | 325 | Maintenance request management |
| `OnboardingPage.tsx` | 5 | Onboarding route wrapper |
| `PropertiesPage.tsx` | 484 | Property list with CRUD |
| `PropertyDetailPage.tsx` | 469 | Property detail with tabs |
| `SettingsPage.tsx` | 632 | Company + user + role settings |
| `TenanciesPage.tsx` | 137 | Tenancy list |
| `TenancyCreatePage.tsx` | 638 | Multi-step tenancy creation |
| `TenancyDetailPage.tsx` | 722 | Tenancy detail with lifecycle tabs |
| `TenantDetailPage.tsx` | 296 | Tenant detail with ID + family |
| `TenantsPage.tsx` | 316 | Tenant list with CRUD |

### Shared Components (34 files)

| Component | Purpose |
|-----------|---------|
| `AppLayout.tsx` | Sidebar navigation, header, activity feed overlay |
| `OnboardingWizard.tsx` | Two-phase onboarding (1081 lines) |
| `ActivityFeed.tsx` | Collapsible sidebar panel showing audit log |
| `AgreementPrintView.tsx` | A4 print layout for agreements |
| `AgreementPreviewDialog.tsx` | In-app agreement preview modal |
| `CouncilSubmissionDialog.tsx` | Council submission packaging workflow |
| `TerminationFormDialog.tsx` | Tenancy termination with penalties/deposit |
| `InspectionFormDialog.tsx` | Room-by-room inspection builder |
| `HomeSafeLicenceDialog.tsx` | HomeSafe licence application workflow |
| `PropertyTimeline.tsx` | Unified property event timeline |
| `PropertyDossierViewer.tsx` | Compiled compliance pack viewer |
| `ChecklistFormDialog.tsx` | Move-in/move-out checklist |
| `RenewalFormDialog.tsx` | Tenancy renewal form |
| `AmendmentFormDialog.tsx` | Mid-tenancy amendment form |
| `TicketFormDialog.tsx` | Property ticket create/edit |
| `ComplianceFormDialog.tsx` | Compliance certificate form |
| `GlobalSearch.tsx` | Cross-entity search |
| `NotificationsDropdown.tsx` | Notification bell + dropdown |
| `ErrorBoundary.tsx` | Global error boundary |
| `NextSteps.tsx` | Contextual next-action suggestions |

### UI Primitives (14 files)

`ColumnVisibility`, `FormField`, `badge`, `breadcrumb`, `button`, `card`, `dialog`, `input`, `label`, `loading-button`, `responsive-table`, `select`, `table`, `textarea`

### Utilities (7 files)

| File | Purpose |
|------|---------|
| `agreements.ts` | Agreement generation with merge fields |
| `agreement-attachments.ts` | Sync compliance/ID docs to agreement attachments |
| `timeline.ts` | Unified tenancy timeline aggregation (8 event sources) |
| `finance.ts` | Financial calculation helpers |
| `references.ts` | Reference number generation (`PRP-XXXX`, `TNC-XXXX`) |
| `dossier.ts` | Property dossier compilation |
| `validation.ts` | Shared validation utilities |

### Hooks (1 file)

| File | Purpose |
|------|---------|
| `useColumnVisibility.ts` | localStorage-persisted column toggle state |

### Schemas (1 file)

| File | Purpose |
|------|---------|
| `forms.ts` | Zod schemas + `zodErrors()` helper |
