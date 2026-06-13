import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BarChart3, Clock, Dumbbell, Flame, Loader2, PlayCircle } from "lucide-react";

import transform from "@/assets/program-transform.jpg";
import muscle from "@/assets/program-muscle.jpg";
import weightLoss from "@/assets/program-weight-loss.jpg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { programsApi, type ApiProgram } from "@/lib/api";
import { apiAssetUrl } from "@/lib/env";

export const Route = createFileRoute("/programs/")({
  head: () => ({
    meta: [
      { title: "Training Programs - Level Up Fitness" },
      { name: "description", content: "Body transformation, weight loss, and muscle building programs led by certified coaches." },
    ],
  }),
  component: ProgramsPage,
});

const categoryLabels: Record<ApiProgram["category"], string> = {
  body_transformation: "Body Transformation",
  lose_weight: "Lose Weight",
  gain_weight_muscle_building: "Gain Weight / Muscle Building",
};

const fallbackImages: Record<ApiProgram["category"], string> = {
  body_transformation: transform,
  lose_weight: weightLoss,
  gain_weight_muscle_building: muscle,
};

const KSh = (value: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);

function programImage(program: ApiProgram) {
  return apiAssetUrl(program.thumbnail) || fallbackImages[program.category];
}

function ProgramsPage() {
  const programsQuery = useQuery({
    queryKey: ["public", "programs"],
    queryFn: () => programsApi.publicList({ limit: 50 }),
  });

  const programs = programsQuery.data?.data.programs ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 space-y-12">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Programs</p>
        <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Training Programs</h1>
        <p className="mt-3 text-muted-foreground">Choose your path. Every program includes schedules, coach support, progress tracking and nutrition guidance.</p>
      </header>

      {programsQuery.isLoading ? (
        <div className="card-elevated grid place-items-center rounded-3xl py-16 text-muted-foreground">
          <Loader2 className="mb-3 h-8 w-8 animate-spin" />
          <p className="text-sm font-medium">Loading programs...</p>
        </div>
      ) : programsQuery.isError ? (
        <div className="card-elevated rounded-3xl p-10 text-center text-destructive">
          <p className="text-sm font-medium">Programs could not be loaded.</p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {programs.map((program) => (
            <article key={program.programRef} className="card-elevated overflow-hidden rounded-3xl">
              <div className="grid sm:grid-cols-5">
                <div className="aspect-[4/3] overflow-hidden sm:col-span-2 sm:aspect-auto">
                  <img src={programImage(program)} alt={program.title} className="h-full w-full object-cover" loading="lazy" width={1024} height={768} />
                </div>
                <div className="sm:col-span-3 p-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="secondary" className="rounded-full">{categoryLabels[program.category]}</Badge>
                    <span className="rounded-full bg-surface px-2.5 py-1 text-surface-foreground">{program.difficultyLevel}</span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" /> {program.duration}
                    </span>
                    {program.subscriptionRequired && <Badge className="rounded-full">Subscription</Badge>}
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-bold">{program.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">with {program.trainer || "Level Up coaching team"}</p>
                  <p className="mt-3 text-sm">{program.description}</p>

                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="font-semibold inline-flex items-center gap-1.5">
                        <Flame className="h-4 w-4 text-primary" /> Weekly Schedule
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(program.workoutSchedule.length ? program.workoutSchedule : ["Schedule shared after enrollment"]).map((item) => (
                          <span key={item} className="rounded-lg bg-muted px-2 py-1 text-xs">{item}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold inline-flex items-center gap-1.5">
                        <BarChart3 className="h-4 w-4 text-primary" /> Program Content
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1">
                          <PlayCircle className="h-3 w-3" /> {program.videos.length} videos
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1">
                          <Dumbbell className="h-3 w-3" /> {program.enrolledUsers?.length ?? 0} enrolled
                        </span>
                      </div>
                      {program.nutritionNotes && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{program.nutritionNotes}</p>}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="font-display text-2xl font-bold gradient-text">{KSh(program.price)}</span>
                    <div className="flex gap-2">
                      <Button asChild variant="soft" size="sm">
                        <Link to="/programs/$slug" params={{ slug: program.programRef }}>View Details</Link>
                      </Button>
                      <Button asChild variant="hero" size="sm">
                        <Link to="/plans">Subscribe <ArrowRight className="h-4 w-4" /></Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {programs.length === 0 && (
            <div className="card-elevated rounded-3xl p-10 text-center lg:col-span-2">
              <p className="text-muted-foreground">No active programs are available yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
