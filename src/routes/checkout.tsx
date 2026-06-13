import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, Check, CreditCard, Loader2, Lock, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { subscriptionsApi } from "@/lib/api";
import { useAuthState } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";

type Search = { planRef?: string };

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    planRef: typeof search.planRef === "string" ? search.planRef : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Checkout - Level Up Fitness" },
      { name: "description", content: "Review your subscription plan and complete checkout." },
    ],
  }),
  component: CheckoutPage,
});

const steps = ["Plan", "Payment", "Review"] as const;

type PaymentMethod = "card" | "wallet" | "bank";

const KSh = (value: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);

function planAmount(price = 0, discount = 0) {
  return Math.max(0, price - discount);
}

function billingLabel(cycle?: string) {
  if (cycle === "monthly") return "Monthly, auto-renews";
  if (cycle === "quarterly") return "Quarterly, auto-renews";
  if (cycle === "yearly") return "Yearly, auto-renews";
  return "Auto-renews";
}

function CheckoutPage() {
  const { planRef } = Route.useSearch();
  const navigate = useNavigate();
  const { session, isHydrated } = useAuthState();

  const [step, setStep] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Awaited<ReturnType<typeof subscriptionsApi.getPlan>> | null>(null);
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", number: "", exp: "", cvc: "", zip: "" });

  useEffect(() => {
    if (!planRef || !isHydrated) return;
    if (!session) {
      window.location.assign(loginUrlFor({ redirect: "/checkout", planRef }));
      return;
    }

    let cancelled = false;
    setLoadingPlan(true);
    setPlanError(null);
    subscriptionsApi
      .getPlan(planRef)
      .then((selectedPlan) => {
        if (!cancelled) setPlan(selectedPlan);
      })
      .catch((error) => {
        if (!cancelled) setPlanError(error instanceof Error ? error.message : "Subscription plan could not be loaded");
      })
      .finally(() => {
        if (!cancelled) setLoadingPlan(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isHydrated, planRef, session]);

  useEffect(() => {
    if (!session?.user || form.name || form.email) return;
    setForm((current) => ({
      ...current,
      name: session.user.name ?? current.name,
      email: session.user.email ?? current.email,
    }));
  }, [form.email, form.name, session?.user]);

  const subtotal = plan ? plan.price : 0;
  const discount = plan?.discount ?? 0;
  const total = useMemo(() => planAmount(subtotal, discount), [discount, subtotal]);

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const canContinue =
    step === 0
      ? !!plan
      : step === 1
        ? method !== "card" ||
          (form.name.length > 1 && form.email.includes("@") && form.number.replace(/\s/g, "").length >= 12 && form.exp.length >= 4 && form.cvc.length >= 3)
        : true;

  const submit = async () => {
    if (!planRef || !plan) return;
    setProcessing(true);
    try {
      await subscriptionsApi.subscribe(planRef);
      toast.success("Subscription activated", { description: `Welcome to the ${plan.name} plan.` });
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Subscription checkout failed");
    } finally {
      setProcessing(false);
    }
  };

  if (!planRef) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Choose a plan first</h1>
        <p className="mt-3 text-sm text-muted-foreground">Checkout needs a selected subscription plan before you can continue.</p>
        <Button asChild className="mt-6" variant="hero">
          <Link to="/plans">Back to plans</Link>
        </Button>
      </div>
    );
  }

  if (!isHydrated || !session) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {isHydrated ? "Redirecting you to login..." : "Restoring your session..."}
        </p>
      </div>
    );
  }

  if (loadingPlan) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="card-elevated grid place-items-center rounded-3xl py-16 text-muted-foreground">
          <Loader2 className="mb-3 h-8 w-8 animate-spin" />
          <p className="text-sm font-medium">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (planError || !plan) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Plan not available</h1>
        <p className="mt-3 text-sm text-muted-foreground">{planError || "The selected subscription plan could not be found."}</p>
        <Button asChild className="mt-6" variant="hero">
          <Link to="/plans">Back to plans</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <Link to="/plans" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to plans
      </Link>

      <header className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Secure checkout</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Complete your subscription</h1>
      </header>

      <ol className="mt-8 flex items-center gap-3 text-sm sm:gap-6">
        {steps.map((label, index) => (
          <li key={label} className="flex items-center gap-3">
            <span className={`grid h-8 w-8 place-items-center rounded-full font-semibold ${index <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {index < step ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span className={index <= step ? "font-medium" : "text-muted-foreground"}>{label}</span>
            {index < steps.length - 1 && <span className="hidden h-px w-10 bg-border sm:block" />}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="card-elevated rounded-3xl p-6 sm:p-8">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold">Confirm your plan</h2>
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-border p-5">
                <div>
                  <p className="inline-flex items-center gap-2 font-display text-lg font-bold">
                    <Sparkles className="h-4 w-4 text-primary" /> {plan.name}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">{plan.billingCycle} billing</p>
                  <p className="mt-3 max-w-xl text-sm text-muted-foreground">{plan.description}</p>
                  <ul className="mt-4 space-y-1.5 text-sm">
                    {(plan.features.length ? plan.features : ["Program access", "Workout guidance", "Customer support"]).map((feature) => (
                      <li key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-primary" /> {feature}</li>
                    ))}
                  </ul>
                </div>
                <p className="whitespace-nowrap font-display text-2xl font-bold">
                  {KSh(total)}<span className="text-sm font-normal text-muted-foreground">/{plan.billingCycle}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Your subscription is created only after you confirm checkout.</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold">Payment method</h2>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "card", label: "Card", icon: CreditCard },
                  { id: "wallet", label: "Wallet", icon: Wallet },
                  { id: "bank", label: "Bank", icon: Building2 },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setMethod(option.id as PaymentMethod)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-medium transition ${method === option.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"}`}
                  >
                    <option.icon className="h-5 w-5" />
                    {option.label}
                  </button>
                ))}
              </div>

              {method === "card" ? (
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Name on card</Label>
                      <Input id="name" placeholder="Jane Doe" value={form.name} onChange={set("name")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="number">Card number</Label>
                    <Input id="number" inputMode="numeric" placeholder="4242 4242 4242 4242" value={form.number} onChange={set("number")} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="exp">Expiry</Label>
                      <Input id="exp" placeholder="MM/YY" value={form.exp} onChange={set("exp")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cvc">CVC</Label>
                      <Input id="cvc" placeholder="123" value={form.cvc} onChange={set("cvc")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="zip">ZIP</Label>
                      <Input id="zip" placeholder="00100" value={form.zip} onChange={set("zip")} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-muted p-5 text-sm text-muted-foreground">
                  Payment provider configuration is pending. For now, checkout confirmation will activate the selected subscription.
                </div>
              )}

              <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" /> This is a placeholder payment step until the live provider is configured.</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold">Review & confirm</h2>
              <dl className="divide-y divide-border rounded-2xl border border-border text-sm">
                <div className="flex justify-between p-4"><dt className="text-muted-foreground">Plan</dt><dd className="font-medium">{plan.name}</dd></div>
                <div className="flex justify-between p-4"><dt className="text-muted-foreground">Billing</dt><dd className="font-medium">{billingLabel(plan.billingCycle)}</dd></div>
                <div className="flex justify-between p-4"><dt className="text-muted-foreground">Method</dt><dd className="font-medium capitalize">{method === "card" ? `Card ending ${form.number.slice(-4) || "0000"}` : method}</dd></div>
                {method === "card" && (
                  <div className="flex justify-between p-4"><dt className="text-muted-foreground">Email</dt><dd className="font-medium">{form.email || session.user.email}</dd></div>
                )}
                <div className="flex justify-between p-4"><dt className="text-muted-foreground">Total due today</dt><dd className="font-medium">{KSh(total)}</dd></div>
              </dl>
              <p className="text-xs text-muted-foreground">By confirming, you agree to create this Level Up Fitness subscription. Live payment collection will be connected later.</p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-between gap-3">
            <Button variant="soft" disabled={step === 0 || processing} onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</Button>
            {step < 2 ? (
              <Button variant="hero" disabled={!canContinue} onClick={() => setStep((current) => current + 1)}>Continue</Button>
            ) : (
              <Button variant="hero" disabled={processing} onClick={submit}>
                {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Activating...</> : `Confirm ${KSh(total)}`}
              </Button>
            )}
          </div>
        </div>

        <aside className="card-elevated sticky top-24 rounded-3xl p-6">
          <h3 className="font-display text-lg font-bold">Order summary</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{plan.name}</span>
              <span className="font-medium">{KSh(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-primary">
                <span>Discount</span>
                <span className="font-medium">-{KSh(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground capitalize">Billing cycle</span>
              <span className="font-medium capitalize">{plan.billingCycle}</span>
            </div>
            {plan.trialDays > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trial</span>
                <span className="font-medium">{plan.trialDays} days</span>
              </div>
            )}
            {plan.programAccess.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Program access</span>
                <span className="font-medium">{plan.programAccess.length}</span>
              </div>
            )}
            <div className="my-2 h-px bg-border" />
            <div className="flex justify-between text-base">
              <span className="font-semibold">Total due today</span>
              <span className="font-display text-xl font-bold">{KSh(total)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{billingLabel(plan.billingCycle)}. Cancel or change your plan from your dashboard.</p>
          </div>

          <div className="mt-6 space-y-2 text-xs text-muted-foreground">
            <p className="inline-flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Subscription details are saved securely</p>
            <p className="inline-flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-primary" /> Protected customer checkout</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
