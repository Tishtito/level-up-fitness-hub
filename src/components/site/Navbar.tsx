import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import levelUpLogo from "@/assets/level-up-logo.jpeg";
import { authApi } from "@/lib/api";
import { useAuthSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/programs", label: "Programs" },
  { to: "/plans", label: "Plans" },
  { to: "/nutrition", label: "Nutrition" },
  { to: "/physiotherapy", label: "Physio" },
  { to: "/shop", label: "Shop" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const session = useAuthSession();
  const dashboardLink = session?.user.role === "TRAINER"
    ? { to: "/trainer" as const, label: "Trainer Portal" }
    : { to: "/dashboard" as const, label: "Dashboard" };
  const links = [...publicLinks, dashboardLink];

  async function logout() {
    await authApi.logout();
    window.location.assign("/");
  }

  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto mt-3 max-w-7xl px-3 sm:px-6">
        <nav className="glass flex items-center justify-between rounded-2xl px-4 py-3 shadow-[var(--shadow-soft)]">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <img src={levelUpLogo} alt="Level Up Fitness" className="h-10 w-10 rounded-full object-cover shadow-sm" />
            <span>Level<span className="gradient-text">Up</span></span>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {links.map((l) => {
              const active = l.to === "/" ? path === "/" : path.startsWith(l.to);
              return (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/70 hover:bg-surface/60 hover:text-foreground",
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="hidden items-center gap-2 lg:flex">
            <Link to="/cart" aria-label="Cart">
              <Button variant="ghost" size="icon"><ShoppingBag className="h-5 w-5" /></Button>
            </Link>
            {session ? (
              <>
                <Link to={dashboardLink.to}><Button variant="soft" size="default">{session.user.name.split(" ")[0]}</Button></Link>
                <Button variant="ghost" size="default" onClick={logout}>Logout</Button>
              </>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" size="default">Login</Button></Link>
                <Link to="/plans"><Button variant="hero" size="default">Join Now</Button></Link>
              </>
            )}
          </div>

          <button
            className="lg:hidden grid h-10 w-10 place-items-center rounded-xl border border-border/60"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {open && (
          <div className="glass mt-2 rounded-2xl p-3 lg:hidden">
            <ul className="flex flex-col gap-1">
              {links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-surface/60"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2 flex gap-2">
                <Link to="/cart" className="flex-1" onClick={() => setOpen(false)}>
                  <Button variant="soft" className="w-full">Cart</Button>
                </Link>
                {session ? (
                  <Button variant="hero" className="flex-1" onClick={logout}>Logout</Button>
                ) : (
                  <Link to="/login" className="flex-1" onClick={() => setOpen(false)}>
                    <Button variant="hero" className="w-full">Login</Button>
                  </Link>
                )}
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
