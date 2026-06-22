# Letting Software — System Specification

**Document Version:** 1.0  
**Last Updated:** June 2026  
**Application Name:** LettingsPro  

---

## 1. System Overview

LettingsPro is a web-based property management application for letting agents and property managers. It provides end-to-end management of the residential letting lifecycle: property portfolios, landlords, tenants, tenancy creation and management, maintenance, finance tracking, compliance monitoring, document storage, and legally binding tenancy agreement generation with digital signature capture.

**Primary Users:**
- Letting agents / negotiators
- Property managers
- Accounts staff
- Administrators

**Core Value:** A single system that replaces spreadsheets, paper files, and disconnected tools, providing a unified view of properties, people, tenancies, and finances with professional document output and digital signing.

---

## 2. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React (with Vite) | React 19, Vite 8 |
| Language | TypeScript | 5.x |
| CSS framework | Tailwind CSS | v4 |
| Server state | TanStack React Query | v5 |
| Rich text editor | TipTap (StarterKit) | latest |
| Signature capture | signature_pad | latest |
| Icons | lucide-react | latest |
| Backend / Database | Supabase (PostgreSQL) | — |
| Authentication | Supabase Auth | — |
| File storage | Supabase Storage | — |
| Build output | ~1,236 kB JS + ~46 kB CSS (gzipped: ~340 kB + ~9 kB) | — |

---

## 3. Architecture

### 3.1 High-Level Architecture

```
Browser (React SPA)
    |
    |-- TanStack React Query --> Supabase JS Client --> Supabase Platform
    |                                                      |
    |                                                      |-- PostgreSQL (data)
    |                                                      |-- Auth (sessions)
    |                                                      |-- Storage (files)
    |
    |-- TipTap Editor --> local state --> Supabase (save template JSON)
    |
    |-- signature_pad --> canvas --> base64 --> Supabase (save signature)
```

### 3.2 Application Shell

The application is wrapped in a hierarchy of providers:

```
ErrorBoundary
  └── QueryClientProvider (TanStack React Query, 30s stale time, 1 retry)
      └── ToastProvider (notification toasts)
          └── AuthProvider (Supabase session, user profile)
              └── BrowserRouter
                  ├── /login → LoginPage (unauthenticated)
                  └── ProtectedRoute → AppLayout → {page content}
```

### 3.3 Route Structure

All routes except `/login` are protected by `ProtectedRoute`, which redirects to `/login` if no session exists. Pages are wrapped in `AppLayout` which provides the sidebar, header, breadcrumbs, global search, and notifications.

| Route | Page | Module |
|---|---|---|
| `/login` | LoginPage | Auth |
| `/` | DashboardPage | Dashboard |
| `/properties` | PropertiesPage | Properties |
| `/properties/:id` | PropertyDetailPage | Properties |
| `/landlords` | LandlordsPage | People |
| `/landlords/:id` | LandlordDetailPage | People |
| `/tenants` | TenantsPage | People |
| `/tenants/:id` | TenantDetailPage | People |
| `/tenancies` | TenanciesPage | Tenancies |
| `/tenancies/new` | TenancyCreatePage | Tenancies |
| `/tenancies/:id` | TenancyDetailPage | Tenancies |
| `/maintenance` | MaintenancePage | Operations |
| `/maintenance/:id` | MaintenancePage | Operations |
| `/finance` | FinancePage | Operations |
| `/documents` | DocumentsPage | Admin |
| `/compliance` | CompliancePage | Operations |
| `/agreements` | AgreementsPage | Admin |
| `/settings` | SettingsPage | Admin |
| `/onboarding` | OnboardingPage | Core |

### 3.4 Context Providers

- **AuthContext** (`src/contexts/AuthContext.tsx`) — Supabase session tracking, user profile (`full_name`, `role`), sign-in/sign-out functions
- **ToastContext** (`src/contexts/ToastContext.tsx`) — Global toast notification system (success, error, warning, info)

### 3.5 Component Architecture

