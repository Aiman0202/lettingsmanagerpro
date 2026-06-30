# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - 2026-06-18

#### Property Enhancement System (Phase 1-5)

**Database Schema:**
- **Migration 026_property_enhancements.sql** - Added 50+ new columns to properties table:
  - **Property Features Category:**
    - `property_subtype` (TEXT) - Property subtype (e.g., Maisonette, Terraced)
    - `floor_number` (INTEGER) - Floor number
    - `total_floors` (INTEGER) - Total floors in building
    - `lift_access` (BOOLEAN) - Lift access indicator
    - `has_garden` (BOOLEAN) - Garden indicator
    - `garden_type` (TEXT) - Garden type with CHECK constraint (front, back, communal, none)
    - `has_balcony` (BOOLEAN) - Balcony indicator
    - `has_terrace` (BOOLEAN) - Terrace indicator
    - `has_patio` (BOOLEAN) - Patio indicator
    - `has_parking` (BOOLEAN) - Parking indicator
    - `parking_type` (TEXT) - Parking type with CHECK constraint (garage, driveway, street, allocated, none)
    - `parking_spaces` (INTEGER) - Number of parking spaces
    - `heating_type` (TEXT) - Heating type with CHECK constraint (gas_central, electric, underfloor, oil, none)
    - `hot_water_type` (TEXT) - Hot water type with CHECK constraint (gas, electric, oil, none)
    - `has_double_glazing` (BOOLEAN) - Double glazing indicator
    - `reception_rooms` (INTEGER) - Number of reception rooms
    - `kitchen_type` (TEXT) - Kitchen type with CHECK constraint (separate, open_plan, kitchenette, none)
    - `appliances_included` (JSONB) - Array of appliances included
    - `broadband_type` (TEXT) - Broadband type with CHECK constraint (fibre, superfast, ultrafast, none)
    - `has_smart_home` (BOOLEAN) - Smart home features indicator
    - `smart_home_features` (TEXT) - Smart home features description
  
  - **Location & Area Category:**
    - `nearest_station` (TEXT) - Nearest train/tube station
    - `station_distance_minutes` (INTEGER) - Walking distance to station
    - `nearby_schools` (JSONB) - Array of nearby schools
    - `nearby_amenities` (JSONB) - Array of nearby amenities
    - `neighborhood_description` (TEXT) - Neighborhood description
    - `local_highlights` (TEXT) - Local highlights
    - `transport_links` (TEXT) - Transport links description
  
  - **Financial Details Category:**
    - `monthly_rent` (NUMERIC) - Monthly rent amount
    - `deposit_amount` (NUMERIC) - Deposit amount
    - `council_tax_band` (TEXT) - Council tax band with CHECK constraint (A-H)
    - `rent_includes` (JSONB) - Array of items included in rent
    - `minimum_term_months` (INTEGER) - Minimum tenancy term
    - `available_from` (DATE) - Property availability date
  
  - **Descriptions Category:**
    - `short_description` (TEXT) - Short property description
    - `full_description` (TEXT) - Full property description
    - `key_features` (JSONB) - Array of key features
  
  - **Media & Documents Category:**
    - `floor_plan_url` (TEXT) - Floor plan URL
    - `virtual_tour_url` (TEXT) - Virtual tour URL
    - `video_tour_url` (TEXT) - Video tour URL
    - `tour_360_url` (TEXT) - 360° tour URL
  
  - **Compliance & Legal Category:**
    - `fire_safety_compliant` (BOOLEAN) - Fire safety compliance
    - `legionella_assessed` (BOOLEAN) - Legionella assessment indicator
    - `legionella_assessment_date` (DATE) - Legionella assessment date
    - `hmo_license_required` (BOOLEAN) - HMO license requirement
    - `hmo_license_number` (TEXT) - HMO license number
    - `hmo_license_expiry` (DATE) - HMO license expiry date
  
  - **Management Details Category:**
    - `managed_by` (UUID) - Foreign key to users table
    - `management_type` (TEXT) - Management type with CHECK constraint (fully_managed, let_only, rent_collection)
    - `management_fee_percentage` (NUMERIC) - Management fee percentage
    - `keys_held` (BOOLEAN) - Keys held indicator
    - `keys_count` (INTEGER) - Number of keys held
    - `alarm_code` (TEXT) - Alarm code
    - `emergency_contact_name` (TEXT) - Emergency contact name
    - `emergency_contact_phone` (TEXT) - Emergency contact phone
  
  - **Website Display Settings Category:**
    - `show_on_website` (BOOLEAN) - Show on website indicator
    - `featured_property` (BOOLEAN) - Featured property indicator
    - `custom_slug` (TEXT) - Custom URL slug (unique)
    - `seo_title` (TEXT) - SEO title
    - `seo_meta_description` (TEXT) - SEO meta description
    - `seo_keywords` (JSONB) - Array of SEO keywords

- **property_rooms Table** - New table for detailed room information:
  - `id` (UUID) - Primary key
  - `property_id` (UUID) - Foreign key to properties table with CASCADE delete
  - `room_name` (TEXT) - Room name (required)
  - `room_type` (TEXT) - Room type with CHECK constraint (bedroom, bathroom, kitchen, living_room, dining_room, study, hallway, utility, other)
  - `length_meters` (DECIMAL) - Room length in meters
  - `width_meters` (DECIMAL) - Room width in meters
  - `length_feet` (DECIMAL) - Room length in feet
  - `width_feet` (DECIMAL) - Room width in feet
  - `features` (JSONB) - Array of room features
  - `floor_covering` (TEXT) - Floor covering with CHECK constraint (carpet, hardwood, tile, laminate, vinyl, other)
  - `description` (TEXT) - Room description
  - `created_at` (TIMESTAMPTZ) - Creation timestamp
  - `updated_at` (TIMESTAMPTZ) - Update timestamp
  - Indexes: `property_id`, `room_type`
  - Trigger: Auto-update `updated_at` timestamp

