import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, refreshPluginSession } from '../services/api';
import { initStorage, getStorage, setStorage, onStorageChange } from '../services/storage';

// Refresh 5 minutes before expiry
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

interface UseAuthResult {
  isAuthenticated: boolean;
  accessToken: string | null;
  email: string | null;
  authError: string | null;
  setSession: (session: Session, email: string) => void;
  logout: () => void;
  clearAuthError: () => void;
}

export function useAuth(): UseAuthResult {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const hasRestoredFromStorage = useRef(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  const applySession = useCallback((token: string, userEmail: string, session: Session) => {
    setAccessToken(token);
    setEmail(userEmail);
    setAuthError(null);
    setStorage({
      accessToken: token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at,
      email: userEmail,
    });
  }, []);

  const scheduleRefresh = useCallback((expiresAt: number, currentEmail: string) => {
    clearRefreshTimer();
    const msUntilRefresh = expiresAt * 1000 - Date.now() - REFRESH_BUFFER_MS;

    if (msUntilRefresh <= 0) {
      // Already expired or expiring very soon — refresh immediately
      const stored = getStorage();
      if (!stored.refreshToken) return;
      refreshPluginSession(stored.refreshToken)
        .then((newSession) => {
          applySession(newSession.access_token, currentEmail, newSession);
          if (newSession.expires_at) scheduleRefresh(newSession.expires_at, currentEmail);
        })
        .catch(() => {
          // Refresh failed — clear auth so user is prompted to sign in again
          setAccessToken(null);
          setEmail(null);
          setStorage({ accessToken: undefined, refreshToken: undefined, expiresAt: undefined, email: undefined });
        });
      return;
    }

    refreshTimerRef.current = setTimeout(async () => {
      const stored = getStorage();
      if (!stored.refreshToken || !stored.email) return;
      try {
        const newSession = await refreshPluginSession(stored.refreshToken);
        applySession(newSession.access_token, stored.email, newSession);
        if (newSession.expires_at) scheduleRefresh(newSession.expires_at, stored.email);
      } catch {
        // Refresh failed — token will expire naturally; user sees auth error on next API call
      }
    }, msUntilRefresh);
  }, [applySession]);

  // Restore auth from storage on mount
  useEffect(() => {
    initStorage();

    const stored = getStorage();
    if (stored.accessToken && stored.email && !hasRestoredFromStorage.current) {
      hasRestoredFromStorage.current = true;
      setAccessToken(stored.accessToken);
      setEmail(stored.email);
      if (stored.expiresAt) scheduleRefresh(stored.expiresAt, stored.email);
    }

    const unsubscribe = onStorageChange((data) => {
      if (data.accessToken && data.email && !hasRestoredFromStorage.current) {
        hasRestoredFromStorage.current = true;
        setAccessToken(data.accessToken);
        setEmail(data.email);
        if (data.expiresAt) scheduleRefresh(data.expiresAt, data.email);
      }
    });

    return () => {
      unsubscribe();
      clearRefreshTimer();
    };
  }, [scheduleRefresh]);

  const setSession = useCallback((session: Session, userEmail: string) => {
    applySession(session.access_token, userEmail, session);
    if (session.expires_at) scheduleRefresh(session.expires_at, userEmail);
  }, [applySession, scheduleRefresh]);

  const logout = useCallback(() => {
    clearRefreshTimer();
    setAccessToken(null);
    setEmail(null);
    setAuthError(null);
    hasRestoredFromStorage.current = false;
    setStorage({
      accessToken: undefined,
      refreshToken: undefined,
      expiresAt: undefined,
      email: undefined,
    });
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  return {
    isAuthenticated: !!accessToken,
    accessToken,
    email,
    authError,
    setSession,
    logout,
    clearAuthError,
  };
}
