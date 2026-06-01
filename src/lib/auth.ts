import { useSyncExternalStore } from "react";

const AUTH_STORAGE_KEY = "level-up-fitness-user-auth";

export type AuthUser = {
  UserSystemRef: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  avatarUrl?: string | null;
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

export function clearAuthSession() {
  currentSession = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
  emit();
}

export function useAuthSession() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => currentSession,
    () => null,
  );
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === AUTH_STORAGE_KEY) {
      currentSession = readStoredSession();
      emit();
    }
  });
}