```
src/
  components/
    layout/AppLayout.tsx        — Sidebar, header, breadcrumbs, notifications
    ui/                          — Reusable primitives (Button, Card, Dialog, etc.)
    AgreementPreviewDialog.tsx   — Print preview modal for agreements
    AgreementPrintView.tsx       — Renders agreement as printable A4 document
    ChecklistFormDialog.tsx      — Move-in/move-out checklist form
    ComplianceFormDialog.tsx     — Compliance certificate form
    ErrorBoundary.tsx            — React error boundary with fallback UI
    GlobalSearch.tsx             — Search across properties/tenants/landlords
    HomeSafeLicenceDialog.tsx    — HMO / Home Safe licence form
    NotificationsDropdown.tsx    — Notification bell with dropdown list
    OnboardingWizard.tsx         — Multi-step onboarding form
    PropertyDossierViewer.tsx    — Full property dossier PDF viewer
    PropertyTimeline.tsx         — Activity timeline with ticket integration
    TemplateBuilder.tsx          — Split-pane structured agreement template editor
    TerminationFormDialog.tsx    — Tenancy termination form
    TicketFormDialog.tsx         — Property ticket creation form
    contextual/NextSteps.tsx     — Context-sensitive action suggestions
  pages/                         — Route-level page components
  utils/
    agreements.ts                — Agreement generation, signature embedding
    dossier.ts                   — Property dossier aggregation
    finance.ts                   — Rent tracking, arrears calculation
    structured-templates.ts      — Merge fields, conditional logic, clause assembly
    timeline.ts                  — Timeline event aggregation
    validation.ts                — Form validation helpers
  lib/
    supabase.ts                  — Supabase client singleton
    utils.ts                     — Formatting, cn() utility
```

---

## 4. Data Model

### 4.1 Entity-Relationship Summary

```
properties ──< property_photos
properties ──< property_compliance
properties ──< property_tickets
properties ──< maintenance_requests
properties ── landlord (nullable FK)

landlords ──< landlord_id_documents

tenants ──< tenant_id_documents
tenants ──< tenant_family_members
tenants ──< tenant_references

tenancies ── property
tenancies ── landlord
tenancies >──< tenants (via tenancy_tenants, with is_lead flag)
tenancies ──< tenancy_renewals
tenancies ──< tenancy_inspections
tenancies ──< tenancy_terminations
tenancies ──< tenancy_checklists
tenancies ──< rent_transactions
tenancies ──< generated_agreements

maintenance_requests ── property
maintenance_requests ── tenancy
maintenance_requests ──< maintenance_jobs
maintenance_jobs ── contractor

generated_agreements ── tenancy
generated_agreements ── agreement_template
generated_agreements ──< agreement_signatures

agreement_templates ──< template_sections
agreement_templates ──< template_versions
template_sections ──< template_section_clauses
template_section_clauses ── agreement_clauses

users (extends auth.users) ── role-based access
```

### 4.2 Table Definitions

#### 4.2.1 Core & Identity

**`users`** — Extends Supabase `auth.users`. Stores full name, role (`admin`, `manager`, `negotiator`, `accounts`), and active status.

**`roles`** — Predefined roles: admin, manager, negotiator, accounts.

**`permissions`** — Resource-level read/write/delete per role.

**`company_settings`** — Agency branding: company name, logo, address, email, phone, bank details, VAT number, default fee percentage. One row only.

#### 4.2.2 Properties

**`properties`** — Address, postcode, type (`flat`/`house`/etc.), bedrooms, bathrooms, status (`available`/`let`/`maintenance`), landlord FK, EPC rating.

**`property_photos`** — Storage path, primary flag. Linked to property.

**`property_compliance`** — Certificates: `gas_safe`, `eicr`, `epc`, `pat`, `fire_risk`, `legionella`, `other`. Each has an expiry date and optional document reference.

**`property_tickets`** — Enquiries, notices, issues/complaints, action items. Priority (`low`/`medium`/`high`/`urgent`), status (`open`/`in_progress`/`resolved`/`closed`), due date, assigned user.

