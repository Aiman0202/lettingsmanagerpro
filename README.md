# LettingSoftware - UK Property Management Platform

A comprehensive property management platform for UK letting agencies, built with React, TypeScript, and Supabase.

## Features

- **Property Management** - Comprehensive property tracking with 50+ enhanced fields including features, rooms, financial details, compliance, and website display settings
  - **Room Management** - Detailed room information with dimensions, floor coverings, and features
  - **Property Enhancement System** - 9 categories of property data: features, location, financial, descriptions, media, compliance, management, website settings
  - Photo gallery with compression and primary photo selection
  - Compliance tracking (Gas Safe, EPC, EICR, PAT, Fire Risk, Legionella)
  - Home Safe licensing with certificate tracking
  - Inventory management with room-by-room items
  - Property tickets and maintenance tasks
  - Property activity timeline
- **Tenancy Management** - Full tenancy lifecycle from creation to renewal with automated workflows
- **Agreement Generation** - Enhanced WYSIWYG template editor with TipTap, 60+ merge fields, clause library, and conditional blocks
- **Financial Management** - Rent tracking, tenant statements, landlord statements, payment receipts
- **Tenant Management** - Tenant profiles, ID documents, family members, emergency contacts
- **Landlord Management** - Landlord profiles, banking details, property associations, ID verification
- **Compliance Tracking** - Multi-certificate tracking with expiry alerts and document attachments
- **Maintenance Requests** - Track and manage property maintenance with priority levels
- **Document Management** - Centralized document storage with signed URLs
- **Audit Logging** - Comprehensive activity tracking for all system operations

## Tech Stack

- **Frontend**: React 19 + TypeScript with strict mode
- **Build Tool**: Vite 8 with HMR
- **Styling**: Tailwind CSS v4 with custom shadcn/ui components
- **UI Components**: Radix UI primitives (Dialog, Select, Tabs, Toast, Tooltip, Popover, Checkbox, Avatar, Separator)
- **Rich Text Editor**: TipTap 3.x with custom extensions (MergeFieldNode, PageBreak)
- **Form Validation**: Zod 4.x for schema validation
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: TanStack React Query 5.x for server state
- **Authentication**: Supabase Auth with protected routes
- **Routing**: react-router-dom 7.x with nested layouts
- **Deployment**: Vercel with automatic deployments
- **PWA**: vite-plugin-pwa + Workbox for offline caching
- **Icons**: Lucide React
- **Image Compression**: Browser Image Compression library

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase account

### Installation

```bash
# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

### Deployment

The application is automatically deployed to Vercel on push to main branch:

```bash
npx vercel --prod --yes
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── features/            # Feature-specific modules
│   └── agreements/      # Agreement generation system
│       ├── editor/      # Template editor (TipTap-based)
│       └── ...
├── pages/               # Page components
│   ├── properties/      # Property management pages
│   ├── tenancies/       # Tenancy management pages
│   ├── finance/         # Financial management pages
│   └── ...
├── utils/               # Utility functions
│   ├── agreements.ts    # Agreement HTML generation
│   ├── agreement-settings.ts  # Layout settings
│   └── ...
├── lib/                 # Core libraries and utilities
│   ├── supabase.ts      # Supabase client
│   └── audit.ts         # Audit logging
└── hooks/               # Custom React hooks

