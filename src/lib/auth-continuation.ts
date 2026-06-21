import { cartApi } from "@/lib/api";

export type AuthContinuation = {
  redirect?: string;
  addProductRef?: string;
  planRef?: string;
};

const AUTH_CONTINUATION_KEY = "level-up-fitness-auth-continuation";

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function safeInternalRedirect(value: unknown, fallback = "/dashboard") {
  const redirect = optionalString(value);
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//") || redirect.includes("\\")) {
    return fallback;
  }

  try {
    const base = "https://level-up-fitness.local";
    const parsed = new URL(redirect, base);
    if (parsed.origin !== base) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

function normalizeAuthContinuation(search: Record<string, unknown>): AuthContinuation {
  const rawRedirect = optionalString(search.redirect);
  const redirect = rawRedirect ? safeInternalRedirect(rawRedirect) : undefined;
  const addProductRef = optionalString(search.addProductRef);
  const planRef = optionalString(search.planRef);

  if (planRef && addProductRef) {
    const isCartAction = redirect === "/shop" || redirect === "/cart";
    return isCartAction
      ? { redirect, addProductRef }
      : { redirect: redirect === "/checkout" ? redirect : undefined, planRef };
  }

  if (planRef) return { redirect, planRef };
  if (addProductRef) return { redirect, addProductRef };
  return { redirect };
}

export function parseAuthContinuation(search: Record<string, unknown>): AuthContinuation {
  return normalizeAuthContinuation(search);
}

function hasContinuation(continuation: AuthContinuation) {
  return !!(continuation.redirect || continuation.addProductRef || continuation.planRef);
}

function readStoredContinuation(): AuthContinuation {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.sessionStorage.getItem(AUTH_CONTINUATION_KEY);
    return raw ? normalizeAuthContinuation(JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function storeContinuation(continuation: AuthContinuation) {
  if (typeof window === "undefined") return;

  if (hasContinuation(continuation)) {
    window.sessionStorage.setItem(AUTH_CONTINUATION_KEY, JSON.stringify(continuation));
  } else {
    window.sessionStorage.removeItem(AUTH_CONTINUATION_KEY);
  }
}

function clearStoredContinuation() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(AUTH_CONTINUATION_KEY);
  }
}

function resolvedContinuation(continuation: AuthContinuation) {
  const provided = normalizeAuthContinuation(continuation as Record<string, unknown>);
  return hasContinuation(provided) ? provided : readStoredContinuation();
}

function continuationSearch(continuation: AuthContinuation) {
  const normalized = normalizeAuthContinuation(continuation as Record<string, unknown>);
  storeContinuation(normalized);

  const search = new URLSearchParams();
  if (normalized.redirect) search.set("redirect", normalized.redirect);
  if (normalized.addProductRef) search.set("addProductRef", normalized.addProductRef);
  if (normalized.planRef) search.set("planRef", normalized.planRef);
  return search.toString();
}

export function loginUrlFor(continuation: AuthContinuation) {
  const suffix = continuationSearch(continuation);
  return `/login${suffix ? `?${suffix}` : ""}`;
}

export function signupUrlFor(continuation: AuthContinuation) {
  const normalized = resolvedContinuation(continuation);
  const suffix = continuationSearch(normalized);
  return `/signup${suffix ? `?${suffix}` : ""}`;
}

export function verifyEmailUrlFor(email: string, continuation: AuthContinuation) {
  const normalized = resolvedContinuation(continuation);
  const suffix = continuationSearch(normalized);
  const separator = suffix ? "&" : "";
  return `/verify-email?${suffix}${separator}email=${encodeURIComponent(email)}`;
}

export async function completeAuthContinuation(continuation: AuthContinuation, fallback = "/dashboard") {
  const normalized = resolvedContinuation(continuation);

  if (normalized.planRef) {
    clearStoredContinuation();
    return `/checkout?planRef=${encodeURIComponent(normalized.planRef)}`;
  }

  if (normalized.addProductRef) {
    await cartApi.addItem(normalized.addProductRef, 1);
    clearStoredContinuation();
    return "/cart";
  }

  const redirect = safeInternalRedirect(normalized.redirect, fallback);
  clearStoredContinuation();
  return redirect;
}
