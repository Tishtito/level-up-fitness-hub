import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Loader2, Lock, Smartphone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { programsApi, subscriptionsApi, type ApiPayment } from "@/lib/api";
import { useAuthState } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";
import { usePaymentStatus } from "@/lib/use-payment-status";

type Search = { planRef?: string; programRef?: string; paymentRef?: string; subscriptionRef?: string };

// Normalized descriptor so the checkout UI renders the same way for a subscription plan
// or a one-off program purchase.
type CheckoutItem = {
  name: string;
  description: string;
  price: number;
  meta: string;
  features: string[];
  trialDays?: number;
  successCopy: string;
  successRedirect: string;
};

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    planRef: typeof search.planRef === "string" ? search.planRef : undefined,
    programRef: typeof search.programRef === "string" ? search.programRef : undefined,
    paymentRef: typeof search.paymentRef === "string" ? search.paymentRef : undefined,
    subscriptionRef: typeof search.subscriptionRef === "string" ? search.subscriptionRef : undefined,
  }),
  head: () => ({ meta: [{ title: "Checkout - Level Up Fitness" }] }),
  component: CheckoutPage,
});

const KSh = (value: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);

function CheckoutPage() {
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
      trialDays: plan.trialDays,
      successCopy: "Subscription activated",
      successRedirect: "/dashboard",
    };
  }, [mode, planQuery.data, programQuery.data]);

  const total = item?.price ?? 0;
  const backLink = mode === "program" && activeRef ? `/programs/${activeRef}` : "/plans";

  useEffect(() => {
    if (!isHydrated || session || !activeRef) return;
    const continuation = mode === "program"
      ? { redirect: "/checkout", programRef: activeRef }
      : { redirect: "/checkout", planRef: activeRef };
    window.location.assign(loginUrlFor(continuation));
  }, [isHydrated, session, activeRef, mode]);

  useEffect(() => {
    if (paymentQuery.data?.status !== "succeeded" || successHandled.current === paymentQuery.data.paymentRef) return;
    successHandled.current = paymentQuery.data.paymentRef;
    const redirect = item?.successRedirect ?? "/dashboard";
    toast.success(item?.successCopy ?? "Payment confirmed", { description: "Your M-Pesa payment was confirmed." });
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
        nextSearch = { planRef: activeRef, paymentRef: result.payment?.paymentRef, subscriptionRef: result.subscription.subscriptionRef };
      }

      if (!payment) {
        toast.success(item.successCopy);
        window.location.replace(item.successRedirect);
        return;
      }
      await navigate({ to: "/checkout", search: nextSearch, replace: true });
      setStep(2);
      if (payment.status === "failed") toast.error("M-Pesa prompt could not be sent. Check the number and retry.");
      else toast.success("M-Pesa prompt sent", { description: "Approve the request on your phone." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment could not be started");
    } finally {
      setProcessing(false);
    }
  }

  const steps = [mode === "program" ? "Program" : "Plan", "M-Pesa", "Confirmation"] as const;

  if (!activeRef) return <State backLink={backLink} title="Nothing to check out" message="Choose a subscription plan or a program before opening checkout." />;
  if (!isHydrated || !session || activeQuery.isLoading) return <Loading label={isHydrated ? "Loading checkout..." : "Restoring your session..."} />;
  if (activeQuery.isError || !item) return <State backLink={backLink} title={mode === "program" ? "Program not available" : "Plan not available"} message={activeQuery.error instanceof Error ? activeQuery.error.message : "The selected item could not be found."} />;

  const payment = paymentQuery.data;
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">j
      {mode === "program" && activeRef
        ? <Link to="/programs/$slug" params={{ slug: activeRef }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to program</Link>
        : <Link to="/plans" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to plans</Link>}
      <header className="mt-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Secure checkout</p><h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{mode === "program" ? "Complete your purchase" : "Complete your subscription"}</h1></header>
      <ol className="mt-8 flex items-center gap-3 text-sm sm:gap-6">
        {steps.map((label, index) => <li key={label} className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-full font-semibold ${index <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{index < step ? <Check className="h-4 w-4" /> : index + 1}</span><span className={index <= step ? "font-medium" : "text-muted-foreground"}>{label}</span>{index < 2 && <span className="hidden h-px w-10 bg-border sm:block" />}</li>)}
      </ol>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <section className="card-elevated rounded-3xl p-6 sm:p-8">
          {step === 0 && <div><h2 className="font-display text-xl font-bold">Confirm your {mode === "program" ? "program" : "plan"}</h2><p className="mt-3 text-muted-foreground">{item.description}</p>{item.features.length > 0 && <ul className="mt-5 space-y-2 text-sm">{item.features.map((feature) => <li key={feature} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" />{feature}</li>)}</ul>}</div>}
          {step === 1 && <div><h2 className="font-display text-xl font-bold">Pay with M-Pesa</h2><div className="mt-5 rounded-2xl border border-[#43B02A] bg-[#43B02A]/10 p-5"><Smartphone className="h-6 w-6 text-[#43B02A]" /><p className="mt-2 font-semibold">M-Pesa</p><p className="mt-1 text-sm text-muted-foreground">Enter the Safaricom number that should receive the payment prompt.</p></div><div className="mt-5 space-y-2"><Label htmlFor="mpesa-phone">M-Pesa phone number</Label><Input id="mpesa-phone" inputMode="tel" placeholder="0712 345 678" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} /></div></div>}
          {step === 2 && <PaymentState status={payment?.status} loading={paymentQuery.isLoading} paymentRef={search.paymentRef} onRetry={() => { setStep(1); void navigate({ to: "/checkout", search: mode === "program" ? { programRef: activeRef } : { planRef: activeRef }, replace: true }); }} />}
          <div className="mt-8 flex justify-between gap-3">
            <Button variant="soft" disabled={step === 0 || processing || (!!search.paymentRef && payment?.status === "processing")} onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</Button>
            {step === 0 && <Button variant="hero" onClick={() => setStep(1)}>Continue</Button>}
            {step === 1 && <Button variant="mpesa" disabled={processing || phoneNumber.replace(/\D/g, "").length < 9} onClick={initiateCheckout}>{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Pay {KSh(total)}</Button>}
          </div>
        </section>
        <aside className="card-elevated sticky top-24 rounded-3xl p-6"><p className="inline-flex items-center gap-2 font-display text-lg font-bold"><Sparkles className="h-4 w-4 text-primary" />{item.name}</p><p className="mt-1 text-sm capitalize text-muted-foreground">{item.meta}</p><div className="my-5 border-t" /><div className="flex justify-between font-display text-xl font-bold"><span>Total</span><span>{KSh(total)}</span></div>{item.trialDays ? <p className="mt-3 text-xs text-muted-foreground">Includes {item.trialDays} trial days. Payment is collected at checkout.</p> : null}</aside>
      </div>
    </div>
  );
}

function PaymentState({ status, loading, paymentRef, onRetry }: { status?: string; loading: boolean; paymentRef?: string; onRetry: () => void }) {
  if (loading || !status) return <Loading label="Checking payment status..." compact />;
  if (status === "succeeded") return <div className="text-center"><Check className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 font-display text-2xl font-bold">Payment confirmed</h2><p className="mt-2 text-sm text-muted-foreground">Unlocking your access...</p></div>;
  if (status === "cancelled") return <div className="text-center"><h2 className="font-display text-2xl font-bold">M-Pesa prompt cancelled</h2><p className="mt-2 text-sm text-muted-foreground">No money was collected. You can send a new prompt when ready.</p><Button className="mt-5" variant="hero" onClick={onRetry}>Try again</Button></div>;
  if (status === "failed") return <div className="text-center"><h2 className="font-display text-2xl font-bold">Payment was not completed</h2><p className="mt-2 text-sm text-muted-foreground">The prompt timed out or Safaricom could not complete it.</p><Button className="mt-5" variant="hero" onClick={onRetry}>Try again</Button></div>;
  return <div className="text-center"><Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" /><h2 className="mt-4 font-display text-2xl font-bold">Approve the M-Pesa prompt</h2><p className="mt-2 text-sm text-muted-foreground">Keep this page open while Safaricom confirms your payment.</p><p className="mt-4 text-xs text-muted-foreground">Payment: {paymentRef}</p></div>;
}

function Loading({ label, compact = false }: { label: string; compact?: boolean }) { return <div className={`${compact ? "py-10" : "mx-auto max-w-2xl px-6 py-20"} text-center text-muted-foreground`}><Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" /><p className="text-sm">{label}</p></div>; }
function State({ title, message, backLink }: { title: string; message: string; backLink: string }) { return <div className="mx-auto max-w-2xl px-6 py-20 text-center"><h1 className="font-display text-3xl font-bold">{title}</h1><p className="mt-3 text-sm text-muted-foreground">{message}</p><Button asChild className="mt-6" variant="hero"><a href={backLink}>Go back</a></Button></div>; }
