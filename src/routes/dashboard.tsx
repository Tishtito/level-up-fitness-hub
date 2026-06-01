import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Calendar, Heart, Flame, TrendingUp, ShoppingBag, Award, ArrowRight, Check, Lock, Crown, Sparkles, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Level Up Fitness" },
      { name: "description", content: "Track your fitness progress, subscriptions, appointments and more." },
    ],
  }),
  component: Dashboard,
});

const weekData = [40, 65, 50, 80, 70, 90, 75];
const days = ["M","T","W","T","F","S","S"];

function Dashboard() {
  const session = useAuthSession();

  if (!session) {
    return (
      <div className="mx-auto grid min-h-[65vh] max-w-7xl place-items-center px-4 pt-10 sm:px-6">
        <div className="card-elevated max-w-md rounded-3xl p-8 text-center">
          <Lock className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 font-display text-3xl font-bold">Login to view your dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your subscriptions, appointments, and activity are available after login.</p>
          <a href={loginUrlFor({ redirect: "/dashboard" })} className="mt-6 inline-block">
            <Button variant="hero">Login to continue</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Welcome back</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Hey, {session.user.name}</h1>
          <p className="text-muted-foreground">You're 2 workouts away from your weekly goal. Keep going!</p>
        </div>
        <div className="flex gap-2">
          <Link to="/programs"><Button variant="soft">Browse Programs</Button></Link>
          <Link to="/plans"><Button variant="hero">Upgrade Plan</Button></Link>
        </div>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Flame} label="Calories burned" value="2,340" sub="this week" />
        <Stat icon={Activity} label="Workouts done" value="5/7" sub="goal: 7" />
        <Stat icon={Heart} label="Avg HR" value="142 bpm" sub="last session" />
        <Stat icon={TrendingUp} label="BMI" value="22.4" sub="healthy" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-elevated rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Weekly progress</h2>
            <span className="text-xs text-muted-foreground">Calories per day</span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-3">
            {weekData.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-2xl bg-[image:var(--gradient-primary)] transition-all" style={{ height: `${v}%` }} />
                <span className="text-xs text-muted-foreground">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <ActiveSubscriptionCard />
      </div>

      <PlanAccessMatrix />

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="card-elevated rounded-3xl p-6 lg:col-span-2">
          <h2 className="font-display text-xl font-bold inline-flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Upcoming appointments</h2>
          <div className="mt-4 space-y-3">
            {[
              { title: "Nutrition consultation", who: "Sarah Patel, RD", when: "Wed · 14:00" },
              { title: "Physiotherapy session", who: "Dr. Aisha Kimani", when: "Fri · 10:00" },
            ].map((a) => (
              <div key={a.title} className="flex items-center justify-between rounded-2xl bg-muted p-4">
                <div>
                  <p className="font-semibold text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.who}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{a.when}</p>
                  <button className="text-xs text-primary hover:underline">Reschedule</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated rounded-3xl p-6">
          <h2 className="font-display text-xl font-bold inline-flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-primary" /> Saved products</h2>
          <div className="mt-4 space-y-3">
            {[
              { name: "Whey Protein 2kg", emoji: "🥤", price: "$42" },
              { name: "Yoga Mat Pro", emoji: "🧘", price: "$54" },
              { name: "Compression Leggings", emoji: "🩱", price: "$48" },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-surface text-2xl">{p.emoji}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs gradient-text font-bold">{p.price}</p>
                </div>
              </div>
            ))}
            <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-primary font-semibold mt-2">View shop <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Flame; label: string; value: string; sub: string }) {
  return (
    <div className="card-elevated rounded-3xl p-6">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground"><Icon className="h-5 w-5" /></div>
      <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

// Current user's plan — wire to real data once auth/subscriptions are in place.
const CURRENT_PLAN: "basic" | "pro" | "elite" = "pro";

const PLAN_META = {
  basic: { label: "Basic", price: 19, icon: Sparkles, accent: "from-muted to-surface" },
  pro: { label: "Pro", price: 39, icon: Crown, accent: "from-primary to-[hsl(var(--primary-glow,var(--primary)))]" },
  elite: { label: "Elite", price: 79, icon: Crown, accent: "from-primary to-accent" },
} as const;

const PLAN_FEATURES: { name: string; tiers: Array<"basic" | "pro" | "elite"> }[] = [
  { name: "Workout video library", tiers: ["basic", "pro", "elite"] },
  { name: "Mobile & web app", tiers: ["basic", "pro", "elite"] },
  { name: "Community access", tiers: ["basic", "pro", "elite"] },
  { name: "Personalized training plans", tiers: ["pro", "elite"] },
  { name: "Nutrition guides", tiers: ["pro", "elite"] },
  { name: "Progress analytics", tiers: ["pro", "elite"] },
  { name: "1:1 trainer consultations", tiers: ["elite"] },
  { name: "Physio session credits", tiers: ["elite"] },
  { name: "Priority support", tiers: ["elite"] },
];

function ActiveSubscriptionCard() {
  const meta = PLAN_META[CURRENT_PLAN];
  const Icon = meta.icon;
  const usedSessions = 8;
  const totalSessions = 20;
  const usagePct = Math.round((usedSessions / totalSessions) * 100);

  return (
    <div className="rounded-3xl p-6 text-primary-foreground shadow-[var(--shadow-elegant)] bg-[image:var(--gradient-primary)] relative overflow-hidden">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden />
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
          <Icon className="h-3.5 w-3.5" /> Active subscription
        </span>
        <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">Live</span>
      </div>
      <h2 className="mt-4 font-display text-3xl font-bold">{meta.label} Plan</h2>
      <p className="text-sm text-primary-foreground/85">${meta.price}/mo · Renews Dec 12, 2026</p>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-primary-foreground/85">Monthly session credits</span>
          <span className="font-semibold">{usedSessions}/{totalSessions}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
          <div className="h-full rounded-full bg-white" style={{ width: `${usagePct}%` }} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link to="/plans"><Button variant="soft" size="sm"><CreditCard className="h-4 w-4" /> Manage</Button></Link>
        <Link to="/plans"><Button variant="soft" size="sm">Upgrade</Button></Link>
      </div>
    </div>
  );
}

function PlanAccessMatrix() {
  return (
    <div className="card-elevated rounded-3xl p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold inline-flex items-center gap-2"><Award className="h-5 w-5 text-primary" /> Plan access</h2>
          <p className="text-sm text-muted-foreground">What's included with your <span className="font-semibold text-foreground">{PLAN_META[CURRENT_PLAN].label}</span> plan.</p>
        </div>
        <Link to="/plans" className="inline-flex items-center gap-1 text-sm text-primary font-semibold">Compare plans <ArrowRight className="h-4 w-4" /></Link>
      </div>

      <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {PLAN_FEATURES.map((f) => {
          const unlocked = f.tiers.includes(CURRENT_PLAN);
          const requiredTier = f.tiers[0];
          return (
            <li
              key={f.name}
              className={`flex items-center justify-between gap-3 rounded-2xl border p-3 ${
                unlocked
                  ? "border-primary/20 bg-primary/5"
                  : "border-border bg-muted/40 text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${unlocked ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {unlocked ? <Check className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                </span>
                <span className={`text-sm truncate ${unlocked ? "font-medium text-foreground" : ""}`}>{f.name}</span>
              </div>
              {!unlocked && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary shrink-0">{PLAN_META[requiredTier].label}+</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
