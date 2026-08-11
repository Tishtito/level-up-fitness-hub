import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Bone,
  ClipboardList,
  Droplets,
  HeartPulse,
  Scale,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";

import programMobility from "@/assets/home/program-mobility.webp";
import physioDetail from "@/assets/physio.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/medicare")({
  head: () => ({
    meta: [
      { title: "Medical Assessments - Level Up Fitness" },
      {
        name: "description",
        content:
          "Medical assessments for special populations and older adults: screening, baseline measures, and safe movement guidance for managing blood pressure, obesity, arthritis, and blood sugar.",
      },
    ],
  }),
  component: MedicarePage,
});

const conditions = [
  {
    icon: HeartPulse,
    title: "Blood pressure",
    detail:
      "Resting and response-to-exercise readings, so training loads stay inside a safe range for your body.",
  },
  {
    icon: Scale,
    title: "Obesity",
    detail:
      "Body composition and joint-friendly movement plans that make weight management sustainable.",
  },
  {
    icon: Bone,
    title: "Arthritis",
    detail:
      "Mobility range checks and low-impact routines that ease stiffness without flaring joints up.",
  },
  {
    icon: Droplets,
    title: "Blood sugar",
    detail:
      "Glycaemic awareness for workout timing, nutrition support, and steady energy through the day.",
  },
];

const specialPopulations = [
  {
    title: "Older adults",
    detail: "Strength, balance, and mobility work that keeps everyday life independent and safe.",
  },
  {
    title: "Chronic condition clients",
    detail:
      "Exercise plans that work alongside blood pressure, diabetes, arthritis, and weight management care.",
  },
  {
    title: "Deconditioned beginners",
    detail:
      "Small, progressive starting points for clients returning to movement after illness or inactivity.",
  },
  {
    title: "Injured or recovering",
    detail: "Coordinated recovery with our physiotherapy team before, during, and after training.",
  },
];

const steps = [
  {
    icon: ClipboardList,
    title: "Health screening",
    detail:
      "A structured intake covers your medical history, medications, and current symptoms before any movement.",
  },
  {
    icon: Activity,
    title: "Baseline measures",
    detail:
      "Blood pressure, body composition, resting heart rate, and activity levels are recorded as a starting point.",
  },
  {
    icon: Users,
    title: "Movement readiness",
    detail:
      "A coach-led review of mobility, strength, and balance shows what to start with and what to avoid.",
  },
  {
    icon: ShieldCheck,
    title: "Care plan",
    detail:
      "You leave with a clear care path across training, nutrition, and physiotherapy — coordinated with your clinician where needed.",
  },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function MedicarePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
      <div className="space-y-[clamp(4rem,8vw,6.5rem)]">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold text-primary">Medical assessments</p>
            <h1 className="max-w-2xl text-balance font-display text-5xl font-bold leading-[0.92] tracking-[-0.035em] sm:text-6xl">
              Assessment first. Then the right movement for your body.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Medicare sessions screen blood pressure, weight, arthritis, and blood sugar risks —
              then build a safe, coach-led plan for special-population clients and older adults.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="hero" size="lg" onClick={() => scrollTo("how-it-works")}>
                How it works
              </Button>
              <Button variant="soft" size="lg" asChild>
                <Link to="/plans">View memberships</Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Screenings", value: "4 lifestyle areas" },
                { label: "Special focus", value: "Seniors & care" },
                { label: "Plan", value: "Care-first" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1rem] bg-white p-4 shadow-[var(--shadow-soft)]"
                >
                  <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                  <p className="mt-2 font-display text-2xl font-bold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-[1.25rem] border border-border bg-white shadow-[var(--shadow-elegant)]">
            <img
              src={physioDetail}
              alt="A guided recovery session at Level Up Fitness"
              className="h-full min-h-[24rem] w-full object-cover"
              loading="lazy"
              width={1536}
              height={1024}
            />
          </div>
        </section>

        <section className="rounded-[1.25rem] bg-[#14231d] p-8 text-[#f6f8f5] shadow-[var(--shadow-elegant)] sm:p-10">
          <p className="text-sm font-semibold text-[#f6f8f5]/75">
            Lifestyle diseases we screen for
          </p>
          <h2 className="mt-2 max-w-xl text-balance font-display text-4xl font-bold sm:text-5xl">
            Know your numbers before you push the pace.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#f6f8f5]/75">
            The most common barriers to safe training in Nairobi are conditions that rarely show
            symptoms until they don&apos;t. A baseline assessment turns guesswork into a plan.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {conditions.map((condition) => (
              <article key={condition.title} className="rounded-[1rem] bg-[#263930] p-5">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <condition.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold">{condition.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#f6f8f5]/80">{condition.detail}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-[#f6f8f5]/70">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Assessments guide safe training and coordinate with your clinician. They do not replace
            diagnosis or medical care.
          </p>
        </section>

        <section className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="overflow-hidden rounded-[1.25rem] border border-border bg-white shadow-[var(--shadow-soft)]">
            <img
              src={programMobility}
              alt="A coach leads a small group through a mobility session"
              className="h-full min-h-[20rem] w-full object-cover"
              loading="lazy"
              width={1536}
              height={1024}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Special populations</p>
            <h2 className="mt-2 max-w-xl text-balance font-display text-4xl font-bold sm:text-5xl">
              Movement that respects who you are today.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              Generic programs fail people whose bodies need a gentler start. Assessment lets our
              coaches scale every session to your current capacity — and build on it safely.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {specialPopulations.map((group) => (
                <article
                  key={group.title}
                  className="rounded-[1rem] border border-border bg-white p-5 shadow-[var(--shadow-soft)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl font-bold">{group.title}</h3>
                    <Stethoscope className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{group.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-24 rounded-[1.25rem] border border-border bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10"
        >
          <p className="text-sm font-semibold text-primary">How it works</p>
          <h2 className="mt-2 max-w-xl text-balance font-display text-4xl font-bold sm:text-5xl">
            Four steps from screening to a safe plan.
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="relative rounded-[1rem] bg-muted p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Step {index + 1}
                </span>
                <div className="mt-3 grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-[1.25rem] bg-primary p-8 text-primary-foreground sm:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="max-w-[16ch] text-balance font-display text-[clamp(2.5rem,5vw,4.5rem)] font-bold leading-[0.98] tracking-[-0.03em]">
                Begin with an assessment, then keep the care connected.
              </h2>
              <p className="mt-5 max-w-xl text-lg text-primary-foreground/85">
                Training, nutrition, and physiotherapy work best when they start from the same
                baseline. Memberships include the full care path.
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