#### 4.2.3 People

**`landlords`** — Full name, email, phone, company name, address, bank details (account name, number, sort code, bank name).

**`landlord_id_documents`** — ID type (`passport`, `driving_license`, `national_id`, `biometric_residence_permit`, `other`), document number, issuing country, issue/expiry dates, file path.

**`tenants`** — Full name, email, phone, DOB, NI number, emergency contact.

**`tenant_id_documents`** — Same structure as landlord ID documents (`passport`, `driving_license`, `right_to_rent`, `biometric_residence_permit`, `national_id`, `other`), with file path in `tenant-id-documents` storage bucket.

**`tenant_family_members`** — Name, relationship (`spouse`/`partner`/`child`/`parent`/`sibling`/`other`), DOB, phone.

**`tenant_references`** — Reference type (`employer`/`previous_landlord`/`credit`), status (`pending`/`passed`/`failed`/`in_progress`).

#### 4.2.4 Tenancies

**`tenancies`** — Core junction: property FK, landlord FK, start/end dates, rent amount, deposit amount, deposit scheme, status (`active`/`expired`/`ending_soon`/`draft`), agreement template FK.

**`tenancy_tenants`** — Many-to-many join table with `is_lead` flag.

**`tenancy_renewals`** — Old and new end dates, new rent amount, notes.

#### 4.2.5 Tenancy Lifecycle

**`tenancy_inspections`** — Type (`move_in`/`move_out`/`mid_tenancy`), date, inspector name, overall condition.

**`inspection_rooms`** — Room name, cleanliness/decoration ratings, notes.

**`inspection_room_items`** — Item name, condition rating, move-in vs move-out comparisons, action flags.

**`inspection_photos`** — Storage path, linked to inspection/room/item, caption.

**`tenancy_terminations`** — Initiated by (`tenant`/`landlord`/`mutual`), reason category, notice period, effective date, penalties, deposit deductions, key return tracking, move-out inspection flag.

**`tenancy_checklists`** — Move-in/out checklists: keys, meter readings, alarm codes, parking permits, appliances, cleaning, garden condition.

#### 4.2.6 Maintenance

**`maintenance_requests`** — Title, description, priority, status (`open`/`in_progress`/`resolved`/`closed`), linked to property and tenancy.

**`contractors`** — Name, trade, email, phone, insurance expiry.

**`maintenance_jobs`** — Links request to contractor, scheduled/completed dates, cost, status.

#### 4.2.7 Finance

**`rent_transactions`** — Amount, due date, paid date, payment method, status (`pending`/`paid`/`overdue`/`partial`).

**`landlord_statements`** — Period start/end, total rent, fees deducted, net payout, PDF path.

**`expenses`** — Category, amount, date, description, linked to property.

**`agency_fees`** — Fee type, amount, linked to tenancy.

#### 4.2.8 Agreements

**`agreement_templates`** — Name, content JSON (TipTap format), merge fields schema, default flag.

**`agreement_clauses`** — Reusable clause library: category (`terms_conditions`/`tenancy_requirements`/`deposit_financial`/`special_clauses`), title, HTML content, sort order, built-in flag. Seeded with 20+ standard UK AST clauses.

**`template_sections`** — Ordered sections within a template: type, title, sort order, conditional expression (JSONB).

**`template_section_clauses`** — Links clauses to sections with sort order and optional condition overrides.

**`template_versions`** — Version history snapshots for templates.

**`generated_agreements`** — Merged content (JSON + HTML), PDF path, status (`draft`/`pending_signatures`/`signed`).

**`agreement_signatures`** — Signatory type (`tenant`/`landlord`/`witness`), name, base64 image, capture method (`topaz`/`touch`).

#### 4.2.9 Administration

**`documents`** — Generic document storage with entity type (`property`/`tenant`/`landlord`/`tenancy`/`general`), entity ID, category, storage path, size.

