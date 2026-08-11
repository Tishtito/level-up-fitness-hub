import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Menu, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import levelUpLogo from "@/assets/level-up-logo.jpeg";
import { authApi } from "@/lib/api";
import { useAuthSession } from "@/lib/auth";
import { useCartCount } from "@/lib/use-cart-count";
import { cn } from "@/lib/utils";

const servicesChildren = [
  { to: "/nutrition", label: "Nutrition" },
  { to: "/physiotherapy", label: "Physiotherapy" },
  { to: "/medicare", label: "Medicare" },
] as const;

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/programs", label: "Programs" },
  { to: "/plans", label: "Plans" },
  { label: "Services", children: servicesChildren },
  { to: "/shop", label: "Shop" },
] as const;

type NavListItem = (typeof publicLinks)[number] | { to: string; label: string };
type NestedNavItem = Extract<NavListItem, { children: unknown }>;

function isNestedItem(item: NavListItem): item is NestedNavItem {
  return "children" in item;
}

function linkIsActive(path: string, to: string) {
  return to === "/" ? path === "/" : path.startsWith(to);
}

/** Count bubble on the cart icon. The ring keeps it legible over the blurred header. */
function CartBadge({ count }: { count: number }) {
  if (count < 1) return null;

  return (
    <span
      aria-hidden
      className="absolute -right-0.5 -top-0.5 grid h-[1.15rem] min-w-[1.15rem] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function cartLabel(count: number) {
  if (count < 1) return "Cart";
  return `Cart, ${count} ${count === 1 ? "item" : "items"}`;
}

function ServicesDesktopItem({ item, path }: { item: NestedNavItem; path: string }) {
  const nestedActive = item.children.some((child) => linkIsActive(path, child.to));

  return (
    <li key={item.label}>
      <NavigationMenu className="z-10">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={cn(
                "h-auto rounded-full bg-transparent px-3 py-2 text-sm font-medium transition-colors hover:bg-transparent hover:text-foreground focus:bg-transparent focus:text-foreground data-[state=open]:bg-transparent data-[state=open]:text-foreground",
                nestedActive ? "text-foreground" : "text-foreground/55",
              )}
            >
              {item.label}
            </NavigationMenuTrigger>
            <NavigationMenuContent className="min-w-44 p-1.5 md:absolute md:w-auto">
              <ul className="grid gap-0.5">
                {item.children.map((child) => (
                  <li key={child.to}>
                    <NavigationMenuLink asChild active={linkIsActive(path, child.to)}>
                      <Link
                        to={child.to}
                        className={cn(
                          "block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/70 hover:text-foreground focus:bg-secondary/70 focus:text-foreground focus:outline-none",
                          linkIsActive(path, child.to) ? "text-foreground" : "text-foreground/70",
                        )}
                      >
                        {child.label}
                      </Link>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </li>
  );
}

function ServicesMobileItem({
  item,
  path,
  onNavigate,
}: {
  item: NestedNavItem;
  path: string;
  onNavigate: () => void;
}) {
  const nestedActive = item.children.some((child) => linkIsActive(path, child.to));

  return (
    <li key={item.label}>
      <Collapsible>
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-colors [&[data-state=open]>svg]:rotate-180",
            nestedActive
              ? "bg-foreground/5 text-foreground"
              : "text-foreground/70 hover:bg-foreground/5",
          )}
        >
          {item.label}
          <ChevronDown
            className="h-4 w-4 shrink-0 transition-transform duration-200"
            aria-hidden="true"
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="grid gap-1 pl-4">
          {item.children.map((child) => (
            <Link
              key={child.to}
              to={child.to}
              onClick={onNavigate}
              className={cn(
                "block rounded-2xl px-4 py-3 text-sm font-medium",
                linkIsActive(path, child.to)
                  ? "bg-foreground/5 text-foreground"
                  : "text-foreground/70 hover:bg-foreground/5",
              )}
            >
              {child.label}
            </Link>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const session = useAuthSession();
  const cartCount = useCartCount();
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
            {links.map((item) => {
              if (isNestedItem(item))
                return <ServicesDesktopItem key={item.label} item={item} path={path} />;

              const active = linkIsActive(path, item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                      active ? "text-foreground" : "text-foreground/55 hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="hidden items-center gap-2 lg:flex">
            <Link to="/cart" className="relative" aria-label={cartLabel(cartCount)}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ShoppingBag className="h-5 w-5" />
              </Button>
              <CartBadge count={cartCount} />
            </Link>
            {session ? (
              <>
                <Link to={dashboardLink.to}>
                  <Button variant="ghost" size="default" className="rounded-full">
                    {session.user.name.split(" ")[0]}
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" size="default" className="rounded-full">
                    Profile
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

          <div className="flex items-center gap-1 lg:hidden">
            <Link to="/cart" className="relative" aria-label={cartLabel(cartCount)}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ShoppingBag className="h-5 w-5" />
              </Button>
              <CartBadge count={cartCount} />
            </Link>

            <button
              className="grid h-10 w-10 place-items-center rounded-full border border-border/60"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={open}
              aria-controls="mobile-navigation"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {open && (
          <div id="mobile-navigation" className="pb-4 lg:hidden">
            <div className="rounded-[1.5rem] border border-border/60 bg-background p-3 shadow-sm">
              <ul className="grid gap-1">
                {links.map((item) => {
                  if (isNestedItem(item)) {
                    return (
                      <ServicesMobileItem
                        key={item.label}
                        item={item}
                        path={path}
                        onNavigate={() => setOpen(false)}
                      />
                    );
                  }

                  const active = linkIsActive(path, item.to);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "block rounded-2xl px-4 py-3 text-sm font-medium",
                          active
                            ? "bg-foreground/5 text-foreground"
                            : "text-foreground/70 hover:bg-foreground/5",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link to="/cart" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full rounded-full">
                    Cart
                    {cartCount > 0 && (
                      <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
                {session ? (
                  <>
                    <Link to="/profile" onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full rounded-full">
                        Profile
                      </Button>
                    </Link>
                    <Button variant="ghost" className="w-full rounded-full" onClick={logout}>
                      Logout
                    </Button>
                  </>
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
