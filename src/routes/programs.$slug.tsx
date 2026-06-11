import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, PlayCircle, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import muscle from "@/assets/program-muscle.jpg";
import weightLoss from "@/assets/program-weight-loss.jpg";
import transform from "@/assets/program-transform.jpg";

type ProgramDetail = {
  title: string;
  img: string;
  coach: string;
  duration: string;
  level: string;
  overview: string;
  modules: { title: string; videos: { title: string; length: string }[] }[];
  outcomes: string[];
};

const details: Record<string, ProgramDetail> = {
  "body-transformation": {
    title: "Body Transformation",
    img: transform,
    coach: "Coach Maya Chen",
    duration: "12 weeks",
    level: "All Levels",
    overview:
      "A complete 12-week rebuild combining strength, conditioning, mobility and nutrition. Every week unlocks new video lessons, follow-along workouts and coach check-ins.",
    modules: [
      {
        title: "Module 1 · Foundations",
        videos: [
          { title: "Welcome & Program Walkthrough", length: "6:42" },
          { title: "Movement Assessment", length: "12:08" },
          { title: "Setting Your Baseline", length: "9:15" },
        ],
      },
      {
        title: "Module 2 · Strength Block",
        videos: [
          { title: "Full Body Strength A", length: "38:20" },
          { title: "Full Body Strength B", length: "41:05" },
          { title: "Recovery & Mobility Flow", length: "22:30" },
        ],
      },
      {
        title: "Module 3 · Conditioning Block",
        videos: [
          { title: "HIIT Intervals", length: "28:50" },
          { title: "Steady State Cardio Guide", length: "18:00" },
          { title: "Active Recovery", length: "20:10" },
        ],
      },
    ],
    outcomes: [
      "Lose 6–12% body fat",
      "Build full-body strength",
      "Establish sustainable habits",
    ],
  },
  "lose-weight": {
    title: "Lose Weight",
    img: weightLoss,
    coach: "Coach Liam Brooks",
    duration: "8 weeks",
    level: "Beginner → Advanced",
    overview:
      "An 8-week fat-loss blueprint with cardio progressions, full-body strength, and macro-aware meal plans delivered through weekly video lessons.",
    modules: [
      {
        title: "Module 1 · Kickstart",
        videos: [
          { title: "Your Fat Loss Roadmap", length: "8:12" },
          { title: "Calorie & Macro Basics", length: "14:40" },
        ],
      },
      {
        title: "Module 2 · Burn Block",
        videos: [
          { title: "Low Impact HIIT", length: "25:00" },
          { title: "Full Body Burn", length: "32:18" },
          { title: "Core Conditioning", length: "16:45" },
        ],
      },
      {
        title: "Module 3 · Habit Stack",
        videos: [
          { title: "Daily Step Strategy", length: "10:22" },
          { title: "Meal Prep Walkthrough", length: "19:55" },
        ],
      },
    ],
    outcomes: [
      "Drop 1–2 lb / week sustainably",
      "Improve cardio capacity",
      "Master portion control",
    ],
  },
  "muscle-building": {
    title: "Muscle Building",
    img: muscle,
    coach: "Coach Andre Silva",
    duration: "10 weeks",
    level: "Intermediate",
    overview:
      "A 10-week hypertrophy program built around a push/pull/legs split with structured progressive overload and high-protein meal guidance.",
    modules: [
      {
        title: "Module 1 · Push Day",
        videos: [
          { title: "Chest & Shoulders Breakdown", length: "34:10" },
          { title: "Triceps Finisher", length: "12:05" },
        ],
      },
      {
        title: "Module 2 · Pull Day",
        videos: [
          { title: "Back Width & Thickness", length: "36:40" },
          { title: "Biceps & Forearms", length: "14:20" },
        ],
      },
      {
        title: "Module 3 · Leg Day",
        videos: [
          { title: "Quad Dominant Session", length: "42:00" },
          { title: "Hamstring & Glute Focus", length: "38:30" },
        ],
      },
    ],
    outcomes: [
      "Add 4–8 lb lean muscle",
      "Increase compound lifts",
      "Refine training technique",
    ],
  },
};

export const Route = createFileRoute("/programs/$slug")({
  loader: ({ params }) => {
    const program = details[params.slug];
    if (!program) throw notFound();
    return { program };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.program.title ?? "Program"} — Level Up Fitness` },
      { name: "description", content: loaderData?.program.overview ?? "Program details" },
    ],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Program not found</h1>
      <Link to="/programs" className="mt-4 inline-block text-primary underline">Back to programs</Link>
    </div>
  ),
  errorComponent: ({ reset }) => (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Something went wrong</h1>
      <Button className="mt-4" onClick={reset}>Try again</Button>
    </div>
  ),
  component: ProgramDetailPage,
});

function ProgramDetailPage() {
  const { program } = Route.useLoaderData() as { program: ProgramDetail };
  const totalVideos = program.modules.reduce((n: number, m) => n + m.videos.length, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-16 space-y-10">
      <Link to="/programs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Programs
      </Link>

      <header className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2 overflow-hidden rounded-3xl">
          <img src={program.img} alt={program.title} className="h-full w-full object-cover" width={1024} height={768} />
        </div>
        <div className="lg:col-span-3 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Program Details</p>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">{program.title}</h1>
          <p className="text-muted-foreground">with {program.coach}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-surface px-2.5 py-1 text-surface-foreground">{program.level}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Clock className="h-3 w-3" /> {program.duration}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><PlayCircle className="h-3 w-3" /> {totalVideos} videos</span>
          </div>
          <p className="text-sm leading-relaxed">{program.overview}</p>
          <div className="flex gap-2 pt-2">
            <Link to="/plans"><Button variant="hero">Subscribe to Access</Button></Link>
          </div>
        </div>
      </header>

      <section className="space-y-6">
        <h2 className="font-display text-2xl font-bold">What's inside</h2>
        <div className="space-y-4">
          {program.modules.map((m) => (
            <div key={m.title} className="card-elevated rounded-2xl p-5">
              <h3 className="font-semibold">{m.title}</h3>
              <ul className="mt-3 divide-y divide-border">
                {m.videos.map((v) => (
                  <li key={v.title} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="inline-flex items-center gap-2">
                      <PlayCircle className="h-4 w-4 text-primary" />
                      {v.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{v.length}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold">What you'll achieve</h2>
        <ul className="grid gap-2 sm:grid-cols-3">
          {program.outcomes.map((o) => (
            <li key={o} className="card-elevated flex items-start gap-2 rounded-2xl p-4 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> {o}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}