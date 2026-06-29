# LettingSoftware - UK Property Management Platform

A comprehensive property management platform for UK letting agencies, built with React, TypeScript, and Supabase.

## Features

- **Property Management** - Track properties, photos, compliance, and inventory
- **Tenancy Management** - Full tenancy lifecycle from creation to renewal
- **Agreement Generation** - WYSIWYG template editor with merge fields for AST agreements
- **Financial Management** - Rent tracking, tenant statements, landlord statements
- **Tenant Management** - Tenant profiles, ID documents, family members
- **Landlord Management** - Landlord profiles, banking details, property associations
- **Compliance Tracking** - Gas safety, EPC, EICR, Home Safe licenses
- **Maintenance Requests** - Track and manage property maintenance
- **Document Management** - Store and manage property-related documents
- **Audit Logging** - Track all system activities

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4
- **UI Components**: Custom shadcn/ui pattern
- **Rich Text Editor**: TipTap 3.x
- **Database**: Supabase (PostgreSQL)
- **State Management**: TanStack React Query
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

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

- WYSIWYG editing with TipTap
- Merge field support (200+ fields)
- Page break controls
- HTML source code editing
- Clause library and conditional blocks
- Layout settings (margins, fonts, headers/footers)

### Property Management

- Photo gallery with compression
- Compliance tracking (Gas, EPC, EICR)
- Home Safe licensing
- Inventory management
- Property tickets and tasks

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
