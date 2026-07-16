import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Loader2, Lock, Smartphone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { subscriptionsApi } from "@/lib/api";
import { useAuthState } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";
import { usePaymentStatus } from "@/lib/use-payment-status";

type Search = { planRef?: string; paymentRef?: string; subscriptionRef?: string };

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    planRef: typeof search.planRef === "string" ? search.planRef : undefined,
    paymentRef: typeof search.paymentRef === "string" ? search.paymentRef : undefined,
    subscriptionRef: typeof search.subscriptionRef === "string" ? search.subscriptionRef : undefined,
  }),
  head: () => ({ meta: [{ title: "Subscription Checkout - Level Up Fitness" }] }),
  component: CheckoutPage,
});

const KSh = (value: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);
const steps = ["Plan", "M-Pesa", "Confirmation"] as const;

function CheckoutPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { session, isHydrated } = useAuthState();
  const [step, setStep] = useState(search.paymentRef ? 2 : 0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const successHandled = useRef<string | null>(null);
  const planQuery = useQuery({
    queryKey: ["subscription-plan", search.planRef],
    queryFn: () => subscriptionsApi.getPlan(search.planRef!),
    enabled: !!search.planRef && !!session,
  });
  const paymentQuery = usePaymentStatus(search.paymentRef);
  const plan = planQuery.data;
  const total = useMemo(() => Math.max(0, (plan?.price ?? 0) - (plan?.discount ?? 0)), [plan]);

  useEffect(() => {
    if (!isHydrated || session || !search.planRef) return;
    window.location.assign(loginUrlFor({ redirect: "/checkout", planRef: search.planRef }));
  }, [isHydrated, search.planRef, session]);

  useEffect(() => {
    if (paymentQuery.data?.status !== "succeeded" || successHandled.current === paymentQuery.data.paymentRef) return;
    successHandled.current = paymentQuery.data.paymentRef;
    toast.success("Subscription activated", { description: "Your M-Pesa payment was confirmed." });
    window.setTimeout(() => window.location.replace("/dashboard"), 600);
  }, [paymentQuery.data]);

  async function initiateCheckout() {
    if (!plan || !search.planRef || !phoneNumber.trim()) return;
    setProcessing(true);
    try {
      const result = await subscriptionsApi.checkout(search.planRef, phoneNumber.trim());
      if (!result.payment) {
        toast.success("Subscription activated");
        window.location.replace("/dashboard");
        return;
      }
      await navigate({
        to: "/checkout",
        search: { planRef: search.planRef, paymentRef: result.payment.paymentRef, subscriptionRef: result.subscription.subscriptionRef },
        replace: true,
      });
      setStep(2);
      if (result.payment.status === "failed") toast.error("M-Pesa prompt could not be sent. Check the number and retry.");
      else toast.success("M-Pesa prompt sent", { description: "Approve the request on your phone." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Subscription payment could not be started");
    } finally {
      setProcessing(false);
    }
  }

  if (!search.planRef) return <State title="Choose a plan first" message="Select a subscription plan before opening checkout." />;
  if (!isHydrated || !session || planQuery.isLoading) return <Loading label={isHydrated ? "Loading checkout..." : "Restoring your session..."} />;
  if (planQuery.isError || !plan) return <State title="Plan not available" message={planQuery.error instanceof Error ? planQuery.error.message : "The selected plan could not be found."} />;

  const payment = paymentQuery.data;
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <Link to="/plans" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to plans</Link>
      <header className="mt-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Secure checkout</p><h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Complete your subscription</h1></header>
      <ol className="mt-8 flex items-center gap-3 text-sm sm:gap-6">
        {steps.map((label, index) => <li key={label} className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-full font-semibold ${index <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{index < step ? <Check className="h-4 w-4" /> : index + 1}</span><span className={index <= step ? "font-medium" : "text-muted-foreground"}>{label}</span>{index < 2 && <span className="hidden h-px w-10 bg-border sm:block" />}</li>)}
      </ol>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <section className="card-elevated rounded-3xl p-6 sm:p-8">
          {step === 0 && <div><h2 className="font-display text-xl font-bold">Confirm your plan</h2><p className="mt-3 text-muted-foreground">{plan.description}</p><ul className="mt-5 space-y-2 text-sm">{plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" />{feature}</li>)}</ul></div>}
          {step === 1 && <div><h2 className="font-display text-xl font-bold">Pay with M-Pesa</h2><div className="mt-5 rounded-2xl border border-primary bg-primary/5 p-5"><Smartphone className="h-6 w-6 text-primary" /><p className="mt-2 font-semibold">M-Pesa STK Push</p><p className="mt-1 text-sm text-muted-foreground">Enter the Safaricom number that should receive the payment prompt.</p></div><div className="mt-5 space-y-2"><Label htmlFor="mpesa-phone">M-Pesa phone number</Label><Input id="mpesa-phone" inputMode="tel" placeholder="0712 345 678" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} /></div></div>}
          {step === 2 && <PaymentState status={payment?.status} loading={paymentQuery.isLoading} paymentRef={search.paymentRef} onRetry={() => { setStep(1); void navigate({ to: "/checkout", search: { planRef: search.planRef }, replace: true }); }} />}
          <div className="mt-8 flex justify-between gap-3">
            <Button variant="soft" disabled={step === 0 || processing || (!!search.paymentRef && payment?.status === "processing")} onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</Button>
            {step === 0 && <Button variant="hero" onClick={() => setStep(1)}>Continue</Button>}
            {step === 1 && <Button variant="hero" disabled={processing || phoneNumber.replace(/\D/g, "").length < 9} onClick={initiateCheckout}>{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Pay {KSh(total)}</Button>}
          </div>
        </section>
        <aside className="card-elevated sticky top-24 rounded-3xl p-6"><p className="inline-flex items-center gap-2 font-display text-lg font-bold"><Sparkles className="h-4 w-4 text-primary" />{plan.name}</p><p className="mt-1 text-sm capitalize text-muted-foreground">{plan.billingCycle} billing</p><div className="my-5 border-t" /><div className="flex justify-between font-display text-xl font-bold"><span>Total</span><span>{KSh(total)}</span></div>{plan.trialDays > 0 && <p className="mt-3 text-xs text-muted-foreground">Includes {plan.trialDays} trial days. Payment is collected at checkout.</p>}</aside>
      </div>
    </div>
  );
}

function PaymentState({ status, loading, paymentRef, onRetry }: { status?: string; loading: boolean; paymentRef?: string; onRetry: () => void }) {
  if (loading || !status) return <Loading label="Checking payment status..." compact />;
  if (status === "succeeded") return <div className="text-center"><Check className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 font-display text-2xl font-bold">Payment confirmed</h2><p className="mt-2 text-sm text-muted-foreground">Activating your subscription...</p></div>;
  if (status === "cancelled") return <div className="text-center"><h2 className="font-display text-2xl font-bold">M-Pesa prompt cancelled</h2><p className="mt-2 text-sm text-muted-foreground">No money was collected. You can send a new prompt when ready.</p><Button className="mt-5" variant="hero" onClick={onRetry}>Try again</Button></div>;
  if (status === "failed") return <div className="text-center"><h2 className="font-display text-2xl font-bold">Payment was not completed</h2><p className="mt-2 text-sm text-muted-foreground">The prompt timed out or Safaricom could not complete it.</p><Button className="mt-5" variant="hero" onClick={onRetry}>Try again</Button></div>;
  return <div className="text-center"><Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" /><h2 className="mt-4 font-display text-2xl font-bold">Approve the M-Pesa prompt</h2><p className="mt-2 text-sm text-muted-foreground">Keep this page open while Safaricom confirms your payment.</p><p className="mt-4 text-xs text-muted-foreground">Payment: {paymentRef}</p></div>;
}

function Loading({ label, compact = false }: { label: string; compact?: boolean }) { return <div className={`${compact ? "py-10" : "mx-auto max-w-2xl px-6 py-20"} text-center text-muted-foreground`}><Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" /><p className="text-sm">{label}</p></div>; }
function State({ title, message }: { title: string; message: string }) { return <div className="mx-auto max-w-2xl px-6 py-20 text-center"><h1 className="font-display text-3xl font-bold">{title}</h1><p className="mt-3 text-sm text-muted-foreground">{message}</p><Button asChild className="mt-6" variant="hero"><Link to="/plans">Back to plans</Link></Button></div>; }
