import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Loader2,
  Lock,
  Package,
  Smartphone,
  Sparkles,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  cartApi,
  homeApi,
  ordersApi,
  paymentsApi,
  programsApi,
  subscriptionsApi,
  type ApiCart,
  type ApiPayment,
  type ApiPlanProgram,
} from "@/lib/api";
import { useAuthState } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";
import { apiAssetUrl } from "@/lib/env";
import { KENYA_COUNTIES } from "@/lib/kenya-counties";
import { programImage } from "@/lib/program-display";
import { CART_QUERY_KEY } from "@/lib/use-cart-count";
import { usePaymentStatus } from "@/lib/use-payment-status";

type Search = {
  planRef?: string;
  programRef?: string;
  paymentRef?: string;
  subscriptionRef?: string;
};

// Normalized descriptor so the checkout UI renders the same way for a subscription plan
// or a one-off program purchase.
type CheckoutItem = {
  name: string;
  description: string;
  price: number;
  meta: string;
  features: string[];
  programs?: ApiPlanProgram[];
  trialDays?: number;
  successCopy: string;
  successRedirect: string;
};

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    planRef: typeof search.planRef === "string" ? search.planRef : undefined,
    programRef: typeof search.programRef === "string" ? search.programRef : undefined,
    paymentRef: typeof search.paymentRef === "string" ? search.paymentRef : undefined,
    subscriptionRef:
      typeof search.subscriptionRef === "string" ? search.subscriptionRef : undefined,
  }),
  head: () => ({ meta: [{ title: "Checkout - Level Up Fitness" }] }),
  component: CheckoutPage,
});

const KSh = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);

/** Products check out from the cart; plans and programs go through the 3-step wizard. */
function CheckoutPage() {
  const search = Route.useSearch();
  if (!search.planRef && !search.programRef) return <CartCheckout />;
  return <SubscriptionCheckout />;
}