**`audit_log`** — Action, resource, resource ID, details (JSONB), IP address.

**`notifications`** — User-targeted: title, body, type, read flag, link.

### 4.3 Database Migrations

| # | File | Contents |
|---|---|---|
| 001 | `001_initial_schema.sql` | Core schema: users, roles, permissions, company_settings, properties, landlords, tenants, tenancies, maintenance, finance, documents, agreements, audit_log, notifications, RLS policies, seed roles |
| 002 | `002_tenant_documents_family.sql` | tenant_id_documents, tenant_family_members, storage bucket |
| 003 | `003_property_photos_status.sql` | property_photos enhancements, status workflow |
| 004 | `004_home_safe_licensing.sql` | HMO / Home Safe licensing fields |
| 005 | `005_landlord_bank_id_documents.sql` | Landlord bank details columns, landlord_id_documents table, storage bucket |
| 006 | `006_enhanced_company_settings.sql` | Additional company_settings fields (address, phone, email) |
| 007 | `007_tenancy_lifecycle.sql` | Inspections, rooms, items, photos, terminations, checklists |
| 008 | `008_agreement_clauses.sql` | agreement_clauses library with 20+ seeded UK AST clauses |
| 009 | `009_structured_templates.sql` | template_sections, template_section_clauses, template_versions |
| 010 | `010_property_tickets.sql` | property_tickets table with type/subtype/priority/status |

### 4.4 Supabase Storage Buckets

| Bucket | Purpose | Access |
|---|---|---|
| `property-photos` | Property images | Authenticated, via signed URLs |
| `documents` | General documents | Authenticated, via signed URLs |
| `agreements` | Generated agreement PDFs | Authenticated, via signed URLs |
| `tenant-id-documents` | Tenant ID scans | Authenticated |
| `landlord-id-documents` | Landlord ID scans | Authenticated |
| `inspection-photos` | Inspection photos | Authenticated |

---

## 5. Feature Inventory

### 5.1 Dashboard

**Route:** `/`  
**Page:** `DashboardPage.tsx`

Summary cards with counts and quick links:
- Total properties
- Active tenancies
- Open maintenance requests
- Ending tenancies (next 30 days)
- Expiring compliance certificates
- Overdue rent transactions

### 5.2 Properties

**Routes:** `/properties`, `/properties/:id`  
**Pages:** `PropertiesPage.tsx`, `PropertyDetailPage.tsx`  
**Key Components:** `PropertyTimeline.tsx`, `PropertyDossierViewer.tsx`, `TicketFormDialog.tsx`, `ChecklistFormDialog.tsx`, `HomeSafeLicenceDialog.tsx`

**List View:**
- Filterable property table (status, type, search)
- Add new property
- Quick status indicators

**Detail View Tabs:**
- **Overview** — Address, type, bedrooms, landlord link, status, photos
- **Tenancies** — Active and historical tenancies for this property
- **Maintenance** — Maintenance requests and jobs
- **Compliance** — Certificates with expiry tracking and status badges
- **Tickets** — Property tickets (enquiries, notices, issues, action items)
- **Timeline** — Unified activity feed showing inspections, tickets, compliance changes, maintenance updates with filter chips

**Actions:**
- Upload/manage property photos (primary photo flag)
- Create/view Home Safe (HMO) licences
- Add compliance certificates
- Create tickets inline from timeline
- View property dossier (aggregated PDF)

### 5.3 Landlords

**Routes:** `/landlords`, `/landlords/:id`  
**Pages:** `LandlordsPage.tsx`, `LandlordDetailPage.tsx`

**List View:** Searchable table of landlords.

**Detail View:**
- Contact details, company name, address
- Banking details (account name, number, sort code, bank name)
- ID documents upload/view
- Associated properties list
- Active tenancies

### 5.4 Tenants

**Routes:** `/tenants`, `/tenants/:id`  
**Pages:** `TenantsPage.tsx`, `TenantDetailPage.tsx`

**List View:** Searchable tenant table.

