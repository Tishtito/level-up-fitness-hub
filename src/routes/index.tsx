import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Clock,
  Loader2,
  MapPin,
  Package,
  Quote,
  ShoppingBag,
  Star,
} from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import heroStudio from "@/assets/home/hero-studio.webp";
import nutritionCare from "@/assets/home/nutrition-care.webp";
import programMobility from "@/assets/home/program-mobility.webp";
import programStrength from "@/assets/home/program-strength.webp";
import { Button } from "@/components/ui/button";
import {
  cartApi,
  homeApi,
  type ApiProgram,
  type ApiSubscriptionPlan,
  type ApiWellnessService,
} from "@/lib/api";
import { useAuthSession } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";
import { CART_QUERY_KEY } from "@/lib/use-cart-count";
import { apiAssetUrl } from "@/lib/env";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Level Up Fitness — Training, nutrition and recovery in Nairobi" },
      {
        name: "description",
        content:
          "Find coach-led fitness programs, memberships, nutrition support, physiotherapy and training gear from Level Up Fitness.",
      },
    ],
  }),
  component: Home,
});

const testimonials = [
  {
    name: "Amelia K.",
    text: "I lost 14kg in four months while feeling stronger than ever. The coaches adjusted the plan when life got busy, so I could keep going.",
    role: "Member · 1 year",
  },
  {
    name: "Jordan M.",
    text: "The program is demanding without being intimidating. I always know what to do next and why it matters.",
    role: "Pro member",
  },
  {
    name: "Priya S.",
    text: "Having nutrition and physiotherapy alongside my training changed how quickly I recover.",
    role: "Elite member",
  },
];

const KSh = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value || 0);

const count = (value?: number) => new Intl.NumberFormat("en-KE").format(value ?? 0);

function planAmount(plan: ApiSubscriptionPlan) {
  return Math.max(0, plan.price - (plan.discount ?? 0));
}

function fallbackProgramImage(program: ApiProgram) {
  if (program.category === "lose_weight") return programMobility;
  return programStrength;
}

function programImage(program: ApiProgram) {
  return apiAssetUrl(program.thumbnail) || fallbackProgramImage(program);
}

