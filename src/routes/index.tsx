import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Clock, Dumbbell, Loader2, MapPin, Package, Quote, ShoppingBag, Sparkles, Star, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import type { ReactNode } from "react";

import hero from "@/assets/hero.jpg";
import muscle from "@/assets/program-muscle.jpg";
import transform from "@/assets/program-transform.jpg";
import weightLoss from "@/assets/program-weight-loss.jpg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cartApi, homeApi, type ApiProgram, type ApiSubscriptionPlan, type ApiWellnessService } from "@/lib/api";
import { useAuthSession } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";
import { apiAssetUrl } from "@/lib/env";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Level Up Fitness - Transform Your Body. Elevate Your Life." },
      { name: "description", content: "Premium fitness subscriptions, online training programs, nutrition, physiotherapy and a curated wellness store." },
    ],
  }),
  component: Home,
});

const testimonials = [
  { name: "Amelia K.", text: "Lost 14kg in 4 months while feeling stronger than ever. The trainers are next level.", role: "Member · 1 yr" },
  { name: "Jordan M.", text: "Finally a fitness platform that doesn't yell at me. Calm, premium, and works.", role: "Pro Member" },
  { name: "Priya S.", text: "Booking my nutritionist and physio in the same app changed my recovery.", role: "Elite Member" },
];

const KSh = (value: number) => new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
}).format(value || 0);

const count = (value?: number) => new Intl.NumberFormat("en-KE").format(value ?? 0);

function planAmount(plan: ApiSubscriptionPlan) {
  return Math.max(0, plan.price - (plan.discount ?? 0));
}

function fallbackProgramImage(program: ApiProgram) {
  if (program.category === "lose_weight") return weightLoss;
  if (program.category === "gain_weight_muscle_building") return muscle;
  return transform;
}

