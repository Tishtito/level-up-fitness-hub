import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Facebook, Linkedin, Mail, MapPin, Music2, Phone } from "lucide-react";
import levelUpLogo from "@/assets/level-up-logo.jpeg";

const socialLinks = [
  { label: "TikTok", href: "https://vm.tiktok.com/ZS92f16NoxntV-017g5/", icon: Music2 },
  { label: "Facebook", href: "https://www.facebook.com/levelupFitnessKE", icon: Facebook },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/levelup-functional-strength-coach-bab8361a3",
    icon: Linkedin,
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/50 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3">
              <img
                src={levelUpLogo}
                alt="Level Up Fitness"
                className="h-11 w-11 rounded-full object-cover"
              />
              <div>
                <p className="font-display text-xl font-semibold leading-none">
                  Level<span className="text-primary">Up</span>
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  Fitness Hub
                </p>
              </div>
            </div>

            <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Transform your body. Elevate your life. Care beyond the workout. A single home for
              training, nutrition, recovery, and the shop.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/plans"
                className="inline-flex items-center gap-2 rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
              >
                Explore plans
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                to="/programs"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                Browse programs
              </Link>
            </div>

            <div className="flex gap-2">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={"Visit Level Up Fitness on " + label}
                  title={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-border/60 text-foreground/65 transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <h4 className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Explore
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-foreground/70">
                <li>
                  <Link to="/programs" className="transition-colors hover:text-foreground">
                    Programs
                  </Link>
                </li>
                <li>
                  <Link to="/plans" className="transition-colors hover:text-foreground">
                    Subscriptions
                  </Link>
                </li>
                <li>
                  <Link to="/shop" className="transition-colors hover:text-foreground">
                    Shop
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="transition-colors hover:text-foreground">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Services
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-foreground/70">
                <li>
                  <Link to="/nutrition" className="transition-colors hover:text-foreground">
                    Nutritionist
                  </Link>
                </li>
                <li>
                  <Link to="/physiotherapy" className="transition-colors hover:text-foreground">
                    Physiotherapy
                  </Link>
                </li>
                <li>
                  <Link to="/trainer" className="transition-colors hover:text-foreground">
                    Trainer Portal
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Contact
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-foreground/70">
                <li className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>hello@levelup.fit</span>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>+254 700 000 000</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>Nairobi, Kenya</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/50 px-1 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Level Up Fitness. All rights reserved.</p>
          <p>Built for training, recovery, and consistency.</p>
        </div>
      </div>
    </footer>
  );
}
