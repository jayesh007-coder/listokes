/**
 * Listokes API client.
 *
 * Central HTTP layer that handles:
 *  - Dynamic Base URL configuration with LAN/web/emulator auto-detection
 *  - Web/Native hybrid token persistence (SecureStore on native, localStorage on web)
 *  - Automatic Bearer-token injection
 *  - Automatic Token refresh on 401
 *  - High-level domain services for Auth, Tasks, Expenses, and Subscriptions
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type {
  Expense,
  ExpenseCreatePayload,
  ExpenseSummary,
  ExpenseUpdatePayload,
  LoginPayload,
  RegisterPayload,
  Subscription,
  Task,
  TaskCreatePayload,
  TaskPriority,
  TaskStatus,
  TaskUpdatePayload,
  TokenPair,
  User,
} from './types';

// ── Configuration ─────────────────────────────────────────

const DEFAULT_SERVER_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

const SERVER_URL_KEY = 'listokes_server_url';
let currentServerUrl = DEFAULT_SERVER_URL;

export function getServerUrl(): string {
  return currentServerUrl;
}

export async function setServerUrl(url: string): Promise<void> {
  const cleaned = url.replace(/\/+$/, '');
  currentServerUrl = cleaned;
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(SERVER_URL_KEY, cleaned);
    } else {
      await SecureStore.setItemAsync(SERVER_URL_KEY, cleaned);
    }
  } catch (err) {
    console.warn('Failed to persist server URL:', err);
  }
}

export async function initServerUrl(): Promise<string> {
  try {
    let saved: string | null = null;
    if (Platform.OS === 'web') {
      saved = localStorage.getItem(SERVER_URL_KEY);
    } else {
      saved = await SecureStore.getItemAsync(SERVER_URL_KEY);
    }
    if (saved) {
      currentServerUrl = saved;
    }
  } catch {
    // Keep default
  }
  return currentServerUrl;
}

// ── Token Storage ─────────────────────────────────────────

const TOKEN_KEYS = {
  access: 'listokes_access_token',
  refresh: 'listokes_refresh_token',
} as const;

export async function getAccessToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEYS.access);
    }
    return await SecureStore.getItemAsync(TOKEN_KEYS.access);
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEYS.refresh);
    }
    return await SecureStore.getItemAsync(TOKEN_KEYS.refresh);
  } catch {
    return null;
  }
}

export async function saveTokens(access: string, refresh: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEYS.access, access);
      localStorage.setItem(TOKEN_KEYS.refresh, refresh);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEYS.access, access);
      await SecureStore.setItemAsync(TOKEN_KEYS.refresh, refresh);
    }
  } catch (err) {
    console.error('Failed to save tokens:', err);
  }
}

export async function clearTokens(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEYS.access);
      localStorage.removeItem(TOKEN_KEYS.refresh);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEYS.access);
      await SecureStore.deleteItemAsync(TOKEN_KEYS.refresh);
    }
  } catch (err) {
    console.warn('Failed to clear tokens:', err);
  }
}

// ── Core Fetch Wrapper ────────────────────────────────────

export interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const apiV1 = `${currentServerUrl}/api/v1`;
    const res = await fetch(`${apiV1}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      await clearTokens();
      return null;
    }

    const data: TokenPair = await res.json();
    await saveTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    await clearTokens();
    return null;
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, skipAuth = false } = options;

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (!skipAuth) {
    const token = await getAccessToken();
    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const endpointUrl = `${currentServerUrl}/api/v1${path}`;

  let res: Response;
  try {
    res = await fetch(endpointUrl, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      `Cannot connect to backend server at ${currentServerUrl}. Please verify the server is running.`
    );
  }

  // Auto-refresh on 401
  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      reqHeaders['Authorization'] = `Bearer ${newToken}`;
      try {
        res = await fetch(endpointUrl, {
          method,
          headers: reqHeaders,
          body: body ? JSON.stringify(body) : undefined,
        });
      } catch {
        throw new ApiError(0, `Network error after token refresh.`);
      }
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new ApiError(res.status, errorBody.detail || 'Request failed');
  }

  return res.json() as Promise<T>;
}

// ── Typed API Primitives ──────────────────────────────────

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...opts, method: 'GET' }),

  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'POST', body }),

  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),

  delete: <T>(path: string, opts?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
};

// ── Domain Services ───────────────────────────────────────

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<TokenPair>('/auth/login', payload, { skipAuth: true }),

  register: (payload: RegisterPayload) =>
    api.post<User>('/auth/register', payload, { skipAuth: true }),

  getProfile: () => api.get<User>('/auth/me'),

  updateProfile: (data: { full_name?: string; email?: string }) =>
    api.patch<User>('/auth/me', data),

  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post<void>('/auth/change-password', data),
};

export const taskService = {
  list: (params?: { status?: TaskStatus; priority?: TaskPriority; category?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.category) query.append('category', params.category);
    const qs = query.toString();
    return api.get<Task[]>(`/tasks/${qs ? `?${qs}` : ''}`);
  },

  get: (id: string) => api.get<Task>(`/tasks/${id}`),

  create: (data: TaskCreatePayload) => api.post<Task>('/tasks/', data),

  update: (id: string, data: TaskUpdatePayload) => api.patch<Task>(`/tasks/${id}`, data),

  delete: (id: string) => api.delete<void>(`/tasks/${id}`),
};

export const expenseService = {
  list: (params?: { category?: string; start_date?: string; end_date?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    const qs = query.toString();
    return api.get<Expense[]>(`/expenses/${qs ? `?${qs}` : ''}`);
  },

  summary: (year: number, month: number) =>
    api.get<ExpenseSummary[]>(`/expenses/summary?year=${year}&month=${month}`),

  get: (id: string) => api.get<Expense>(`/expenses/${id}`),

  create: (data: ExpenseCreatePayload) => api.post<Expense>('/expenses/', data),

  update: (id: string, data: ExpenseUpdatePayload) => api.patch<Expense>(`/expenses/${id}`, data),

  delete: (id: string) => api.delete<void>(`/expenses/${id}`),
};

export const subscriptionService = {
  get: () => api.get<Subscription>('/subscriptions/me'),

  update: (data: { plan?: string }) => api.patch<Subscription>('/subscriptions/me', data),

  cancel: () => api.post<Subscription>('/subscriptions/me/cancel'),
};

export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${currentServerUrl}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
