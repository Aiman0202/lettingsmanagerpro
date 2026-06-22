# LettingsPro — Architecture & Workflows

> System architecture, key business workflows, and integration patterns.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Key Workflows](#2-key-workflows)
   - 2.1 [Agency Onboarding](#21-agency-onboarding)
   - 2.2 [Tenancy Lifecycle](#22-tenancy-lifecycle)
   - 2.3 [Agreement Generation & Signing](#23-agreement-generation--signing)
   - 2.4 [Council Submission](#24-council-submission)
   - 2.5 [Arrears Management](#25-arrears-management)
   - 2.6 [Inspection Workflow](#26-inspection-workflow)
   - 2.7 [Landlord Statement Generation](#27-landlord-statement-generation)
3. [Data Flow Patterns](#3-data-flow-patterns)
4. [Frontend Architecture](#4-frontend-architecture)
5. [PWA Configuration](#5-pwa-configuration)
6. [Security Model](#6-security-model)

---

## 1. System Architecture

### High-Level Overview

```mermaid
graph TB
    subgraph Client
        PWA[PWA - React 19 + TypeScript]
        SW[Service Worker - Workbox]
    end

    subgraph Supabase Cloud
        AUTH[Supabase Auth]
        DB[(PostgreSQL)]
        STORAGE[Supabase Storage]
        RLS[Row Level Security]
    end

    PWA --> AUTH
    PWA --> DB
    PWA --> STORAGE
    SW --> PWA
    AUTH --> RLS
    RLS --> DB
```

### Frontend Module Structure

```mermaid
graph TB
    APP[App.tsx - Provider Hierarchy]
    ROUTER[AppRoutes - Route Definitions]
    LAYOUT[AppLayout - Sidebar + Header]

    subgraph Feature Pages
        DASH[Dashboard]
        PROP[Properties]
        LAND[Landlords]
        TENT[Tenants]
        TNCY[Tenancies]
        AGRM[Agreements]
        COMP[Compliance]
        MAINT[Maintenance]
        FIN[Finance]
        DOCS[Documents]
        SET[Settings]
        ONBD[Onboarding]
    end

    subgraph Shared Components
        WIZARD[OnboardingWizard]
        SIGPAD[SignatureCaptureModal]
        INSPCT[InspectionFormDialog]
        TERMNT[TerminationFormDialog]
        TIMELINE[PropertyTimeline]
        FEED[ActivityFeed]
    end

    subgraph Utilities
        AGR_UTIL[agreements.ts]
        TL_UTIL[timeline.ts]
        FIN_UTIL[finance.ts]
        REF_UTIL[references.ts]
    end

    APP --> ROUTER
    ROUTER --> LAYOUT
    LAYOUT --> DASH
    LAYOUT --> PROP
    LAYOUT --> LAND
    LAYOUT --> TENT
    LAYOUT --> TNCY
    LAYOUT --> AGRM
    LAYOUT --> COMP
    LAYOUT --> MAINT
    LAYOUT --> FIN
    LAYOUT --> DOCS
    LAYOUT --> SET
    LAYOUT --> ONBD
```

### Database Layer Architecture

```mermaid
graph TB
    subgraph Application Layer
        REACT[React Components]
        QUERY[TanStack Query]
        SUPA[@supabase/supabase-js]
    end

    subgraph Supabase Platform
        CLIENT[Supabase Client]
        AUTH_MW[Auth Middleware]
        RLS_POLICIES[RLS Policies]
    end

    subgraph PostgreSQL
        CORE[Core Tables - roles, users, company_settings]
        ENTITIES[Entity Tables - properties, landlords, tenants]
        TENANCY[Tenancy Tables - tenancies, renewals, terminations]
        FINANCE_T[Finance Tables - rent_transactions, expenses, statements]
        AGREEMENT[Agreement Tables - templates, generated, signatures]
        SYSTEM_T[System Tables - audit_log, notifications]
    end

    subgraph Storage
        BUCKETS[7 Storage Buckets]
    end

    REACT --> QUERY
    QUERY --> SUPA
    SUPA --> CLIENT
    CLIENT --> AUTH_MW
    AUTH_MW --> RLS_POLICIES
    RLS_POLICIES --> CORE
    RLS_POLICIES --> ENTITIES
    RLS_POLICIES --> TENANCY
    RLS_POLICIES --> FINANCE_T
    RLS_POLICIES --> AGREEMENT
    RLS_POLICIES --> SYSTEM_T
    SUPA --> BUCKETS
```

---

## 2. Key Workflows

### 2.1 Agency Onboarding

Two-phase wizard guiding new agencies through full setup.

```mermaid
graph TB
    START([Start Onboarding]) --> P1S1[Phase 1 Step 1: Create Landlord]
    P1S1 --> P1S2[Step 2: Create Property]
    P1S2 --> P1S3[Step 3: Upload Photos]
    P1S3 --> P1S4[Step 4: Upload Compliance Docs]
    P1S4 --> P1S5[Step 5: Review Phase 1]
    P1S5 --> PAUSE{Pause Between Phases?}
    PAUSE -->|Yes| RESUME[Resume Later]
    RESUME --> P2S1
    PAUSE -->|No| P2S1[Phase 2 Step 1: Confirm Property & Landlord]
    P2S1 --> P2S2[Step 2: Select/Create Tenant]
    P2S2 --> P2S3[Step 3: Set Tenancy Terms]
    P2S3 --> P2S4[Step 4: Generate Agreement]
    P2S4 --> P2S5[Step 5: Capture Signatures]
    P2S5 --> P2S6[Step 6: Final Review]
    P2S6 --> DONE([Onboarding Complete])
    P2S1 -.->|Revisit| P1S1
```

**State management:** Each phase tracks independent progress. Phase 2 can revisit Phase 1 at any time. State persisted in React component state (no backend persistence between steps).

**Key outputs:**
- Phase 1: `landlords`, `properties`, `property_photos`, `property_compliance`, `documents` records
- Phase 2: `tenancies`, `tenancy_tenants`, `generated_agreements`, `agreement_signatures` records

---

### 2.2 Tenancy Lifecycle

State machine governing tenancy from creation to termination.

```mermaid
graph LR
    DRAFT[draft] -->|Activate| ACTIVE[active]
    ACTIVE -->|Approaching End| ENDING[ending_soon]
    ENDING -->|Renew| ACTIVE
    ENDING -->|Expire| EXPIRED[expired]
    ENDING -->|Terminate| TERMINATED[terminated]
    ACTIVE -->|Terminate| TERMINATED
    ENDING -->|End| ENDED[ended]
    ACTIVE -->|End| ENDED
```

**Status transitions logged in `tenancy_status_log`** with from/to status, user, and reason.

#### Lifecycle Operations

| Operation | Trigger | Effect |
|-----------|---------|--------|
| **Renewal** | "Renew" button on TenancyDetailPage | Creates `tenancy_renewals` record, extends `end_date`, optionally updates rent |
| **Amendment** | Mid-tenancy change | Creates `tenancy_amendments` record (rent_change, tenant_add, tenant_remove, other) |
| **Termination** | "Terminate" button | Creates `tenancy_terminations` record with notice period, penalties, deposit deductions |
| **Inspection** | Scheduled or ad-hoc | Creates `tenancy_inspections` with rooms, items, photos |
| **Checklist** | Move-in/move-out | Creates `tenancy_checklists` with keys, meters, alarms |

---

### 2.3 Agreement Generation & Signing

End-to-end flow from tenancy to signed agreement.

```mermaid
graph TB
    TRIGGER[User clicks 'Create Agreement'] --> FETCH[Fetch Tenancy Data]
    FETCH --> TPL[Load Default AST Template]
    TPL --> BUILD[Build Merge Context - 60+ fields]
    BUILD --> MERGE[Replace Merge Fields in HTML]
    MERGE --> INSERT[Insert into generated_agreements]
    INSERT --> SYNC[Sync Compliance + ID Attachments]
    SYNC --> DRAFT[Status: draft]

    DRAFT --> SIGN_BTN[User clicks 'Sign']
    SIGN_BTN --> MODAL[SignatureCaptureModal]
    MODAL --> TENANT_SIG[Tenant Signs - Touch/Topaz]
    TENANT_SIG --> AGENT_SIG[Agent Signs - Touch/Topaz]
    AGENT_SIG --> SAVE_SIGS[Save to agreement_signatures]
    SAVE_SIGS --> SIGNED[Status: signed + signed_at timestamp]
```

#### Merge Field Categories

| Category | Fields | Examples |
|----------|--------|---------|
| **Tenancy** | Dates, rent, deposit | `{{tenancy.start_date}}`, `{{tenancy.rent_amount}}` |
| **Property** | Address, type, rooms | `{{property.address}}`, `{{property.postcode}}` |
| **Landlord** | Name, address, contact | `{{landlord.full_name}}`, `{{landlord.email}}` |
| **Tenant(s)** | Name, NI number | `{{tenant.full_name}}`, `{{tenant.ni_number}}` |
| **Company** | Name, address, VAT | `{{company.company_name}}`, `{{company.vat_number}}` |

#### Signature Capture

- **Topaz signature pad:** Hardware device detected automatically; captures high-fidelity signatures
- **Touch/Mouse canvas:** Fallback using `signature_pad` library on HTML5 canvas
- **Multi-signatory:** Queue-based — all tenants sign first, then agent
- **Each signature stores:** base64 image, signatory type (tenant/agent), capture method, IP address, timestamp

---

### 2.4 Council Submission

Packaging signed agreement with compliance documents for city council.

```mermaid
graph TB
    SIGNED[Signed Agreement] --> PREPARE[User clicks 'Submit to Council']
    PREPARE --> DIALOG[CouncilSubmissionDialog]
    DIALOG --> REVIEW[Review Agreement + Attachments]
    REVIEW --> CHECK{All Docs Present?}
    CHECK -->|No| WARN[Show Missing Items]
    WARN --> REVIEW
    CHECK -->|Yes| SUBMIT[Update council_submission_status]
    SUBMIT --> STATUS[Status: submitted + council_submitted_at]
    STATUS --> COUNCIL_RESPONSE{Council Response}
    COUNCIL_RESPONSE -->|Accepted| ACCEPTED[Status: accepted]
    COUNCIL_RESPONSE -->|Rejected| REJECTED[Status: rejected]
```

**Attachment types included in council pack:**
- Compliance certificates (Gas Safe, EICR, EPC) from `property_compliance`
- Tenant ID documents from `tenant_id_documents`
- Tenant references from `tenant_references`
- Filtered by `included_in_council_pack = TRUE`

---

### 2.5 Arrears Management

Workflow for managing tenants in rent arrears.

```mermaid
graph TB
    OVERDUE[Rent Transaction Overdue] --> IDENTIFY[Identify on Arrears Page]
    IDENTIFY --> SUMMARY[Summary Cards: Total Arrears, Count, Follow-ups Due]
    SUMMARY --> SELECT[Select Tenancy in Arrears]
    SELECT --> DETAIL[Detail Modal: Property, Landlord, Tenant Contact, Overdue Payments]
    DETAIL --> LOG_ACTION[Log Action]
    LOG_ACTION --> ACTION_TYPE{Action Type}
    ACTION_TYPE --> PHONE[Phone Call]
    ACTION_TYPE --> EMAIL[Email]
    ACTION_TYPE --> LETTER[Letter]
    ACTION_TYPE --> SMS[SMS]
    ACTION_TYPE --> VISIT[Visit]
    ACTION_TYPE --> S8[Section 8 Notice]
    ACTION_TYPE --> S21[Section 21 Notice]
    ACTION_TYPE --> PLAN[Payment Plan Agreed]
    ACTION_TYPE --> PAID[Payment Received]
    ACTION_TYPE --> OTHER[Other]
    PHONE --> SAVE[Save to arrears_actions]
    EMAIL --> SAVE
    LETTER --> SAVE
    SMS --> SAVE
    VISIT --> SAVE
    S8 --> SAVE
    S21 --> SAVE
    PLAN --> UPDATE_STATUS[Update Tenancy Status]
    PAID --> UPDATE_STATUS
    SAVE --> FOLLOWUP[Set Follow-up Date]
    UPDATE_STATUS --> SAVE
```

**Tenancy status progression in arrears:**
`active → arrears → payment_plan → legal_proceedings → terminated`

---

### 2.6 Inspection Workflow

Room-by-room property inspection with photo evidence.

```mermaid
graph TB
    CREATE[Create Inspection] --> TYPE{Inspection Type}
    TYPE --> MOVE_IN[Move-In]
    TYPE --> MID[Mid-Tenancy]
    TYPE --> MOVE_OUT[Move-Out]
    MOVE_IN --> ROOMS[Add Rooms]
    MID --> ROOMS
    MOVE_OUT --> ROOMS
    ROOMS --> ROOM_DETAIL[Per Room: Cleanliness, Decoration, Notes]
    ROOM_DETAIL --> ITEMS[Add Items per Room]
    ITEMS --> ITEM_DETAIL[Per Item: Condition, Notes, Action Required]
    ITEM_DETAIL --> PHOTOS[Upload Photos per Room/Item]
    PHOTOS --> OVERALL[Set Overall Condition Rating]
    OVERALL --> SIGNATURES[Tenant + Inspector Signatures]
    SIGNATURES --> SAVE[Save tenancy_inspections + children]
```

**Inspection hierarchy:**
```
tenancy_inspections
  ├── inspection_rooms (N)
  │   ├── inspection_room_items (N)
  │   │   └── inspection_photos (N)
  │   └── inspection_photos (N)
  └── inspection_photos (N, general)
```

---

### 2.7 Landlord Statement Generation

Monthly payout calculation and tracking.

```mermaid
graph TB
    SELECT_LANDLORD[Select Landlord] --> SELECT_PERIOD[Select Period: Last/This/Custom Month]
    SELECT_PERIOD --> CALC_GROSS[Calculate Gross Rent from rent_transactions]
    CALC_GROSS --> SET_FEE[Set Agency Fee Percentage]
    SET_FEE --> CALC_FEES[Calculate Fees Deducted]
    CALC_FEES --> CALC_EXPENSES[Sum Property Expenses]
    CALC_EXPENSES --> CALC_NET[Net Payout = Gross - Fees - Expenses]
    CALC_NET --> PREVIEW[Preview Statement]
    PREVIEW --> SAVE[Save to landlord_statements]
    SAVE --> MARK_PAID[Mark as Paid with Date]
    MARK_PAID --> PDF[Store PDF Path]
```

---

## 3. Data Flow Patterns

### Server State Management (TanStack Query)

```mermaid
graph LR
    COMPONENT[Component] --> USE_QUERY[useQuery - Fetch Data]
    USE_QUERY --> CACHE[Query Cache - 30s stale time]
    CACHE --> SUPABASE[Supabase Client]
    SUPABASE --> DB[(PostgreSQL)]

    COMPONENT --> USE_MUTATION[useMutation - Write Data]
    USE_MUTATION --> SUPABASE
    USE_MUTATION --> INVALIDATE[queryClient.invalidateQueries]
    INVALIDATE --> CACHE
```

### Form Submission Pattern

```mermaid
graph TB
    FORM[Form Dialog Opens] --> INIT[Initialize Form State]
    INIT --> EDIT[User Edits Fields]
    EDIT --> SUBMIT[Submit Handler]
    SUBMIT --> VALIDATE[Zod Schema Validation]
    VALIDATE --> VALID{Valid?}
    VALID -->|No| ERRORS[Set Inline Errors via zodErrors]
    ERRORS --> EDIT
    VALID -->|Yes| INSERT[Supabase Insert/Update]
    INSERT --> SUCCESS{Success?}
    SUCCESS -->|No| TOAST_ERROR[Show Error Toast]
    SUCCESS -->|Yes| INVALIDATE[Invalidate Query Cache]
    INVALIDATE --> TOAST_OK[Show Success Toast]
    TOAST_OK --> CLOSE[Close Dialog]
```

### Agreement Generation Data Flow

```mermaid
graph TB
    TENANCY_ID[Tenancy ID] --> Q1[Query: tenancies + properties + landlords]
    TENANCY_ID --> Q2[Query: tenancy_tenants + tenants]
    TENANCY_ID --> Q3[Query: company_settings]
    TENANCY_ID --> Q4[Query: agreement_templates WHERE is_default]

    Q1 --> CONTEXT[Build Merge Context]
    Q2 --> CONTEXT
    Q3 --> CONTEXT
    Q4 --> MERGE[Template + Context = Merged HTML]

    MERGE --> INSERT[INSERT generated_agreements]
    INSERT --> Q5[Query: property_compliance for property]
    INSERT --> Q6[Query: tenant_id_documents for tenants]
    Q5 --> ATTACH[INSERT agreement_attachments]
    Q6 --> ATTACH
```

---

## 4. Frontend Architecture

### Component Composition Pattern

```mermaid
graph TB
    PAGE[List Page] --> FILTER_CARD[Filter Card - Search, Status, Column Visibility]
    PAGE --> DATA_TABLE[Data Table - Sortable, Filterable]
    PAGE --> FORM_DIALOG[Form Dialog - CRUD Operations]

    FILTER_CARD --> CV[ColumnVisibility Component]
    FILTER_CARD --> SEARCH[Search Input]
    FILTER_CARD --> STATUS_FILTER[Status Select]

    DATA_TABLE --> COLS[Conditional Columns via useColumnVisibility]
    DATA_TABLE --> ACTIONS[Row Actions - Edit, Delete, Status Change]
    DATA_TABLE --> PRINT_CSS[no-print classes]

    FORM_DIALOG --> FF[FormField Wrappers]
    FF --> ZOD[Zod Schema Validation]
    FF --> ERRORS[Inline Error Display]
```

### Layout Structure

```mermaid
graph TB
    APP_LAYOUT[AppLayout] --> SIDEBAR[Sidebar Navigation]
    APP_LAYOUT --> HEADER[Header Bar]
    APP_LAYOUT --> MAIN[Main Content Area]
    APP_LAYOUT --> FEED_PANEL[Activity Feed Panel - Collapsible]

    SIDEBAR --> NAV_ITEMS[Dashboard, Properties, Landlords, Tenants, Tenancies, Finance, etc.]
    HEADER --> GLOBAL_SEARCH[Global Search]
    HEADER --> NOTIFICATIONS[Notifications Dropdown]
    HEADER --> USER_MENU[User Menu]
    HEADER --> FEED_TOGGLE[Activity Feed Toggle]
    FEED_PANEL --> AUDIT_LOG[Recent Audit Log Entries]
```

### Detail Page Tab Pattern

```mermaid
graph TB
    DETAIL_PAGE[Detail Page] --> TABS[Radix Tabs]
    TABS --> TAB1[Overview Tab]
    TABS --> TAB2[Agreement Tab]
    TABS --> TAB3[Inspections Tab]
    TABS --> TAB4[Timeline Tab]
    TABS --> TAB5[Tickets Tab]

    TAB2 --> CREATE_AGR[Create Agreement Button]
    TAB2 --> PREVIEW_AGR[Preview Agreement]
    TAB2 --> SIGN_AGR[Sign Agreement]
    TAB2 --> SUBMIT_COUNCIL[Submit to Council]
    TAB2 --> SIGS_DISPLAY[Signature Cards]

    TAB4 --> TIMELINE_UTIL[timeline.ts - 8 Event Sources]
```

---

## 5. PWA Configuration

### Service Worker Strategy

| Resource Type | Strategy | Description |
|---------------|----------|-------------|
| **App shell** | Precache | HTML, JS, CSS cached during install |
| **API calls** | Network first | Always try network, fallback to cache |
| **Images** | Cache first | Cache on first load, serve from cache |
| **Fonts** | Cache first | Precached for offline support |

### Manifest

```json
{
  "name": "LettingsPro",
  "short_name": "LettingsPro",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [...]
}
```

### Build Configuration

- **Plugin:** `vite-plugin-pwa` with Workbox
- **Dev mode:** Service worker disabled (`devOptions: { enabled: false }`)
- **Production:** Full Workbox precaching + runtime caching strategies
- **Asset inlining limit:** 4096 bytes (assetsBase64)

---

## 6. Security Model

### Authentication Flow

```mermaid
graph TB
    USER[User] --> LOGIN[Login Page]
    LOGIN --> SUPA_AUTH[Supabase Auth - Email/Password]
    SUPA_AUTH --> SESSION[Session Token - JWT]
    SESSION --> APP[Application]
    APP --> GUARD[ProtectedRoute Guard]
    GUARD --> CHECK{Session Valid?}
    CHECK -->|No| REDIRECT[Redirect to /login]
    CHECK -->|Yes| RENDER[Render Page]
```

### Authorization Layers

| Layer | Mechanism | Scope |
|-------|-----------|-------|
| **Route protection** | `ProtectedRoute` component | All pages except `/login` |
| **Role-based access** | `users.role` + `permissions` table | Admin-only features (user mgmt, role editing) |
| **Row Level Security** | PostgreSQL RLS policies | All database tables |
| **Storage access** | Supabase Storage policies | All file uploads/downloads |

### RLS Policy Pattern

All tables use a blanket authenticated-user policy:

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access on <table>"
  ON <table> FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

This means any authenticated Supabase user can access any table. Fine-grained access control is handled at the application layer via RBAC (role-based permissions checked in UI components).

### Admin-Only Enforcement

User and role management in Settings is restricted to admin users only:

```typescript
if (user.role !== 'admin') {
  // Hide user management UI
  // Disable role/permission editing
}
```

### Storage Bucket Policies

- **Private buckets** (property-photos, tenant-id-documents, landlord-id-documents, inspection-photos, documents, agreements): Authenticated users can read/write
- **Public bucket** (company-assets): Public read, authenticated write — used for company logo displayed on branded login page