function SubscriptionCheckout() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { session, isHydrated } = useAuthState();
  const mode: "plan" | "program" = search.programRef ? "program" : "plan";
  const activeRef = search.programRef ?? search.planRef;
  const [step, setStep] = useState(search.paymentRef ? 2 : 0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const successHandled = useRef<string | null>(null);

  const planQuery = useQuery({
    queryKey: ["subscription-plan", search.planRef],
    queryFn: () => subscriptionsApi.getPlan(search.planRef!),
    enabled: mode === "plan" && !!search.planRef && !!session,
  });
  const programQuery = useQuery({
    queryKey: ["checkout-program", search.programRef],
    queryFn: async () => (await programsApi.get(search.programRef!)).data.program,
    enabled: mode === "program" && !!search.programRef && !!session,
  });

  const paymentQuery = usePaymentStatus(search.paymentRef);
  const activeQuery = mode === "program" ? programQuery : planQuery;

  const item = useMemo<CheckoutItem | null>(() => {
    if (mode === "program") {
      const program = programQuery.data;
      if (!program) return null;
      return {
        name: program.title,
        description: program.description,
        price: program.price,
        meta: "One-time program access",
        features: [],
        successCopy: "Program unlocked",
        successRedirect: `/programs/${encodeURIComponent(program.programRef)}`,
      };
    }
    const plan = planQuery.data;
    if (!plan) return null;
    return {
      name: plan.name,
      description: plan.description,
      price: Math.max(0, plan.price - (plan.discount ?? 0)),
      meta: `${plan.billingCycle} billing`,
      features: plan.features,
      programs: plan.programs ?? [],
      trialDays: plan.trialDays,
      successCopy: "Subscription activated",
      successRedirect: "/dashboard",
    };
  }, [mode, planQuery.data, programQuery.data]);

  const total = item?.price ?? 0;
  const backLink = mode === "program" && activeRef ? `/programs/${activeRef}` : "/plans";

  useEffect(() => {
    if (!isHydrated || session || !activeRef) return;
    const continuation =
      mode === "program"
        ? { redirect: "/checkout", programRef: activeRef }
        : { redirect: "/checkout", planRef: activeRef };
    window.location.assign(loginUrlFor(continuation));
  }, [isHydrated, session, activeRef, mode]);

  useEffect(() => {
    if (
      paymentQuery.data?.status !== "succeeded" ||
      successHandled.current === paymentQuery.data.paymentRef
    )
      return;
    successHandled.current = paymentQuery.data.paymentRef;
    const redirect = item?.successRedirect ?? "/dashboard";
    toast.success(item?.successCopy ?? "Payment confirmed", {
      description: "Your M-Pesa payment was confirmed.",
    });
    window.setTimeout(() => window.location.replace(redirect), 600);
  }, [paymentQuery.data, item]);

  async function initiateCheckout() {
    if (!item || !activeRef || !phoneNumber.trim()) return;
    setProcessing(true);
    try {
      let payment: ApiPayment | null;
      let nextSearch: Search;
      if (mode === "program") {
        const result = await programsApi.checkout(activeRef, phoneNumber.trim());
        payment = result.payment;
        nextSearch = { programRef: activeRef, paymentRef: result.payment?.paymentRef };
      } else {
        const result = await subscriptionsApi.checkout(activeRef, phoneNumber.trim());
        payment = result.payment;
        nextSearch = {
          planRef: activeRef,
          paymentRef: result.payment?.paymentRef,
          subscriptionRef: result.subscription.subscriptionRef,
        };
      }

      if (!payment) {
        toast.success(item.successCopy);
        window.location.replace(item.successRedirect);
        return;
      }
      await navigate({ to: "/checkout", search: nextSearch, replace: true });
      setStep(2);
      if (payment.status === "failed")
        toast.error("M-Pesa prompt could not be sent. Check the number and retry.");
      else
        toast.success("M-Pesa prompt sent", { description: "Approve the request on your phone." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment could not be started");
    } finally {
      setProcessing(false);
    }
  }

  const steps = [mode === "program" ? "Program" : "Plan", "M-Pesa", "Confirmation"] as const;

  if (!activeRef)
    return (
      <State
        backLink={backLink}
        title="Nothing to check out"
        message="Choose a subscription plan or a program before opening checkout."
      />
    );
  if (!isHydrated || !session || activeQuery.isLoading)
    return <Loading label={isHydrated ? "Loading checkout..." : "Restoring your session..."} />;
  if (activeQuery.isError || !item)
    return (
      <State
        backLink={backLink}
        title={mode === "program" ? "Program not available" : "Plan not available"}
        message={
          activeQuery.error instanceof Error
            ? activeQuery.error.message
            : "The selected item could not be found."
        }
      />
    );

  const payment = paymentQuery.data;
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      {mode === "program" && activeRef ? (
        <Link
          to="/programs/$slug"
          params={{ slug: activeRef }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to program
        </Link>
      ) : (
        <Link
          to="/plans"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to plans
        </Link>
      )}
      <header className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Secure checkout
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          {mode === "program" ? "Complete your purchase" : "Complete your subscription"}
        </h1>
      </header>
      <ol className="mt-8 flex items-center gap-3 text-sm sm:gap-6">
        {steps.map((label, index) => (
          <li key={label} className="flex items-center gap-3">
            <span
              className={`grid h-8 w-8 place-items-center rounded-full font-semibold ${index <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {index < step ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span className={index <= step ? "font-medium" : "text-muted-foreground"}>{label}</span>
            {index < 2 && <span className="hidden h-px w-10 bg-border sm:block" />}
          </li>
        ))}
      </ol>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <section className="card-elevated rounded-3xl p-6 sm:p-8">
          {step === 0 && (
            <div>
              <h2 className="font-display text-xl font-bold">
                Confirm your {mode === "program" ? "program" : "plan"}
              </h2>
              <p className="mt-3 text-muted-foreground">{item.description}</p>
              {item.features.length > 0 && (
                <ul className="mt-5 space-y-2 text-sm">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
              <IncludedPrograms programs={item.programs ?? []} />
            </div>
          )}
          {step === 1 && (
            <div>
              <h2 className="font-display text-xl font-bold">Pay with M-Pesa</h2>
              <div className="mt-5 rounded-2xl border border-[#43B02A] bg-[#43B02A]/10 p-5">
                <Smartphone className="h-6 w-6 text-[#43B02A]" />
                <p className="mt-2 font-semibold">M-Pesa</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the Safaricom number that should receive the payment prompt.
                </p>
              </div>
              <div className="mt-5 space-y-2">
                <Label htmlFor="mpesa-phone">M-Pesa phone number</Label>
                <Input
                  id="mpesa-phone"
                  inputMode="tel"
                  placeholder="0712 345 678"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                />
              </div>
            </div>
          )}
          {step === 2 && (
            <PaymentState
              status={payment?.status}
              loading={paymentQuery.isLoading}
              paymentRef={search.paymentRef}
              onRetry={() => {
                setStep(1);
                void navigate({
                  to: "/checkout",
                  search: mode === "program" ? { programRef: activeRef } : { planRef: activeRef },
                  replace: true,
                });
              }}
            />
          )}
          <div className="mt-8 flex justify-between gap-3">
            <Button
              variant="soft"
              disabled={
                step === 0 ||
                processing ||
                (!!search.paymentRef && payment?.status === "processing")
              }
              onClick={() => setStep((value) => Math.max(0, value - 1))}
            >
              Back
            </Button>
            {step === 0 && (
              <Button variant="hero" onClick={() => setStep(1)}>
                Continue
              </Button>
            )}
            {step === 1 && (
              <Button
                variant="mpesa"
                disabled={processing || phoneNumber.replace(/\D/g, "").length < 9}
                onClick={initiateCheckout}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}{" "}
                Pay {KSh(total)}
              </Button>
            )}
          </div>
        </section>
        <aside className="card-elevated sticky top-24 rounded-3xl p-6">
          <p className="inline-flex items-center gap-2 font-display text-lg font-bold">
            <Sparkles className="h-4 w-4 text-primary" />
            {item.name}
          </p>
          <p className="mt-1 text-sm capitalize text-muted-foreground">{item.meta}</p>
          <div className="my-5 border-t" />
          <div className="flex justify-between font-display text-xl font-bold">
            <span>Total</span>
            <span>{KSh(total)}</span>
          </div>
          {item.trialDays ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Includes {item.trialDays} trial days. Payment is collected at checkout.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

const emptyAddress = {
  fullName: "",
  phone: "",
  email: "",
  county: "",
  city: "",
  addressLine: "",
  instructions: "",
};

type AddressForm = typeof emptyAddress;
type AddressField = keyof AddressForm;

const REQUIRED_ADDRESS_FIELDS: AddressField[] = [
  "fullName",
  "phone",
  "county",
  "city",
  "addressLine",
];

function addressError(field: AddressField, value: string) {
  const trimmed = value.trim();
  if (REQUIRED_ADDRESS_FIELDS.includes(field) && !trimmed) return "Required";
  if (field === "phone" && trimmed && trimmed.replace(/\D/g, "").length < 9)
    return "Enter a valid phone number";
  if (field === "addressLine" && trimmed && trimmed.length < 3) return "Too short";
  return null;
}

function Field({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string | null;
} & Omit<React.ComponentProps<typeof Input>, "id" | "value" | "onChange" | "onBlur">) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Single-page product checkout: details and payment on the left, the bag on the right. */
function CartCheckout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, isHydrated } = useAuthState();
  const [address, setAddress] = useState<AddressForm>(emptyAddress);
  const [touched, setTouched] = useState<Partial<Record<AddressField, boolean>>>({});
  const [payMethod, setPayMethod] = useState<"mpesa" | "cash_on_delivery">("mpesa");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [promo, setPromo] = useState("");
  const [placing, setPlacing] = useState(false);
  const prefilled = useRef(false);

  const cartQuery = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: cartApi.get,
    enabled: !!session,
  });
  const deliveryQuery = useQuery({
    queryKey: ["public", "delivery-options"],
    queryFn: homeApi.deliveryOptions,
    staleTime: 300_000,
  });

  // Returning customers shouldn't retype what the account already knows. Runs once so it
  // never clobbers edits when the session object changes identity.
  useEffect(() => {
    if (prefilled.current || !session) return;
    prefilled.current = true;
    setAddress((current) => ({
      ...current,
      fullName: current.fullName || session.user.name || "",
      email: current.email || session.user.email || "",
      phone: current.phone || session.user.phone || "",
    }));
    setPhoneNumber((current) => current || session.user.phone || "");
  }, [session]);

  useEffect(() => {
    if (!isHydrated || session) return;
    window.location.assign(loginUrlFor({ redirect: "/checkout" }));
  }, [isHydrated, session]);

  const writeCart = (cart: ApiCart) => queryClient.setQueryData(CART_QUERY_KEY, cart);
  const setDelivery = useMutation({
    mutationFn: cartApi.setDeliveryMethod,
    onSuccess: writeCart,
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update delivery"),
  });
  const applyPromo = useMutation({
    mutationFn: cartApi.applyPromo,
    onSuccess: (cart) => {
      writeCart(cart);
      toast.success("Promo code applied");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not apply promo code"),
  });

  const cart = cartQuery.data;
  const items = cart?.items ?? [];
  const totals = cart?.totals;
  const deliveryMethod = cart?.deliveryMethod ?? "standard";

  const errors = REQUIRED_ADDRESS_FIELDS.reduce<Partial<Record<AddressField, string>>>(
    (acc, field) => {
      const error = addressError(field, address[field]);
      if (error) acc[field] = error;
      return acc;
    },
    {},
  );
  const phoneRequired = payMethod === "mpesa";
  const phoneValid = phoneNumber.replace(/\D/g, "").length >= 9;
  const canPlace =
    items.length > 0 &&
    Object.keys(errors).length === 0 &&
    agreed &&
    (!phoneRequired || phoneValid) &&
    !placing;

  async function placeOrder() {
    if (!canPlace) {
      setTouched(Object.fromEntries(REQUIRED_ADDRESS_FIELDS.map((field) => [field, true])));
      return;
    }
    setPlacing(true);
    try {
      const order = await ordersApi.create({
        deliveryMethod,
        shippingAddress: {
          fullName: address.fullName.trim(),
          phone: address.phone.trim(),
          email: address.email.trim() || null,
          county: address.county.trim(),
          city: address.city.trim(),
          addressLine: address.addressLine.trim(),
          instructions: address.instructions.trim() || null,
        },
      });
      const payment = await paymentsApi.initiate({
        orderRef: order.orderRef,
        method: payMethod,
        phoneNumber: phoneRequired ? phoneNumber.trim() : undefined,
      });
      void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      toast.success(payMethod === "cash_on_delivery" ? "Order placed" : "M-Pesa prompt sent", {
        description:
          payMethod === "cash_on_delivery"
            ? "Pay the rider on delivery."
            : "Approve the request on your phone.",
      });
      void navigate({
        to: "/orders/$orderRef",
        params: { orderRef: order.orderRef },
        // Only M-Pesa has something to watch. A cash-on-delivery payment is created
        // `pending` and stays there until an admin settles it, so handing its ref to the
        // confirmation page would just start a poll that never ends.
        search: { paymentRef: payMethod === "mpesa" ? payment?.paymentRef : undefined },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place your order");
    } finally {
      setPlacing(false);
    }
  }

  if (!isHydrated || !session || cartQuery.isLoading)
    return <Loading label={isHydrated ? "Loading checkout..." : "Restoring your session..."} />;
  if (cartQuery.isError)
    return (
      <State
        backLink="/cart"
        title="Checkout unavailable"
        message="We could not load your bag. Try again in a moment."
      />
    );
  if (!items.length)
    return (
      <State
        backLink="/shop"
        title="Your bag is empty"
        message="Add something to your bag before checking out."
      />
    );

  const bind = (field: AddressField) => ({
    value: address[field],
    onChange: (value: string) => setAddress((current) => ({ ...current, [field]: value })),
    onBlur: () => setTouched((current) => ({ ...current, [field]: true })),
    error: touched[field] ? errors[field] : undefined,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <Link
        to="/cart"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to bag
      </Link>
      <h1 className="mt-4 font-display text-5xl font-bold uppercase tracking-[-0.03em] sm:text-6xl">
        Checkout
      </h1>

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          <section>
            <h2 className="font-display text-xl font-bold">Information</h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Personal information
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field id="fullName" label="Full name" autoComplete="name" {...bind("fullName")} />
              <Field
                id="phone"
                label="Phone number"
                inputMode="tel"
                autoComplete="tel"
                {...bind("phone")}
              />
              <div className="sm:col-span-2">
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  {...bind("email")}
                />
              </div>
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Shipping information
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="county">County</Label>
                <Select
                  value={address.county}
                  onValueChange={(value) => {
                    setAddress((current) => ({ ...current, county: value }));
                    setTouched((current) => ({ ...current, county: true }));
                  }}
                >
                  <SelectTrigger id="county" aria-invalid={!!(touched.county && errors.county)}>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {KENYA_COUNTIES.map((county) => (
                      <SelectItem key={county} value={county}>
                        {county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.county && errors.county && (
                  <p className="text-xs font-medium text-destructive">{errors.county}</p>
                )}
              </div>
              <Field
                id="city"
                label="City / Town"
                autoComplete="address-level2"
                {...bind("city")}
              />
              <div className="sm:col-span-2">
                <Field
                  id="addressLine"
                  label="Delivery address"
                  autoComplete="street-address"
                  placeholder="Street, building, house number"
                  {...bind("addressLine")}
                />
              </div>
              <div className="sm:col-span-2">
                <Field
                  id="instructions"
                  label="Landmark or instructions (optional)"
                  {...bind("instructions")}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Delivery</h2>
            <div className="mt-4 space-y-2">
              {(deliveryQuery.data ?? []).map((option) => (
                <label
                  key={option.method}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${deliveryMethod === option.method ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
                >
                  <input
                    type="radio"
                    name="delivery"
                    className="accent-[var(--primary)]"
                    checked={deliveryMethod === option.method}
                    onChange={() => setDelivery.mutate(option.method)}
                    disabled={setDelivery.isPending}
                  />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="block text-xs text-muted-foreground">{option.eta}</span>
                  </span>
                  <span className="text-sm font-semibold">
                    {option.fee === 0 ? "Free" : KSh(option.fee)}
                  </span>
                </label>
              ))}
              {deliveryQuery.isError && (
                <p className="text-sm text-muted-foreground">
                  Delivery options unavailable — standard delivery will be applied.
                </p>
              )}
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Payment</h2>
            <div className="mt-4 space-y-2">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${payMethod === "mpesa" ? "border-[#43B02A] bg-[#43B02A]/10" : "border-border hover:bg-muted"}`}
              >
                <input
                  type="radio"
                  name="payment"
                  className="accent-[#43B02A]"
                  checked={payMethod === "mpesa"}
                  onChange={() => setPayMethod("mpesa")}
                />
                <Smartphone className="h-5 w-5 text-[#43B02A]" />
                <span className="flex-1 text-sm font-semibold">M-Pesa</span>
              </label>
              {payMethod === "mpesa" && (
                <div className="space-y-1.5 pl-4">
                  <Label htmlFor="mpesa-phone">M-Pesa phone number</Label>
                  <Input
                    id="mpesa-phone"
                    inputMode="tel"
                    placeholder="0712 345 678"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    aria-invalid={!!phoneNumber && !phoneValid}
                  />
                  {!!phoneNumber && !phoneValid && (
                    <p className="text-xs font-medium text-destructive">
                      Enter a valid Safaricom number
                    </p>
                  )}
                </div>
              )}
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${payMethod === "cash_on_delivery" ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
              >
                <input
                  type="radio"
                  name="payment"
                  className="accent-[var(--primary)]"
                  checked={payMethod === "cash_on_delivery"}
                  onChange={() => setPayMethod("cash_on_delivery")}
                />
                <Wallet className="h-5 w-5 text-primary" />
                <span className="flex-1 text-sm font-semibold">Cash on delivery</span>
              </label>
            </div>

            <label className="mt-5 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 accent-[var(--primary)]"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
              />
              <span className="text-muted-foreground">
                I agree to the delivery terms and to my details being used to process this order.
              </span>
            </label>

            <Button
              className="mt-5 w-full bg-foreground text-background hover:bg-foreground/90"
              size="lg"
              onClick={() => void placeOrder()}
              disabled={!canPlace}
            >
              {placing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Pay and place order
            </Button>
          </section>
        </div>

        <aside className="card-elevated sticky top-24 space-y-5 rounded-3xl p-6">
          <h2 className="font-display text-xl font-bold">Shopping bag ({items.length})</h2>
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.productRef} className="flex gap-3">
                {item.image ? (
                  <img
                    src={apiAssetUrl(item.image)}
                    alt=""
                    aria-hidden
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-muted">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold">{KSh(item.unitPrice * item.quantity)}</p>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <Input
              value={promo}
              onChange={(event) => setPromo(event.target.value)}
              placeholder="Promocode"
              aria-label="Promo code"
              className="h-9"
            />
            <Button
              variant="soft"
              size="sm"
              className="h-9"
              onClick={() => applyPromo.mutate(promo)}
              disabled={!promo.trim() || applyPromo.isPending}
            >
              Apply
            </Button>
          </div>

          <div className="space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{KSh(totals?.subtotal ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{totals?.deliveryFee ? KSh(totals.deliveryFee) : "Free"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>-{KSh(totals?.discount ?? 0)}</span>
            </div>
          </div>
          <div className="flex justify-between border-t pt-4 font-display text-xl font-bold">
            <span>Total:</span>
            <span>{KSh(totals?.total ?? 0)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

/** The programs a plan unlocks — buyers should see what they are paying for before paying. */
function IncludedPrograms({ programs }: { programs: ApiPlanProgram[] }) {
  if (!programs.length) return null;

  return (
    <div className="mt-6 border-t pt-5">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Programs included ({programs.length})
      </h3>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {programs.map((program) => (
          <li key={program.programRef}>
            <Link
              to="/programs/$slug"
              params={{ slug: program.programRef }}
              className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-muted"
            >
              <img
                src={programImage(program)}
                alt=""
                aria-hidden
                className="h-11 w-11 shrink-0 rounded-xl object-cover"
                loading="lazy"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{program.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {program.difficultyLevel} &middot; {program.duration}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PaymentState({
  status,
  loading,
  paymentRef,
  onRetry,
}: {
  status?: string;
  loading: boolean;
  paymentRef?: string;
  onRetry: () => void;
}) {
  if (loading || !status) return <Loading label="Checking payment status..." compact />;
  if (status === "succeeded")
    return (
      <div className="text-center">
        <Check className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-4 font-display text-2xl font-bold">Payment confirmed</h2>
        <p className="mt-2 text-sm text-muted-foreground">Unlocking your access...</p>
      </div>
    );
  if (status === "cancelled")
    return (
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold">M-Pesa prompt cancelled</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No money was collected. You can send a new prompt when ready.
        </p>
        <Button className="mt-5" variant="hero" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  if (status === "failed")
    return (
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold">Payment was not completed</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The prompt timed out or Safaricom could not complete it.
        </p>
        <Button className="mt-5" variant="hero" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  return (
    <div className="text-center">
      <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
      <h2 className="mt-4 font-display text-2xl font-bold">Approve the M-Pesa prompt</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Keep this page open while Safaricom confirms your payment.
      </p>
      <p className="mt-4 text-xs text-muted-foreground">Payment: {paymentRef}</p>
    </div>
  );
}

function Loading({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div
      className={`${compact ? "py-10" : "mx-auto max-w-2xl px-6 py-20"} text-center text-muted-foreground`}
    >
      <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
function State({ title, message, backLink }: { title: string; message: string; backLink: string }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      <Button asChild className="mt-6" variant="hero">
        <a href={backLink}>Go back</a>
      </Button>
    </div>
  );
}
