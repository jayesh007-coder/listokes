/**
 * Listokes Auth & Backend Context
 *
 * Provides reactive auth state, profile data, login/register/logout methods,
 * and live server connection monitoring.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  authService,
  checkServerHealth,
  clearTokens,
  getAccessToken,
  getServerUrl,
  initServerUrl,
  saveTokens,
  setServerUrl as persistServerUrl,
} from '@/services/api';
import type { LoginPayload, RegisterPayload, User } from '@/services/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  serverUrl: string;
  isServerOnline: boolean | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateServerUrl: (url: string) => Promise<boolean>;
  pingServer: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [serverUrl, setServerUrlState] = useState<string>(getServerUrl());
  const [isServerOnline, setIsServerOnline] = useState<boolean | null>(null);

  // ── Ping Server ─────────────────────────────────────────

  const pingServer = async (): Promise<boolean> => {
    const online = await checkServerHealth();
    setIsServerOnline(online);
    return online;
  };

  // ── Refresh Profile ─────────────────────────────────────

  const refreshProfile = async (): Promise<void> => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
    } catch {
      setUser(null);
      await clearTokens();
    }
  };

  // ── Initial Bootstrap ───────────────────────────────────

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const initialUrl = await initServerUrl();
        if (mounted) {
          setServerUrlState(initialUrl);
        }

        const online = await checkServerHealth();
        if (mounted) {
          setIsServerOnline(online);
        }

        const token = await getAccessToken();
        if (token && online) {
          try {
            const profile = await authService.getProfile();
            if (mounted) {
              setUser(profile);
            }
          } catch {
            if (mounted) {
              setUser(null);
            }
            await clearTokens();
          }
        }
      } catch (err) {
        console.warn('Auth bootstrap failed:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    bootstrap();

    // Check server status periodically (every 30s)
    const interval = setInterval(() => {
      pingServer();
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // ── Login ───────────────────────────────────────────────

  const login = async (payload: LoginPayload): Promise<void> => {
    const tokens = await authService.login(payload);
    await saveTokens(tokens.access_token, tokens.refresh_token);
    await refreshProfile();
    await pingServer();
  };

  // ── Register ────────────────────────────────────────────

  const register = async (payload: RegisterPayload): Promise<void> => {
    await authService.register(payload);
    // After register, auto-login
    await login({ email: payload.email, password: payload.password });
  };

  // ── Logout ──────────────────────────────────────────────

  const logout = async (): Promise<void> => {
    await clearTokens();
    setUser(null);
  };

  // ── Update Server URL ───────────────────────────────────

  const updateServerUrl = async (newUrl: string): Promise<boolean> => {
    await persistServerUrl(newUrl);
    setServerUrlState(newUrl);
    const online = await pingServer();
    if (online) {
      await refreshProfile();
    }
    return online;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        serverUrl,
        isServerOnline,
        login,
        register,
        logout,
        refreshProfile,
        updateServerUrl,
        pingServer,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
