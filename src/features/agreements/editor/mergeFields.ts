export type MergeFieldCategory =
  | 'Tenancy' | 'Property' | 'Landlord' | 'Tenant'
  | 'Agency' | 'Financial' | 'Inventory' | 'HMO'
  | 'Guarantor' | 'Utilities' | 'Other'

export interface MergeField {
  key: string
  label: string
  category: MergeFieldCategory
}

export const MERGE_FIELDS: MergeField[] = [
  // Tenancy
  { key: 'tenancy_reference', label: 'Tenancy Reference', category: 'Tenancy' },
  { key: 'start_date', label: 'Start Date', category: 'Tenancy' },
  { key: 'end_date', label: 'End Date', category: 'Tenancy' },
  { key: 'rent_amount', label: 'Rent Amount', category: 'Tenancy' },
  { key: 'deposit_amount', label: 'Deposit Amount', category: 'Tenancy' },
  { key: 'deposit_scheme', label: 'Deposit Scheme', category: 'Tenancy' },
  { key: 'rent_frequency', label: 'Rent Frequency', category: 'Tenancy' },
  { key: 'rent_day', label: 'Rent Day', category: 'Tenancy' },
  { key: 'rent_due_day', label: 'Rent Due Day', category: 'Tenancy' },
  { key: 'today_date', label: 'Today Date', category: 'Tenancy' },
  { key: 'permitted_occupiers', label: 'Permitted Occupiers', category: 'Tenancy' },
  { key: 'relevant_person_declaration', label: 'Relevant Person Declaration', category: 'Tenancy' },
  { key: 'relevant_person_name', label: 'Relevant Person Name', category: 'Tenancy' },
  { key: 'relevant_person_address', label: 'Relevant Person Address', category: 'Tenancy' },
  { key: 'relevant_person_phone', label: 'Relevant Person Phone', category: 'Tenancy' },
  { key: 'relevant_person_email', label: 'Relevant Person Email', category: 'Tenancy' },
  { key: 'garden_maintenance', label: 'Garden Maintenance', category: 'Tenancy' },

  // Property
  { key: 'property_address', label: 'Property Address', category: 'Property' },
  { key: 'property_postcode', label: 'Property Postcode', category: 'Property' },
  { key: 'property_type', label: 'Property Type', category: 'Property' },

  // Landlord
  { key: 'landlord_name', label: 'Landlord Name', category: 'Landlord' },
  { key: 'landlord_address', label: 'Landlord Address', category: 'Landlord' },
  { key: 'landlord_email', label: 'Landlord Email', category: 'Landlord' },
  { key: 'landlord_phone', label: 'Landlord Phone', category: 'Landlord' },
  { key: 'bank_name', label: 'Bank Name', category: 'Landlord' },
  { key: 'bank_sort_code', label: 'Bank Sort Code', category: 'Landlord' },
  { key: 'bank_account_number', label: 'Bank Account Number', category: 'Landlord' },
  { key: 'payment_reference', label: 'Payment Reference', category: 'Landlord' },

  // Tenant
  { key: 'tenant_name', label: 'Tenant Name', category: 'Tenant' },
  { key: 'tenant_dob', label: 'Tenant Date of Birth', category: 'Tenant' },
  { key: 'tenant_phone', label: 'Tenant Phone', category: 'Tenant' },
  { key: 'tenant_email', label: 'Tenant Email', category: 'Tenant' },
  { key: 'tenant_id_number', label: 'Tenant ID Number', category: 'Tenant' },
  { key: 'lead_tenant_name', label: 'Lead Tenant Name', category: 'Tenant' },
  { key: 'family_member_1_name', label: 'Family Member 1 Name', category: 'Tenant' },
  { key: 'family_member_1_dob', label: 'Family Member 1 Date of Birth', category: 'Tenant' },
  { key: 'family_member_1_relation', label: 'Family Member 1 Relation', category: 'Tenant' },
  { key: 'family_member_2_name', label: 'Family Member 2 Name', category: 'Tenant' },
  { key: 'family_member_2_dob', label: 'Family Member 2 Date of Birth', category: 'Tenant' },
  { key: 'family_member_2_relation', label: 'Family Member 2 Relation', category: 'Tenant' },
  { key: 'family_member_3_name', label: 'Family Member 3 Name', category: 'Tenant' },
  { key: 'family_member_3_dob', label: 'Family Member 3 Date of Birth', category: 'Tenant' },
  { key: 'family_member_3_relation', label: 'Family Member 3 Relation', category: 'Tenant' },

  // Agency
  { key: 'agency_name', label: 'Agency Name', category: 'Agency' },
  { key: 'agency_address', label: 'Agency Address', category: 'Agency' },
  { key: 'agency_phone', label: 'Agency Phone', category: 'Agency' },
  { key: 'agency_email', label: 'Agency Email', category: 'Agency' },
  { key: 'agency_reg_number', label: 'Agency Registration Number', category: 'Agency' },
  { key: 'agent_name', label: 'Agent Name', category: 'Agency' },
  { key: 'agency_emergency_phone', label: 'Agency Emergency Phone', category: 'Agency' },
  { key: 'agency_website', label: 'Agency Website', category: 'Agency' },
  { key: 'principal_contact', label: 'Principal Contact', category: 'Agency' },

  // Financial
  { key: 'rent_amount', label: 'Rent Amount', category: 'Financial' },
  { key: 'deposit_amount', label: 'Deposit Amount', category: 'Financial' },
  { key: 'deposit_scheme', label: 'Deposit Scheme', category: 'Financial' },
  { key: 'bank_name', label: 'Bank Name', category: 'Financial' },
  { key: 'bank_sort_code', label: 'Bank Sort Code', category: 'Financial' },
  { key: 'bank_account_number', label: 'Bank Account Number', category: 'Financial' },

  // Inventory
  { key: 'inventory_living_room', label: 'Inventory Living Room', category: 'Inventory' },
  { key: 'inventory_kitchen', label: 'Inventory Kitchen', category: 'Inventory' },
  { key: 'inventory_electrical_items', label: 'Inventory Electrical Items', category: 'Inventory' },
  { key: 'inventory_bedroom_1', label: 'Inventory Bedroom 1', category: 'Inventory' },
  { key: 'inventory_bedroom_2', label: 'Inventory Bedroom 2', category: 'Inventory' },
  { key: 'inventory_bedroom_3', label: 'Inventory Bedroom 3', category: 'Inventory' },

  // HMO
  { key: 'hmo_status', label: 'HMO Status', category: 'HMO' },
  { key: 'hmo_licence_status', label: 'HMO Licence Status', category: 'HMO' },
  { key: 'hmo_licence_details', label: 'HMO Licence Details', category: 'HMO' },
  { key: 'hmo_max_individuals', label: 'HMO Max Individuals', category: 'HMO' },
  { key: 'hmo_max_families', label: 'HMO Max Families', category: 'HMO' },

  // Guarantor
  { key: 'guarantor_name', label: 'Guarantor Name', category: 'Guarantor' },
  { key: 'guarantor_address', label: 'Guarantor Address', category: 'Guarantor' },
  { key: 'guarantor_phone', label: 'Guarantor Phone', category: 'Guarantor' },
  { key: 'guarantor_email', label: 'Guarantor Email', category: 'Guarantor' },

  // Utilities
  { key: 'gas_meter_number', label: 'Gas Meter Number', category: 'Utilities' },
  { key: 'electric_meter_number', label: 'Electric Meter Number', category: 'Utilities' },
  { key: 'water_charges', label: 'Water Charges', category: 'Utilities' },
  { key: 'council_tax_band', label: 'Council Tax Band', category: 'Utilities' },
]

export const MERGE_FIELDS_BY_CATEGORY = (() => {
  const map = new Map<MergeFieldCategory, MergeField[]>()
  for (const field of MERGE_FIELDS) {
    if (!map.has(field.category)) map.set(field.category, [])
    map.get(field.category)!.push(field)
  }
  return Object.fromEntries(map) as Record<MergeFieldCategory, MergeField[]>
})()

export const MERGE_FIELD_KEYS = new Set<string>(MERGE_FIELDS.map((f) => f.key))