function Home() {
  const session = useAuthSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const homeQuery = useQuery({
    queryKey: ["public", "home"],
    queryFn: homeApi.getOverview,
    staleTime: 60_000,
  });
  const addItemMutation = useMutation({
    mutationFn: (productRef: string) => cartApi.addItem(productRef, 1),
    onSuccess: () => {
      toast.success("Added to cart");
      void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "We couldn't add that item. Please try again.",
      ),
  });

  const overview = homeQuery.data;
  const programs = overview?.programs ?? [];
  const plans = overview?.plans ?? [];
  const maxTrialDays = Math.max(0, ...(overview?.plans.map((plan) => plan.trialDays) ?? [0]));

  function choosePlan(plan: ApiSubscriptionPlan) {
    if (!session) {
      window.location.assign(loginUrlFor({ redirect: "/checkout", planRef: plan.planRef }));
      return;
    }
    navigate({ to: "/checkout", search: { planRef: plan.planRef } });
  }

  function addToCart(productRef: string) {
    if (!session) {
      window.location.assign(loginUrlFor({ redirect: "/shop", addProductRef: productRef }));
      return;
    }
    addItemMutation.mutate(productRef);
  }

  return (
    <div className="home-page min-w-0 overflow-x-clip pb-10">
      <section
        className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6"
        aria-labelledby="home-hero-title"
      >
        <div className="home-hero grid overflow-hidden rounded-2xl bg-surface lg:min-h-[39rem] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="home-hero-copy flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
            <p className="max-w-xs text-sm font-semibold text-primary">
              Nairobi moves. We move with you.
            </p>
            <h1
              id="home-hero-title"
              className="mt-5 max-w-[11ch] text-balance font-display text-[clamp(3.25rem,7vw,5.75rem)] font-extrabold leading-[0.92] tracking-[-0.035em] text-foreground"
            >
              Transform your body. Elevate your life.
            </h1>
            <p className="mt-7 max-w-[34rem] text-pretty text-lg leading-relaxed text-muted-foreground">
              Training, nutrition and recovery—built around your goals, your routine and the life
              you want to lead.
            </p>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button asChild variant="hero" size="xl" className="w-full sm:w-auto">
                <Link to="/programs">
                  Find your program <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Link
                to="/plans"
                className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-foreground underline decoration-border decoration-2 underline-offset-8 transition-colors hover:text-primary focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                Compare memberships
              </Link>
            </div>
            <p className="mt-10 max-w-md border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
              {homeQuery.isSuccess && overview?.stats.activeMembers
                ? `Trusted by ${count(overview.stats.activeMembers)} active members, with verified coaches and coordinated wellness support.`
                : "Coach-led programs and coordinated wellness support for every starting point."}
            </p>
          </div>
          <div className="home-hero-media relative min-h-[27rem] overflow-hidden lg:min-h-full">
            <img
              src={heroStudio}
              alt="A coach guides two athletes through lunges in a bright Nairobi studio"
              className="h-full w-full object-cover object-center"
              width={1448}
              height={1086}
              fetchPriority="high"
            />
            <div className="absolute bottom-5 right-5 max-w-52 rounded-xl bg-foreground px-4 py-3 text-sm leading-snug text-background">
              Expert coaching.
              <br />
              Care that continues.
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-[clamp(5rem,10vw,8rem)] pt-[clamp(5rem,10vw,8rem)]">
        <section className="mx-auto max-w-7xl px-4 sm:px-6" aria-labelledby="programs-title">
          <SectionHeading
            titleId="programs-title"
            title="Train with intention"
            subtitle="Choose a coach-led path with a clear schedule, practical guidance and progress you can measure."
            link="/programs"
            linkLabel="Explore all programs"
          />
          <DynamicSection
            query={homeQuery}
            empty={!programs.length}
            emptyMessage="New training programs are being prepared. Explore memberships while we update the schedule."
            emptyLink="/plans"
            emptyLinkLabel="View memberships"
            loading={<ProgramsSkeleton />}
          >
            <ProgramsEditorial programs={programs.slice(0, 3)} />
          </DynamicSection>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6" aria-labelledby="plans-title">
          <SectionHeading
            titleId="plans-title"
            title="Membership that fits the work"
            subtitle="Compare access, support and billing without hidden extras. Choose the level that matches your routine."
            link="/plans"
            linkLabel="Compare every plan"
          />
          <DynamicSection
            query={homeQuery}
            empty={!plans.length}
            emptyMessage="Membership enrolment will reopen soon. You can still explore individual programs."
            emptyLink="/programs"
            emptyLinkLabel="Browse programs"
            loading={<PlansSkeleton />}
          >
            <div className="mt-10 overflow-hidden rounded-2xl bg-foreground text-background lg:grid lg:grid-cols-[0.75fr_repeat(3,1fr)]">
              <div className="flex flex-col justify-between gap-8 border-b border-background/20 p-7 sm:p-9 lg:border-b-0 lg:border-r">
                <div>
                  <p className="font-display text-3xl font-bold leading-tight">
                    Choose your level.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-background/75">
                    Every plan keeps your next workout and support options clear.
                  </p>
                </div>
                {maxTrialDays > 0 && (
                  <p className="text-sm font-semibold text-primary">
                    Up to {maxTrialDays} trial days
                  </p>
                )}
              </div>
              {plans.slice(0, 3).map((plan, index) => {
                const featured = index === 1 || (plans.length < 3 && index === 0);
                return (
                  <article
                    key={plan.planRef}
                    className={cn(
                      "flex min-h-full flex-col border-b border-background/20 p-7 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0",
                      featured && "bg-[#3F6E8C]",
                    )}
                  >
                    <div className="flex min-h-7 items-start justify-between gap-3">
                      <span className="text-sm font-semibold capitalize">{plan.billingCycle}</span>
                      {featured && (
                        <span className="rounded-md bg-background px-2 py-1 text-xs font-semibold text-foreground">
                          Best fit
                        </span>
                      )}
                    </div>
                    <h3 className="mt-6 font-display text-2xl font-bold">{plan.name}</h3>
                    <p className="mt-2 min-h-16 text-sm leading-relaxed text-background/75">
                      {plan.description}
                    </p>
                    <p className="mt-5 font-display text-3xl font-bold tabular-nums">
                      {KSh(planAmount(plan))}
                      <span className="ml-1 font-sans text-sm font-normal">
                        /{plan.billingCycle}
                      </span>
                    </p>
                    {plan.discount > 0 && (
                      <p className="mt-1 text-xs text-background/70 line-through tabular-nums">
                        {KSh(plan.price)}
                      </p>
                    )}
                    <ul className="mt-7 flex-1 space-y-3 text-sm">
                      {plan.features.slice(0, 5).map((feature) => (
                        <li key={feature} className="flex gap-2">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={featured ? "soft" : "hero"}
                      className="mt-8 w-full"
                      onClick={() => choosePlan(plan)}
                    >
                      Choose {plan.name}
                    </Button>
                  </article>
                );
              })}
            </div>
          </DynamicSection>
        </section>

        <section
          className="bg-primary py-[clamp(4rem,8vw,7rem)] text-primary-foreground"
          aria-labelledby="care-title"
        >
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
              <img
                src={nutritionCare}
                alt="A nutrition professional reviews a balanced meal plan with a client"
                className="h-full min-h-96 w-full rounded-2xl object-cover"
                loading="lazy"
                width={1536}
                height={1024}
              />
              <img
                src={programMobility}
                alt="A coach leads a small group through a mobility session"
                className="hidden h-full min-h-96 w-full rounded-2xl object-cover sm:block"
                loading="lazy"
                width={1536}
                height={1024}
              />
            </div>
            <div className="lg:pl-8">
              <h2
                id="care-title"
                className="max-w-[11ch] text-balance font-display text-[clamp(2.75rem,5vw,4.75rem)] font-bold leading-[0.98] tracking-[-0.03em]"
              >
                Care beyond the workout
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-primary-foreground/85">
                Training works better when food, recovery and expert support move in the same
                direction.
              </p>
              <DynamicSection
                query={homeQuery}
                empty={!overview?.services.length}
                emptyMessage="Nutrition and physiotherapy bookings will appear here when the next schedule opens."
                loading={<CareSkeleton />}
                inverse
              >
                <div className="mt-9 divide-y divide-primary-foreground/25 border-y border-primary-foreground/25">
                  {overview?.services.slice(0, 3).map((service) => (
                    <ServiceRow key={service.serviceRef} service={service} />
                  ))}
                </div>
              </DynamicSection>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="soft">
                  <Link to="/nutrition">Nutrition support</Link>
                </Button>
                <Link
                  to="/physiotherapy"
                  className="inline-flex min-h-11 items-center px-2 text-sm font-semibold underline decoration-primary-foreground/50 decoration-2 underline-offset-8 hover:decoration-primary-foreground focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-foreground"
                >
                  Physiotherapy
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6" aria-labelledby="stories-title">
          <div className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
            <article className="rounded-2xl bg-foreground p-8 text-background sm:p-12">
              <Quote className="h-10 w-10 text-primary" aria-hidden="true" />
              <h2
                id="stories-title"
                className="mt-8 max-w-[20ch] text-balance font-display text-[clamp(2rem,4vw,3.75rem)] font-bold leading-[1.05]"
              >
                “{testimonials[0].text}”
              </h2>
              <p className="mt-8 font-semibold">
                {testimonials[0].name}{" "}
                <span className="font-normal text-background/65">· {testimonials[0].role}</span>
              </p>
            </article>
            <div>
              <p className="font-display text-2xl font-bold">
                Real progress, in members’ own words.
              </p>
              <div className="mt-6 divide-y divide-border border-y border-border">
                {testimonials.slice(1).map((testimonial) => (
                  <blockquote key={testimonial.name} className="py-7">
                    <p className="text-base leading-relaxed text-muted-foreground">
                      “{testimonial.text}”
                    </p>
                    <footer className="mt-4 text-sm font-semibold">
                      {testimonial.name}{" "}
                      <span className="font-normal text-muted-foreground">
                        · {testimonial.role}
                      </span>
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6" aria-labelledby="shop-title">
          <SectionHeading
            titleId="shop-title"
            title="Useful gear, clearly chosen"
            subtitle="A focused selection for training, recovery and everyday movement."
            link="/shop"
            linkLabel="Visit the shop"
          />
          <DynamicSection
            query={homeQuery}
            empty={!overview?.products.length}
            emptyMessage="The next product collection is being prepared."
            emptyLink="/programs"
            emptyLinkLabel="Explore programs"
            loading={<ShopSkeleton />}
          >
            <div className="mt-10 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
              {overview?.products.slice(0, 4).map((product) => {
                const image = apiAssetUrl(product.images?.[0]);
                const price = product.discountPrice ?? product.price;
                const adding =
                  addItemMutation.isPending && addItemMutation.variables === product.productRef;
                return (
                  <article key={product.productRef} className="group">
                    <Link
                      to="/shop/$productRef"
                      params={{ productRef: product.productRef }}
                      className="grid aspect-square place-items-center overflow-hidden rounded-xl bg-secondary"
                      aria-label={`View ${product.name}`}
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                          loading="lazy"
                        />
                      ) : (
                        <Package className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                      )}
                    </Link>
                    <div className="mt-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-semibold">
                          <Link
                            to="/shop/$productRef"
                            params={{ productRef: product.productRef }}
                            className="transition-colors hover:text-primary"
                          >
                            {product.name}
                          </Link>
                        </h3>
                        <p className="mt-1 text-sm capitalize text-muted-foreground">
                          {product.category.replaceAll("_", " ")}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm tabular-nums">
                        <Star
                          className="h-3.5 w-3.5 fill-primary text-primary"
                          aria-hidden="true"
                        />
                        {product.rating.toFixed(1)}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-display text-lg font-bold tabular-nums">{KSh(price)}</p>
                        {product.discountPrice ? (
                          <p className="text-xs text-muted-foreground line-through tabular-nums">
                            {KSh(product.price)}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={adding}
                        onClick={() => addToCart(product.productRef)}
                      >
                        {adding ? (
                          <Loader2 className="animate-spin" aria-hidden="true" />
                        ) : (
                          <ShoppingBag aria-hidden="true" />
                        )}
                        {adding ? "Adding" : "Add to cart"}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </DynamicSection>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 rounded-2xl bg-primary px-7 py-12 text-primary-foreground sm:px-12 lg:grid-cols-[1fr_auto] lg:items-end lg:px-16 lg:py-16">
            <div>
              <h2 className="max-w-[14ch] text-balance font-display text-[clamp(2.5rem,5vw,4.5rem)] font-bold leading-[0.98] tracking-[-0.03em]">
                Your next step should feel clear.
              </h2>
              <p className="mt-5 max-w-xl text-lg text-primary-foreground/85">
                {maxTrialDays > 0
                  ? `Choose a membership and begin with up to ${maxTrialDays} trial days.`
                  : "Start with the program that matches your goal and current routine."}
              </p>
            </div>
            <Button asChild variant="soft" size="xl">
              <Link to="/plans">
                View memberships <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ProgramsEditorial({ programs }: { programs: ApiProgram[] }) {
  const [featured, ...secondary] = programs;
  if (!featured) return null;
  return (
    <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <article className="overflow-hidden rounded-2xl bg-foreground text-background">
        <img
          src={programImage(featured)}
          alt={`${featured.title} training session`}
          className="aspect-[16/10] w-full object-cover"
          loading="lazy"
        />
        <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-end sm:p-8">
          <div>
            <div className="flex flex-wrap gap-3 text-sm text-background/70">
              <span className="capitalize">{featured.difficultyLevel}</span>
              <span aria-hidden="true">·</span>
              <span>{featured.duration}</span>
            </div>
            <h3 className="mt-3 font-display text-3xl font-bold">{featured.title}</h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-background/75">
              {featured.description}
            </p>
          </div>
          <Button asChild variant="hero">
            <Link to="/programs/$slug" params={{ slug: featured.programRef }}>
              View program <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </article>
      <div className="grid gap-5">
        {secondary.map((program, index) => (
          <article
            key={program.programRef}
            className="grid overflow-hidden rounded-2xl bg-surface sm:grid-cols-[0.9fr_1.1fr]"
          >
            <img
              src={programImage(program)}
              alt={`${program.title} training session`}
              className="h-full min-h-56 w-full object-cover"
              loading="lazy"
            />
            <div className="flex flex-col p-6">
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span className="capitalize">{program.difficultyLevel}</span>
                <span>{program.duration}</span>
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold">{program.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {program.description}
              </p>
              <Link
                to="/programs/$slug"
                params={{ slug: program.programRef }}
                className="mt-6 inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-primary hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                Explore program <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
        {secondary.length === 0 && (
          <article className="grid overflow-hidden rounded-2xl bg-secondary sm:grid-cols-[0.9fr_1.1fr]">
            <img
              src={programMobility}
              alt="A coach leads a small group through a mobility session"
              className="h-full min-h-56 w-full object-cover"
              loading="lazy"
            />
            <div className="flex flex-col justify-center p-6">
              <h3 className="font-display text-2xl font-bold">Move well between sessions</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Mobility and recovery support help you keep training consistently.
              </p>
              <Link
                to="/physiotherapy"
                className="mt-5 inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-primary hover:underline"
              >
                Explore recovery <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}

function ServiceRow({ service }: { service: ApiWellnessService }) {
  const destination = service.type === "nutritionist" ? "/nutrition" : "/physiotherapy";
  return (
    <article className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <h3 className="font-display text-xl font-bold">{service.name}</h3>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-primary-foreground/75">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {service.duration} minutes
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {service.location}
          </span>
        </div>
      </div>
      <Link
        to={destination}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline decoration-primary-foreground/40 decoration-2 underline-offset-8 hover:decoration-primary-foreground focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-foreground"
      >
        View booking <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

type PublicRoute = "/" | "/programs" | "/plans" | "/shop" | "/nutrition" | "/physiotherapy";

function SectionHeading({
  titleId,
  title,
  subtitle,
  link,
  linkLabel,
}: {
  titleId: string;
  title: string;
  subtitle: string;
  link: PublicRoute;
  linkLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-6">
      <div>
        <h2
          id={titleId}
          className="text-balance font-display text-[clamp(2.4rem,5vw,4.5rem)] font-bold leading-[0.98] tracking-[-0.03em]"
        >
          {title}
        </h2>
        <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          {subtitle}
        </p>
      </div>
      <Link
        to={link}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary transition-[gap] duration-200 hover:gap-3 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        {linkLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

function InlineError({ onRetry, inverse = false }: { onRetry: () => void; inverse?: boolean }) {
  return (
    <div
      className={cn(
        "mt-8 rounded-xl border p-6",
        inverse ? "border-primary-foreground/35" : "border-destructive/35",
      )}
      role="alert"
    >
      <p className={cn("text-sm", inverse ? "text-primary-foreground" : "text-destructive")}>
        We couldn't load this section. Check your connection and try again.
      </p>
      <Button variant={inverse ? "soft" : "outline"} className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function DynamicSection({
  query,
  empty,
  emptyMessage,
  emptyLink,
  emptyLinkLabel,
  loading,
  inverse = false,
  children,
}: {
  query: { isLoading: boolean; isError: boolean; refetch: () => Promise<unknown> };
  empty: boolean;
  emptyMessage: string;
  emptyLink?: PublicRoute;
  emptyLinkLabel?: string;
  loading: ReactNode;
  inverse?: boolean;
  children: ReactNode;
}) {
  if (query.isLoading) return loading;
  if (query.isError) return <InlineError inverse={inverse} onRetry={() => void query.refetch()} />;
  if (empty)
    return (
      <div
        className={cn(
          "mt-8 rounded-xl border border-dashed p-8",
          inverse
            ? "border-primary-foreground/40 text-primary-foreground"
            : "text-muted-foreground",
        )}
      >
        <p className="max-w-xl text-sm leading-relaxed">{emptyMessage}</p>
        {emptyLink && emptyLinkLabel && (
          <Link
            to={emptyLink}
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-8"
          >
            {emptyLinkLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    );
  return children;
}

function ProgramsSkeleton() {
  return (
    <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]" aria-label="Loading programs">
      <div className="h-[34rem] animate-pulse rounded-2xl bg-secondary" />
      <div className="grid gap-5">
        <div className="h-[16.5rem] animate-pulse rounded-2xl bg-secondary" />
        <div className="h-[16.5rem] animate-pulse rounded-2xl bg-secondary" />
      </div>
    </div>
  );
}

function PlansSkeleton() {
  return (
    <div
      className="mt-10 grid overflow-hidden rounded-2xl bg-foreground p-6 sm:grid-cols-2 lg:grid-cols-4"
      aria-label="Loading memberships"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="m-2 h-80 animate-pulse rounded-xl bg-background/10" />
      ))}
    </div>
  );
}

function CareSkeleton() {
  return (
    <div className="mt-9 space-y-3" aria-label="Loading wellness services">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-xl bg-primary-foreground/15" />
      ))}
    </div>
  );
}

function ShopSkeleton() {
  return (
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading products">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index}>
          <div className="aspect-square animate-pulse rounded-xl bg-secondary" />
          <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-secondary" />
          <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-secondary" />
        </div>
      ))}
    </div>
  );
}
