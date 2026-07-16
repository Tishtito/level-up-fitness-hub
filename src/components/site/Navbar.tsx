import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
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
  const dashboardLink =
    session?.user.role === "TRAINER"
      ? { to: "/trainer" as const, label: "Trainer Portal" }
      : { to: "/dashboard" as const, label: "Dashboard" };
  const links = [...publicLinks, dashboardLink];

  async function logout() {
    await authApi.logout();
    window.location.assign("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-2xl">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <nav className="flex items-center justify-between gap-4 py-3.5">
          <Link
            to="/"
            className="flex items-center gap-3 font-display text-base font-semibold tracking-tight"
          >
            <img
              src={levelUpLogo}
              alt="Level Up Fitness"
              className="h-10 w-10 rounded-full object-cover"
            />
            <span className="leading-none text-foreground">
              Level<span className="text-primary">Up</span>
              <span className="mt-1 block text-[10px] font-normal tracking-[0.26em] text-muted-foreground uppercase">
                Fitness Hub
              </span>
            </span>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {links.map((l) => {
              const active = l.to === "/" ? path === "/" : path.startsWith(l.to);
              return (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className={cn(
                      "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                      active ? "text-foreground" : "text-foreground/55 hover:text-foreground",
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
              <Button variant="ghost" size="icon" className="rounded-full">
                <ShoppingBag className="h-5 w-5" />
              </Button>
            </Link>
            {session ? (
              <>
                <Link to={dashboardLink.to}>
                  <Button variant="ghost" size="default" className="rounded-full">
                    {session.user.name.split(" ")[0]}
                  </Button>
                </Link>
                <Button variant="ghost" size="default" className="rounded-full" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="default" className="rounded-full">
                    Login
                  </Button>
                </Link>
                <Link to="/plans">
                  <Button variant="hero" size="default" className="rounded-full">
                    Join Now
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-border/60 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {open && (
          <div id="mobile-navigation" className="pb-4 lg:hidden">
            <div className="rounded-[1.5rem] border border-border/60 bg-background p-3 shadow-sm">
              <ul className="grid gap-1">
                {links.map((l) => {
                  const active = l.to === "/" ? path === "/" : path.startsWith(l.to);
                  return (
                    <li key={l.to}>
                      <Link
                        to={l.to}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "block rounded-2xl px-4 py-3 text-sm font-medium",
                          active
                            ? "bg-foreground/5 text-foreground"
                            : "text-foreground/70 hover:bg-foreground/5",
                        )}
                      >
                        {l.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link to="/cart" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full rounded-full">
                    Cart
                  </Button>
                </Link>
                {session ? (
                  <Button variant="ghost" className="w-full rounded-full" onClick={logout}>
                    Logout
                  </Button>
                ) : (
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full rounded-full">
                      Login
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
