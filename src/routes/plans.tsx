import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { subscriptionsApi, type ApiPlanProgram, type ApiSubscriptionPlan } from "@/lib/api";
import { useAuthSession } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";
import { programImage } from "@/lib/program-display";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "Subscription Plans - Level Up Fitness" },
      {
        name: "description",
        content: "Pick a plan that fits your goals. Monthly, quarterly, or yearly billing.",
      },
    ],
  }),
  component: PlansPage,
});

const cycleLabels: Record<ApiSubscriptionPlan["billingCycle"], string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

const cycleMonths: Record<ApiSubscriptionPlan["billingCycle"], number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

/** How many program rows fit on a card before we collapse the rest into "+N more". */
const VISIBLE_PROGRAMS = 3;

const KSh = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);

function planAmount(plan: ApiSubscriptionPlan) {
  return Math.max(0, plan.price - (plan.discount ?? 0));
}

/**
 * Exactly one plan is highlighted, chosen by what it actually offers rather than by its
 * position — the old `index === 1 || /pro|elite/` rule could flag two cards at once and
 * moved as you switched billing cycle.
 */
function selectFeaturedRef(plans: ApiSubscriptionPlan[]) {
  if (plans.length < 2) return null;

  return plans.reduce((best, plan) => {
    const bestPrograms = best.programs?.length ?? best.programAccess.length;
    const planPrograms = plan.programs?.length ?? plan.programAccess.length;
    if (planPrograms !== bestPrograms) return planPrograms > bestPrograms ? plan : best;
    return planAmount(plan) > planAmount(best) ? plan : best;
  }).planRef;
}

