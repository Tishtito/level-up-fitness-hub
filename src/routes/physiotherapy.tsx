import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar as CalendarIcon, MapPin, Activity, HeartPulse, Bandage, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import physioImg from "@/assets/physio.jpg";

export const Route = createFileRoute("/physiotherapy")({
  head: () => ({
    meta: [
      { title: "Physiotherapy — Level Up Fitness" },
      { name: "description", content: "Recover faster with hands-on physiotherapy sessions, rehab packages and expert therapists." },
    ],
  }),
  component: PhysioPage,
});

const services = [
  { icon: Activity, name: "Sports Therapy", price: "$70 / session", desc: "Performance recovery and mobility work." },
  { icon: HeartPulse, name: "Injury Recovery", price: "$520 · 8 sessions", desc: "Structured plan after injury." },
  { icon: Bandage, name: "Rehabilitation", price: "$890 · 12 weeks", desc: "Long-term rehab with measurable goals." },
];

const therapists = [
  { name: "Dr. Aisha Kimani", spec: "Musculoskeletal", rating: 4.9 },
  { name: "Mark Otieno, PT", spec: "Sports & Performance", rating: 4.8 },
  { name: "Lila Hassan, DPT", spec: "Post-op Rehabilitation", rating: 5.0 },
];

const days = ["Mon 12", "Tue 13", "Wed 14", "Thu 15", "Fri 16"];
const slots = ["08:00", "10:00", "12:00", "14:00", "16:00"];

function PhysioPage() {
  const [day, setDay] = useState(days[0]);
  const [slot, setSlot] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 space-y-16">
      <section className="grid gap-8 lg:grid-cols-2 items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Recovery & Rehab</p>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Move better. Recover faster.</h1>
          <p className="mt-4 text-muted-foreground">Hands-on physiotherapy with certified therapists at our Nairobi clinic — built around you.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="hero" size="lg">Book Session</Button>
            <Button variant="soft" size="lg">View Therapists</Button>
          </div>
        </div>
        <img src={physioImg} alt="Physiotherapy session" className="rounded-[2rem] shadow-[var(--shadow-elegant)] w-full" loading="lazy" width={1024} height={768} />
      </section>

      <section>
        <h2 className="font-display text-3xl font-bold">Therapy programs</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {services.map((s) => (
            <div key={s.name} className="card-elevated rounded-3xl p-6">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground"><s.icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-display text-xl font-bold">{s.name}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
              <p className="mt-4 font-display text-2xl font-bold gradient-text">{s.price}</p>
              <Button variant="hero" className="mt-5 w-full">Book Now</Button>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-3">
        <div className="card-elevated rounded-3xl p-6 lg:col-span-2">
          <h2 className="font-display text-2xl font-bold inline-flex items-center gap-2"><CalendarIcon className="h-6 w-6 text-primary" /> Schedule appointment</h2>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Day</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {days.map((d) => (
                  <button key={d} onClick={() => setDay(d)} className={`rounded-xl px-4 py-2 text-sm font-medium ${day === d ? "bg-[image:var(--gradient-primary)] text-primary-foreground" : "bg-muted hover:bg-surface"}`}>{d}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</p>
              <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
                {slots.map((s) => (
                  <button key={s} onClick={() => setSlot(s)} className={`rounded-xl px-3 py-2 text-sm font-medium ${slot === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-surface"}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
          <Button onClick={() => toast.success(`Appointment ${day} · ${slot ?? "—"}`)} disabled={!slot} variant="hero" size="lg" className="mt-6">Confirm Appointment</Button>
        </div>

        <div className="card-elevated rounded-3xl p-6">
          <h3 className="font-display text-xl font-bold inline-flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Clinic</h3>
          <p className="mt-1 text-sm text-muted-foreground">Level Up Recovery Clinic</p>
          <p className="text-sm">Riverside, Nairobi · Kenya</p>
          <div className="mt-4 aspect-square rounded-2xl bg-[image:var(--gradient-hero)] grid place-items-center text-surface-foreground">
            <MapPin className="h-10 w-10" />
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl font-bold">Our therapists</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {therapists.map((t) => (
            <div key={t.name} className="card-elevated rounded-3xl p-6 text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-[image:var(--gradient-primary)]" />
              <h4 className="mt-4 font-display font-bold">{t.name}</h4>
              <p className="text-sm text-muted-foreground">{t.spec}</p>
              <p className="mt-2 inline-flex items-center gap-1 text-sm"><Star className="h-3.5 w-3.5 fill-primary text-primary" /> {t.rating}</p>
              <Button variant="soft" className="mt-4">Book</Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
