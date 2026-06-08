import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Flame, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import muscle from "@/assets/program-muscle.jpg";
import weightLoss from "@/assets/program-weight-loss.jpg";
import transform from "@/assets/program-transform.jpg";

export const Route = createFileRoute("/programs")({
  head: () => ({
    meta: [
      { title: "Training Programs — Level Up Fitness" },
      { name: "description", content: "Body transformation, weight loss, and muscle building programs led by certified coaches." },
    ],
  }),
  component: ProgramsPage,
});

const programs = [
  {
    title: "Body Transformation",
    slug: "body-transformation",
    img: transform,
    level: "All Levels",
    duration: "12 weeks",
    price: "$49/mo",
    coach: "Coach Maya Chen",
    desc: "A complete head-to-toe rebuild combining strength, cardio, mobility & nutrition.",
    schedule: ["Mon · Strength", "Tue · HIIT", "Wed · Mobility", "Thu · Strength", "Fri · Conditioning", "Sat · Active recovery"],
    tracking: ["Weekly photos", "Body measurements", "Strength PRs"],
  },
  {
    title: "Lose Weight",
    slug: "lose-weight",
    img: weightLoss,
    level: "Beginner → Advanced",
    duration: "8 weeks",
    price: "$39/mo",
    coach: "Coach Liam Brooks",
    desc: "Sustainable fat-burning blueprint with cardio progressions and macro-aware meal plans.",
    schedule: ["Mon · Steady cardio", "Tue · Full-body strength", "Wed · HIIT", "Thu · Walk + core", "Fri · Strength", "Sat · Long cardio"],
    tracking: ["Weight check-ins", "Step goals", "Calorie targets"],
  },
  {
    title: "Muscle Building",
    slug: "muscle-building",
    img: muscle,
    level: "Intermediate",
    duration: "10 weeks",
    price: "$45/mo",
    coach: "Coach Andre Silva",
    desc: "Hypertrophy-focused split with structured progressive overload and high-protein meal guidance.",
    schedule: ["Push · Mon", "Pull · Tue", "Legs · Wed", "Rest · Thu", "Push · Fri", "Pull · Sat"],
    tracking: ["Lift logs", "Volume tracking", "Bodyweight trend"],
  },
];

function ProgramsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 space-y-12">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Programs</p>
        <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Training Programs</h1>
        <p className="mt-3 text-muted-foreground">Choose your path. Every program includes weekly schedules, coach support, progress tracking and meal guidance.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {programs.map((p) => (
          <article key={p.title} className="card-elevated overflow-hidden rounded-3xl">
            <div className="grid sm:grid-cols-5">
              <div className="sm:col-span-2 aspect-[4/3] sm:aspect-auto overflow-hidden">
                <img src={p.img} alt={p.title} className="h-full w-full object-cover" loading="lazy" width={1024} height={768} />
              </div>
              <div className="sm:col-span-3 p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-surface px-2.5 py-1 text-surface-foreground">{p.level}</span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {p.duration}</span>
                </div>
                <h2 className="mt-3 font-display text-2xl font-bold">{p.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">with {p.coach}</p>
                <p className="mt-3 text-sm">{p.desc}</p>

                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="font-semibold inline-flex items-center gap-1.5"><Flame className="h-4 w-4 text-primary" /> Weekly Schedule</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.schedule.map((s) => <span key={s} className="rounded-lg bg-muted px-2 py-1 text-xs">{s}</span>)}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold inline-flex items-center gap-1.5"><BarChart3 className="h-4 w-4 text-primary" /> Progress Tracking</p>
                    <ul className="mt-1 text-xs text-muted-foreground">{p.tracking.map((t) => <li key={t}>· {t}</li>)}</ul>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="font-display text-2xl font-bold gradient-text">{p.price}</span>
                  <div className="flex gap-2">
                    <Link to="/programs/$slug" params={{ slug: p.slug }}><Button variant="soft" size="sm">View Details</Button></Link>
                    <Link to="/plans"><Button variant="hero" size="sm">Subscribe <ArrowRight className="h-4 w-4" /></Button></Link>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
