import { createFileRoute } from "@tanstack/react-router";
import { Users, Upload, BarChart3, DollarSign, Calendar, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/trainer")({
  head: () => ({
    meta: [
      { title: "Trainer Dashboard — Level Up Fitness" },
      { name: "description", content: "Manage clients, upload programs, track revenue and schedule sessions." },
    ],
  }),
  component: TrainerDash,
});

const revenue = [30, 45, 38, 60, 55, 80, 72, 90];

function TrainerDash() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Trainer portal</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Coach Maya's Studio</h1>
          <p className="text-muted-foreground">42 active clients · 8 programs published</p>
        </div>
        <Button variant="hero"><Upload className="h-4 w-4" /> Upload program</Button>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Clients" value="42" sub="+5 this month" />
        <Stat icon={Calendar} label="Sessions" value="128" sub="this month" />
        <Stat icon={BarChart3} label="Completion" value="87%" sub="avg adherence" />
        <Stat icon={DollarSign} label="Revenue" value="$8,420" sub="+12% MoM" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-elevated rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Revenue trend</h2>
            <span className="text-xs text-muted-foreground">Last 8 weeks</span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-2">
            {revenue.map((v, i) => (
              <div key={i} className="flex-1 rounded-t-2xl bg-[image:var(--gradient-primary)] opacity-90" style={{ height: `${v}%` }} />
            ))}
          </div>
        </div>

        <div className="card-elevated rounded-3xl p-6">
          <h2 className="font-display text-xl font-bold">Today's sessions</h2>
          <div className="mt-4 space-y-3">
            {[
              { client: "Alex M.", time: "10:00", type: "1-on-1 Strength" },
              { client: "Priya S.", time: "12:30", type: "Mobility" },
              { client: "Jordan T.", time: "16:00", type: "Assessment" },
            ].map((s) => (
              <div key={s.time} className="flex items-center justify-between rounded-2xl bg-muted p-3">
                <div>
                  <p className="text-sm font-semibold">{s.client}</p>
                  <p className="text-xs text-muted-foreground">{s.type}</p>
                </div>
                <span className="text-sm font-semibold gradient-text">{s.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-elevated rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Top clients</h2>
            <Button variant="ghost" size="sm">Manage <ArrowUpRight className="h-4 w-4" /></Button>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { name: "Amelia K.", program: "Body Transformation", progress: 86 },
              { name: "Liam B.", program: "Muscle Building", progress: 72 },
              { name: "Naomi R.", program: "Lose Weight", progress: 65 },
              { name: "Carlos S.", program: "Body Transformation", progress: 50 },
            ].map((c) => (
              <div key={c.name} className="rounded-2xl bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.program}</p>
                  </div>
                  <span className="text-xs font-semibold text-primary">{c.progress}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-background overflow-hidden">
                  <div className="h-full bg-[image:var(--gradient-primary)]" style={{ width: `${c.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated rounded-3xl p-6">
          <h2 className="font-display text-xl font-bold">Published programs</h2>
          <div className="mt-4 space-y-3">
            {[
              { name: "Body Transformation", subs: 124, price: "$49/mo" },
              { name: "Strength Foundations", subs: 87, price: "$39/mo" },
              { name: "Mobility Reset", subs: 56, price: "$29/mo" },
            ].map((p) => (
              <div key={p.name} className="flex items-center justify-between rounded-2xl bg-surface/60 p-4">
                <div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.subs} subscribers</p>
                </div>
                <span className="text-sm font-bold gradient-text">{p.price}</span>
              </div>
            ))}
            <Button variant="soft" className="w-full mt-2"><Upload className="h-4 w-4" /> New program</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string; sub: string }) {
  return (
    <div className="card-elevated rounded-3xl p-6">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground"><Icon className="h-5 w-5" /></div>
      <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
