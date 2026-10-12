/**
 * TypeScript types matching the backend Pydantic schemas.
 */

// ── User & Auth ─────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterPayload {
  email: string;
  full_name: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ── Tasks ───────────────────────────────────────────────

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  category: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskCreatePayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string;
  category?: string;
}

export interface TaskUpdatePayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string;
  category?: string;
  sort_order?: number;
}

// ── Expenses ────────────────────────────────────────────

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'housing'
  | 'utilities'
  | 'entertainment'
  | 'health'
  | 'shopping'
  | 'education'
  | 'savings'
  | 'other';

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string | null;
  merchant: string | null;
  expense_date: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreatePayload {
  amount: number;
  currency?: string;
  category?: ExpenseCategory;
  description?: string;
  merchant?: string;
  expense_date?: string;
}

export interface ExpenseUpdatePayload {
  amount?: number;
  currency?: string;
  category?: ExpenseCategory;
  description?: string;
  merchant?: string;
  expense_date?: string;
}

export interface ExpenseSummary {
  total: number;
  currency: string;
  category: ExpenseCategory | null;
  count: number;
}

// ── Subscriptions ───────────────────────────────────────

export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  payment_provider: string | null;
  external_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}
