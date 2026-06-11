import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Star, Users, Trophy, Dumbbell, Quote, Sparkles, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero.jpg";
import muscle from "@/assets/program-muscle.jpg";
import weightLoss from "@/assets/program-weight-loss.jpg";
import transform from "@/assets/program-transform.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Level Up Fitness — Transform Your Body. Elevate Your Life." },
      { name: "description", content: "Premium fitness subscriptions, online training programs, nutrition, physiotherapy & a curated wellness store." },
    ],
  }),
  component: Home,
});

const stats = [
  { icon: Users, value: "12,400+", label: "Active Members" },
  { icon: Dumbbell, value: "85+", label: "Programs Available" },
  { icon: Trophy, value: "120+", label: "Certified Trainers" },
  { icon: Star, value: "4.9/5", label: "Member Rating" },
];

const featuredPrograms = [
  { title: "Body Transformation", img: transform, level: "All Levels", weeks: "12 weeks", price: "$49/mo", to: "/programs" },
  { title: "Lose Weight", img: weightLoss, level: "Beginner+", weeks: "8 weeks", price: "$39/mo", to: "/programs" },
  { title: "Muscle Building", img: muscle, level: "Intermediate", weeks: "10 weeks", price: "$45/mo", to: "/programs" },
];

const testimonials = [
  { name: "Amelia K.", text: "Lost 14kg in 4 months while feeling stronger than ever. The trainers are next level.", role: "Member · 1 yr" },
  { name: "Jordan M.", text: "Finally a fitness platform that doesn't yell at me. Calm, premium, and works.", role: "Pro Member" },
  { name: "Priya S.", text: "Booking my nutritionist & physio in the same app changed my recovery.", role: "Elite Member" },
];

const plans = [
  { name: "Basic", price: "$19", features: ["Workout videos", "Community access", "Mobile app"] },
  { name: "Pro", price: "$39", features: ["Personalized plans", "Nutrition guide", "Progress analytics"], featured: true },
  { name: "Elite", price: "$79", features: ["1:1 coaching", "Physio sessions", "Priority support"] },
];

const products = [
  { name: "Whey Protein", price: "$42", emoji: "🥤" },
  { name: "Resistance Bands", price: "$24", emoji: "🎯" },
  { name: "Premium Shaker", price: "$18", emoji: "🧴" },
  { name: "Performance Tee", price: "$32", emoji: "👕" },
];

function Home() {
  return (
    <div className="space-y-24 pb-8">
      {/* HERO */}
      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="hero-bg relative overflow-hidden rounded-[2rem] p-6 sm:p-12 lg:p-16">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div className="text-primary-foreground">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> Premium Fitness Platform
              </span>
              <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
                Transform Your Body.<br />
                <span className="gradient-text">Elevate</span> Your Life.
              </h1>
              <p className="mt-5 max-w-md text-base text-primary-foreground/85 sm:text-lg">
                Subscriptions, expert coaching, nutrition, physiotherapy and curated gear — all in one beautifully simple platform.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/plans"><Button variant="hero" size="xl">Join Now <ArrowRight className="h-4 w-4" /></Button></Link>
                <Link to="/programs"><Button variant="soft" size="xl">Explore Programs</Button></Link>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="h-9 w-9 rounded-full border-2 border-white bg-primary" />
                  ))}
                </div>
                <p className="text-sm text-primary-foreground/85">Join 12,400+ members already leveling up.</p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 -translate-y-3 translate-x-3 rounded-[2rem] bg-primary/30 blur-2xl" />
              <img src={hero} alt="Athletic woman stretching" className="relative w-full rounded-[2rem] object-cover shadow-[var(--shadow-elegant)]" width={1024} height={1280} />
              <div className="glass absolute -bottom-5 left-5 hidden rounded-2xl p-4 sm:block">
                <p className="text-xs text-muted-foreground">Today's burn</p>
                <p className="font-display text-xl font-bold text-primary">642 kcal 🔥</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card-elevated rounded-2xl p-6 text-center text-card-foreground">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <s.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 font-display text-3xl font-bold text-card-foreground">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED PROGRAMS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Programs" title="Train with intention" subtitle="Hand-crafted programs led by certified coaches." link="/programs" />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {featuredPrograms.map((p) => (
            <article key={p.title} className="card-elevated overflow-hidden rounded-3xl text-card-foreground">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={p.img} alt={p.title} className="h-full w-full object-cover transition-transform hover:scale-105" loading="lazy" width={1024} height={768} />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">{p.level}</span>
                  <span>{p.weeks}</span>
                </div>
                <h3 className="mt-3 font-display text-xl font-bold text-card-foreground">{p.title}</h3>
                <div className="mt-5 flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-primary">{p.price}</span>
                  <Link to="/programs"><Button size="sm" variant="hero">Subscribe</Button></Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* PLANS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Membership" title="Plans for every athlete" subtitle="Cancel anytime. Upgrade as you grow." link="/plans" linkLabel="Compare all plans" />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={`relative rounded-3xl p-7 ${p.featured ? "bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]" : "card-elevated text-card-foreground"}`}>
              {p.featured && <span className="absolute -top-3 right-6 rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary">Most Popular</span>}
              <h3 className={`font-display text-xl font-bold ${p.featured ? "text-primary-foreground" : "text-card-foreground"}`}>{p.name}</h3>
              <p className={`mt-3 font-display text-4xl font-bold ${p.featured ? "text-primary-foreground" : "text-primary"}`}>{p.price}<span className={`text-sm font-normal ${p.featured ? "text-primary-foreground/80" : "text-secondary-foreground"}`}>/mo</span></p>
              <ul className={`mt-6 space-y-2 text-sm ${p.featured ? "text-primary-foreground/90" : "text-secondary-foreground"}`}>
                {p.features.map((f) => <li key={f}>✓ {f}</li>)}
              </ul>
              <Link to="/plans" className="mt-7 block"><Button variant={p.featured ? "soft" : "hero"} className="w-full">Get {p.name}</Button></Link>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Loved by members" title="Real transformations" />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="card-elevated rounded-3xl p-6 text-card-foreground">
              <Quote className="h-8 w-8 text-primary/40" />
              <p className="mt-3 text-sm leading-relaxed text-card-foreground">{t.text}</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Shop" title="Gear up in style" link="/shop" linkLabel="Visit shop" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <Link key={p.name} to="/shop" className="card-elevated group rounded-3xl p-6 text-center text-card-foreground">
              <div className="mx-auto grid aspect-square w-full place-items-center rounded-2xl bg-surface text-6xl">
                {p.emoji}
              </div>
              <h4 className="mt-4 font-display font-semibold text-card-foreground">{p.name}</h4>
              <p className="text-sm text-primary font-bold">{p.price}</p>
              <Button variant="ghost" size="sm" className="mt-2"><ShoppingBag className="h-4 w-4" /> Add</Button>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="hero-bg relative overflow-hidden rounded-[2rem] p-10 text-center sm:p-16">
          <div className="absolute -right-10 top-0 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <h2 className="font-display text-3xl font-bold sm:text-5xl">Ready to level up?</h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">Join today and get your first week free. No commitments.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/plans"><Button variant="hero" size="xl">Start Free Week</Button></Link>
            <Link to="/programs"><Button variant="soft" size="xl">Browse Programs</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle, link, linkLabel = "View all" }: { eyebrow: string; title: string; subtitle?: string; link?: string; linkLabel?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
      </div>
      {link && <Link to={link} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 transition-all">{linkLabel} <ArrowRight className="h-4 w-4" /></Link>}
    </div>
  );
}