supabase/
└── migrations/          # Database migrations
```

## Key Features

### Agreement Template Editor

- **WYSIWYG Editing** - TipTap-based rich text editor with visual formatting
- **Merge Field System** - 60+ dynamic fields organized by category:
  - Tenancy fields (start date, rent, deposit, term, notice period)
  - Property fields (address, type, bedrooms, EPC, furnished status)
  - Landlord fields (name, address, contact details)
  - Tenant fields (name, contact, emergency contact, NI number)
  - Agency fields (company name, address, logo)
  - Financial fields (rent amount, frequency, deposit scheme)
  - Inventory fields (room-by-room inventory)
  - HMO fields (license status, max occupants)
  - Guarantor fields (name, address, contact)
  - Utilities fields (meter numbers, providers)
  - Council fields (council name, address, license type)
- **Clause Library** - 18 pre-seeded UK tenancy clauses across 4 categories:
  - Rent & Deposit clauses
  - Obligations clauses
  - General clauses (right of entry, data protection, entire agreement)
  - Conditional clauses with dynamic visibility
- **Conditional Blocks** - Dynamic content sections with IF/THEN logic
- **Layout Settings** - Customizable document appearance:
  - Page margins and orientation
  - Font family and size
  - Text colors and highlight colors
  - Header and footer content
  - Signature page layout (single vs. dual signature)
  - Logo placement and sizing
- **HTML Source Code View** - Direct HTML editing with syntax highlighting
- **Page Break Support** - Visual page break indicators for print layout
- **Template Validation** - Ensures required merge fields are present
- **Auto-save** - Automatic template saving with version tracking

### Property Management

- **Enhanced Property Schema** - 50+ fields organized in 9 categories:
  - Property Features (subtype, furnished, floors, outdoor space, parking, heating, interior)
  - Location & Area (nearest station, council tax band, neighborhood, transport links)
  - Financial Details (monthly rent, deposit, minimum term, availability date)
  - Descriptions (short description, full description, key features list)
  - Media & Documents (floor plans, virtual tours, video tours)
  - Compliance & Legal (fire safety, legionella assessment, HMO license)
  - Management Details (management type, fees, keys held, emergency contacts)
  - Website Display Settings (SEO title, meta description, featured property, custom slug)
- **Room Management** - Comprehensive room tracking:
  - 9 room types (bedroom, bathroom, kitchen, living room, dining room, study, hallway, utility, other)
  - Dimensions in metric and imperial units
  - Floor coverings (carpet, hardwood, tile, laminate, vinyl)
  - Custom room features with add/remove functionality
  - Room descriptions and photos
  - Room summary dashboard showing count by type
- **Property Form UI** - 5 collapsible sections for easy data entry:
  - Basic Information (address, type, bedrooms, bathrooms, status)
  - Property Features (subtype, furnished, floors, heating, parking, garden)
  - Financial Details (rent, deposit, council tax, terms, availability)
  - Location & Area (station, distance)
  - Website Display Settings (SEO, featured, visibility)
- **Property Detail Page** - 8 collapsible sections displaying all enhanced information
- Photo gallery with compression and primary photo selection
- Compliance tracking (Gas Safe, EPC, EICR, PAT, Fire Risk, Legionella)
- Home Safe licensing with certificate tracking
- Inventory management with room-by-room items
- Property tickets and maintenance tasks
- Property activity timeline with full audit trail

### Tenancy Workflow

- Automated reference number generation (TNC-XXXX)
- Multi-tenant support
- Tenancy amendments and renewals
- Move-in/move-out checklists
- Digital signature capture

### Financial Features

- Rent schedule generation
- Tenant statements
- Landlord statements
- Payment receipt PDFs
- Arrears tracking

## Database Migrations

Run migrations in Supabase Dashboard → SQL Editor or use:

```bash
npx supabase db push
```

## Environment Variables

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development

### Code Style

- ESLint with TypeScript strict mode
- Prettier for formatting
- React Hooks best practices
- Null-safe coding patterns

### Testing

```bash
npm run test
```

## Recent Changes (2026)

### Property Enhancement System - June 2026

**Phase 1-5 Complete:** Comprehensive property data model enhancement with 50+ new fields and room management.

**What's New:**
- **Database Migration 026** - Added 50+ new columns to properties table across 9 categories
- **property_rooms Table** - New table for detailed room information with dimensions and features
- **Enhanced Property Form** - 5 collapsible sections for easy data entry
- **Enhanced Property Detail Page** - 8 collapsible sections displaying all property information
- **PropertyRooms Component** - Full CRUD interface for room management
- **TypeScript Types** - Complete type safety for all new fields

**Key Features:**
- Property features (subtype, furnished, floors, outdoor space, parking, heating, interior)
- Location & area details (nearest station, council tax band, neighborhood)
- Financial details (monthly rent, deposit, minimum term, availability)
- Descriptions and key features (short description, full description, features list)
- Media & virtual tours (floor plans, video tours, 360° tours)
- Compliance & legal (fire safety, legionella, HMO license)
- Management details (management type, fees, keys, emergency contacts)
- Website display settings (SEO, featured property, custom slug)

**Documentation:** See [CHANGELOG.md](CHANGELOG.md) for full details.

### Agreement Editor Enhancements - 2026

- TipTap integration for WYSIWYG editing
- Merge field system with 60+ fields
- Clause library with 18 pre-seeded UK tenancy clauses
- Conditional blocks for dynamic content
- Layout settings customization
- HTML source code view
- Page break support

---

## License

Proprietary - All rights reserved

## Support

For support, contact your system administrator.
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
