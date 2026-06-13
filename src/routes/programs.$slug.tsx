import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, CheckCircle2, Clock, Dumbbell, Flame, Loader2, PlayCircle } from "lucide-react";

import transform from "@/assets/program-transform.jpg";
import muscle from "@/assets/program-muscle.jpg";
import weightLoss from "@/assets/program-weight-loss.jpg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { programsApi, type ApiProgram } from "@/lib/api";
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

function ProgramDetailPage() {
  const { slug: programRef } = Route.useParams();
  const programQuery = useQuery({
    queryKey: ["public", "program", programRef],
    queryFn: async () => {
      const response = await programsApi.get(programRef);
      return response.data.program;
    },
    retry: false,
  });

  if (programQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="card-elevated grid place-items-center rounded-3xl py-16 text-muted-foreground">
          <Loader2 className="mb-3 h-8 w-8 animate-spin" />
          <p className="text-sm font-medium">Loading program details...</p>
        </div>
      </div>
    );
  }

  if (programQuery.isError || !programQuery.data) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Program not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">We could not find that program, or it is no longer available.</p>
        <Button asChild className="mt-6" variant="hero">
          <Link to="/programs">Back to programs</Link>
        </Button>
      </div>
    );
  }

  const program = programQuery.data;
  const totalVideos = program.videos.length;
  const enrolledCount = program.enrolledUsers?.length ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 space-y-10">
      <Link to="/programs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Programs
      </Link>

      <header className="grid gap-8 lg:grid-cols-5">
        <div className="overflow-hidden rounded-3xl lg:col-span-2">
          <img src={programImage(program)} alt={program.title} className="h-full min-h-72 w-full object-cover" width={1024} height={768} />
        </div>
        <div className="lg:col-span-3 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Program Details</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full">{categoryLabels[program.category]}</Badge>
            {program.subscriptionRequired && <Badge className="rounded-full">Subscription required</Badge>}
          </div>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">{program.title}</h1>
          <p className="text-muted-foreground">with {program.trainer || "Level Up coaching team"}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-surface px-2.5 py-1 text-surface-foreground">{program.difficultyLevel}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Clock className="h-3 w-3" /> {program.duration}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><PlayCircle className="h-3 w-3" /> {totalVideos} videos</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Dumbbell className="h-3 w-3" /> {enrolledCount} enrolled</span>
          </div>
          <p className="text-sm leading-relaxed">{program.description}</p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="font-display text-3xl font-bold gradient-text">{KSh(program.price)}</span>
            <Button asChild variant="hero">
              <Link to="/plans">Subscribe to Access</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card-elevated rounded-2xl p-5 lg:col-span-2">
          <h2 className="inline-flex items-center gap-2 font-display text-2xl font-bold">
            <Flame className="h-5 w-5 text-primary" /> Workout schedule
          </h2>
          {program.workoutSchedule.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {program.workoutSchedule.map((item) => (
                <span key={item} className="rounded-lg bg-muted px-3 py-2 text-sm">{item}</span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">The workout schedule will be shared after enrollment.</p>
          )}
        </div>

        <div className="card-elevated rounded-2xl p-5">
          <h2 className="inline-flex items-center gap-2 font-display text-2xl font-bold">
            <BarChart3 className="h-5 w-5 text-primary" /> Nutrition
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {program.nutritionNotes || "Nutrition notes will be added by the coaching team."}
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-2xl font-bold">Program videos</h2>
        {program.videos.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {program.videos.map((video) => {
              const videoUrl = apiAssetUrl(video.url) || video.url;
              return (
                <div key={`${video.title}-${video.url}`} className="card-elevated rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                      <PlayCircle className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold">{video.title}</h3>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{video.url}</p>
                      {video.url && (
                        <a href={videoUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                          Open video
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card-elevated rounded-2xl p-6 text-sm text-muted-foreground">
            No videos have been uploaded for this program yet.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold">What you get</h2>
        <ul className="grid gap-2 sm:grid-cols-3">
          {["Structured training plan", "Coach-guided progression", "Program access through subscription"].map((item) => (
            <li key={item} className="card-elevated flex items-start gap-2 rounded-2xl p-4 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
