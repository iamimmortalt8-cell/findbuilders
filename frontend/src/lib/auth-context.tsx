import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { supabaseProfileService } from "@/lib/supabase-profiles";
import type { Profile } from "@/lib/types";

const setSupabaseSession = (access_token: string | null, refresh_token: string | null) => {
  if (access_token && refresh_token) {
    supabase.auth.setSession({ access_token, refresh_token }).catch(console.error);
  } else {
    supabase.auth.signOut().catch(console.error);
  }
};

interface BackendUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: BackendUser | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null; url?: string }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    if (!decoded.exp) return false;
    // 10-second buffer to guard against clock skew
    return decoded.exp * 1000 <= Date.now() + 10000;
  } catch {
    return true;
  }
}

function logTokenInfo(label: string, token: string | null, source: string) {
  if (import.meta.env.DEV) {
    console.debug(`[Auth] ${label}:`, {
      exists: !!token,
      length: token ? token.length : 0,
      source,
    });
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initPromiseRef = React.useRef<Promise<void> | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const data = await supabaseProfileService.getProfile(userId);
      setProfile(data);
    } catch {
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const performTokenRefresh = useCallback(async (refreshToken: string): Promise<string> => {
    try {
      logTokenInfo('Starting refresh', refreshToken, 'localStorage(refresh_token)');
      const res = await api.refreshToken(refreshToken);
      const newAccessToken = res.accessToken;
      if (newAccessToken) {
        localStorage.setItem(TOKEN_KEY, newAccessToken);
        setSupabaseSession(newAccessToken, refreshToken);
        logTokenInfo('Refreshed token saved', newAccessToken, 'api.refreshToken');
        return newAccessToken;
      }
      throw new Error("No access token returned from refresh");
    } catch (err: any) {
      console.error('[Auth] Token refresh failed:', err);
      if (err?.status >= 400 && err?.status < 500) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        setSupabaseSession(null, null);
      }
      throw err;
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    const runInit = async () => {
      let token = localStorage.getItem(TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!token && !refreshToken) {
        setLoading(false);
        return;
      }

      if (!token || isTokenExpired(token)) {
        if (refreshToken) {
          logTokenInfo('Access token expired or missing, refreshing before /me', token, 'localStorage');
          try {
            const newToken = await performTokenRefresh(refreshToken);
            token = newToken;
          } catch (err: any) {
             if (err?.status >= 400 && err?.status < 500) {
                setUser(null);
                setProfile(null);
             }
             setLoading(false);
             return;
          }
        } else {
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
      }

      try {
        if (token && refreshToken) {
          setSupabaseSession(token, refreshToken);
        }
        logTokenInfo('Calling /me', token, 'active_session');
        const me = await api.getMe();
        setUser({ id: me.id, email: me.email });
        await fetchProfile(me.id);
      } catch (error: any) {
        if (error?.status === 401 && refreshToken) {
          logTokenInfo('/me failed, attempting fallback refresh', token, 'fallback');
          try {
            const newToken = await performTokenRefresh(refreshToken);
            token = newToken;
            if (token && refreshToken) {
              setSupabaseSession(token, refreshToken);
            }
            const retryMe = await api.getMe();
            setUser({ id: retryMe.id, email: retryMe.email });
            await fetchProfile(retryMe.id);
          } catch (retryError: any) {
            if (retryError?.status >= 400 && retryError?.status < 500) {
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(REFRESH_TOKEN_KEY);
              setSupabaseSession(null, null);
              setUser(null);
              setProfile(null);
            }
          }
        } else {
          if (error?.status >= 400 && error?.status < 500) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            setSupabaseSession(null, null);
            setUser(null);
            setProfile(null);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    initPromiseRef.current = runInit().finally(() => {
      initPromiseRef.current = null;
    });

    return initPromiseRef.current;
  }, [fetchProfile, performTokenRefresh]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const tokens = await api.signUp(email, password, displayName);
      localStorage.setItem(TOKEN_KEY, tokens.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
      setSupabaseSession(tokens.access_token, tokens.refresh_token);
      const me = await api.getMe();
      setUser({ id: me.id, email: me.email });
      await fetchProfile(me.id);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const tokens = await api.signIn(email, password);
      localStorage.setItem(TOKEN_KEY, tokens.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
      setSupabaseSession(tokens.access_token, tokens.refresh_token);
      const me = await api.getMe();
      setUser({ id: me.id, email: me.email });
      await fetchProfile(me.id);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { url } = await api.signInWithGoogle();
      window.location.href = url;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await api.signOut();
    } catch {
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setSupabaseSession(null, null);
      setUser(null);
      setProfile(null);
    }
  };

  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        isAdmin,
        refreshProfile,
        initializeAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
