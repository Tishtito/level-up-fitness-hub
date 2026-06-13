import { Link } from "@tanstack/react-router";
import { Dumbbell, Music2, Facebook, Linkedin, Mail, MapPin, Phone } from "lucide-react";

const socialLinks = [
  { label: "TikTok", href: "https://vm.tiktok.com/ZS92f16NoxntV-017g5/", icon: Music2 },
  { label: "Facebook", href: "https://www.facebook.com/levelupFitnessKE", icon: Facebook },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/levelup-functional-strength-coach-bab8361a3", icon: Linkedin },
] as const;

export function Footer() {
  return (
    <footer className="mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="card-elevated rounded-3xl p-8 sm:p-12">
          <div className="grid gap-10 lg:grid-cols-4">
            <div>
              <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground">
                  <Dumbbell className="h-5 w-5" />
                </span>
                Level<span className="gradient-text">Up</span>
              </Link>
              <p className="mt-3 text-sm text-muted-foreground max-w-xs">
                Transform your body. Elevate your life. The premium fitness platform for every goal.
              </p>
              <div className="mt-5 flex gap-2">
                {socialLinks.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={"Visit Level Up Fitness on " + label}
                    title={label}
                    className="grid h-9 w-9 place-items-center rounded-xl bg-surface/60 text-surface-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider">Explore</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link to="/programs" className="hover:text-primary">Programs</Link></li>
                <li><Link to="/plans" className="hover:text-primary">Subscriptions</Link></li>
                <li><Link to="/shop" className="hover:text-primary">Shop</Link></li>
                <li><Link to="/dashboard" className="hover:text-primary">Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider">Services</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link to="/nutrition" className="hover:text-primary">Nutritionist</Link></li>
                <li><Link to="/physiotherapy" className="hover:text-primary">Physiotherapy</Link></li>
                <li><Link to="/trainer" className="hover:text-primary">Trainer Portal</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider">Contact</h4>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> hello@levelup.fit</li>
                <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> +254 700 000 000</li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Nairobi, Kenya</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} Level Up Fitness. All rights reserved.</p>
            <p>Designed to elevate.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
