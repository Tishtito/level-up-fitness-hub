import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Lock,
  PlayCircle,
} from "lucide-react";

import heroStudio from "@/assets/home/hero-studio.webp";
import programMobility from "@/assets/home/program-mobility.webp";
import programStrength from "@/assets/home/program-strength.webp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { programsApi, type ApiProgram } from "@/lib/api";
import { useAuthSession } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";
import { apiAssetUrl } from "@/lib/env";

export const Route = createFileRoute("/programs/$slug")({
  head: () => ({
    meta: [
      { title: "Program Details - Level Up Fitness" },
      { name: "description", content: "View a Level Up Fitness training program." },
    ],
  }),
  component: ProgramDetailPage,
});

const categoryLabels: Record<ApiProgram["category"], string> = {
  body_transformation: "Body transformation",
  lose_weight: "Lose weight",
  gain_weight_muscle_building: "Gain weight / muscle building",
};

const fallbackImages: Record<ApiProgram["category"], string> = {
  body_transformation: heroStudio,
  lose_weight: programStrength,
  gain_weight_muscle_building: programMobility,
};

const KSh = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);

function programImage(program: ApiProgram) {
  return apiAssetUrl(program.thumbnail) || fallbackImages[program.category];
}

function ProgramDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <div className="space-y-10">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div className="overflow-hidden rounded-[1.25rem] border border-border bg-muted">
            <div className="aspect-[4/3] animate-pulse bg-muted" />
          </div>
          <div className="space-y-4">
            <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-12 w-full max-w-xl animate-pulse rounded-[1rem] bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-full max-w-2xl animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-full max-w-xl animate-pulse rounded-full bg-muted" />
            </div>
            <div className="flex gap-3">
              <div className="h-11 w-36 animate-pulse rounded-xl bg-muted" />
              <div className="h-11 w-40 animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-44 animate-pulse rounded-[1rem] bg-muted lg:col-span-2" />
          <div className="h-44 animate-pulse rounded-[1rem] bg-muted" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-32 animate-pulse rounded-[1rem] bg-muted" />
          <div className="h-32 animate-pulse rounded-[1rem] bg-muted" />
        </div>
      </div>
    </div>
  );
}

