import { z } from 'zod'

// UK postcode regex (simplified but covers most valid formats)
const ukPostcode = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i

// UK phone: starts with +44 or 0, then 9-10 digits (spaces allowed)
const ukPhone = /^(\+44|0)\s?\d[\d\s]{8,}$/

// National Insurance number: 2 letters + 6 digits + 1 letter (A-D)
const niNumber = /^[A-CEGHJ-PR-TW-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]$/i

export const propertySchema = z.object({
  address: z.string().min(1, 'Address is required'),
  postcode: z.string().min(1, 'Postcode is required').regex(ukPostcode, 'Enter a valid UK postcode'),
  type: z.string().min(1),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  status: z.string().min(1),
  description: z.string().optional(),
  epc_rating: z.string().optional(),
  landlord_id: z.string().optional(),
})

export const tenantSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z.string().optional().refine(
    (v) => !v || ukPhone.test(v),
    'Enter a valid UK phone number',
  ),
  dob: z.string().optional(),
  ni_number: z.string().optional().refine(
    (v) => !v || niNumber.test(v),
    'Enter a valid NI number (e.g. AB123456C)',
  ),
  emergency_contact: z.string().optional(),
})

export const landlordSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z.string().optional().refine(
    (v) => !v || ukPhone.test(v),
    'Enter a valid UK phone number',
  ),
  company_name: z.string().optional(),
  address: z.string().optional(),
  bank_details: z.string().optional(),
})

export const paymentSchema = z.object({
  tenancy_id: z.string().min(1, 'Select a tenancy'),
  amount: z.string().min(1, 'Amount is required').refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    'Amount must be greater than 0',
  ),
  due_date: z.string().min(1, 'Due date is required'),
  paid_date: z.string().optional(),
  payment_method: z.string().min(1, 'Select a payment method'),
  status: z.string().min(1),
  notes: z.string().optional(),
})

export const expenseSchema = z.object({
  property_id: z.string().min(1, 'Select a property'),
  category: z.string().min(1, 'Category is required'),
  amount: z.string().min(1, 'Amount is required').refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    'Amount must be greater than 0',
  ),
  date: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
})

export const maintenanceSchema = z.object({
  property_id: z.string().min(1, 'Select a property'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.string().min(1),
  status: z.string().min(1),
})

/**
 * Convert Zod validation errors into a Record<field, message> for inline display.
 */
export function zodErrors(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }): Record<string, string> {
  if (result.success) return {}
  const errors: Record<string, string> = {}
  for (const issue of result.error!.issues) {
    const key = issue.path.map(String).join('.')
    if (!errors[key]) errors[key] = issue.message
  }
  return errors
}
