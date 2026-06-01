import { cartApi, subscriptionsApi } from "@/lib/api";

export type AuthContinuation = {
  redirect?: string;
  addProductRef?: string;
  planRef?: string;
};

export function loginUrlFor(continuation: AuthContinuation) {
  const search = new URLSearchParams();
  if (continuation.redirect) search.set("redirect", continuation.redirect);
  if (continuation.addProductRef) search.set("addProductRef", continuation.addProductRef);
  if (continuation.planRef) search.set("planRef", continuation.planRef);
  const suffix = search.toString();
  return `/login${suffix ? `?${suffix}` : ""}`;
}

export function registerUrlFor(continuation: AuthContinuation) {
  const search = new URLSearchParams();
  if (continuation.redirect) search.set("redirect", continuation.redirect);
  if (continuation.addProductRef) search.set("addProductRef", continuation.addProductRef);
  if (continuation.planRef) search.set("planRef", continuation.planRef);
  const suffix = search.toString();
  return `/register${suffix ? `?${suffix}` : ""}`;
}

export async function completeAuthContinuation(continuation: AuthContinuation) {
  if (continuation.addProductRef) {
    await cartApi.addItem(continuation.addProductRef, 1);
    return "/cart";
  }

  if (continuation.planRef) {
    await subscriptionsApi.subscribe(continuation.planRef);
    return "/dashboard";
  }

  return continuation.redirect || "/dashboard";
}
