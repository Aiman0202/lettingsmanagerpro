# LettingsPro — Database Reference

> Complete database schema reference with table definitions, column types, constraints, and relationships.  
> Based on `supabase/migrations/001_initial_schema.sql` and `supabase/migrations/026_property_enhancements.sql`

---

## Table of Contents

1. [Core Tables](#core-tables)
2. [Company Settings](#company-settings)
3. [Landlords](#landlords)
4. [Tenants](#tenants)
5. [Properties](#properties)
   - 5.1 [Property Enhancement Columns (Migration 026)](#51-property-enhancement-columns-migration-026)
   - 5.2 [property_rooms](#52-property_rooms)
6. [Documents](#documents)
7. [Tenancies](#tenancies)
8. [Maintenance](#maintenance)
9. [Finance](#finance)
10. [Agreements](#agreements)
11. [System](#system)
12. [Functions](#functions)
13. [Entity Relationship Summary](#entity-relationship-summary)

---

## Core Tables

### `roles`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `name` | TEXT | NOT NULL, UNIQUE | — |
| `description` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |

**Seeded values:** `admin`, `manager`, `negotiator`, `accounts`

### `permissions`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `role_id` | UUID | FK → roles(id), CASCADE | — |
| `resource` | TEXT | NOT NULL, UNIQUE(role_id, resource) | — |
| `can_read` | BOOLEAN | — | TRUE |
| `can_write` | BOOLEAN | — | FALSE |
| `can_delete` | BOOLEAN | — | FALSE |

### `users`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK, FK → auth.users(id), CASCADE | — |
| `full_name` | TEXT | NOT NULL | — |
| `role` | TEXT | NOT NULL | `'negotiator'` |
| `role_id` | UUID | FK → roles(id), SET NULL | — |
| `is_active` | BOOLEAN | — | TRUE |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `updated_at` | TIMESTAMPTZ | — | `now()` |

---

## Company Settings

### `company_settings`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `company_name` | TEXT | NOT NULL | — |
| `logo_storage_path` | TEXT | — | — |
| `address` | TEXT | — | — |
| `email` | TEXT | — | — |
| `phone` | TEXT | — | — |
| `bank_details` | TEXT | — | — |
| `vat_number` | TEXT | — | — |
| `default_fee_percentage` | NUMERIC(5,2) | — | 10.00 |
| `company_registration_number` | TEXT | — | — |
| `website` | TEXT | — | — |
| `address_line1` | TEXT | — | — |
| `address_line2` | TEXT | — | — |
| `city` | TEXT | — | — |
| `postcode` | TEXT | — | — |
| `company_description` | TEXT | — | — |
| `updated_at` | TIMESTAMPTZ | — | `now()` |

---

## Landlords

### `landlords`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `full_name` | TEXT | NOT NULL | — |
| `email` | TEXT | NOT NULL | — |
| `phone` | TEXT | — | — |
| `company_name` | TEXT | — | — |
| `address` | TEXT | — | — |
| `bank_details` | TEXT | — | — |
| `bank_account_name` | TEXT | — | — |
| `bank_account_number` | TEXT | — | — |
| `bank_sort_code` | TEXT | — | — |
| `bank_name` | TEXT | — | — |
| `address_line1` | TEXT | — | — |
| `address_line2` | TEXT | — | — |
| `city` | TEXT | — | — |
| `postcode` | TEXT | — | — |
| `is_active` | BOOLEAN | — | TRUE |
| `deactivated_at` | TIMESTAMPTZ | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `updated_at` | TIMESTAMPTZ | — | `now()` |

### `landlord_id_documents`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `landlord_id` | UUID | FK → landlords(id), CASCADE | — |
| `document_type` | TEXT | NOT NULL, CHECK IN (...) | — |
| `document_number` | TEXT | — | — |
| `issuing_country` | TEXT | — | — |
| `issue_date` | DATE | — | — |
| `expiry_date` | DATE | — | — |
| `file_path` | TEXT | — | — |
| `notes` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `created_by` | UUID | FK → auth.users(id) | — |

**document_type enum:** `passport`, `driving_license`, `national_id`, `biometric_residence_permit`, `other`

---

## Tenants

### `tenants`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `full_name` | TEXT | NOT NULL | — |
| `email` | TEXT | NOT NULL | — |
| `phone` | TEXT | — | — |
| `dob` | DATE | — | — |
| `ni_number` | TEXT | — | — |
| `emergency_contact` | TEXT | — | — |
| `is_active` | BOOLEAN | — | TRUE |
| `deactivated_at` | TIMESTAMPTZ | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `updated_at` | TIMESTAMPTZ | — | `now()` |

### `tenant_references`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `tenant_id` | UUID | FK → tenants(id), CASCADE | — |
| `type` | TEXT | NOT NULL, CHECK IN (...) | — |
| `status` | TEXT | NOT NULL, CHECK IN (...) | `'pending'` |
| `notes` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `updated_at` | TIMESTAMPTZ | — | `now()` |

**type enum:** `employer`, `previous_landlord`, `credit`  
**status enum:** `pending`, `passed`, `failed`, `in_progress`

### `tenant_id_documents`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `tenant_id` | UUID | FK → tenants(id), CASCADE | — |
| `document_type` | TEXT | NOT NULL, CHECK IN (...) | — |
| `document_number` | TEXT | — | — |
| `issuing_country` | TEXT | — | — |
| `issue_date` | DATE | — | — |
| `expiry_date` | DATE | — | — |
| `file_path` | TEXT | — | — |
| `file_url` | TEXT | — | — |
| `notes` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `created_by` | UUID | FK → auth.users(id) | — |

**document_type enum:** `passport`, `driving_license`, `right_to_rent`, `biometric_residence_permit`, `national_id`, `other`

### `tenant_family_members`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `tenant_id` | UUID | FK → tenants(id), CASCADE | — |
| `full_name` | TEXT | NOT NULL | — |
| `relationship` | TEXT | NOT NULL, CHECK IN (...) | — |
| `date_of_birth` | DATE | — | — |
| `phone` | TEXT | — | — |
| `notes` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |

**relationship enum:** `spouse`, `partner`, `child`, `parent`, `sibling`, `other`

---

## Properties

### `properties`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `reference_number` | TEXT | NOT NULL, UNIQUE | — |
| `address` | TEXT | NOT NULL | — |
| `postcode` | TEXT | NOT NULL | — |
| `type` | TEXT | NOT NULL | `'flat'` |
| `bedrooms` | INTEGER | — | — |
| `bathrooms` | INTEGER | — | — |
| `status` | TEXT | NOT NULL, CHECK IN (...) | `'available'` |
| `landlord_id` | UUID | FK → landlords(id), SET NULL | — |
| `description` | TEXT | — | — |
| `epc_rating` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `updated_at` | TIMESTAMPTZ | — | `now()` |

**status enum:** `available`, `let`, `unavailable`, `inactive`

### 5.1 Property Enhancement Columns (Migration 026)

The following columns were added to the `properties` table via `026_property_enhancements.sql`:

#### Property Features

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `property_subtype` | TEXT | — | — | Property subtype (e.g., Maisonette, Terraced) |
| `furnished_status` | TEXT | CHECK IN ('furnished', 'part_furnished', 'unfurnished') | — | Furnishing status |
| `floor_number` | INTEGER | — | — | Floor number within building |
| `total_floors` | INTEGER | — | — | Total number of floors in building |
| `lift_access` | BOOLEAN | — | FALSE | Whether lift is available |
| `has_garden` | BOOLEAN | — | FALSE | Whether property has a garden |
| `garden_type` | TEXT | CHECK IN ('front', 'back', 'communal', 'none') | — | Garden type |
| `has_balcony` | BOOLEAN | — | FALSE | Whether property has a balcony |
| `has_terrace` | BOOLEAN | — | FALSE | Whether property has a terrace |
| `has_patio` | BOOLEAN | — | FALSE | Whether property has a patio |
| `has_parking` | BOOLEAN | — | FALSE | Whether property has parking |
| `parking_type` | TEXT | CHECK IN ('garage', 'driveway', 'street', 'allocated', 'none') | — | Parking type |
| `parking_spaces` | INTEGER | — | 0 | Number of parking spaces |
| `heating_type` | TEXT | CHECK IN ('gas_central', 'electric', 'underfloor', 'oil', 'none') | — | Heating type |
| `hot_water_type` | TEXT | CHECK IN ('gas', 'electric', 'oil', 'none') | — | Hot water type |
| `has_double_glazing` | BOOLEAN | — | FALSE | Whether property has double glazing |
| `reception_rooms` | INTEGER | — | 1 | Number of reception rooms |
| `kitchen_type` | TEXT | CHECK IN ('separate', 'open_plan', 'kitchenette', 'none') | — | Kitchen type |
| `appliances_included` | JSONB | — | — | Array of appliances included |
| `broadband_type` | TEXT | CHECK IN ('fibre', 'superfast', 'ultrafast', 'none') | — | Broadband type |
| `has_smart_home` | BOOLEAN | — | FALSE | Whether smart home features present |
| `smart_home_features` | TEXT | — | — | Description of smart home features |

#### Location & Area

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `nearest_station` | TEXT | — | — | Nearest train/tube station name |
| `station_distance_minutes` | TEXT | — | — | Walking distance to station |
| `nearby_schools` | JSONB | — | — | Array of nearby schools |
| `nearby_amenities` | JSONB | — | — | Array of nearby amenities |
| `neighborhood_description` | TEXT | — | — | Description of neighborhood |
| `local_highlights` | TEXT | — | — | Local highlights |
| `transport_links` | TEXT | — | — | Transport links description |

#### Financial Details

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `monthly_rent` | NUMERIC(10,2) | — | — | Monthly rent amount |
| `deposit_amount` | NUMERIC(10,2) | — | — | Deposit amount |
| `council_tax_band` | TEXT | — | — | Council tax band (A-H) |
| `rent_includes` | JSONB | — | — | Array of items included in rent |
| `minimum_term_months` | INTEGER | — | 12 | Minimum tenancy term in months |
| `available_from` | DATE | — | — | Property availability date |

#### Descriptions

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `short_description` | TEXT | — | — | Short property description |
| `full_description` | TEXT | — | — | Full property description |
| `key_features` | JSONB | — | — | Array of key features |

#### Media & Documents

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `floor_plan_url` | TEXT | — | — | Floor plan URL |
| `virtual_tour_url` | TEXT | — | — | Virtual tour URL |
| `video_tour_url` | TEXT | — | — | Video tour URL |
| `tour_360_url` | TEXT | — | — | 360° virtual tour URL |

#### Compliance & Legal

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `fire_safety_compliant` | BOOLEAN | — | FALSE | Fire safety compliance flag |
| `legionella_assessed` | BOOLEAN | — | FALSE | Legionella assessment flag |
| `legionella_assessment_date` | DATE | — | — | Date of legionella assessment |
| `hmo_license_required` | BOOLEAN | — | FALSE | Whether HMO license is required |
| `hmo_license_number` | TEXT | — | — | HMO license number |
| `hmo_license_expiry` | DATE | — | — | HMO license expiry date |

#### Management Details

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `managed_by` | UUID | FK → users(id) | — | User managing the property |
| `management_type` | TEXT | CHECK IN ('fully_managed', 'let_only', 'rent_collection') | — | Management type |
| `management_fee_percentage` | NUMERIC(5,2) | — | — | Management fee percentage |
| `keys_held` | BOOLEAN | — | FALSE | Whether keys are held |
| `keys_count` | INTEGER | — | 0 | Number of keys held |
| `alarm_code` | TEXT | — | — | Alarm code |
| `emergency_contact_name` | TEXT | — | — | Emergency contact name |
| `emergency_contact_phone` | TEXT | — | — | Emergency contact phone |

#### Website Display Settings

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `show_on_website` | BOOLEAN | — | TRUE | Whether to show on website |
| `featured_property` | BOOLEAN | — | FALSE | Whether property is featured |
| `custom_slug` | TEXT | UNIQUE | — | Custom URL slug |
| `seo_title` | TEXT | — | — | SEO title |
| `seo_meta_description` | TEXT | — | — | SEO meta description |
| `seo_keywords` | JSONB | — | — | Array of SEO keywords |

### 5.2 property_rooms

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `property_id` | UUID | FK → properties(id), CASCADE | — |
| `room_name` | TEXT | NOT NULL | — |
| `room_type` | TEXT | NOT NULL, CHECK IN ('bedroom','bathroom','kitchen','living_room','dining_room','study','hallway','utility','other') | — |
| `length_meters` | DECIMAL | — | — |
| `width_meters` | DECIMAL | — | — |
| `length_feet` | DECIMAL | — | — |
| `width_feet` | DECIMAL | — | — |
| `features` | JSONB | — | — |
| `floor_covering` | TEXT | CHECK IN ('carpet','hardwood','tile','laminate','vinyl','other') | — |
| `description` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `updated_at` | TIMESTAMPTZ | — | `now()` |

**Indexes:** `property_id`, `room_type`

### `property_photos`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `property_id` | UUID | FK → properties(id), CASCADE | — |
| `storage_path` | TEXT | NOT NULL | — |
| `is_primary` | BOOLEAN | — | FALSE |
| `created_at` | TIMESTAMPTZ | — | `now()` |

### `property_compliance`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `property_id` | UUID | FK → properties(id), CASCADE | — |
| `type` | TEXT | NOT NULL, CHECK IN (...) | — |
| `expiry_date` | DATE | NOT NULL | — |
| `document_id` | UUID | FK → documents(id), SET NULL | — |
| `notes` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |

**type enum:** `gas_safe`, `eicr`, `epc`, `pat`, `fire_risk`, `legionella`, `other`

### `property_home_safe_licences`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `property_id` | UUID | FK → properties(id), CASCADE | — |
| `status` | TEXT | NOT NULL, CHECK IN (...) | `'certificates_pending'` |
| `has_gas_safe` | BOOLEAN | — | FALSE |
| `has_eicr` | BOOLEAN | — | FALSE |
| `has_epc` | BOOLEAN | — | FALSE |
| `has_fire_risk_assessment` | BOOLEAN | — | FALSE |
| `has_legionella_risk` | BOOLEAN | — | FALSE |
| `has_smoke_co_alarms` | BOOLEAN | — | FALSE |
| `application_date` | DATE | — | — |
| `application_reference` | TEXT | — | — |
| `licence_number` | TEXT | — | — |
| `licence_issue_date` | DATE | — | — |
| `licence_expiry_date` | DATE | — | — |
| `rejection_reason` | TEXT | — | — |
| `document_id` | UUID | FK → documents(id), SET NULL | — |
| `notes` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `updated_at` | TIMESTAMPTZ | — | `now()` |
| `created_by` | UUID | FK → auth.users(id) | — |

**status enum:** `certificates_pending`, `applied`, `under_review`, `granted`, `rejected`, `expired`

### `property_tickets`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `property_id` | UUID | FK → properties(id), CASCADE | — |
| `type` | TEXT | NOT NULL, CHECK IN (...) | — |
| `subtype` | TEXT | — | — |
| `title` | TEXT | NOT NULL | — |
| `description` | TEXT | — | — |
| `priority` | TEXT | NOT NULL, CHECK IN (...) | `'medium'` |
| `status` | TEXT | NOT NULL, CHECK IN (...) | `'open'` |
| `due_date` | DATE | — | — |
| `assigned_to` | UUID | FK → users(id) | — |
| `created_by` | UUID | FK → auth.users(id) | — |
| `resolved_at` | TIMESTAMPTZ | — | — |
| `resolution_notes` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `updated_at` | TIMESTAMPTZ | — | `now()` |

**type enum:** `enquiry`, `notice`, `issue`, `action_item`  
**priority enum:** `low`, `medium`, `high`, `urgent`  
**status enum:** `open`, `in_progress`, `resolved`, `closed`

---

## Documents

### `documents`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `entity_type` | TEXT | NOT NULL, CHECK IN (...) | — |
| `entity_id` | UUID | — | — |
| `name` | TEXT | NOT NULL | — |
| `storage_path` | TEXT | NOT NULL | — |
| `category` | TEXT | NOT NULL | `'Other'` |
| `uploaded_by` | UUID | FK → users(id), SET NULL | — |
| `uploaded_at` | TIMESTAMPTZ | — | `now()` |
| `size_bytes` | BIGINT | — | — |

**entity_type enum:** `property`, `tenant`, `landlord`, `tenancy`, `general`

---

## Tenancies

### `tenancies`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `reference_number` | TEXT | NOT NULL, UNIQUE | — |
| `property_id` | UUID | FK → properties(id), SET NULL | — |
| `landlord_id` | UUID | FK → landlords(id), SET NULL | — |
| `start_date` | DATE | NOT NULL | — |
| `end_date` | DATE | NOT NULL | — |
| `rent_amount` | NUMERIC(10,2) | NOT NULL | — |
| `deposit_amount` | NUMERIC(10,2) | — | 0 |
| `deposit_scheme` | TEXT | — | — |
| `status` | TEXT | NOT NULL, CHECK IN (...) | `'draft'` |
| `agreement_template_id` | UUID | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `updated_at` | TIMESTAMPTZ | — | `now()` |

**status enum:** `draft`, `active`, `ending_soon`, `expired`, `ended`, `terminated`

**Unique index:** `uq_property_active_tenancy` on `property_id WHERE status IN ('active', 'ending_soon')` — enforces single active tenancy per property.

### `tenancy_tenants`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `tenancy_id` | UUID | FK → tenancies(id), CASCADE, PK | — |
| `tenant_id` | UUID | FK → tenants(id), CASCADE, PK | — |
| `is_lead` | BOOLEAN | — | FALSE |

### `tenancy_renewals`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `tenancy_id` | UUID | FK → tenancies(id), CASCADE | — |
| `old_end_date` | DATE | NOT NULL | — |
| `new_end_date` | DATE | NOT NULL | — |
| `new_rent` | NUMERIC(10,2) | NOT NULL | — |
| `notes` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |

### `tenancy_inspections`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `tenancy_id` | UUID | FK → tenancies(id), CASCADE | — |
| `type` | TEXT | NOT NULL, CHECK IN (...) | — |
| `inspection_date` | DATE | NOT NULL | — |
| `inspector_name` | TEXT | NOT NULL | — |
| `weather_conditions` | TEXT | — | — |
| `overall_condition` | TEXT | CHECK IN (...) | — |
| `general_notes` | TEXT | — | — |
| `tenant_present` | BOOLEAN | — | FALSE |
| `tenant_signature_path` | TEXT | — | — |
| `inspector_signature_path` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `updated_at` | TIMESTAMPTZ | — | `now()` |

**type enum:** `move_in`, `move_out`, `mid_tenancy`  
**overall_condition enum:** `excellent`, `good`, `fair`, `poor`

### `inspection_rooms`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `inspection_id` | UUID | FK → tenancy_inspections(id), CASCADE | — |
| `room_name` | TEXT | NOT NULL | — |
| `room_order` | INTEGER | — | 0 |
| `cleanliness` | TEXT | CHECK IN (...) | — |
| `decoration` | TEXT | CHECK IN (...) | — |
| `condition_notes` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |

### `inspection_room_items`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `room_id` | UUID | FK → inspection_rooms(id), CASCADE | — |
| `item_name` | TEXT | NOT NULL | — |
| `condition` | TEXT | CHECK IN (...) | — |
| `condition_notes` | TEXT | — | — |
| `move_in_condition` | TEXT | — | — |
| `move_out_condition` | TEXT | — | — |
| `requires_action` | BOOLEAN | — | FALSE |
| `action_notes` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |

### `inspection_photos`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `inspection_id` | UUID | FK → tenancy_inspections(id), CASCADE | — |
| `room_id` | UUID | FK → inspection_rooms(id), SET NULL | — |
| `item_id` | UUID | FK → inspection_room_items(id), SET NULL | — |
| `storage_path` | TEXT | NOT NULL | — |
| `caption` | TEXT | — | — |
| `photo_order` | INTEGER | — | 0 |
| `created_at` | TIMESTAMPTZ | — | `now()` |

### `tenancy_terminations`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `tenancy_id` | UUID | FK → tenancies(id), CASCADE | — |
| `initiated_by` | TEXT | NOT NULL, CHECK IN (...) | — |
| `reason` | TEXT | NOT NULL | — |
| `reason_category` | TEXT | NOT NULL, CHECK IN (...) | — |
| `notice_date` | DATE | NOT NULL | — |
| `notice_period_days` | INTEGER | NOT NULL | 30 |
| `effective_date` | DATE | NOT NULL | — |
| `penalty_amount` | NUMERIC(10,2) | — | 0 |
| `penalty_reason` | TEXT | — | — |
| `deposit_deduction` | NUMERIC(10,2) | — | 0 |
| `deposit_deduction_reason` | TEXT | — | — |
| `final_rent_paid` | BOOLEAN | — | FALSE |
| `final_rent_amount` | NUMERIC(10,2) | — | 0 |
| `keys_returned` | BOOLEAN | — | FALSE |
| `keys_returned_date` | DATE | — | — |
| `property_vacant` | BOOLEAN | — | FALSE |
| `property_vacant_date` | DATE | — | — |
| `move_out_inspection_completed` | BOOLEAN | — | FALSE |
| `termination_letter_sent` | BOOLEAN | — | FALSE |
| `notes` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `updated_at` | TIMESTAMPTZ | — | `now()` |

**initiated_by enum:** `tenant`, `landlord`, `mutual`  
**reason_category enum:** `job_relocation`, `financial`, `property_issue`, `landlord_request`, `mutual_agreement`, `breach_of_contract`, `other`

### `tenancy_checklists`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `tenancy_id` | UUID | FK → tenancies(id), CASCADE | — |
| `type` | TEXT | NOT NULL, CHECK IN (...) | — |
| `keys_handed_over` | BOOLEAN | — | FALSE |
| `keys_count` | INTEGER | — | 0 |
| `keys_description` | TEXT | — | — |
| `meter_electric_reading` | TEXT | — | — |
| `meter_gas_reading` | TEXT | — | — |
| `meter_water_reading` | TEXT | — | — |
| `alarm_code` | TEXT | — | — |
| `parking_permits_handed` | BOOLEAN | — | FALSE |
| `appliances_tested` | BOOLEAN | — | FALSE |
| `cleaning_completed` | BOOLEAN | — | FALSE |
| `garden_condition` | TEXT | — | — |
| `notes` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |

**type enum:** `move_in`, `move_out`

### `tenancy_status_log`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `tenancy_id` | UUID | FK → tenancies(id), CASCADE | — |
| `from_status` | TEXT | — | — |
| `to_status` | TEXT | NOT NULL | — |
| `changed_by` | UUID | FK → auth.users(id) | — |
| `reason` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |

### `tenancy_amendments`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `tenancy_id` | UUID | FK → tenancies(id), CASCADE | — |
| `amendment_type` | TEXT | NOT NULL, CHECK IN (...) | — |
| `old_value` | TEXT | — | — |
| `new_value` | TEXT | NOT NULL | — |
| `effective_date` | DATE | NOT NULL | — |
| `reason` | TEXT | — | — |
| `created_by` | UUID | FK → auth.users(id) | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |

**amendment_type enum:** `rent_change`, `tenant_add`, `tenant_remove`, `other`

### `arrears_actions`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `tenancy_id` | UUID | FK → tenancies(id), CASCADE | — |
| `action_type` | TEXT | NOT NULL, CHECK IN (...) | — |
| `action_date` | DATE | NOT NULL | `CURRENT_DATE` |
| `notes` | TEXT | — | — |
| `follow_up_date` | DATE | — | — |
| `created_by` | UUID | FK → users(id), SET NULL | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |

**action_type enum:** `phone_call`, `email`, `letter`, `sms`, `visit`, `section_8_notice`, `section_21_notice`, `payment_plan_agreed`, `payment_received`, `other`

---

## Maintenance

### `maintenance_requests`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `property_id` | UUID | FK → properties(id), SET NULL | — |
| `tenancy_id` | UUID | FK → tenancies(id), SET NULL | — |
| `title` | TEXT | NOT NULL | — |
| `description` | TEXT | — | — |
| `priority` | TEXT | NOT NULL, CHECK IN (...) | `'medium'` |
| `status` | TEXT | NOT NULL, CHECK IN (...) | `'open'` |
| `reported_by` | UUID | FK → users(id), SET NULL | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `updated_at` | TIMESTAMPTZ | — | `now()` |

**priority enum:** `low`, `medium`, `high`, `urgent`  
**status enum:** `open`, `in_progress`, `resolved`, `closed`

### `contractors`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `name` | TEXT | NOT NULL | — |
| `trade` | TEXT | NOT NULL | — |
| `email` | TEXT | — | — |
| `phone` | TEXT | — | — |
| `insurance_expiry` | DATE | — | — |
| `is_active` | BOOLEAN | — | TRUE |
| `created_at` | TIMESTAMPTZ | — | `now()` |

### `maintenance_jobs`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `request_id` | UUID | FK → maintenance_requests(id), CASCADE | — |
| `contractor_id` | UUID | FK → contractors(id), SET NULL | — |
| `scheduled_date` | DATE | — | — |
| `completed_date` | DATE | — | — |
| `cost` | NUMERIC(10,2) | — | — |
| `notes` | TEXT | — | — |
| `status` | TEXT | — | `'scheduled'` |
| `created_at` | TIMESTAMPTZ | — | `now()` |

---

## Finance

### `rent_transactions`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `tenancy_id` | UUID | FK → tenancies(id), CASCADE | — |
| `amount` | NUMERIC(10,2) | NOT NULL | — |
| `due_date` | DATE | NOT NULL | — |
| `paid_date` | DATE | — | — |
| `payment_method` | TEXT | — | — |
| `status` | TEXT | NOT NULL, CHECK IN (...) | `'pending'` |
| `notes` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |

**status enum:** `pending`, `paid`, `overdue`, `partial`

### `landlord_statements`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `landlord_id` | UUID | FK → landlords(id), CASCADE | — |
| `period_start` | DATE | NOT NULL | — |
| `period_end` | DATE | NOT NULL | — |
| `total_rent` | NUMERIC(10,2) | NOT NULL | — |
| `fees_deducted` | NUMERIC(10,2) | NOT NULL | 0 |
| `net_payout` | NUMERIC(10,2) | NOT NULL | — |
| `paid_at` | TIMESTAMPTZ | — | — |
| `pdf_path` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |

### `expenses`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `property_id` | UUID | FK → properties(id), SET NULL | — |
| `category` | TEXT | NOT NULL | — |
| `amount` | NUMERIC(10,2) | NOT NULL | — |
| `date` | DATE | NOT NULL | — |
| `description` | TEXT | — | — |
| `receipt_document_id` | UUID | — | — |
| `created_by` | UUID | FK → users(id), SET NULL | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |

### `agency_fees`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `tenancy_id` | UUID | FK → tenancies(id), CASCADE | — |
| `fee_type` | TEXT | NOT NULL | — |
| `amount` | NUMERIC(10,2) | NOT NULL | — |
| `charged_at` | TIMESTAMPTZ | — | `now()` |
| `description` | TEXT | — | — |

---

## Agreements

### `agreement_templates`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `name` | TEXT | NOT NULL | — |
| `content_json` | JSONB | NOT NULL | `'{}'` |
| `merge_fields_schema` | JSONB | — | — |
| `is_default` | BOOLEAN | — | FALSE |
| `created_by` | UUID | FK → users(id), SET NULL | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `updated_at` | TIMESTAMPTZ | — | `now()` |

### `agreement_clauses`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `category` | TEXT | NOT NULL, CHECK IN (...) | — |
| `title` | TEXT | NOT NULL | — |
| `content_html` | TEXT | NOT NULL | — |
| `sort_order` | INTEGER | — | 0 |
| `is_builtin` | BOOLEAN | — | FALSE |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `updated_at` | TIMESTAMPTZ | — | `now()` |

**category enum:** `terms_conditions`, `tenancy_requirements`, `deposit_financial`, `special_clauses`

### `template_sections`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `template_id` | UUID | FK → agreement_templates(id), CASCADE | — |
| `section_type` | TEXT | NOT NULL, CHECK IN (...) | — |
| `title` | TEXT | NOT NULL | — |
| `sort_order` | INTEGER | NOT NULL | 0 |
| `is_required` | BOOLEAN | — | FALSE |
| `condition_expression` | JSONB | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `updated_at` | TIMESTAMPTZ | — | `now()` |

**section_type enum:** `header`, `parties`, `property_details`, `financial_terms`, `tenant_obligations`, `landlord_obligations`, `requirements`, `special_clauses`, `signatures`, `footer`

### `template_section_clauses`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `section_id` | UUID | FK → template_sections(id), CASCADE | — |
| `clause_id` | UUID | FK → agreement_clauses(id), CASCADE | — |
| `is_required` | BOOLEAN | — | FALSE |
| `sort_order` | INTEGER | NOT NULL | 0 |
| `condition_expression` | JSONB | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |

**Unique constraint:** (section_id, clause_id)

### `template_versions`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `template_id` | UUID | FK → agreement_templates(id), CASCADE | — |
| `version_number` | INTEGER | NOT NULL, UNIQUE(template_id, version_number) | — |
| `change_summary` | TEXT | — | — |
| `content_snapshot` | JSONB | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `created_by` | UUID | FK → auth.users(id) | — |

### `generated_agreements`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `tenancy_id` | UUID | FK → tenancies(id), CASCADE | — |
| `template_id` | UUID | FK → agreement_templates(id), SET NULL | — |
| `merged_content_json` | JSONB | NOT NULL | `'{}'` |
| `merged_html` | TEXT | — | — |
| `pdf_storage_path` | TEXT | — | — |
| `status` | TEXT | NOT NULL, CHECK IN (...) | `'draft'` |
| `signed_at` | TIMESTAMPTZ | — | — |
| `council_submitted_at` | TIMESTAMPTZ | — | — |
| `council_submission_status` | TEXT | CHECK IN (...) | `'not_submitted'` |
| `council_reference` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `updated_at` | TIMESTAMPTZ | — | `now()` |

**status enum:** `draft`, `pending_signatures`, `signed`  
**council_submission_status enum:** `not_submitted`, `ready_to_submit`, `submitted`, `accepted`, `rejected`

### `agreement_signatures`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `agreement_id` | UUID | FK → generated_agreements(id), CASCADE | — |
| `signatory_type` | TEXT | NOT NULL, CHECK IN (...) | — |
| `signatory_id` | UUID | — | — |
| `signatory_name` | TEXT | NOT NULL | — |
| `signature_image_base64` | TEXT | NOT NULL | — |
| `capture_method` | TEXT | NOT NULL, CHECK IN (...) | — |
| `ip_address` | TEXT | — | — |
| `signed_by_user_id` | UUID | FK → users(id), SET NULL | — |
| `signed_at` | TIMESTAMPTZ | — | `now()` |

**signatory_type enum:** `tenant`, `agent`  
**capture_method enum:** `topaz`, `touch`

### `agreement_attachments`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `agreement_id` | UUID | FK → generated_agreements(id), CASCADE | — |
| `attachment_type` | TEXT | NOT NULL, CHECK IN (...) | — |
| `source_table` | TEXT | NOT NULL, CHECK IN (...) | — |
| `source_id` | UUID | NOT NULL | — |
| `document_id` | UUID | FK → documents(id), SET NULL | — |
| `display_name` | TEXT | NOT NULL | — |
| `storage_path` | TEXT | — | — |
| `included_in_council_pack` | BOOLEAN | — | TRUE |
| `created_at` | TIMESTAMPTZ | — | `now()` |

**attachment_type enum:** `compliance_certificate`, `tenant_id_document`, `tenant_reference`, `other`  
**source_table enum:** `property_compliance`, `tenant_id_documents`, `tenant_references`, `documents`

### `agreement_defaults`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `key` | TEXT | NOT NULL, UNIQUE | — |
| `name` | TEXT | NOT NULL | — |
| `body_html` | TEXT | NOT NULL | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |
| `updated_at` | TIMESTAMPTZ | — | `now()` |

---

## System

### `audit_log`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `user_id` | UUID | FK → users(id), SET NULL | — |
| `action` | TEXT | NOT NULL | — |
| `resource` | TEXT | NOT NULL | — |
| `resource_id` | UUID | — | — |
| `details` | JSONB | — | — |
| `ip_address` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |

### `notifications`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `user_id` | UUID | FK → users(id), CASCADE | — |
| `title` | TEXT | NOT NULL | — |
| `body` | TEXT | NOT NULL | — |
| `type` | TEXT | NOT NULL | — |
| `is_read` | BOOLEAN | — | FALSE |
| `link` | TEXT | — | — |
| `created_at` | TIMESTAMPTZ | — | `now()` |

---

## Functions

### `generate_next_reference(prefix TEXT, tbl TEXT) → TEXT`

Generates the next sequential reference number for a given table.

- Extracts the maximum numeric suffix from existing `reference_number` values matching the prefix
- Increments by 1 and zero-pads to 4 digits
- Returns format: `{prefix}-{NNNN}` (e.g., `PRP-0001`, `TNC-0015`)

```sql
CREATE OR REPLACE FUNCTION generate_next_reference(prefix TEXT, tbl TEXT)
RETURNS TEXT AS $$
DECLARE
  max_num INTEGER;
  next_ref TEXT;
BEGIN
  EXECUTE format(
    'SELECT COALESCE(MAX(NULLIF(regexp_replace(reference_number, ''^%s-'', ''''), '''')::INTEGER), 0) FROM %I',
    prefix, tbl
  ) INTO max_num;
  next_ref := prefix || '-' || LPAD((max_num + 1)::TEXT, 4, '0');
  RETURN next_ref;
END;
$$ LANGUAGE plpgsql;
```

---

## Entity Relationship Summary

```
roles 1──N permissions
roles 1──N users

landlords 1──N landlords.id_documents
landlords 1──N properties
landlords 1──N landlord_statements

tenants 1──N tenant_id_documents
tenants 1──N tenant_references
tenants 1──N tenant_family_members
tenants N──M tenancies (via tenancy_tenants)

properties 1──N property_photos
properties 1──N property_compliance
properties 1──N property_home_safe_licences
properties 1──N property_tickets
properties 1──N property_rooms
properties 1──N maintenance_requests
properties 1──N expenses

tenancies 1──1 generated_agreements
tenancies 1──N tenancy_renewals
tenancies 1──N tenancy_inspections 1──N inspection_rooms 1──N inspection_room_items
tenancies 1──N tenancy_terminations
tenancies 1──N tenancy_checklists
tenancies 1──N tenancy_status_log
tenancies 1──N tenancy_amendments
tenancies 1──N arrears_actions
tenancies 1──N rent_transactions
tenancies 1──N agency_fees

generated_agreements 1──N agreement_signatures
generated_agreements 1──N agreement_attachments

agreement_templates 1──N template_sections 1──N template_section_clauses
agreement_templates 1──N template_versions
agreement_templates 1──N generated_agreements
```

**Total tables:** 48  
**Total indexes:** 45+  
**RLS enabled:** All tables  
**Storage buckets:** 7

---

## Migration History

| # | File | Contents |
|---|------|----------|
| 001 | `001_initial_schema.sql` | Core schema: all tables, indexes, RLS policies, storage buckets, seed roles |
| 002 | `002_seed_data.sql` | Default permission assignments, agreement clause library seeding |
| 003–025 | Various | Incremental migrations: tenant documents, property photos, home safe licensing, tenancy lifecycle, agreement clauses, structured templates, property tickets, etc. |
| 026 | `026_property_enhancements.sql` | Property enhancement: 50+ new columns on `properties` table, new `property_rooms` table, CHECK constraints, indexes |
