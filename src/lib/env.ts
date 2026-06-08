const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

export const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || "http://localhost:8002");
export const API_PREFIX = `/${trimSlashes(import.meta.env.VITE_API_PREFIX || "/api/v1")}`;
export const API_URL = `${API_BASE_URL}${API_PREFIX}`;
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export function apiAssetUrl(path?: string | null) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