function Home() {
  const session = useAuthSession();
  const navigate = useNavigate();
  const homeQuery = useQuery({
    queryKey: ["public", "home"],
    queryFn: homeApi.getOverview,
    staleTime: 60_000,
  });
  const addItemMutation = useMutation({
    mutationFn: (productRef: string) => cartApi.addItem(productRef, 1),
    onSuccess: () => toast.success("Added to cart"),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not add item"),
  });

  const overview = homeQuery.data;
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
    <div className="space-y-24 pb-8">
      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="hero-bg relative overflow-hidden rounded-[2rem] p-6 sm:p-12 lg:p-16">
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div className="text-primary-foreground">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> Premium Fitness Platform
              </span>
              <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
                Transform Your Body.<br /><span className="gradient-text">Elevate</span> Your Life.
              </h1>
              <p className="mt-5 max-w-md text-base text-primary-foreground/85 sm:text-lg">
                Subscriptions, expert coaching, nutrition, physiotherapy and curated gear, all in one beautifully simple platform.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/plans"><Button variant="hero" size="xl">Join Now <ArrowRight className="h-4 w-4" /></Button></Link>
                <Link to="/programs"><Button variant="soft" size="xl">Explore Programs</Button></Link>
              </div>
              <p className="mt-8 text-sm text-primary-foreground/85">
                {homeQuery.isSuccess
                  ? "Join " + count(overview?.stats.activeMembers) + " active members already leveling up."
                  : "Build strength, confidence, and healthier routines with Level Up Fitness."}
              </p>
            </div>
            <img src={hero} alt="Athletic woman stretching" className="w-full rounded-[2rem] object-cover shadow-[var(--shadow-elegant)]" width={1024} height={1280} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        {homeQuery.isLoading ? <StatsSkeleton /> : homeQuery.isError ? <InlineError onRetry={() => void homeQuery.refetch()} /> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={Users} value={count(overview?.stats.activeMembers)} label="Active Members" />
            <Stat icon={Dumbbell} value={count(overview?.stats.activePrograms)} label="Active Programs" />
            <Stat icon={Trophy} value={count(overview?.stats.verifiedTrainers)} label="Verified Trainers" />
            <Stat icon={Sparkles} value={count(overview?.stats.activeServices)} label="Wellness Services" />
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Programs" title="Train with intention" subtitle="Purposeful programs led by verified coaches." link="/programs" />
        <DynamicSection query={homeQuery} empty={!overview?.programs.length} emptyMessage="Active training programs will appear here soon.">
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {overview?.programs.map((program) => {
              const image = apiAssetUrl(program.thumbnail) || fallbackProgramImage(program);
              return (
                <article key={program.programRef} className="card-elevated overflow-hidden rounded-3xl text-card-foreground">
                  <div className="aspect-[4/3] overflow-hidden"><img src={image} alt={program.title} className="h-full w-full object-cover transition-transform hover:scale-105" loading="lazy" /></div>
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground"><Badge variant="secondary" className="capitalize">{program.difficultyLevel}</Badge><span>{program.duration}</span></div>
                    <h3 className="mt-3 font-display text-xl font-bold">{program.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{program.description}</p>
                    <div className="mt-5 flex items-center justify-between"><div><p className="font-display text-lg font-bold text-primary">{KSh(program.price)}</p><p className="text-xs text-muted-foreground">{program.enrollmentCount} enrolled</p></div><Link to="/programs/$slug" params={{ slug: program.programRef }}><Button size="sm" variant="hero">View details</Button></Link></div>
                  </div>
                </article>
              );
            })}
          </div>
        </DynamicSection>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Membership" title="Plans for every athlete" subtitle="Choose the access and billing cycle that fit your goals." link="/plans" linkLabel="Compare all plans" />
        <DynamicSection query={homeQuery} empty={!overview?.plans.length} emptyMessage="Subscription plans will appear here soon.">
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {overview?.plans.map((plan, index) => {
              const featured = index === 0;
              return (
                <div key={plan.planRef} className={cn("relative flex flex-col rounded-3xl p-7", featured ? "bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]" : "card-elevated text-card-foreground")}>
                  {featured && <span className="absolute -top-3 right-6 rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary">Most Popular</span>}
                  <div className="flex flex-wrap gap-2"><Badge variant={featured ? "secondary" : "outline"} className="capitalize">{plan.billingCycle}</Badge>{plan.trialDays > 0 && <Badge variant={featured ? "secondary" : "outline"}>{plan.trialDays} day trial</Badge>}</div>
                  <h3 className="mt-5 font-display text-xl font-bold">{plan.name}</h3>
                  <p className={cn("mt-2 text-sm", featured ? "text-primary-foreground/80" : "text-muted-foreground")}>{plan.description}</p>
                  <p className="mt-5 font-display text-3xl font-bold">{KSh(planAmount(plan))}<span className="text-sm font-normal">/{plan.billingCycle}</span></p>
                  {plan.discount > 0 && <p className={cn("text-xs line-through", featured ? "text-primary-foreground/70" : "text-muted-foreground")}>{KSh(plan.price)}</p>}
                  <ul className="mt-6 flex-1 space-y-2 text-sm">{plan.features.slice(0, 5).map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
                  <p className={cn("mt-5 text-xs", featured ? "text-primary-foreground/80" : "text-muted-foreground")}>{plan.programAccess.length} included programs · {plan.subscriberCount} subscribers</p>
                  <Button variant={featured ? "soft" : "hero"} className="mt-7 w-full" onClick={() => choosePlan(plan)}>Choose {plan.name}</Button>
                </div>
              );
            })}
          </div>
        </DynamicSection>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Wellness" title="Care beyond the workout" subtitle="Book in-person nutrition and physiotherapy support." />
        <DynamicSection query={homeQuery} empty={!overview?.services.length} emptyMessage="Wellness services will appear here soon.">
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {overview?.services.map((service) => <ServiceCard key={service.serviceRef} service={service} />)}
          </div>
        </DynamicSection>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Loved by members" title="Real transformations" />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="card-elevated rounded-3xl p-6 text-card-foreground">
              <Quote className="h-8 w-8 text-primary/40" /><p className="mt-3 text-sm leading-relaxed">{testimonial.text}</p>
              <div className="mt-6"><p className="text-sm font-semibold">{testimonial.name}</p><p className="text-xs text-muted-foreground">{testimonial.role}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Shop" title="Gear up in style" link="/shop" linkLabel="Visit shop" />
        <DynamicSection query={homeQuery} empty={!overview?.products.length} emptyMessage="Featured products will appear here soon.">
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {overview?.products.map((product) => {
              const image = apiAssetUrl(product.images?.[0]);
              const price = product.discountPrice ?? product.price;
              return (
                <article key={product.productRef} className="card-elevated rounded-3xl p-5 text-card-foreground">
                  <div className="grid aspect-square place-items-center overflow-hidden rounded-2xl bg-surface">{image ? <img src={image} alt={product.name} className="h-full w-full object-cover" loading="lazy" /> : <Package className="h-14 w-14 text-muted-foreground" />}</div>
                  <div className="mt-4 flex items-start justify-between gap-2"><div><h3 className="font-display font-semibold">{product.name}</h3><p className="text-xs capitalize text-muted-foreground">{product.category.replaceAll("_", " ")}</p></div><span className="inline-flex items-center gap-1 text-xs"><Star className="h-3 w-3 fill-primary text-primary" />{product.rating.toFixed(1)}</span></div>
                  <div className="mt-4 flex items-center justify-between gap-3"><div><p className="font-display font-bold text-primary">{KSh(price)}</p>{product.discountPrice ? <p className="text-xs text-muted-foreground line-through">{KSh(product.price)}</p> : null}</div><Button size="sm" variant="hero" disabled={addItemMutation.isPending} onClick={() => addToCart(product.productRef)}>{addItemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}Add</Button></div>
                </article>
              );
            })}
          </div>
        </DynamicSection>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="hero-bg relative overflow-hidden rounded-[2rem] p-10 text-center sm:p-16">
          <h2 className="font-display text-3xl font-bold sm:text-5xl">Ready to level up?</h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">{maxTrialDays > 0 ? "Choose a plan and start with up to " + maxTrialDays + " trial days." : "Choose a training plan built around your goals."}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/plans"><Button variant="hero" size="xl">{maxTrialDays > 0 ? "Start Your Trial" : "View Plans"}</Button></Link><Link to="/programs"><Button variant="soft" size="xl">Browse Programs</Button></Link></div>
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ service }: { service: ApiWellnessService }) {
  const destination = service.type === "nutritionist" ? "/nutrition" : "/physiotherapy";
  return (
    <div className="card-elevated p-7">
      <Badge variant="secondary" className="capitalize">{service.type}</Badge>
      <h3 className="mt-4 font-display text-2xl font-bold">{service.name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
      <div className="mt-5 flex flex-wrap gap-4 text-sm"><span className="flex items-center gap-1"><Clock className="h-4 w-4 text-primary" />{service.duration} minutes</span><span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-primary" />{service.location}</span></div>
      <div className="mt-6 flex items-center justify-between"><p className="font-display text-xl font-bold text-primary">{KSh(service.price)}</p><Link to={destination}><Button variant="hero">View booking <ArrowRight className="h-4 w-4" /></Button></Link></div>
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Users; value: string; label: string }) {
  return <div className="card-elevated rounded-2xl p-6 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground"><Icon className="h-5 w-5" /></div><p className="mt-4 font-display text-3xl font-bold">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>;
}

function StatsSkeleton() {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="card-elevated h-40 animate-pulse rounded-2xl bg-muted/50" />)}</div>;
}

function InlineError({ onRetry }: { onRetry: () => void }) {
  return <div className="border border-destructive/30 p-8 text-center"><p className="text-sm text-destructive">Live homepage data could not be loaded.</p><Button variant="outline" className="mt-4" onClick={onRetry}>Try again</Button></div>;
}

function DynamicSection({ query, empty, emptyMessage, children }: { query: { isLoading: boolean; isError: boolean; refetch: () => Promise<unknown> }; empty: boolean; emptyMessage: string; children: ReactNode }) {
  if (query.isLoading) return <div className="mt-10 h-72 animate-pulse bg-muted/50" />;
  if (query.isError) return <InlineError onRetry={() => void query.refetch()} />;
  if (empty) return <div className="mt-10 border border-dashed p-10 text-center text-sm text-muted-foreground">{emptyMessage}</div>;
  return children;
}

function SectionHeader({ eyebrow, title, subtitle, link, linkLabel = "View all" }: { eyebrow: string; title: string; subtitle?: string; link?: string; linkLabel?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p><h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">{title}</h2>{subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}</div>
      {link && <Link to={link} className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-all hover:gap-2">{linkLabel} <ArrowRight className="h-4 w-4" /></Link>}
    </div>
  );
}
