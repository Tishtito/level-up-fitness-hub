import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "Subscription Plans — Level Up Fitness" },
      { name: "description", content: "Pick a plan that fits your goals. Monthly or yearly billing, cancel anytime." },
    ],
  }),
  component: PlansPage,
});

const features = [
  "Access to workout videos",
  "Mobile & web app",
  "Community access",
  "Personalized plans",
  "Nutrition guides",
  "Progress analytics",
  "Trainer consultations",
  "Physio session credits",
  "Priority support",
];

const plans = [
  { name: "Basic", monthly: 19, yearly: 15, blurb: "Get started with the essentials.", incl: [0,1,2] },
  { name: "Pro", monthly: 39, yearly: 31, blurb: "Smarter training, real results.", incl: [0,1,2,3,4,5], featured: true },
  { name: "Elite", monthly: 79, yearly: 63, blurb: "1:1 attention from real experts.", incl: [0,1,2,3,4,5,6,7,8] },
];

function PlansPage() {
  const [yearly, setYearly] = useState(false);
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 space-y-12">
      <header className="text-center max-w-2xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Membership</p>
        <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Choose your plan</h1>
        <p className="mt-3 text-muted-foreground">Cancel anytime. Switch or upgrade as you grow.</p>

        <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-muted p-1 text-sm">
          <button onClick={() => setYearly(false)} className={`rounded-full px-4 py-2 font-medium transition ${!yearly ? "bg-background shadow-[var(--shadow-soft)]" : "text-muted-foreground"}`}>Monthly</button>
          <button onClick={() => setYearly(true)} className={`rounded-full px-4 py-2 font-medium transition inline-flex items-center gap-1 ${yearly ? "bg-background shadow-[var(--shadow-soft)]" : "text-muted-foreground"}`}>
            Yearly <span className="rounded-full bg-primary/15 text-primary text-[10px] px-1.5 py-0.5">-20%</span>
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3 items-stretch">
        {plans.map((p) => (
          <div key={p.name} className={`relative rounded-3xl p-8 flex flex-col ${p.featured ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)] lg:-translate-y-3" : "card-elevated"}`}>
            {p.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary"><Sparkles className="h-3 w-3" /> Recommended</span>}
            <h3 className="font-display text-2xl font-bold">{p.name}</h3>
            <p className={`mt-2 text-sm ${p.featured ? "text-primary-foreground/85" : "text-muted-foreground"}`}>{p.blurb}</p>
            <p className="mt-6 font-display text-5xl font-bold">${yearly ? p.yearly : p.monthly}<span className={`text-base font-normal ${p.featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>/mo</span></p>
            {yearly && <p className={`text-xs mt-1 ${p.featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>Billed ${p.yearly * 12}/year</p>}

            <ul className="mt-6 space-y-3 text-sm flex-1">
              {features.map((f, i) => {
                const included = p.incl.includes(i);
                return (
                  <li key={f} className={`flex items-center gap-2 ${included ? "" : (p.featured ? "opacity-50" : "text-muted-foreground/50 line-through")}`}>
                    <span className={`grid h-5 w-5 place-items-center rounded-full ${included ? (p.featured ? "bg-white/20" : "bg-primary/15 text-primary") : "bg-muted"}`}>
                      <Check className="h-3 w-3" />
                    </span>
                    {f}
                  </li>
                );
              })}
            </ul>
            <Link to="/dashboard" className="mt-8 block">
              <Button variant={p.featured ? "soft" : "hero"} className="w-full" size="lg">Choose {p.name}</Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
