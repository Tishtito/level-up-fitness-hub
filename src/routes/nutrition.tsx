import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar as CalendarIcon, MapPin, Apple, Salad, Utensils, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import nutritionImg from "@/assets/nutrition.jpg";

export const Route = createFileRoute("/nutrition")({
  head: () => ({
    meta: [
      { title: "Nutritionist Services — Level Up Fitness" },
      { name: "description", content: "Book in-person nutritionist consultations, meal planning and diet packages." },
    ],
  }),
  component: NutritionPage,
});

const packages = [
  { icon: Apple, name: "Single Consultation", price: "$60", desc: "60-min one-on-one session.", features: ["Full diet review", "Custom recommendations", "Email follow-up"] },
  { icon: Salad, name: "Meal Planning", price: "$120", desc: "Personalized 4-week plan.", features: ["Weekly meal plans", "Shopping lists", "Recipe library"] },
  { icon: Utensils, name: "Premium Coaching", price: "$240/mo", desc: "Ongoing nutrition coaching.", features: ["4 sessions / month", "WhatsApp support", "Progress reviews"] },
];

const nutritionists = [
  { name: "Dr. Naomi Wairimu", spec: "Sports Nutrition", rating: 4.9 },
  { name: "Sarah Patel, RD", spec: "Weight Management", rating: 4.8 },
  { name: "James Otieno, MSc", spec: "Clinical & Performance", rating: 4.9 },
];

const slots = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];
const days = ["Mon 12", "Tue 13", "Wed 14", "Thu 15", "Fri 16", "Sat 17"];

function NutritionPage() {
  const [day, setDay] = useState(days[0]);
  const [slot, setSlot] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 space-y-16">
      <section className="grid gap-8 lg:grid-cols-2 items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">In-person service</p>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Nutrition that works for your body</h1>
          <p className="mt-4 text-muted-foreground">Sit down with a certified nutritionist, get a tailored plan and finally enjoy food that fuels your goals.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="hero" size="lg" onClick={() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" })}>Book Appointment</Button>
            <Button variant="soft" size="lg" onClick={() => document.getElementById("team")?.scrollIntoView({ behavior: "smooth" })}>Meet the Team</Button>
          </div>
        </div>
        <img src={nutritionImg} alt="Healthy meal" className="rounded-[2rem] shadow-[var(--shadow-elegant)] w-full" loading="lazy" width={1024} height={768} />
      </section>

      <section>
        <h2 className="font-display text-3xl font-bold">Packages</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {packages.map((p) => (
            <div key={p.name} className="card-elevated rounded-3xl p-6">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground"><p.icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-display text-xl font-bold">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
              <p className="mt-4 font-display text-3xl font-bold gradient-text">{p.price}</p>
              <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">{p.features.map((f) => <li key={f}>✓ {f}</li>)}</ul>
              <Button variant="hero" className="mt-6 w-full">Select</Button>
            </div>
          ))}
        </div>
      </section>

      <section id="booking" className="grid gap-8 lg:grid-cols-3 scroll-mt-24">
        <div className="card-elevated rounded-3xl p-6 lg:col-span-2">
          <h2 className="font-display text-2xl font-bold inline-flex items-center gap-2"><CalendarIcon className="h-6 w-6 text-primary" /> Book your session</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pick a day & time that works for you.</p>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Day</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {days.map((d) => (
                <button key={d} onClick={() => setDay(d)} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${day === d ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]" : "bg-muted hover:bg-surface"}`}>{d}</button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</p>
            <div className="mt-2 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {slots.map((s) => (
                <button key={s} onClick={() => setSlot(s)} className={`rounded-xl px-3 py-2 text-sm font-medium transition ${slot === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-surface"}`}>{s}</button>
              ))}
            </div>
          </div>

          <Button onClick={() => toast.success(`Booked ${day} at ${slot ?? "—"}`, { description: "We'll send a confirmation by email." })} disabled={!slot} variant="hero" size="lg" className="mt-6 w-full sm:w-auto">Confirm Booking</Button>
        </div>

        <div className="card-elevated rounded-3xl p-6">
          <h3 className="font-display text-xl font-bold inline-flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Location</h3>
          <p className="mt-1 text-sm text-muted-foreground">Level Up Wellness Center</p>
          <p className="text-sm">Westlands, Nairobi · Kenya</p>
          <div className="mt-4 aspect-square rounded-2xl bg-[image:var(--gradient-hero)] grid place-items-center text-surface-foreground">
            <MapPin className="h-10 w-10" />
          </div>
        </div>
      </section>

      <section id="team" className="scroll-mt-24">
        <h2 className="font-display text-3xl font-bold">Meet our nutritionists</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {nutritionists.map((n) => (
            <div key={n.name} className="card-elevated rounded-3xl p-6 text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-[image:var(--gradient-primary)]" />
              <h4 className="mt-4 font-display font-bold">{n.name}</h4>
              <p className="text-sm text-muted-foreground">{n.spec}</p>
              <p className="mt-2 inline-flex items-center gap-1 text-sm"><Star className="h-3.5 w-3.5 fill-primary text-primary" /> {n.rating}</p>
              <Button variant="soft" className="mt-4">Book</Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
