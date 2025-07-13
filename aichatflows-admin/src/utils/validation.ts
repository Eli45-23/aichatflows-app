import { ClientFormData, GoalFormData, PaymentFormData, VisitFormData } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// URL validation regex  
const URL_REGEX = /^https?:\/\/.+/;

// Instagram handle validation (alphanumeric + underscore, no spaces)
const INSTAGRAM_HANDLE_REGEX = /^[a-zA-Z0-9_.]+$/;

// Phone number validation (basic international format)
const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;

export function validateClient(data: Partial<ClientFormData>): ValidationResult {
  const errors: Record<string, string> = {};

  // Required fields
  if (!data.name?.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!data.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!PHONE_REGEX.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (!data.delivery_preference) {
    errors.delivery_preference = 'Delivery preference is required';
  }

  if (!data.platform_preference) {
    errors.platform_preference = 'Platform preference is required';
  }

  if (!data.plan) {
    errors.plan = 'Plan selection is required';
  }

  // Optional field validations
  if (data.instagram_handle && !INSTAGRAM_HANDLE_REGEX.test(data.instagram_handle)) {
    errors.instagram_handle = 'Instagram handle can only contain letters, numbers, periods, and underscores';
  }

  if (data.facebook_url && !URL_REGEX.test(data.facebook_url)) {
    errors.facebook_url = 'Please enter a valid Facebook URL (starting with http:// or https://)';
  }

  if (data.tiktok_handle && !INSTAGRAM_HANDLE_REGEX.test(data.tiktok_handle)) {
    errors.tiktok_handle = 'TikTok handle can only contain letters, numbers, periods, and underscores';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateGoal(data: Partial<GoalFormData>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.title?.trim()) {
    errors.title = 'Goal title is required';
  } else if (data.title.trim().length < 3) {
    errors.title = 'Goal title must be at least 3 characters';
  } else if (data.title.trim().length > 100) {
    errors.title = 'Goal title cannot exceed 100 characters';
  }

  if (!data.frequency) {
    errors.frequency = 'Goal frequency is required';
  } else if (!['daily', 'weekly', 'monthly'].includes(data.frequency)) {
    errors.frequency = 'Invalid goal frequency';
  }

  // Metric is no longer needed - all goals are client acquisition goals

  if (!data.target || data.target <= 0) {
    errors.target = 'Target must be greater than 0';
  } else if (data.target > 1000000) {
    errors.target = 'Target cannot exceed 1,000,000';
  }

  // All goals are now global client acquisition goals - no client_id validation needed

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePayment(data: Partial<PaymentFormData>): ValidationResult {
  const errors: Record<string, string> = {};

  // Client ID is optional - allow direct payments
  // if (!data.client_id) {
  //   errors.client_id = 'Client selection is required';
  // }

  const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
  if (!amount || isNaN(amount) || amount <= 0) {
    errors.amount = 'Payment amount must be greater than 0';
  } else if (amount > 100000) {
    errors.amount = 'Payment amount cannot exceed $100,000';
  }

  if (!data.status) {
    errors.status = 'Payment status is required';
  } else if (!['pending', 'confirmed', 'failed'].includes(data.status)) {
    errors.status = 'Invalid payment status';
  }

  if (!data.payment_date) {
    errors.payment_date = 'Payment date is required';
  } else {
    const paymentDate = new Date(data.payment_date);
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    if (isNaN(paymentDate.getTime())) {
      errors.payment_date = 'Invalid payment date format';
    } else if (paymentDate < oneYearAgo || paymentDate > oneYearFromNow) {
      errors.payment_date = 'Payment date must be within the last year or next year';
    }
  }

  if (data.description && data.description.length > 500) {
    errors.description = 'Description cannot exceed 500 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateVisit(data: Partial<VisitFormData>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.location?.trim()) {
    errors.location = 'Location is required';
  }

  if (typeof data.latitude !== 'number' || Math.abs(data.latitude) > 90) {
    errors.latitude = 'Valid latitude is required';
  }

  if (typeof data.longitude !== 'number' || Math.abs(data.longitude) > 180) {
    errors.longitude = 'Valid longitude is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Utility functions for form validation
export function sanitizeString(value: string | undefined): string {
  return value?.trim() || '';
}

export function sanitizeNumber(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  const num = parseFloat(value || '0');
  return isNaN(num) ? 0 : num;
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it starts with +1, format as US number
  if (cleaned.startsWith('+1') && cleaned.length === 12) {
    return `+1 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
  }
  
  // If it's 10 digits, assume US number
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Return as-is for international numbers
  return cleaned;
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// Additional validation utilities
export function validateRequired(value: any, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateMinLength(value: string, minLength: number, fieldName: string): string | null {
  if (value && value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return null;
}

export function validateMaxLength(value: string, maxLength: number, fieldName: string): string | null {
  if (value && value.length > maxLength) {
    return `${fieldName} cannot exceed ${maxLength} characters`;
  }
  return null;
}

export function validateNumericRange(value: number, min: number, max: number, fieldName: string): string | null {
  if (value < min || value > max) {
    return `${fieldName} must be between ${min} and ${max}`;
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!EMAIL_REGEX.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
}

export function validatePhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (!PHONE_REGEX.test(cleaned)) {
    return 'Please enter a valid phone number';
  }
  return null;
}

export function validateDate(dateString: string, fieldName: string): string | null {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return `Please enter a valid ${fieldName.toLowerCase()}`;
  }
  return null;
}

// Comprehensive form validation helper
export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, Array<(value: any) => string | null>>
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [field, validators] of Object.entries(rules)) {
    const value = data[field];
    for (const validator of validators) {
      const error = validator(value);
      if (error) {
        errors[field] = error;
        break; // Stop at first error for this field
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Business logic validation
export function validateBusinessRules(data: any, type: 'client' | 'goal' | 'payment' | 'visit'): ValidationResult {
  const errors: Record<string, string> = {};
  
  switch (type) {
    case 'client':
      // Business rules for clients
      if (data.plan === 'pro' && !data.payment_method) {
        errors.payment_method = 'Payment method is required for Pro plan clients';
      }
      break;
      
    case 'goal':
      // Business rules for goals
      if (data.target > 1000) {
        errors.target = 'Client acquisition goals should not exceed 1000 clients';
      }
      break;
      
    case 'payment':
      // Business rules for payments
      if (data.status === 'confirmed' && data.amount > 10000) {
        // This could trigger additional verification workflows
        console.log('Large payment confirmed - may require additional verification');
      }
      break;
      
    case 'visit':
      // Business rules for visits
      if (data.business_name && data.business_name.toLowerCase().includes('competitor')) {
        // Flag potential competitive visits
        console.log('Competitive business visit flagged');
      }
      break;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}