import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BarChart3, Clock, Dumbbell, Flame, PlayCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { programsApi, type ApiProgram } from "@/lib/api";
import { programCategoryLabels as categoryLabels, programImage } from "@/lib/program-display";

export const Route = createFileRoute("/programs/")({
  head: () => ({
    meta: [
      { title: "Training Programs - Level Up Fitness" },
      {
        name: "description",
        content:
          "Body transformation, weight loss, and muscle building programs led by certified coaches.",
      },
    ],
  }),
  component: ProgramsPage,
});

const categoryKicker: Record<ApiProgram["category"], string> = {
  body_transformation: "Transform Your Body",
  lose_weight: "Elevate Your Life",
  gain_weight_muscle_building: "Care beyond the workout",
};

const KSh = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);

function selectFeaturedProgram(programs: ApiProgram[]) {
  return (
    programs.find((program) => program.category === "body_transformation") ?? programs[0] ?? null
  );
}

function ProgramsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div className="space-y-4">
          <div className="h-4 w-40 animate-pulse rounded-full bg-muted" />
          <div className="h-16 w-full max-w-xl animate-pulse rounded-[1.25rem] bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-full max-w-2xl animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-full max-w-xl animate-pulse rounded-full bg-muted" />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="h-11 w-36 animate-pulse rounded-xl bg-muted" />
            <div className="h-11 w-40 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
        <div className="overflow-hidden rounded-[1.25rem] border border-border bg-muted">
          <div className="aspect-[4/3] animate-pulse bg-muted" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-4 w-36 animate-pulse rounded-full bg-muted" />
        <div className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-7 overflow-hidden rounded-[1rem] border border-border bg-muted">
            <div className="aspect-[16/10] animate-pulse bg-muted" />
          </div>
          <div className="xl:col-span-5 grid gap-4">
            <div className="overflow-hidden rounded-[1rem] border border-border bg-muted">
              <div className="aspect-[16/9] animate-pulse bg-muted" />
            </div>
            <div className="overflow-hidden rounded-[1rem] border border-border bg-muted">
              <div className="aspect-[16/9] animate-pulse bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgramCard({ program, featured = false }: { program: ApiProgram; featured?: boolean }) {
  return (
    <article className="card-elevated overflow-hidden rounded-[1rem]">
      <div
        className={
          featured
            ? "grid gap-0 lg:grid-cols-[1.1fr_0.9fr]"
            : "grid gap-0 md:grid-cols-[0.95fr_1.05fr]"
        }
      >
        <div className={featured ? "order-2 p-6 lg:order-1 lg:p-8" : "order-2 p-5 md:order-1"}>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="secondary" className="rounded-full">
              {categoryLabels[program.category]}
            </Badge>
            <span className="rounded-full bg-muted px-2.5 py-1 text-surface-foreground">
              {program.difficultyLevel}
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {program.duration}
            </span>
            {program.subscriptionRequired && (
              <Badge className="rounded-full">Subscription required</Badge>
            )}
          </div>

          <p className="mt-4 text-sm font-medium text-muted-foreground">
            {categoryKicker[program.category]}
          </p>
          <h3
            className={
              featured
                ? "mt-2 font-display text-3xl font-bold"
                : "mt-2 font-display text-2xl font-bold"
            }
          >
            {program.title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            with {program.trainer || "Level Up coaching team"}
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed">{program.description}</p>

          <div
            className={
              featured ? "mt-6 grid gap-3 sm:grid-cols-2" : "mt-5 grid gap-3 sm:grid-cols-2"
            }
          >
            <div className="rounded-[0.9rem] bg-muted/80 p-4">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
                <Flame className="h-4 w-4 text-primary" />
                Weekly schedule
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(program.workoutSchedule.length
                  ? program.workoutSchedule
                  : ["Shared after enrollment"]
                ).map((item) => (
                  <span
                    key={item}
                    className="rounded-lg bg-background px-2 py-1 text-xs text-muted-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[0.9rem] bg-muted/80 p-4">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
                <BarChart3 className="h-4 w-4 text-primary" />
                Program content
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-lg bg-background px-2 py-1">
                  <PlayCircle className="h-3.5 w-3.5" />
                  {program.videos?.length ?? 0} videos
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-background px-2 py-1">
                  <Dumbbell className="h-3.5 w-3.5" />
                  {program.enrolledCount ?? program.enrolledUsers?.length ?? 0} enrolled
                </span>
              </div>
              {program.nutritionNotes && (
                <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                  {program.nutritionNotes}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">From</p>
              <p className="font-display text-3xl font-bold">{KSh(program.price)}</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="soft" size="sm">
                <Link to="/programs/$slug" params={{ slug: program.programRef }}>
                  View details
                </Link>
              </Button>
              <Button asChild variant="hero" size="sm">
                <Link to="/plans">
                  Subscribe
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className={featured ? "order-1 lg:order-2" : "order-1"}>
          <img
            src={programImage(program)}
            alt={program.title}
            className={
              featured
                ? "h-full min-h-[18rem] w-full object-cover"
                : "h-full min-h-[16rem] w-full object-cover"
            }
            loading="lazy"
            width={1024}
            height={768}
          />
        </div>
      </div>
    </article>
  );
}

function ProgramsPage() {
  const programsQuery = useQuery({
    queryKey: ["public", "programs"],
    queryFn: () => programsApi.publicList({ limit: 50 }),
  });

  const programs = programsQuery.data?.data.programs ?? [];
  const featuredProgram = selectFeaturedProgram(programs);
  const supportingPrograms = programs.filter(
    (program) => program.programRef !== featuredProgram?.programRef,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
      <div className="space-y-12">
        {programsQuery.isLoading ? (
          <ProgramsSkeleton />
        ) : programsQuery.isError ? (
          <section className="card-elevated rounded-[1rem] p-8 sm:p-10">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-primary">Programs</p>
              <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">
                Training programs are unavailable
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                We could not load the current program list. Try again or return once the connection
                is stable.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => programsQuery.refetch()} variant="hero">
                  Retry
                </Button>
                <Button asChild variant="soft">
                  <Link to="/">Back to home</Link>
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div className="home-hero-copy space-y-6">
                <p className="text-sm font-semibold text-primary">Programs</p>
                <h1 className="max-w-xl font-display text-5xl font-bold leading-[0.92] tracking-[-0.035em] text-balance sm:text-6xl">
                  Training built with the same clarity as the class floor.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                  Explore guided programs for body transformation, weight loss, and muscle building.
                  Each path keeps the schedule, coach support, and nutrition guidance visible so the
                  next step is obvious.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="hero">
                    <Link to="/plans">
                      Explore memberships
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="soft">
                    <Link to="/shop">Browse equipment</Link>
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1rem] bg-white p-4 shadow-[var(--shadow-soft)]">
                    <p className="text-xs font-medium text-muted-foreground">Programs live</p>
                    <p className="mt-2 font-display text-2xl font-bold">{programs.length}</p>
                  </div>
                  <div className="rounded-[1rem] bg-white p-4 shadow-[var(--shadow-soft)]">
                    <p className="text-xs font-medium text-muted-foreground">Program videos</p>
                    <p className="mt-2 font-display text-2xl font-bold">
                      {programs.reduce((count, program) => count + (program.videos?.length ?? 0), 0)}
                    </p>
                  </div>
                  <div className="rounded-[1rem] bg-white p-4 shadow-[var(--shadow-soft)]">
                    <p className="text-xs font-medium text-muted-foreground">Active paths</p>
                    <p className="mt-2 font-display text-2xl font-bold">
                      {new Set(programs.map((program) => program.category)).size}
                    </p>
                  </div>
                </div>
              </div>

              {featuredProgram ? (
                <div className="home-hero-media overflow-hidden rounded-[1.25rem] border border-border bg-white shadow-[var(--shadow-elegant)]">
                  <img
                    src={programImage(featuredProgram)}
                    alt={featuredProgram.title}
                    className="h-full min-h-[24rem] w-full object-cover"
                    width={1448}
                    height={1086}
                  />
                </div>
              ) : (
                <div className="overflow-hidden rounded-[1.25rem] border border-border bg-muted">
                  <div className="aspect-[4/3] bg-muted" />
                </div>
              )}
            </section>

            <section className="space-y-5">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-muted-foreground">Small group programs</p>
                <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                  A more guided way to choose your lane
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                  Like the Core Atelier classes page, the page opens with one clear narrative and
                  then expands into specific offerings. The structure below keeps the highest-value
                  program prominent while giving the rest of the catalogue a quieter role.
                </p>
              </div>

              {featuredProgram ? <ProgramCard program={featuredProgram} featured /> : null}

              {supportingPrograms.length > 0 && (
                <div className="grid gap-6 xl:grid-cols-2">
                  {supportingPrograms.map((program) => (
                    <ProgramCard key={program.programRef} program={program} />
                  ))}
                </div>
              )}
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.25rem] bg-[#14231d] p-8 text-[#f6f8f5] shadow-[var(--shadow-elegant)]">
                <p className="text-sm font-semibold text-[#f6f8f5]/75">How access works</p>
                <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                  Simple, direct, and easy to scan.
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      title: "Choose a program",
                      body: "Pick the training path that matches your current goal and starting point.",
                    },
                    {
                      title: "Subscribe to unlock",
                      body: "Use the membership path that gives you access to the right program and support.",
                    },
                    {
                      title: "Train with guidance",
                      body: "Follow the schedule, track the content, and keep nutrition support visible.",
                    },
                  ].map((step, index) => (
                    <div key={step.title} className="rounded-[1rem] bg-[#263930] p-4">
                      <p className="text-xs font-semibold text-[#f6f8f5]/70">0{index + 1}</p>
                      <h3 className="mt-2 font-display text-xl font-bold">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#f6f8f5]/80">{step.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-border bg-white p-8 shadow-[var(--shadow-soft)]">
                <p className="text-sm font-semibold text-primary">Need a slower start?</p>
                <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                  Memberships unlock the full program path.
                </h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  If you want access to multiple programs, use a membership plan first. That keeps
                  the decision flow short and makes the subscription step explicit.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild variant="hero">
                    <Link to="/plans">
                      View plans
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="soft">
                    <Link to="/programs">Back to top</Link>
                  </Button>
                </div>
              </div>
            </section>

            {!featuredProgram && programs.length === 0 ? (
              <section className="card-elevated rounded-[1rem] p-8 text-center">
                <p className="text-muted-foreground">No active programs are available yet.</p>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
