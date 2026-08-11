import { useEffect, useState, useSyncExternalStore } from "react";

const AUTH_STORAGE_KEY = "level-up-fitness-user-auth";

export type AuthUser = {
  UserSystemRef: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  avatarUrl?: string | null;
  /** Present on GET /auth/me; null until the address is confirmed. */
  emailVerifiedAt?: string | null;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

const listeners = new Set<() => void>();

function readStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

let currentSession: AuthSession | null = readStoredSession();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAuthSession() {
  return currentSession;
}

export function saveAuthSession(session: AuthSession) {
  currentSession = session;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }
  emit();
}

/**
 * Merge fresh user fields into the stored session, keeping the tokens.
 *
 * Routes through saveAuthSession so subscribers are notified — that is what lets the navbar
 * pick up a renamed profile without a reload. No-ops when signed out.
 */
export function updateAuthUser(patch: Partial<AuthUser>) {
  if (!currentSession) return;
  saveAuthSession({ ...currentSession, user: { ...currentSession.user, ...patch } });
}

export function clearAuthSession() {
  currentSession = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
  emit();
}

export function useAuthSession() {
  return useSyncExternalStore(subscribe, () => currentSession, () => null);
}

export function useAuthState() {
  const session = useAuthSession();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    currentSession = readStoredSession();
    setIsHydrated(true);
    emit();
  }, []);

  return { session, isHydrated };
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === AUTH_STORAGE_KEY) {
      currentSession = readStoredSession();
      emit();
    }
  });
}
