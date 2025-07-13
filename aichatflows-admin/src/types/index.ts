export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'in_progress' | 'paused' | 'cancelled';
  instagram_handle?: string;
  facebook_url?: string;
  tiktok_handle?: string;
  delivery_preference?: 'delivery' | 'pickup'; // Optional for backward compatibility
  platform_preference?: 'instagram' | 'facebook' | 'tiktok'; // Optional for backward compatibility
  plan?: 'starter' | 'pro'; // Optional for backward compatibility
  payment_status?: 'paid' | 'unpaid' | 'overdue'; // Phase 7: Payment tracking
  signed_in_person?: boolean; // Phase 7: In-person signup flag
  payment_method?: string;
  notes?: string;
  // New comprehensive fields to match Google Form
  business_name?: string;
  other_platforms?: string;
  business_type?: string;
  business_niche?: string;
  common_customer_question?: string;
  products_or_services?: string;
  has_faqs?: boolean;
  faq_location?: string;
  consent_to_share?: boolean;
  
  // Login credentials (conditional on platform selection)
  instagram_password?: string;
  facebook_password?: string;
  tiktok_password?: string;
  
  // Delivery details (conditional on delivery preference)
  delivery_method?: string;
  delivery_notes?: string;
  
  // Pickup details (conditional on pickup preference)
  pickup_method?: string;
  pickup_notes?: string;
  
  // Photo upload
  photo_url?: string;
  
  created_at: string;
  updated_at?: string;
}

export interface FormSubmission {
  id: string;
  email: string;
  status: string;
  client_id: string;
  submitted_at: string;
  client?: Client;
}

export interface Submission {
  id: string;
  form_data: Record<string, any>;
  submitted_at: string;
}

export interface Payment {
  id: string;
  client_id?: string; // Optional to handle cases where client might not be set
  client?: Client;
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
  payment_date: string;
  description?: string;
  payment_method?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Visit {
  id: string;
  client_id: string;
  location: string;
}

export interface BusinessVisit {
  id: string;
  client_id?: string; // Optional - visits can be made without client assignment
  client?: Client;
  location: string | null; // Can be null in some cases
  latitude?: number; // Optional for backward compatibility
  longitude?: number; // Optional for backward compatibility
  timestamp?: string; // Optional for backward compatibility
  notes?: string;
  created_at?: string;
}

// Legacy interface for compatibility
export interface LegacyBusinessVisit {
  id: string;
  business_name: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  visited_at: string;
  notes?: string;
}

export interface Goal {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target: number;
  is_global: boolean; // Always true for client acquisition goals
  created_at: string;
  updated_at?: string;
  current_progress?: number; // calculated field for progress tracking
  // Legacy fields for backward compatibility (will be removed)
  metric?: 'clients';
  client_id?: string;
  client?: Client;
}

export interface NotificationData {
  id: string;
  type: 'onboarding' | 'payment' | 'goal' | 'client_status' | 'client_added' | 'payment_received' | 'visit_logged' | 'goal_reached';
  title: string;
  body: string;
  data?: Record<string, any>;
  sent_at: string;
  read_at?: string;
  user_id?: string;
}

// Push notification device registration
export interface UserDevice {
  id: string;
  user_id: string;
  push_token: string;
  device_type: 'ios' | 'android';
  created_at: string;
  updated_at: string;
}

// Notification log entry for history
export interface NotificationLog {
  id: string;
  user_id: string;
  type: NotificationData['type'];
  title: string;
  body: string;
  data?: Record<string, any>;
  read_at?: string;
  created_at: string;
}

// Analytics and dashboard types
export interface DashboardStats {
  totalClients: number;
  totalRevenue: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
  newSubmissions: number;
  activeGoals: number;
  recentVisits: number;
  clientsByStatus: {
    active: number;
    in_progress: number;
    paused: number;
    cancelled: number;
    unknown: number;
  };
  paymentsByStatus: {
    pending: number;
    confirmed: number;
    failed: number;
  };
}

// Form data types for enhanced client onboarding
export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  status: Client['status'];
  instagram_handle?: string;
  facebook_url?: string;
  tiktok_handle?: string;
  delivery_preference: Client['delivery_preference'];
  platform_preference: Client['platform_preference'];
  plan: Client['plan'];
  payment_status?: Client['payment_status'];
  signed_in_person?: boolean;
  payment_method?: string;
  notes?: string;
  // New comprehensive fields to match Google Form
  business_name?: string;
  other_platforms?: string;
  business_type?: string;
  business_niche?: string;
  common_customer_question?: string;
  products_or_services?: string;
  has_faqs?: boolean;
  faq_location?: string;
  consent_to_share?: boolean;
  
  // Login credentials (conditional on platform selection)
  instagram_password?: string;
  facebook_password?: string;
  tiktok_password?: string;
  
  // Delivery details (conditional on delivery preference)
  delivery_method?: string;
  delivery_notes?: string;
  
  // Pickup details (conditional on pickup preference)
  pickup_method?: string;
  pickup_notes?: string;
  
  // Photo upload
  photo_url?: string;
}

// Goal creation form data
export interface GoalFormData {
  title: string;
  frequency: Goal['frequency'];
  target: number;
  // Legacy fields for compatibility
  metric?: 'clients';
  client_id?: string;
}

// Payment form data
export interface PaymentFormData {
  client_id: string;
  amount: string; // Form input as string, converted to number on submission
  status: Payment['status'];
  payment_date: string;
  description?: string;
  payment_method?: string;
  notes?: string;
}

// Visit form data
export interface VisitFormData {
  client_id?: string;
  location: string;
  latitude: number;
  longitude: number;
  notes?: string;
}

// Filter and search types
export interface ClientFilters {
  status?: Client['status'] | 'all';
  plan?: Client['plan'] | 'all';
  payment_status?: Client['payment_status'] | 'all'; // Phase 7: Payment status filter
  platform?: Client['platform_preference'] | 'all';
  search?: string;
}

export interface PaymentFilters {
  status?: Payment['status'] | 'all';
  client_id?: string;
  date_range?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface GoalFilters {
  frequency?: Goal['frequency'] | 'all';
  search?: string;
}

// Phase 7: Monetization and activity tracking types
export interface PlanInfo {
  name: 'starter' | 'pro';
  price: number;
  features: string[];
}

export interface RevenueStats {
  totalRevenue: number;
  starterRevenue: number;
  proRevenue: number;
  starterCount: number;
  proCount: number;
  paidCount: number;
  unpaidCount: number;
  overdueCount: number;
}

export interface ActivityLogEntry {
  id: string;
  type: 'plan_change' | 'payment_status' | 'in_person_signup' | 'client_created';
  description: string;
  client_id?: string;
  client_name?: string;
  timestamp: string;
  data?: Record<string, any>;
}

export interface InPersonSubmission {
  id: string;
  form_data: ClientFormData;
  submitted_at: string;
  converted_to_client: boolean;
  client_id?: string;
}