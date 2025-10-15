// Type definitions for BTL Costing Application

export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';

export type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'cancelled';

export type RateType = 'actual' | 'banded';

export type CostType = 'milestone' | 'monthly' | 'one-time';

export type PaymentStatus = 'pending' | 'invoiced' | 'paid' | 'overdue';

export type GAApplication = 'all' | 'labour' | 'material' | 'none';

// Database entities
export interface User {
  id: number;
  email: string;
  password_hash?: string;
  full_name: string;
  role: UserRole;
  is_active: number;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface Project {
  id: number;
  project_code: string;
  project_name: string;
  client_name: string;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
  tax_rate: number;
  ga_percentage: number;
  ga_application: GAApplication;
  total_labour_cost: number;
  total_material_cost: number;
  total_cost: number;
  total_revenue: number;
  margin_percentage: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Personnel {
  id: number;
  employee_id: string;
  employee_name: string;
  employee_role: string;
  employee_level?: string;
  hourly_cost: number;
  banded_rate?: number;
  is_active: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RateBand {
  id: number;
  band_name: string;
  band_level?: string;
  role_description?: string;
  hourly_rate: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: number;
  project_id: number;
  milestone_code: string;
  milestone_name: string;
  milestone_date?: string;
  description?: string;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

export interface CostLineItem {
  id: number;
  project_id: number;
  milestone_id?: number;
  wbs_code?: string;
  task_description: string;
  rate_type: RateType;
  personnel_id?: number;
  rate_band_id?: number;
  hours: number;
  hourly_rate: number;
  apply_ga: number;
  base_cost: number;
  ga_cost: number;
  total_cost: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialCost {
  id: number;
  project_id: number;
  milestone_id?: number;
  material_description: string;
  material_category?: string;
  cost_type: CostType;
  quantity: number;
  unit_cost: number;
  start_month?: number;
  end_month?: number;
  months_count?: number;
  apply_ga: number;
  base_cost: number;
  ga_cost: number;
  total_cost: number;
  supplier?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentSchedule {
  id: number;
  project_id: number;
  milestone_id?: number;
  payment_description: string;
  payment_date?: string;
  invoice_amount: number;
  invoice_number?: string;
  payment_status: PaymentStatus;
  paid_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CashFlow {
  id: number;
  project_id: number;
  month_year: string;
  month_number: number;
  labour_outflow: number;
  material_outflow: number;
  total_outflow: number;
  revenue_inflow: number;
  net_cash_flow: number;
  cumulative_cash_flow: number;
  created_at: string;
  updated_at: string;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: Omit<User, 'password_hash'>;
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Bindings for Cloudflare Workers
export interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

// Auth context
export interface AuthContext {
  user: User;
}
