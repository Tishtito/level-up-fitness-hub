import { clearAuthSession, getAuthSession, saveAuthSession, type AuthSession } from "@/lib/auth";
import { API_URL } from "@/lib/env";

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
};

export type ApiProduct = {
  productRef: string;
  name: string;
  description: string;
  category: "supplements" | "gym_apparel" | "fitness_equipment" | "resistance_bands" | "water_bottles" | "protein_shakers" | "accessories";
  price: number;
  discountPrice?: number | null;
  images: string[];
  stockQuantity: number;
  sku: string;
  brand?: string | null;
  rating: number;
  status: "active" | "inactive" | "draft";
  lowStockThreshold: number;
};

export type ApiProgramVideo = {
  title: string;
  url: string;
  type?: string | null;
};

export type ApiProgram = {
  programRef: string;
  title: string;
  description: string;
  category: "body_transformation" | "lose_weight" | "gain_weight_muscle_building";
  difficultyLevel: string;
  duration: string;
  price: number;
  thumbnail?: string | null;
  trainer?: string | null;
  workoutSchedule: string[];
  videos: ApiProgramVideo[];
  nutritionNotes?: string | null;
  status: "draft" | "active" | "inactive";
  subscriptionRequired: boolean;
  enrolledUsers?: string[];
};

export type ApiSubscriptionPlan = {
  planRef: string;
  name: string;
  description: string;
  price: number;
  billingCycle: "monthly" | "quarterly" | "yearly";
  features: string[];
  programAccess: string[];
  status: "active" | "inactive";
  trialDays: number;
  discount: number;
};

export type ApiUserSubscription = {
  subscriptionRef: string;
  userRef: string;
  planRef: string;
  status: "active" | "cancelled" | "expired" | "pending";
  startedAt: string;
  currentPeriodEnd: string;
  cancelledAt?: string | null;
  amountPaid: number;
};

export type ApiCartItem = {
  productRef: string;
  quantity: number;
  unitPrice: number;
  name: string;
  image?: string | null;
};

export type ApiCart = {
  cartRef: string;
  userRef: string;
  items: ApiCartItem[];
  promoCode?: string | null;
  totals: {
    subtotal: number;
    discount: number;
    deliveryFee: number;
    total: number;
  };
};

export type ApiOrder = {
  orderRef: string;
  userRef: string;
  items: Array<ApiCartItem & { total: number }>;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
};

export type ApiPayment = {
  paymentRef: string;
  userRef: string;
  orderRef?: string | null;
  subscriptionRef?: string | null;
  appointmentRef?: string | null;
  amount: number;
  method: "mpesa" | "card" | "paypal" | "cash_on_delivery";
  status: "pending" | "processing" | "succeeded" | "failed" | "refunded";
  transactionReference?: string | null;
};

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

function buildUrl(path: string) {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function queryString(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `?${value}` : "";
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
  const session = getAuthSession();
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

  if (session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);
  if (options.body !== undefined && !isFormData) headers.set("Content-Type", "application/json");

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    body: options.body === undefined || isFormData ? (options.body as BodyInit | undefined) : JSON.stringify(options.body),
  });

  const payload = await response.json().catch(() => null) as ApiResponse<T> | { message?: string } | null;

  if (!response.ok || !payload || ("success" in payload && payload.success === false)) {
    if (response.status === 401) clearAuthSession();
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return payload as ApiResponse<T>;
}

export const authApi = {
  async login(email: string, password: string) {
    const response = await apiRequest<AuthSession>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    saveAuthSession(response.data);
    return response.data;
  },

  async googleCustomerLogin(credential: string) {
    const response = await apiRequest<AuthSession>("/auth/google/customer", {
      method: "POST",
      body: { credential },
    });
    saveAuthSession(response.data);
    return response.data;
  },

  async register(input: { name: string; email: string; password: string; phone?: string }) {
    const response = await apiRequest<AuthSession>("/auth/register", {
      method: "POST",
      body: input,
    });
    saveAuthSession(response.data);
    return response.data;
  },

  async logout() {
    const session = getAuthSession();
    if (session?.accessToken) {
      await apiRequest<{ loggedOut: boolean }>("/auth/logout", {
        method: "POST",
        body: { refreshToken: session.refreshToken },
      }).catch(() => undefined);
    }
    clearAuthSession();
  },
};

export const productsApi = {
  publicList(params: Record<string, string | number | undefined> = {}) {
    return apiRequest<{ products: ApiProduct[] }>(`/products/public${queryString(params)}`);
  },
};

export const programsApi = {
  publicList(params: Record<string, string | number | undefined> = {}) {
    return apiRequest<{ programs: ApiProgram[] }>(`/programs/public${queryString(params)}`);
  },
};

export const subscriptionsApi = {
  plans(params: Record<string, string | number | undefined> = {}) {
    return apiRequest<{ plans: ApiSubscriptionPlan[] }>(`/subscriptions/plans${queryString(params)}`);
  },

  list(params: Record<string, string | number | undefined> = {}) {
    return apiRequest<{ subscriptions: ApiUserSubscription[] }>(`/subscriptions${queryString(params)}`);
  },

  async subscribe(planRef: string) {
    const response = await apiRequest<{ subscription: ApiUserSubscription }>("/subscriptions/subscribe", {
      method: "POST",
      body: { planRef },
    });
    return response.data.subscription;
  },
};

export const cartApi = {
  async get() {
    const response = await apiRequest<{ cart: ApiCart }>("/cart");
    return response.data.cart;
  },

  async addItem(productRef: string, quantity = 1) {
    const response = await apiRequest<{ cart: ApiCart }>("/cart/items", {
      method: "POST",
      body: { productRef, quantity },
    });
    return response.data.cart;
  },

  async updateItem(productRef: string, quantity: number) {
    const response = await apiRequest<{ cart: ApiCart }>("/cart/items", {
      method: "PATCH",
      body: { productRef, quantity },
    });
    return response.data.cart;
  },

  async removeItem(productRef: string) {
    const response = await apiRequest<{ cart: ApiCart }>(`/cart/items/${productRef}`, { method: "DELETE" });
    return response.data.cart;
  },

  async clear() {
    const response = await apiRequest<{ cart: ApiCart }>("/cart", { method: "DELETE" });
    return response.data.cart;
  },

  async applyPromo(promoCode: string) {
    const response = await apiRequest<{ cart: ApiCart }>("/cart/promo-code", {
      method: "POST",
      body: { promoCode },
    });
    return response.data.cart;
  },
};

export const ordersApi = {
  async create(shippingAddress: Record<string, unknown> = {}) {
    const response = await apiRequest<{ order: ApiOrder }>("/orders", {
      method: "POST",
      body: { shippingAddress },
    });
    return response.data.order;
  },
};

export const paymentsApi = {
  async initiate(input: { orderRef?: string; subscriptionRef?: string; amount: number; method: ApiPayment["method"]; phoneNumber?: string }) {
    const response = await apiRequest<{ payment: ApiPayment }>("/payments/initiate", {
      method: "POST",
      body: input,
    });
    return response.data.payment;
  },

  async bypassComplete(input: { orderRef: string; amount: number; method: Exclude<ApiPayment["method"], "cash_on_delivery">; phoneNumber?: string }) {
    const response = await apiRequest<{ payment: ApiPayment }>("/payments/bypass-complete", {
      method: "POST",
      body: input,
    });
    return response.data.payment;
  },
};
