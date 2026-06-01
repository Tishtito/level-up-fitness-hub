import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { subscriptionsApi, type ApiSubscriptionPlan } from "@/lib/api";
import { useAuthSession } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "Subscription Plans - Level Up Fitness" },
      { name: "description", content: "Pick a plan that fits your goals. Monthly, quarterly, or yearly billing." },
    ],
  }),
  component: PlansPage,
});

const cycleLabels: Record<ApiSubscriptionPlan["billingCycle"], string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

const KSh = (value: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);

function planAmount(plan: ApiSubscriptionPlan) {
  return Math.max(0, plan.price - (plan.discount ?? 0));
}

function PlansPage() {
  const session = useAuthSession();
  const [cycle, setCycle] = useState<"all" | ApiSubscriptionPlan["billingCycle"]>("all");

  const plansQuery = useQuery({
    queryKey: ["public", "subscription-plans"],
    queryFn: () => subscriptionsApi.plans({ status: "active", limit: 50 }),
  });

  const subscribeMutation = useMutation({
    mutationFn: (planRef: string) => subscriptionsApi.subscribe(planRef),
    onSuccess: () => {
      toast.success("Subscription activated");
      window.location.assign("/dashboard");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Subscription failed"),
  });

  const plans = (plansQuery.data?.data.plans ?? []).filter((plan) => cycle === "all" || plan.billingCycle === cycle);

  function choosePlan(plan: ApiSubscriptionPlan) {
    if (!session) {
      window.location.assign(loginUrlFor({ redirect: "/plans", planRef: plan.planRef }));
      return;
    }
    subscribeMutation.mutate(plan.planRef);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 space-y-12">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Membership</p>
        <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Choose your plan</h1>
        <p className="mt-3 text-muted-foreground">Browse freely. Login is only needed when you choose a plan.</p>

        <div className="mt-6 inline-flex flex-wrap items-center gap-1 rounded-full bg-muted p-1 text-sm">
          {[
            { value: "all", label: "All" },
            { value: "monthly", label: "Monthly" },
            { value: "quarterly", label: "Quarterly" },
            { value: "yearly", label: "Yearly" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setCycle(item.value as typeof cycle)}
              className={`rounded-full px-4 py-2 font-medium transition ${
                cycle === item.value ? "bg-background shadow-[var(--shadow-soft)]" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {plansQuery.isLoading ? (
        <div className="card-elevated grid place-items-center rounded-3xl py-16 text-muted-foreground">
          <Loader2 className="mb-3 h-8 w-8 animate-spin" />
          <p className="text-sm font-medium">Loading plans...</p>
        </div>
      ) : plansQuery.isError ? (
        <div className="card-elevated rounded-3xl p-10 text-center text-destructive">
          <p className="text-sm font-medium">Plans could not be loaded.</p>
        </div>
      ) : (
        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => {
            const featured = index === 1 || /pro|elite/i.test(plan.name);
            const amount = planAmount(plan);

            return (
              <div
                key={plan.planRef}
                className={`relative flex flex-col rounded-3xl p-8 ${
                  featured ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)] lg:-translate-y-3" : "card-elevated"
                }`}
              >
                {featured && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary">
                    <Sparkles className="h-3 w-3" /> Recommended
                  </span>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
                    <p className={`mt-2 text-sm ${featured ? "text-primary-foreground/85" : "text-muted-foreground"}`}>{plan.description}</p>
                  </div>
                  <Badge variant={featured ? "secondary" : "outline"}>{cycleLabels[plan.billingCycle]}</Badge>
                </div>

                <p className="mt-6 font-display text-4xl font-bold">
                  {KSh(amount)}
                  <span className={`text-base font-normal ${featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>/{plan.billingCycle}</span>
                </p>
                {plan.discount > 0 && <p className={`mt-1 text-xs ${featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{KSh(plan.discount)} discount applied</p>}
                {plan.trialDays > 0 && <p className={`mt-1 text-xs ${featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{plan.trialDays} trial days included</p>}

                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {(plan.features.length ? plan.features : ["Program access", "Workout guidance", "Customer support"]).map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className={`grid h-5 w-5 place-items-center rounded-full ${featured ? "bg-white/20" : "bg-primary/15 text-primary"}`}>
                        <Check className="h-3 w-3" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.programAccess.length > 0 && (
                  <p className={`mt-4 text-xs ${featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    Includes {plan.programAccess.length} program access {plan.programAccess.length === 1 ? "slot" : "slots"}.
                  </p>
                )}

                <Button
                  variant={featured ? "soft" : "hero"}
                  className="mt-8 w-full"
                  size="lg"
                  onClick={() => choosePlan(plan)}
                  disabled={subscribeMutation.isPending}
                >
                  {subscribeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Choose {plan.name}
                </Button>
              </div>
            );
          })}
          {plans.length === 0 && (
            <div className="card-elevated rounded-3xl p-10 text-center lg:col-span-3">
              <p className="text-muted-foreground">No active plans match this billing cycle.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
