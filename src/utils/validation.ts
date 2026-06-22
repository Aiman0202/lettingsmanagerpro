export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  email?: boolean
  custom?: (value: string) => string | null
}

export interface FieldError {
  field: string
  message: string
}

export function validateField(value: string, rules: ValidationRule, fieldName: string): string | null {
  if (rules.required && (!value || value.trim() === '')) {
    return `${fieldName} is required`
  }

  if (value && rules.minLength && value.length < rules.minLength) {
    return `${fieldName} must be at least ${rules.minLength} characters`
  }

  if (value && rules.maxLength && value.length > rules.maxLength) {
    return `${fieldName} must be no more than ${rules.maxLength} characters`
  }

  if (value && rules.pattern && !rules.pattern.test(value)) {
    return `${fieldName} format is invalid`
  }

  if (value && rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Please enter a valid email address'
  }

  if (value && rules.custom) {
    return rules.custom(value)
  }

  return null
}

export function validateForm<T extends Record<string, string>>(
  values: T,
  rules: Partial<Record<keyof T, ValidationRule>>
): FieldError[] {
  const errors: FieldError[] = []

  for (const [field, fieldRules] of Object.entries(rules)) {
    if (!fieldRules) continue

    const value = values[field] as string
    const error = validateField(value, fieldRules, String(field))

    if (error) {
      errors.push({ field, message: error })
    }
  }

  return errors
}

export function formatSupabaseError(error: any): string {
  if (!error) return 'An unexpected error occurred'
  if (error.message) return error.message
  if (error.error_description) return error.error_description
  return 'An unexpected error occurred'
}

export function handleApiError(error: any, context?: string): string {
  console.error(`Error in ${context || 'operation'}:`, error)
  
  // Handle common Supabase errors
  if (error?.code === 'PGRST116') {
    return 'Record not found'
  }
  if (error?.code === '23505') {
    return 'A record with this information already exists'
  }
  if (error?.code === '23503') {
    return 'This record is linked to other data and cannot be deleted'
  }
  if (error?.message?.includes('JWT')) {
    return 'Your session has expired. Please log in again.'
  }
  
  return formatSupabaseError(error)
}