**Detail View:**
- Personal details (name, email, phone, DOB, NI number)
- Emergency contact
- ID documents (passport, driving license, right to rent, etc.)
- Family members
- Reference checks (employer, previous landlord, credit)
- Active and historical tenancies

### 5.5 Tenancies

**Routes:** `/tenancies`, `/tenancies/new`, `/tenancies/:id`  
**Pages:** `TenanciesPage.tsx`, `TenancyCreatePage.tsx`, `TenancyDetailPage.tsx`  
**Key Components:** `TerminationFormDialog.tsx`

**Creation Wizard:**
1. Select property (available)
2. Select landlord
3. Add tenants (lead + additional)
4. Set dates, rent, deposit, deposit scheme
5. Review and create

**Detail View:**
- Property, landlord, tenant details
- Financial summary (rent, deposit, arrears)
- Inspections (move-in, mid-tenancy, move-out) with room-by-room condition reports and photos
- Terminations with reason, notice period, deposit deductions, key return
- Checklists (keys, meters, alarms, parking)
- Generated agreements
- Renewal history

### 5.6 Maintenance

**Routes:** `/maintenance`, `/maintenance/:id`  
**Page:** `MaintenancePage.tsx`

- Create maintenance requests linked to property/tenancy
- Priority and status tracking
- Contractor assignment
- Job scheduling and cost tracking
- Status workflow: open → in_progress → resolved → closed

### 5.7 Finance

**Route:** `/finance`  
**Page:** `FinancePage.tsx`

- Rent transactions tracking (due/paid/overdue/partial)
- Arrears calculation and visualization
- Landlord statements with fee deductions
- Expense tracking by category
- Agency fee recording

### 5.8 Compliance

**Route:** `/compliance`  
**Page:** `CompliancePage.tsx`  
**Key Component:** `ComplianceFormDialog.tsx`

- All compliance certificates across properties
- Expiry tracking with visual warnings
- Types: Gas Safe, EICR, EPC, PAT, Fire Risk Assessment, Legionella, Other
- Add/edit certificate details with document reference

### 5.9 Agreements

**Route:** `/agreements`  
**Page:** `AgreementsPage.tsx`  
**Key Components:** `TemplateBuilder.tsx`, `AgreementPrintView.tsx`, `AgreementPreviewDialog.tsx`, `SignatureCaptureModal.tsx`

**Templates:**
- **Structured Builder** (`TemplateBuilder.tsx`) — Split-pane visual designer:
  - Left panel: Section list (Parties, Property Details, Financial Terms, Tenant Obligations, etc.) with add/remove/reorder
  - Clauses added to sections via dropdown from clause library
  - Inline section title editing
  - Clause content preview on hover
  - Right panel: Live A4 print preview with merged content from selected tenancy
- **Clause Library** — 20+ pre-built UK AST clauses organized by category, all using merge fields for dynamic content
- **Conditional Logic** — Sections and clauses can have JSONB condition expressions for conditional display

**Agreement Generation:**
- Select template and tenancy
- Merge fields replaced with actual data (tenant name, landlord name, property address, dates, rent, deposit, etc.)
- Structured templates assembled from sections and clauses
- Professional signature page auto-appended with execution blocks (Tenant, Landlord, Witness)

**Signing:**
- Dual capture modes: Topaz hardware signature pad or touch/mouse
- Signatory type selection (tenant, landlord, witness)
- Signatures saved as base64 images
- Automatic embedding into agreement HTML after capture

**Print & Preview:**
- A4 portrait print layout with Times New Roman 12pt
- Running headers (company name, property address) on every page
- Page numbering in footer
- Professional cover page with details table
- Screen preview identical to print output

### 5.10 Documents

**Route:** `/documents`  
**Page:** `DocumentsPage.tsx`

- Upload documents linked to any entity (property, tenant, landlord, tenancy)
- Category tagging
- Search and filter
- Download via signed URLs

### 5.11 Settings

