import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CreditCard, Lock, ShieldCheck, Check, ArrowLeft, Wallet, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Search = { plan?: string; cycle?: "monthly" | "yearly" };

export const Route = createFileRoute("/checkout")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    plan: typeof s.plan === "string" ? s.plan : "Pro",
    cycle: s.cycle === "yearly" ? "yearly" : "monthly",
  }),
  head: () => ({
    meta: [
      { title: "Checkout — Level Up Fitness" },
      { name: "description", content: "Secure checkout. Review your plan and complete payment." },
    ],
  }),
  component: CheckoutPage,
});

const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  Basic: { monthly: 19, yearly: 15 },
  Pro: { monthly: 39, yearly: 31 },
  Elite: { monthly: 79, yearly: 63 },
};

const PLAN_FEATURES: Record<string, string[]> = {
  Basic: ["Workout videos", "Mobile & web app", "Community access"],
  Pro: ["Everything in Basic", "Personalized plans", "Nutrition guides", "Progress analytics"],
  Elite: ["Everything in Pro", "Trainer consultations", "Physio session credits", "Priority support"],
};

const steps = ["Plan", "Payment", "Review"] as const;

function CheckoutPage() {
  const { plan = "Pro", cycle = "monthly" } = Route.useSearch();
  const navigate = useNavigate();
  const price = PLAN_PRICES[plan] ?? PLAN_PRICES.Pro;
  const monthly = cycle === "yearly" ? price.yearly : price.monthly;
  const subtotal = cycle === "yearly" ? price.yearly * 12 : price.monthly;
  const tax = useMemo(() => +(subtotal * 0.08).toFixed(2), [subtotal]);
  const total = +(subtotal + tax).toFixed(2);

  const [step, setStep] = useState(0);
  const [method, setMethod] = useState<"card" | "wallet" | "bank">("card");
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", number: "", exp: "", cvc: "", zip: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const canContinue =
    step === 0
      ? true
      : step === 1
        ? method !== "card" ||
          (form.name.length > 1 && form.email.includes("@") && form.number.replace(/\s/g, "").length >= 12 && form.exp.length >= 4 && form.cvc.length >= 3)
        : true;

  const submit = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setProcessing(false);
    toast.success("Payment successful", { description: `Welcome to the ${plan} plan.` });
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-16">
      <Link to="/plans" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to plans
      </Link>

      <header className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Secure checkout</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold">Complete your subscription</h1>
      </header>

      {/* Stepper */}
      <ol className="mt-8 flex items-center gap-3 sm:gap-6 text-sm">
        {steps.map((label, i) => (
          <li key={label} className="flex items-center gap-3">
            <span className={`grid h-8 w-8 place-items-center rounded-full font-semibold ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={i <= step ? "font-medium" : "text-muted-foreground"}>{label}</span>
            {i < steps.length - 1 && <span className="hidden sm:block h-px w-10 bg-border" />}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] items-start">
        <div className="card-elevated rounded-3xl p-6 sm:p-8">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold">Confirm your plan</h2>
              <div className="rounded-2xl border border-border p-5 flex items-start justify-between gap-4">
                <div>
                  <p className="inline-flex items-center gap-2 font-display text-lg font-bold"><Sparkles className="h-4 w-4 text-primary" /> {plan}</p>
                  <p className="text-sm text-muted-foreground capitalize">{cycle} billing</p>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {(PLAN_FEATURES[plan] ?? []).map((f) => (
                      <li key={f} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> {f}</li>
                    ))}
                  </ul>
                </div>
                <p className="font-display text-2xl font-bold whitespace-nowrap">${monthly}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </div>
              <p className="text-xs text-muted-foreground">Switch plan anytime from your dashboard. Cancel with one click.</p>
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
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id as typeof method)}
                    className={`rounded-2xl border p-4 text-sm font-medium flex flex-col items-center gap-2 transition ${method === m.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"}`}
                  >
                    <m.icon className="h-5 w-5" />
                    {m.label}
                  </button>
                ))}
              </div>

              {method === "card" ? (
                <div className="grid gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
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
                  You'll be redirected to confirm payment with your {method === "wallet" ? "digital wallet" : "bank"} after review.
                </div>
              )}

              <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Payments are encrypted end-to-end. We never store your card details.</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold">Review & confirm</h2>
              <dl className="divide-y divide-border rounded-2xl border border-border text-sm">
                <div className="flex justify-between p-4"><dt className="text-muted-foreground">Plan</dt><dd className="font-medium">{plan} ({cycle})</dd></div>
                <div className="flex justify-between p-4"><dt className="text-muted-foreground">Method</dt><dd className="font-medium capitalize">{method === "card" ? `Card •••• ${form.number.slice(-4) || "0000"}` : method}</dd></div>
                {method === "card" && (
                  <div className="flex justify-between p-4"><dt className="text-muted-foreground">Email</dt><dd className="font-medium">{form.email || "—"}</dd></div>
                )}
                <div className="flex justify-between p-4"><dt className="text-muted-foreground">Billing</dt><dd className="font-medium">{cycle === "yearly" ? "Annual, billed today" : "Monthly, auto-renews"}</dd></div>
              </dl>
              <p className="text-xs text-muted-foreground">By confirming you agree to our Terms of Service and authorize Level Up Fitness to charge your selected payment method.</p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3 justify-between">
            <Button variant="soft" disabled={step === 0 || processing} onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
            {step < 2 ? (
              <Button variant="hero" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>Continue</Button>
            ) : (
              <Button variant="hero" disabled={processing} onClick={submit}>
                {processing ? "Processing…" : `Pay $${total}`}
              </Button>
            )}
          </div>
        </div>

        {/* Order summary */}
        <aside className="card-elevated rounded-3xl p-6 sticky top-24">
          <h3 className="font-display text-lg font-bold">Order summary</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{plan} — {cycle}</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (8%)</span>
              <span className="font-medium">${tax.toFixed(2)}</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between text-base">
              <span className="font-semibold">Total due today</span>
              <span className="font-display text-xl font-bold">${total.toFixed(2)}</span>
            </div>
            {cycle === "monthly" && <p className="text-xs text-muted-foreground">Then ${monthly}/mo. Cancel anytime.</p>}
            {cycle === "yearly" && <p className="text-xs text-muted-foreground">Renews yearly. Save 20% vs monthly.</p>}
          </div>

          <div className="mt-6 space-y-2 text-xs text-muted-foreground">
            <p className="inline-flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> 7-day money-back guarantee</p>
            <p className="inline-flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-primary" /> 256-bit SSL secured</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