function ProgramDetailPage() {
  const { slug: programRef } = Route.useParams();
  const session = useAuthSession();
  const navigate = useNavigate();
  const programQuery = useQuery({
    queryKey: ["public", "program", programRef],
    queryFn: async () => {
      const response = await programsApi.get(programRef);
      return response.data.program;
    },
    retry: false,
  });

  if (programQuery.isLoading) {
    return <ProgramDetailSkeleton />;
  }

  if (programQuery.isError || !programQuery.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <section className="card-elevated rounded-[1.25rem] p-8 sm:p-10">
          <p className="text-sm font-semibold text-primary">Program</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Program not found</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            We could not find that program, or it is no longer available. Try again or return to the
            list of programs.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => programQuery.refetch()} variant="hero">
              Retry
            </Button>
            <Button asChild variant="soft">
              <Link to="/programs">
                Back to programs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const program = programQuery.data;
  const videos = program.videos ?? [];
  const totalVideos = videos.length;
  const enrolledCount = program.enrolledUsers?.length ?? 0;
  const hasAccess = program.access?.hasAccess ?? !program.subscriptionRequired;
  const buyLabel = program.price > 0 ? `Buy for ${KSh(program.price)}` : "Get access";

  function handleBuy() {
    if (!session) {
      window.location.assign(loginUrlFor({ redirect: "/checkout", programRef }));
      return;
    }
    void navigate({ to: "/checkout", search: { programRef } });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <div className="space-y-10">
        <Link
          to="/programs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to programs
        </Link>

        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div className="overflow-hidden rounded-[1.25rem] border border-border bg-white shadow-[var(--shadow-elegant)]">
            <img
              src={programImage(program)}
              alt={program.title}
              className="h-full min-h-[24rem] w-full object-cover"
              width={1448}
              height={1086}
            />
          </div>

          <div className="space-y-5">
            <p className="text-sm font-semibold text-primary">Program</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                {categoryLabels[program.category]}
              </Badge>
              {program.subscriptionRequired && (
                <Badge className="rounded-full">Subscription required</Badge>
              )}
            </div>
            <h1 className="max-w-xl font-display text-5xl font-bold leading-[0.92] tracking-[-0.035em] text-balance sm:text-6xl">
              {program.title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              with {program.trainer || "Level Up coaching team"}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-muted px-2.5 py-1 text-surface-foreground">
                {program.difficultyLevel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                <Clock className="h-3.5 w-3.5" />
                {program.duration}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                <PlayCircle className="h-3.5 w-3.5" />
                {totalVideos} videos
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                <Dumbbell className="h-3.5 w-3.5" />
                {enrolledCount} enrolled
              </span>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              {program.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">From</p>
                <p className="font-display text-3xl font-bold">{KSh(program.price)}</p>
              </div>
              {hasAccess ? (
                <Badge className="rounded-full px-3 py-1.5 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  You have access
                </Badge>
              ) : (
                <>
                  <Button variant="hero" onClick={handleBuy}>
                    {buyLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button asChild variant="soft">
                    <Link to="/plans">Subscribe instead</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="card-elevated rounded-[1rem] p-5 lg:col-span-2">
            <h2 className="inline-flex items-center gap-2 font-display text-2xl font-bold">
              <Flame className="h-5 w-5 text-primary" />
              Workout schedule
            </h2>
            {program.workoutSchedule.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {program.workoutSchedule.map((item) => (
                  <span key={item} className="rounded-lg bg-muted px-3 py-2 text-sm">
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                The workout schedule will be shared after enrollment.
              </p>
            )}
          </div>

          <div className="card-elevated rounded-[1rem] p-5">
            <h2 className="inline-flex items-center gap-2 font-display text-2xl font-bold">
              <BarChart3 className="h-5 w-5 text-primary" />
              Nutrition
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {program.nutritionNotes || "Nutrition notes will be added by the coaching team."}
            </p>
          </div>
        </section>

        <section className="space-y-5">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-muted-foreground">Program videos</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
              Training clips and guided content
            </h2>
          </div>
          {!hasAccess ? (
            <div className="card-elevated flex flex-col items-start gap-4 rounded-[1rem] p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  <Lock className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">Unlock this program to watch the training clips</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Buy the program or subscribe to a plan that includes it.
                  </p>
                </div>
              </div>
              <Button variant="hero" onClick={handleBuy}>
                {buyLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : videos.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {videos.map((video) => {
                const videoUrl = apiAssetUrl(video.url) || video.url;
                return (
                  <article
                    key={`${video.title}-${video.url}`}
                    className="card-elevated rounded-[1rem] p-5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                        <PlayCircle className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-semibold">{video.title}</h3>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{video.url}</p>
                        {video.url && (
                          <a
                            href={videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                          >
                            Open video
                            <ArrowRight className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="card-elevated rounded-[1rem] p-6 text-sm text-muted-foreground">
              No videos have been uploaded for this program yet.
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.25rem] bg-[#14231d] p-8 text-[#f6f8f5] shadow-[var(--shadow-elegant)]">
            <p className="text-sm font-semibold text-[#f6f8f5]/75">What you get</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
              The essentials stay visible.
            </h2>
            <ul className="mt-6 grid gap-3">
              {[
                "Structured training plan",
                "Coach-guided progression",
                "Program access through subscription",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-[1rem] bg-[#263930] p-4 text-sm leading-6"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#f2553d]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[1.25rem] border border-border bg-white p-8 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-semibold text-primary">Next step</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
              Keep moving by unlocking the plan.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Membership access keeps the booking path short and makes the program choice easier to
              complete.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="hero">
                <Link to="/plans">
                  View plans
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="soft">
                <Link to="/programs">Back to programs</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