**TypeScript Types:**
- Updated `src/types/database.ts` with all new property fields
- Added `property_rooms` table types (Row, Insert, Update)
- Complete type safety for all new fields
- Proper nullable types for optional fields

**Property Form Enhancement:**
- **PropertyFormDialog** - Enhanced with 5 collapsible sections:
  - Basic Information (existing fields: address, postcode, type, bedrooms, bathrooms, status, EPC, landlord, description, utility note, inventory note)
  - Property Features (subtype, furnished status, floor number, total floors, lift access, garden, balcony, terrace, patio, parking, heating, hot water, double glazing, reception rooms, kitchen type, broadband, appliances, smart home)
  - Financial Details (monthly rent, deposit amount, council tax band, minimum term, available from)
  - Location & Area (nearest station, station distance)
  - Website Display Settings (show on website, featured property, SEO title, meta description)
- All 50+ new fields now editable in form UI
- Smooth expand/collapse interactions with chevron icons
- Responsive grid layouts
- Proper form validation
- Checkbox inputs for boolean fields
- Date picker for available_from field
- Number inputs with proper step values

**Property Detail Page Enhancement:**
- **PropertyDetailPage** - Enhanced with 8 new collapsible sections:
  - Property Features - Displays all property feature fields
  - Location & Area - Displays station, council tax, neighborhood, transport links
  - Financial Details - Displays rent, deposit, terms, availability
  - Descriptions & Key Features - Displays short/full descriptions and key features list
  - Media & Virtual Tours - Displays floor plans, virtual tours, video tours
  - Enhanced Compliance - Displays fire safety, legionella, HMO license details
  - Management Details - Displays management type, fees, keys, emergency contacts
  - Website Display Settings - Displays SEO settings, featured status, custom slug
- All enhanced fields displayed with proper formatting
- Empty state handling for missing data
- Currency formatting for rent and deposit
- Date formatting for availability dates
- List rendering for key features
- Link rendering for media URLs

**Property Rooms Component:**
- **PropertyRooms** - Full CRUD component for room management:
  - Add/Edit/Delete rooms with confirmation dialogs
  - Track dimensions in meters and feet
  - Track floor coverings (carpet, hardwood, tile, laminate, vinyl, other)
  - Add custom room features with add/remove functionality
  - Room descriptions
  - Visual room type badges
  - Expandable room cards with smooth animations
  - Room summary dashboard showing count by type
  - Integrated into PropertyDetailPage
  - Proper error handling with toast notifications
  - Audit logging for all room operations

#### Agreement Editor Enhancements

- **TipTap Integration** - WYSIWYG rich text editor with visual formatting
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

### Fixed

- **PropertyRooms Component** - Fixed useEffect initialization bug causing empty page render
  - Changed useState to useEffect for form initialization
  - Added useEffect to imports
  - Added dependency array [existing] to properly react to editId changes

- **Agreement Template Editor** - Fixed click-to-insert functionality for merge fields
  - Added EditorContent component to mount ProseMirror view
  - Fixed duplicate editor instances issue
  - Refactored to use forwardRef/useImperativeHandle for parent-child communication

- **TypeScript Type Safety** - Various improvements across codebase
  - Fixed null/undefined handling
  - Improved type guards
  - Added proper type assertions

### Changed

- Property form now includes all enhanced fields in state management
- Property detail page displays all enhanced information with collapsible sections
- Agreement editor uses TipTap instead of basic textarea
- Database schema extended with 50+ new property fields
- TypeScript types updated for all new fields
- UI components enhanced with collapsible sections pattern

### Technical Details

**Migration Strategy:**
- Used `ADD COLUMN IF NOT EXISTS` for safe migration execution
- Added CHECK constraints for enum-like fields
- Used JSONB for array storage (appliances, features, keywords)
- Created indexes for frequently queried columns
- Added foreign key constraints with CASCADE delete

**UI Pattern:**
- Implemented collapsible sections pattern for better UX
- Used chevron icons for expand/collapse indicators
- Maintained state for expanded sections
- Applied smooth transitions (200ms ease-in-out)
- Responsive grid layouts for mobile support

**Data Flow:**
- Form state management with React useState
- Database operations with Supabase client
- Type safety with TypeScript interfaces
- Error handling with try-catch and toast notifications
- Audit logging for all CRUD operations

---

## [0.1.0] - 2025-01-01

### Added

- Initial project setup with React 19 + TypeScript
- Vite 8 build system with HMR
- Tailwind CSS v4 styling
- Supabase integration (Auth + Database + Storage)
- Property management with basic CRUD
- Tenancy management lifecycle
- Agreement generation with merge fields
- Financial management (rent, expenses, statements)
- Compliance tracking
- Inventory management
- Document management
- Audit logging
- PWA support with offline caching

---

For more information on recent changes, see:
- [SYSTEM_SPEC.md](SYSTEM_SPEC.md) - Complete system specification
- [docs/ARCHITECTURE_AND_WORKFLOWS.md](docs/ARCHITECTURE_AND_WORKFLOWS.md) - Architecture and workflows
- [docs/DATABASE_REFERENCE.md](docs/DATABASE_REFERENCE.md) - Database schema reference
