import { useState, useEffect, useCallback, useRef } from 'react';
import { Session } from '../services/api';
import { initStorage, getStorage, setStorage, onStorageChange } from '../services/storage';

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

  // Restore auth from storage when it loads
  useEffect(() => {
    initStorage();

    const stored = getStorage();
    if (stored.accessToken && stored.email && !hasRestoredFromStorage.current) {
      hasRestoredFromStorage.current = true;
      setAccessToken(stored.accessToken);
      setEmail(stored.email);
    }

    const unsubscribe = onStorageChange((data) => {
      if (data.accessToken && data.email && !hasRestoredFromStorage.current) {
        hasRestoredFromStorage.current = true;
        setAccessToken(data.accessToken);
        setEmail(data.email);
      }
    });

    return unsubscribe;
  }, []);

  const setSession = useCallback((session: Session, userEmail: string) => {
    setAccessToken(session.access_token);
    setEmail(userEmail);
    setAuthError(null);
    setStorage({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      email: userEmail,
    });
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setEmail(null);
    setAuthError(null);
    hasRestoredFromStorage.current = false;
    setStorage({
      accessToken: undefined,
      refreshToken: undefined,
      email: undefined,
    });
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

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