function IncludedPrograms({
  programs,
  fallbackCount,
  featured,
}: {
  programs: ApiPlanProgram[];
  fallbackCount: number;
  featured: boolean;
}) {
  const mutedText = featured ? "text-primary-foreground/80" : "text-muted-foreground";

  // Refs that no longer resolve (program deactivated after the plan was authored) still
  // deserve an honest count rather than an empty section.
  if (programs.length === 0) {
    if (fallbackCount === 0) return null;
    return (
      <p className={cn("mt-5 text-xs", mutedText)}>
        Includes access to {fallbackCount} program{fallbackCount === 1 ? "" : "s"}.
      </p>
    );
  }

  const visible = programs.slice(0, VISIBLE_PROGRAMS);
  const remaining = programs.length - visible.length;

  return (
    <div className={cn("mt-6 border-t pt-5", featured ? "border-white/25" : "border-border")}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">Included programs</p>
        <span className={cn("text-xs", mutedText)}>{programs.length}</span>
      </div>

      <ul className="mt-3 space-y-2">
        {visible.map((program) => (
          <li key={program.programRef}>
            <Link
              to="/programs/$slug"
              params={{ slug: program.programRef }}
              className={cn(
                "flex items-center gap-3 rounded-xl p-1.5 transition",
                featured ? "hover:bg-white/15" : "hover:bg-muted",
              )}
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
                <span className={cn("block truncate text-xs", mutedText)}>
                  {program.difficultyLevel} &middot; {program.duration}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {remaining > 0 && (
        <p className={cn("mt-2 pl-1.5 text-xs", mutedText)}>
          + {remaining} more program{remaining === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  featured,
  isCurrent,
  onChoose,
}: {
  plan: ApiSubscriptionPlan;
  featured: boolean;
  isCurrent: boolean;
  onChoose: () => void;
}) {
  const amount = planAmount(plan);
  const months = cycleMonths[plan.billingCycle];
  const mutedText = featured ? "text-primary-foreground/80" : "text-muted-foreground";

  return (
    <div
      className={cn(
        "relative flex min-h-full flex-col rounded-3xl p-7",
        featured
          ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)]"
          : "card-elevated",
      )}
    >
      {(isCurrent || featured) && (
        <span
          className={cn(
            "absolute -top-3 right-6 rounded-full px-3 py-1 text-xs font-semibold",
            isCurrent ? "bg-success text-white" : "bg-white text-primary",
          )}
        >
          {isCurrent ? "Current plan" : "Most Popular"}
        </span>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={featured ? "secondary" : "outline"}>{cycleLabels[plan.billingCycle]}</Badge>
        {plan.trialDays > 0 && (
          <Badge variant={featured ? "secondary" : "outline"}>{plan.trialDays} day trial</Badge>
        )}
      </div>

      <h2 className="mt-5 font-display text-2xl font-bold">{plan.name}</h2>
      <p
        className={cn(
          "mt-2 text-sm leading-relaxed",
          featured ? "text-primary-foreground/85" : "text-muted-foreground",
        )}
      >
        {plan.description}
      </p>

      <div className="mt-6">
        {plan.discount > 0 && (
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span
              className={cn(
                "line-through",
                featured ? "text-primary-foreground/65" : "text-muted-foreground",
              )}
            >
              {KSh(plan.price)}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                featured ? "bg-white/20" : "bg-success/15 text-success",
              )}
            >
              Save {KSh(plan.discount)}
            </span>
          </p>
        )}
        <p className="font-display text-4xl font-bold">
          {KSh(amount)}
          <span
            className={cn(
              "text-sm font-normal",
              featured ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          >
            /{cycleLabels[plan.billingCycle]}
          </span>
        </p>
        {months > 1 && (
          <p className={cn("mt-1 text-xs", mutedText)}>
            {KSh(Math.round(amount / months))}/month &middot; billed {plan.billingCycle}
          </p>
        )}
      </div>

      <ul className="mt-6 flex-1 space-y-3 text-sm">
        {plan.features.length > 0 ? (
          plan.features.map((feature, index) => (
            <li key={`${feature}-${index}`} className="flex items-start gap-2">
              <span
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
                  featured ? "bg-white/20" : "bg-primary/15 text-primary",
                )}
              >
                <Check className="h-3 w-3" />
              </span>
              <span>{feature}</span>
            </li>
          ))
        ) : (
          <li className={mutedText}>Features will be shared soon.</li>
        )}
      </ul>

      <IncludedPrograms
        programs={plan.programs ?? []}
        fallbackCount={plan.programAccess.length}
        featured={featured}
      />

      {isCurrent ? (
        <Button asChild variant="soft" className="mt-8 w-full" size="lg">
          <Link to="/dashboard">Manage plan</Link>
        </Button>
      ) : (
        <Button
          variant={featured ? "soft" : "hero"}
          className="mt-8 w-full"
          size="lg"
          onClick={onChoose}
        >
          <Sparkles className="h-4 w-4" /> Choose {plan.name}
        </Button>
      )}
    </div>
  );
}

function PlansSkeleton() {
  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="card-elevated flex flex-col rounded-3xl p-7">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="mt-5 h-8 w-2/3" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <Skeleton className="mt-6 h-11 w-40" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="mt-6 space-y-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
          <Skeleton className="mt-8 h-12 w-full rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

function PlansPage() {
  const session = useAuthSession();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<"all" | ApiSubscriptionPlan["billingCycle"]>("all");

  const plansQuery = useQuery({
    queryKey: ["public", "subscription-plans"],
    queryFn: () => subscriptionsApi.plans({ status: "active", limit: 50 }),
  });

  const subscriptionsQuery = useQuery({
    queryKey: ["subscriptions", "me"],
    queryFn: () => subscriptionsApi.list(),
    enabled: !!session,
  });

  const currentPlanRefs = useMemo(() => {
    const subscriptions = subscriptionsQuery.data?.data.subscriptions ?? [];
    return new Set(
      subscriptions.filter((item) => item.status === "active").map((item) => item.planRef),
    );
  }, [subscriptionsQuery.data]);

  const plans = (plansQuery.data?.data.plans ?? []).filter(
    (plan) => cycle === "all" || plan.billingCycle === cycle,
  );
  const featuredRef = useMemo(() => selectFeaturedRef(plans), [plans]);

  function choosePlan(plan: ApiSubscriptionPlan) {
    if (!session) {
      window.location.assign(loginUrlFor({ redirect: "/checkout", planRef: plan.planRef }));
      return;
    }
    void navigate({ to: "/checkout", search: { planRef: plan.planRef } });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 pb-16 pt-10 sm:px-6">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Membership</p>
        <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Choose your plan</h1>
        <p className="mt-3 text-muted-foreground">
          Browse freely. Login is only needed when you choose a plan.
        </p>

        <div className="mt-6 inline-flex flex-wrap items-center gap-1 rounded-full bg-muted p-1 text-sm">
          {[
            { value: "all", label: "All" },
            { value: "monthly", label: "Monthly" },
            { value: "quarterly", label: "Quarterly" },
            { value: "yearly", label: "Yearly" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCycle(item.value as typeof cycle)}
              aria-pressed={cycle === item.value}
              className={cn(
                "rounded-full px-4 py-2 font-medium transition",
                cycle === item.value
                  ? "bg-background shadow-[var(--shadow-soft)]"
                  : "text-muted-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {plansQuery.isLoading ? (
        <PlansSkeleton />
      ) : plansQuery.isError ? (
        <div className="card-elevated rounded-3xl p-10 text-center">
          <p className="text-sm font-medium text-destructive">Plans could not be loaded.</p>
          <Button className="mt-5" variant="hero" onClick={() => void plansQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {plans.length === 0 ? (
            <div className="card-elevated rounded-3xl p-10 text-center text-muted-foreground lg:col-span-3">
              <p className="text-sm font-medium">
                No active plans are available for this billing cycle.
              </p>
            </div>
          ) : (
            plans.map((plan) => (
              <PlanCard
                key={plan.planRef}
                plan={plan}
                featured={plan.planRef === featuredRef}
                isCurrent={currentPlanRefs.has(plan.planRef)}
                onChoose={() => choosePlan(plan)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