**Route:** `/settings`  
**Page:** `SettingsPage.tsx`

- Company branding (name, logo, address, contact details)
- Bank details and VAT number
- Default agency fee percentage
- User management (list, role assignment)

### 5.12 Onboarding

**Route:** `/onboarding`  
**Page:** `OnboardingPage.tsx`  
**Key Component:** `OnboardingWizard.tsx`

Multi-step wizard for new agency setup:
1. Company details
2. Add first property
3. Invite team members

### 5.13 Global Features

**Global Search** (`GlobalSearch.tsx`) — Search across properties, tenants, landlords with keyboard shortcut.

**Notifications** (`NotificationsDropdown.tsx`) — Bell icon with dropdown showing recent notifications, unread count badge.

**Error Handling** — `ErrorBoundary` catches React rendering errors with user-friendly fallback UI. Toast notifications for operation feedback (success/error).

---

## 6. Navigation Structure

### 6.1 Sidebar

The sidebar is organized into four groups:

**Core**
- Dashboard (`/`)
- Properties (`/properties`)
- Tenancies (`/tenancies`)
- Onboarding (`/onboarding`)

**People**
- Landlords (`/landlords`)
- Tenants (`/tenants`)

**Operations**
- Maintenance (`/maintenance`)
- Finance (`/finance`)
- Compliance (`/compliance`)

**Admin**
- Documents (`/documents`)
- Agreements (`/agreements`)
- Settings (`/settings`)

### 6.2 Sidebar Features

- Collapsible (icon-only mode)
- Mobile responsive (hamburger menu overlay)
- Company logo and name in header area (from company_settings)
- Active route highlighting
- Badge counts on selected items (available properties, ending tenancies, open maintenance, expiring compliance)

### 6.3 Header Bar

- Mobile menu toggle
- Breadcrumb navigation (auto-generated from route)
- Global search input
- Notifications bell with unread badge
- User avatar and logout

---

## 7. Security Model

### 7.1 Authentication

- Supabase Auth with email/password
- Session managed by `AuthContext` with loading state
- `ProtectedRoute` component redirects unauthenticated users to `/login`
- Login page with email/password form, error display

### 7.2 Authorization

**Role-based access control (RBAC):**

| Role | Access |
|---|---|
| `admin` | Full access to all modules |
| `manager` | Access to most modules, no system settings |
| `negotiator` | Properties, tenants, landlords, tenancies |
| `accounts` | Finance and documents only |

Roles are stored on the `users` table. Permissions are defined in the `permissions` table per role per resource with read/write/delete flags.

### 7.3 Row-Level Security (RLS)

All tables have RLS enabled with blanket authenticated-access policies (`FOR ALL TO authenticated USING (true) WITH CHECK (true)`). This ensures any authenticated user can read/write all data. Refined per-table role-based restrictions can be added as needed.

### 7.4 Storage Security

All storage buckets are private. Files are accessed via Supabase signed URLs (typically 60-second expiry). Upload/read/delete policies are restricted to authenticated users per bucket.

---

## 8. Integration Points

### 8.1 Supabase REST API

The frontend communicates with Supabase exclusively through the `@supabase/supabase-js` client library (`src/lib/supabase.ts`). No direct HTTP calls. All queries use TanStack React Query for caching, stale-time management, and optimistic updates.

### 8.2 Supabase Storage

File operations (upload, download via signed URL, delete) use the Supabase Storage client. Buckets are organized by domain: `property-photos`, `documents`, `agreements`, `tenant-id-documents`, `landlord-id-documents`, `inspection-photos`.

### 8.3 TipTap Rich Text Editor

Used for legacy agreement template editing (JSON-based). The structured template system (`TemplateBuilder`) uses HTML-based clauses with merge fields instead of the TipTap editor directly.

### 8.4 Signature Capture

Two methods supported:
- **Topaz** — Hardware signature pad integration (captures via proprietary API)
- **Touch/Mouse** — Canvas-based capture using `signature_pad` library

