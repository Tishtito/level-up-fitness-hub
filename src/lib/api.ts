import {
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
  updateAuthUser,
  type AuthSession,
  type AuthUser,
} from "@/lib/auth";
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

type ApiErrorPayload = {
  success?: false;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  message?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type RegisterPendingVerification = {
  user: AuthSession["user"];
  verificationRequired: true;
};

/** Mirrors updateProfileSchema on the API. `null` clears; an omitted key is left alone. */
export type UpdateProfileInput = {
  name?: string;
  phone?: string | null;
  avatarUrl?: string | null;
};

export type ApiProduct = {
  productRef: string;
  name: string;
  description: string;
  category:
    | "supplements"
    | "gym_apparel"
    | "fitness_equipment"
    | "resistance_bands"
    | "water_bottles"
    | "protein_shakers"
    | "accessories";
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

export type ApiVideoStatus = "uploading" | "processing" | "ready" | "error";

export type ApiProgramVideo = {
  title: string;
  /** Cloudflare Stream video id. Not a credential — playback requires a signed token. */
  uid: string;
  status: ApiVideoStatus;
  durationSeconds?: number | null;
  thumbnailUrl?: string | null;
  sizeBytes?: number | null;
  /**
   * Short-lived signed Cloudflare embed URL. Attached by the API only for entitled viewers,
   * and only once the video is `ready`, so its presence is the signal that it can be played.
   */
  embedUrl?: string;
};

export type CreateVideoUploadInput = {
  title: string;
  sizeBytes: number;
  durationSeconds?: number;
};

export type ApiProgramAccessReason = "free" | "staff" | "purchase" | "subscription" | "none";

export type ApiProgramAccess = {
  hasAccess: boolean;
  reason: ApiProgramAccessReason;
  subscriptionRequired: boolean;
};

export type ApiProgram = {
  programRef: string;
  title: string;
  description: string;
  /** Category slug; labels resolve through useProgramCategories(). */
  category: string;
  difficultyLevel: string;
  duration: string;
  price: number;
  thumbnail?: string | null;
  trainer?: string | null;
  workoutSchedule: string[];
  // Gated content: present only when the viewer is entitled (see `access`). The public
  // catalog/list endpoints omit these entirely.
  videos?: ApiProgramVideo[];
  nutritionNotes?: string | null;
  status: "draft" | "active" | "inactive";
  subscriptionRequired: boolean;
  // Only the trainer dashboard returns the raw list; catalog and detail endpoints expose
  // counts instead, so buyers' user refs are never sent to the public storefront.
  enrolledUsers?: string[];
  enrolledCount?: number;
  videoCount?: number;
  // Present on the single-program detail endpoint; describes the viewer's entitlement.
  access?: ApiProgramAccess;
};

export type ApiTrainerProfile = {
  trainerRef: string;
  userRef: string;
  name: string | null;
  email: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  userRole?: string | null;
  userStatus?: "active" | "inactive" | "suspended" | null;
  bio?: string | null;
  specialties: string[];
  certifications: string[];
  hourlyRate: number;
  status: "pending" | "verified" | "inactive";
  assignedPrograms: string[];
  assignedClients: string[];
  earningsTotal: number;
  createdAt: string;
  updatedAt: string;
};

export type ApiTrainerClient = {
  userRef: string;
  name: string;
  email: string;
  programRefs: string[];
};

export type ApiTrainerDashboard = {
  trainer: ApiTrainerProfile;
  programs: ApiProgram[];
  clients: ApiTrainerClient[];
  summary: {
    assignedPrograms: number;
    activePrograms: number;
    assignedClients: number;
    earningsTotal: number;
    hourlyRate: number;
  };
};

/** Compact program projection joined onto a plan by GET /subscriptions/plans. */
export type ApiPlanProgram = Pick<
  ApiProgram,
  "programRef" | "title" | "thumbnail" | "category" | "difficultyLevel" | "duration"
>;

export type ApiSubscriptionPlan = {
  planRef: string;
  name: string;
  description: string;
  price: number;
  billingCycle: "monthly" | "quarterly" | "yearly";
  features: string[];
  programAccess: string[];
  // Resolved from programAccess by the plans list endpoint. Absent on plans that come from
  // /public/home, which still returns bare refs.
  programs?: ApiPlanProgram[];
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

export type ApiDeliveryMethod = "standard" | "express" | "pickup";

export type ApiDeliveryOption = {
  method: ApiDeliveryMethod;
  label: string;
  eta: string;
  fee: number;
};

export type ApiShippingAddress = {
  fullName: string;
  phone: string;
  email?: string | null;
  county: string;
  city: string;
  addressLine: string;
  instructions?: string | null;
};

export type ApiCartItem = {
  productRef: string;
  quantity: number;
  unitPrice: number;
  name: string;
  image?: string | null;
  // Projected from the product on read, so the UI can cap its quantity stepper.
  stockQuantity?: number;
};

export type ApiCart = {
  cartRef: string;
  userRef: string;
  items: ApiCartItem[];
  promoCode?: string | null;
  deliveryMethod: ApiDeliveryMethod;
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
  shippingAddress: ApiShippingAddress;
  deliveryMethod: ApiDeliveryMethod;
  // Payment sits on its own axis: a cash-on-delivery order is fulfilled while still unpaid,
  // so `status` alone never tells you whether the money has landed.
  paymentMethod?: "mpesa" | "cash_on_delivery" | null;
  paymentStatus?: "unpaid" | "paid" | "failed" | "refunded";
  paidAt?: string | null;
  userEmail?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiPayment = {
  paymentRef: string;
  userRef: string;
  orderRef?: string | null;
  subscriptionRef?: string | null;
  appointmentRef?: string | null;
  amount: number;
  method: "mpesa" | "card" | "paypal" | "cash_on_delivery";
  status: "pending" | "processing" | "succeeded" | "failed" | "cancelled" | "refunded";
  transactionReference?: string | null;
  providerRequestId?: string | null;
  purpose?:
    | "order_purchase"
    | "subscription_create"
    | "subscription_renew"
    | "subscription_change"
    | "program_purchase"
    | null;
  programRef?: string | null;
  targetPlanRef?: string | null;
};

export type ApiWellnessService = {
  serviceRef: string;
  name: string;
  description: string;
  type: "nutritionist" | "physiotherapy" | "medical_assessment";
  specialist: string;
  location: string;
  price: number;
  duration: number;
  availableDays: string[];
  availableTimeSlots: string[];
  status: "active" | "inactive";
};

export type ApiAppointment = {
  appointmentRef: string;
  userRef: string;
  serviceRef: string;
  specialist: string;
  scheduledAt: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "attended" | "no_show";
  notes?: string | null;
  userEmail?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiHomeOverview = {
  stats: {
    activeMembers: number;
    activePrograms: number;
    verifiedTrainers: number;
    activeServices: number;
  };
  programs: Array<ApiProgram & { enrollmentCount: number }>;
  plans: Array<ApiSubscriptionPlan & { subscriberCount: number }>;
  products: ApiProduct[];
  services: ApiWellnessService[];
};

export type ApiCustomerDashboard = {
  profile: {
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    status: string;
    emailVerified: boolean;
  };
  summary: {
    activePlans: number;
    accessiblePrograms: number;
    upcomingBookings: number;
    recentOrders: number;
    unreadNotifications: number;
  };
  primarySubscription: ApiDashboardSubscription | null;
  subscriptions: ApiDashboardSubscription[];
  programs: ApiDashboardProgram[];
  appointments: ApiDashboardAppointment[];
  orders: ApiDashboardOrder[];
  notifications: ApiDashboardNotification[];
};

export type ApiDashboardSubscription = {
  subscriptionRef: string;
  status: ApiUserSubscription["status"];
  startedAt: string;
  currentPeriodEnd: string;
  amountPaid: number;
  plan: Pick<
    ApiSubscriptionPlan,
    | "planRef"
    | "name"
    | "description"
    | "billingCycle"
    | "features"
    | "programAccess"
    | "trialDays"
    | "discount"
    | "status"
  > | null;
};

export type ApiDashboardProgram = Omit<ApiProgram, "trainer" | "enrolledUsers" | "status"> & {
  access: { viaSubscription: boolean; enrolled: boolean };
  trainer: { trainerRef: string; name: string | null; avatarUrl: string | null } | null;
};

export type ApiDashboardAppointment = {
  appointmentRef: string;
  scheduledAt: string;
  status: ApiAppointment["status"];
  specialist: string;
  notes: string | null;
  service: Pick<
    ApiWellnessService,
    "serviceRef" | "name" | "type" | "location" | "price" | "duration"
  > | null;
};

export type ApiDashboardOrder = {
  orderRef: string;
  items: Array<ApiCartItem & { total: number }>;
  itemCount: number;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: ApiOrder["status"];
  createdAt: string;
  invoicePath: string;
};

export type ApiDashboardNotification = {
  notificationRef: string;
  title: string;
  message: string;
  type: string;
  channel: string;
  createdAt: string;
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

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const session = getAuthSession();
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

  if (session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);
  if (options.body !== undefined && !isFormData) headers.set("Content-Type", "application/json");

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    body:
      options.body === undefined || isFormData
        ? (options.body as BodyInit | undefined)
        : JSON.stringify(options.body),
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | ApiErrorPayload
    | null;

  if (!response.ok || !payload || ("success" in payload && payload.success === false)) {
    if (response.status === 401) clearAuthSession();
    const errorPayload = payload as ApiErrorPayload | null;
    throw new ApiError(
      errorPayload?.error?.message ||
        errorPayload?.message ||
        `Request failed with status ${response.status}`,
      response.status,
      errorPayload?.error?.code,
      errorPayload?.error?.details,
    );
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
    const response = await apiRequest<AuthSession | RegisterPendingVerification>("/auth/register", {
      method: "POST",
      body: input,
    });
    if ("accessToken" in response.data) saveAuthSession(response.data);
    return response.data;
  },

  async verifyEmail(input: { email: string; code: string }) {
    const response = await apiRequest<AuthSession>("/auth/verify-email", {
      method: "POST",
      body: input,
    });
    saveAuthSession(response.data);
    return response.data;
  },

  async resendVerificationCode(email: string) {
    const response = await apiRequest<{ verificationCodeSent: boolean }>(
      "/auth/resend-verification-code",
      {
        method: "POST",
        body: { email },
      },
    );
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await apiRequest<{ resetInstructionsSent: boolean }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
    });
    return response.data;
  },

  async resetPassword(input: { email: string; code: string; password: string }) {
    const response = await apiRequest<{ reset: boolean }>("/auth/reset-password", {
      method: "POST",
      body: input,
    });
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

  /** Authoritative current user. Prefer this over the cached session when seeding a form. */
  async me() {
    const response = await apiRequest<{ user: AuthUser }>("/auth/me");
    return response.data.user;
  },

  // `null` clears an optional field; omit a key to leave it untouched. Email, password, role and
  // status are not editable here — email has no re-verification flow and password has its own
  // endpoint requiring the current one.
  async updateProfile(input: UpdateProfileInput) {
    const response = await apiRequest<{ user: AuthUser }>("/auth/profile", {
      method: "PATCH",
      body: input,
    });
    // Keep the stored session in step so the navbar reflects the change immediately.
    updateAuthUser(response.data.user);
    return response.data.user;
  },

  // The API revokes every refresh token on success, so other devices are signed out.
  async changePassword(currentPassword: string, newPassword: string) {
    const response = await apiRequest<{ passwordChanged: boolean }>("/auth/change-password", {
      method: "PATCH",
      body: { currentPassword, newPassword },
    });
    return response.data;
  },
};

export const productsApi = {
  publicList(params: Record<string, string | number | boolean | undefined> = {}) {
    return apiRequest<{ products: ApiProduct[] }>(`/products/public${queryString(params)}`);
  },

  async get(productRef: string) {
    const response = await apiRequest<{ product: ApiProduct }>(
      `/products/${encodeURIComponent(productRef)}`,
    );
    return response.data.product;
  },
};

export type ApiOrganisationType = "company" | "school" | "ngo" | "government";

export type ApiEnquiryInput = {
  organisationName: string;
  organisationType: ApiOrganisationType;
  contactName: string;
  email: string;
  phone?: string | null;
  county: string;
  city?: string | null;
  headcount?: number | null;
  preferredDate?: string | null;
  budget?: number | null;
  message: string;
  /** Honeypot — hidden in the UI, always empty for a real person. */
  website?: string | null;
};

export type ApiEnquiry = ApiEnquiryInput & {
  enquiryRef: string;
  status: "new" | "contacted" | "closed";
  createdAt?: string;
};

export const homeApi = {
  async getOverview() {
    const response = await apiRequest<ApiHomeOverview>("/public/home");
    return response.data;
  },

  async deliveryOptions() {
    const response = await apiRequest<{ deliveryOptions: ApiDeliveryOption[] }>(
      "/public/delivery-options",
    );
    return response.data.deliveryOptions;
  },
};

export const dashboardApi = {
  async getOverview() {
    const response = await apiRequest<ApiCustomerDashboard>("/dashboard/me");
    return response.data;
  },
};

export type ApiProgramCategory = {
  categoryRef: string;
  slug: string;
  name: string;
  description?: string | null;
  status: "active" | "inactive";
  sortOrder: number;
};

export const programCategoriesApi = {
  // /public is active-only and sorted by sortOrder server-side.
  publicList(params: Record<string, string | number | undefined> = {}) {
    return apiRequest<{ categories: ApiProgramCategory[] }>(
      `/program-categories/public${queryString(params)}`,
    );
  },
};

export const programsApi = {
  publicList(params: Record<string, string | number | undefined> = {}) {
    return apiRequest<{ programs: ApiProgram[] }>(`/programs/public${queryString(params)}`);
  },

  get(programRef: string) {
    return apiRequest<{ program: ApiProgram }>(`/programs/${encodeURIComponent(programRef)}`);
  },

  async checkout(programRef: string, phoneNumber: string) {
    const response = await apiRequest<{ program: ApiProgram; payment: ApiPayment | null }>(
      `/programs/${encodeURIComponent(programRef)}/checkout`,
      {
        method: "POST",
        body: { phoneNumber },
      },
    );
    return response.data;
  },
};

export const trainerPortalApi = {
  async dashboard() {
    const response = await apiRequest<ApiTrainerDashboard>("/trainers/me");
    return response.data;
  },

  async updateContent(
    programRef: string,
    payload: { workoutSchedule: string[]; nutritionNotes?: string },
  ) {
    const response = await apiRequest<{ program: ApiProgram }>(
      `/trainers/me/programs/${encodeURIComponent(programRef)}/content`,
      {
        method: "PATCH",
        body: payload,
      },
    );
    return response.data.program;
  },

  async uploadThumbnail(programRef: string, file: File) {
    const body = new FormData();
    body.append("thumbnail", file);
    const response = await apiRequest<{ program: ApiProgram }>(
      `/trainers/me/programs/${encodeURIComponent(programRef)}/thumbnail`,
      {
        method: "POST",
        body,
      },
    );
    return response.data.program;
  },

  /** Reserves a one-time Cloudflare tus endpoint; the browser uploads to it directly. */
  async createVideoUpload(programRef: string, input: CreateVideoUploadInput) {
    const response = await apiRequest<{ program: ApiProgram; uid: string; uploadUrl: string }>(
      `/trainers/me/programs/${encodeURIComponent(programRef)}/videos/upload-url`,
      { method: "POST", body: input },
    );
    return response.data;
  },

  async confirmVideo(programRef: string, uid: string) {
    const response = await apiRequest<{ program: ApiProgram }>(
      `/trainers/me/programs/${encodeURIComponent(programRef)}/videos/${uid}/confirm`,
      { method: "POST" },
    );
    return response.data.program;
  },

  async removeVideo(programRef: string, uid: string) {
    const response = await apiRequest<{ program: ApiProgram }>(
      `/trainers/me/programs/${encodeURIComponent(programRef)}/videos`,
      {
        method: "DELETE",
        body: { uid },
      },
    );
    return response.data.program;
  },
};

export const servicesApi = {
  publicList(params: Record<string, string | number | undefined> = {}) {
    return apiRequest<{ services: ApiWellnessService[] }>(`/services/public${queryString(params)}`);
  },
};

export const appointmentsApi = {
  async book(input: {
    serviceRef: string;
    scheduledAt: string;
    specialist?: string;
    notes?: string;
  }) {
    const response = await apiRequest<{ appointment: ApiAppointment }>("/appointments", {
      method: "POST",
      body: input,
    });
    return response.data.appointment;
  },

  upcoming(params: Record<string, string | number | undefined> = {}) {
    return apiRequest<{ appointments: ApiAppointment[] }>(
      `/appointments/upcoming${queryString(params)}`,
    );
  },

  /** The caller's full history, past included. `/upcoming` pins `from` to now. */
  mine(params: Record<string, string | number | undefined> = {}) {
    return apiRequest<{ appointments: ApiAppointment[] }>(`/appointments/me${queryString(params)}`);
  },

  async cancel(appointmentRef: string) {
    const response = await apiRequest<{ appointment: ApiAppointment }>(
      `/appointments/${encodeURIComponent(appointmentRef)}/cancel`,
      { method: "PATCH" },
    );
    return response.data.appointment;
  },

  /** Moves the appointment and resets it to `pending` for re-approval. */
  async reschedule(appointmentRef: string, scheduledAt: string) {
    const response = await apiRequest<{ appointment: ApiAppointment }>(
      `/appointments/${encodeURIComponent(appointmentRef)}/reschedule`,
      { method: "PATCH", body: { scheduledAt } },
    );
    return response.data.appointment;
  },
};

export const subscriptionsApi = {
  plans(params: Record<string, string | number | undefined> = {}) {
    return apiRequest<{ plans: ApiSubscriptionPlan[] }>(
      `/subscriptions/plans${queryString(params)}`,
    );
  },

  async getPlan(planRef: string) {
    const response = await apiRequest<{ plans: ApiSubscriptionPlan[] }>(
      `/subscriptions/plans${queryString({ status: "active", limit: 100 })}`,
    );
    const plan = response.data.plans.find((item) => item.planRef === planRef);
    if (!plan) throw new Error("Subscription plan not found");
    return plan;
  },

  list(params: Record<string, string | number | undefined> = {}) {
    return apiRequest<{ subscriptions: ApiUserSubscription[] }>(
      `/subscriptions${queryString(params)}`,
    );
  },

  async subscribe(planRef: string) {
    const response = await apiRequest<{ subscription: ApiUserSubscription }>(
      "/subscriptions/subscribe",
      {
        method: "POST",
        body: { planRef },
      },
    );
    return response.data.subscription;
  },

  async checkout(planRef: string, phoneNumber: string) {
    const response = await apiRequest<{
      subscription: ApiUserSubscription;
      payment: ApiPayment | null;
    }>("/subscriptions/checkout", {
      method: "POST",
      body: { planRef, phoneNumber },
    });
    return response.data;
  },

  async renewCheckout(subscriptionRef: string, phoneNumber: string) {
    const response = await apiRequest<{
      subscription: ApiUserSubscription;
      payment: ApiPayment | null;
    }>(`/subscriptions/${encodeURIComponent(subscriptionRef)}/renew/checkout`, {
      method: "POST",
      body: { phoneNumber },
    });
    return response.data;
  },

  async changePlanCheckout(subscriptionRef: string, planRef: string, phoneNumber: string) {
    const response = await apiRequest<{
      subscription: ApiUserSubscription;
      payment: ApiPayment | null;
    }>(`/subscriptions/${encodeURIComponent(subscriptionRef)}/change-plan/checkout`, {
      method: "POST",
      body: { planRef, phoneNumber },
    });
    return response.data;
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
    const response = await apiRequest<{ cart: ApiCart }>(`/cart/items/${productRef}`, {
      method: "DELETE",
    });
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

  async setDeliveryMethod(deliveryMethod: ApiDeliveryMethod) {
    const response = await apiRequest<{ cart: ApiCart }>("/cart/delivery-method", {
      method: "PATCH",
      body: { deliveryMethod },
    });
    return response.data.cart;
  },
};

export const ordersApi = {
  async create(input: {
    shippingAddress: ApiShippingAddress;
    deliveryMethod?: ApiDeliveryMethod;
    paymentMethod?: "mpesa" | "cash_on_delivery";
  }) {
    const response = await apiRequest<{ order: ApiOrder }>("/orders", {
      method: "POST",
      body: input,
    });
    return response.data.order;
  },

  async get(orderRef: string) {
    const response = await apiRequest<{ order: ApiOrder }>(
      `/orders/${encodeURIComponent(orderRef)}`,
    );
    return response.data.order;
  },

  /** The caller's own orders, newest first. Returns the envelope for its `pagination`. */
  list(params: Record<string, string | number | undefined> = {}) {
    return apiRequest<{ orders: ApiOrder[] }>(`/orders/me${queryString(params)}`);
  },

  async cancel(orderRef: string) {
    const response = await apiRequest<{ order: ApiOrder }>(
      `/orders/${encodeURIComponent(orderRef)}/cancel`,
      { method: "PATCH" },
    );
    return response.data.order;
  },

  async invoice(orderRef: string) {
    const response = await apiRequest<{ invoice: Record<string, unknown> }>(
      `/orders/${encodeURIComponent(orderRef)}/invoice`,
    );
    return response.data.invoice;
  },
};

export const paymentsApi = {
  async initiate(input: {
    orderRef: string;
    method: "mpesa" | "cash_on_delivery";
    phoneNumber?: string;
  }) {
    const response = await apiRequest<{ payment: ApiPayment }>("/payments/initiate", {
      method: "POST",
      body: input,
    });
    return response.data.payment;
  },

  async status(paymentRef: string) {
    const response = await apiRequest<{ payment: ApiPayment }>(
      `/payments/${encodeURIComponent(paymentRef)}/status`,
    );
    return response.data.payment;
  },

  async verify(paymentRef: string) {
    const response = await apiRequest<{ payment: ApiPayment }>("/payments/verify", {
      method: "POST",
      body: { paymentRef },
    });
    return response.data.payment;
  },
};

export const enquiriesApi = {
  /** Public endpoint — no session required. */
  async create(input: ApiEnquiryInput) {
    const response = await apiRequest<{ enquiry: ApiEnquiry }>("/enquiries", {
      method: "POST",
      body: input,
    });
    return response.data.enquiry;
  },
};