Signatures are stored as base64-encoded PNG images in the `agreement_signatures` table and embedded into agreement HTML.

### 8.5 Merge Field System

30+ merge fields available for dynamic content in agreements:

| Category | Fields |
|---|---|
| Tenancy | `{{tenancy_id}}`, `{{start_date}}`, `{{end_date}}`, `{{rent_amount}}`, `{{rent_frequency}}`, `{{deposit_amount}}`, `{{deposit_scheme}}`, `{{notice_period_days}}`, `{{today_date}}` |
| Property | `{{property_address}}`, `{{property_postcode}}`, `{{property_type}}`, `{{bedrooms}}`, `{{bathrooms}}`, `{{epc_rating}}`, `{{furnished_status}}` |
| Landlord | `{{landlord_name}}`, `{{landlord_address}}`, `{{landlord_email}}`, `{{landlord_phone}}` |
| Tenant | `{{tenant_name}}`, `{{tenant_address}}`, `{{tenant_ni_number}}`, `{{tenant_dob}}`, `{{tenant_emergency_contact}}` |
| Company | `{{agency_name}}`, `{{agency_address}}`, `{{agency_phone}}`, `{{agency_email}}` |
| Deposit Scheme | `{{scheme_name}}`, `{{scheme_address}}` |

Fields support format hints (`date`, `currency`, `number`, `text`) for proper rendering.

---

## 9. Build & Deployment

### 9.1 Build Configuration

| Setting | Value |
|---|---|
| Build tool | Vite 8 |
| Output directory | `dist/` |
| JS bundle size | ~1,236 kB (gzipped: ~340 kB) |
| CSS bundle size | ~46 kB (gzipped: ~9 kB) |
| Build command | `node node_modules/vite/bin/vite.js build` |

### 9.2 Database Migrations

Migrations follow the convention `NNN_description.sql` and are stored in `supabase/migrations/`. They are applied using the Supabase CLI:

```bash
npx supabase link --project-ref <ref>
npx supabase migration up
```

All migrations are idempotent (use `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS` patterns).

### 9.3 Environment

- Development: `npm run dev` (Vite dev server with HMR)
- Production: Static files served from `dist/` via any web server or Supabase hosting
- PowerShell execution policy may require using `node` directly instead of `npx`

---

## Appendix A: UI Component Library

All UI primitives are in `src/components/ui/`:

| Component | File | Description |
|---|---|---|
| Badge | `badge.tsx` | Status labels with variant colors |
| Breadcrumb | `breadcrumb.tsx` | Auto-generated breadcrumb nav |
| Button | `button.tsx` | Standard and variant buttons |
| Card | `card.tsx` | Container with header/content |
| Dialog | `dialog.tsx` | Modal dialog with overlay |
| Input | `input.tsx` | Text input field |
| Label | `label.tsx` | Form label |
| LoadingButton | `loading-button.tsx` | Button with loading spinner |
| ResponsiveTable | `responsive-table.tsx` | Mobile-friendly table |
| Select | `select.tsx` | Dropdown select |
| Table | `table.tsx` | Standard data table |
| Textarea | `textarea.tsx` | Multi-line text input |

---

## Appendix B: Utility Modules

| Module | Purpose |
|---|---|
| `agreements.ts` | `generateAgreementFromTenancy()` (legacy), `generateAgreementStructured()`, `embedSignaturesIntoAgreement()` |
| `dossier.ts` | Aggregate property data into dossier format |
| `finance.ts` | Rent transaction summaries, arrears calculations |
| `structured-templates.ts` | `MERGE_FIELD_DEFS`, `fetchTenancyData()`, `mergeContent()`, `evaluateCondition()`, `validateMergeFields()` |
| `timeline.ts` | Aggregate events (inspections, tickets, maintenance, compliance) into unified timeline |
| `validation.ts` | Form validation helpers and common validation rules |
| `utils.ts` | `cn()` classname merge, `formatDate()`, `formatCurrency()`, `formatBytes()` |
