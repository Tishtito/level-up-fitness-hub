import { useEffect, useState, type ReactNode } from "react";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CircleUserRound,
  Clock,
  CreditCard,
  ExternalLink,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Package,
  Phone,
  PlayCircle,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  dashboardApi,
  ordersApi,
  type ApiCustomerDashboard,
  type ApiDashboardOrder,
  type ApiDashboardProgram,
} from "@/lib/api";
import { useAuthState } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";
import { apiAssetUrl } from "@/lib/env";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard - Level Up Fitness" },
      {
        name: "description",
        content: "View your subscriptions, programs, appointments, orders, and notifications.",
      },
    ],
  }),
  component: Dashboard,
});

const ksh = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (value: string, withTime = false) =>
  new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
  }).format(new Date(value));

function Dashboard() {
  const { session, isHydrated } = useAuthState();

  useEffect(() => {
    if (!isHydrated) return;
    if (!session) window.location.replace(loginUrlFor({ redirect: "/dashboard" }));
    else if (session.user.role === "TRAINER") window.location.replace("/trainer");
  }, [isHydrated, session]);

  const dashboardQuery = useQuery({
    queryKey: ["customer", "dashboard"],
    queryFn: dashboardApi.getOverview,
    enabled: isHydrated && session?.user.role === "CUSTOMER",
    staleTime: 30_000,
  });

  if (!isHydrated) return <DashboardSkeleton />;

  if (!session) {
    return (
      <CenteredState
        icon={<Lock className="h-9 w-9 text-primary" />}
        title="Login to view your dashboard"
        message="Your account overview is available after login."
      />
    );
  }

  if (session.user.role !== "CUSTOMER") {
    return (
      <CenteredState
        icon={<Lock className="h-9 w-9 text-primary" />}
        title="Customer dashboard unavailable"
        message="This dashboard is available to customer accounts."
      />
    );
  }

  if (dashboardQuery.isLoading) return <DashboardSkeleton />;

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <CenteredState
        icon={<RefreshCw className="h-9 w-9 text-primary" />}
        title="Dashboard could not be loaded"
        message={
          dashboardQuery.error instanceof Error ? dashboardQuery.error.message : "Please try again."
        }
      >
        <Button className="mt-5" variant="hero" onClick={() => void dashboardQuery.refetch()}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </CenteredState>
    );
  }

  return <DashboardContent dashboard={dashboardQuery.data} />;
}

function DashboardContent({ dashboard }: { dashboard: ApiCustomerDashboard }) {
  const primary = dashboard.primarySubscription;
  const renewal = primary ? formatDate(primary.currentPeriodEnd) : "Choose a plan to get started";
  const nextAction = primary ? "Manage plan" : "Choose a plan";

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
      <div className="space-y-8">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.25rem] border border-border bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary">Dashboard</p>
                <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.03em]">
                  Hey, {dashboard.profile.name}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                  {primary
                    ? `Your ${primary.plan?.name ?? "subscription"} is active until ${renewal}.`
                    : "Explore a plan or program when you are ready."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="soft">
                  <Link to="/programs">Browse programs</Link>
                </Button>
                <Button asChild variant="hero">
                  <Link to="/plans">{nextAction}</Link>
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <QuickStat
                label="Active plan"
                value={primary?.plan?.name ?? "No plan"}
                sub={primary ? `Renews ${renewal}` : "View available plans"}
              />
              <QuickStat
                label="Programs"
                value={String(dashboard.summary.accessiblePrograms)}
                sub="Available to you"
              />
              <QuickStat
                label="Bookings"
                value={String(dashboard.summary.upcomingBookings)}
                sub="Pending or approved"
              />
              <QuickStat
                label="Orders"
                value={String(dashboard.summary.recentOrders)}
                sub="Active or completed"
              />
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-border bg-[#14231d] p-6 text-[#f6f8f5] shadow-[var(--shadow-elegant)] sm:p-8">
            <p className="text-sm font-semibold text-[#f6f8f5]/75">Account</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-[#263930] text-lg font-bold text-[#f6f8f5]">
                {dashboard.profile.avatarUrl ? (
                  <img
                    src={apiAssetUrl(dashboard.profile.avatarUrl)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  dashboard.profile.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-xl font-bold">{dashboard.profile.name}</p>
                <Badge variant="secondary" className="mt-1 capitalize">
                  {dashboard.profile.status}
                </Badge>
              </div>
            </div>

            <dl className="mt-6 space-y-4 text-sm">
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={dashboard.profile.email}
              />
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={dashboard.profile.phone || "Not provided"}
              />
              <InfoRow
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Verification"
                value={dashboard.profile.emailVerified ? "Verified" : "Verification pending"}
              />
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild variant="soft">
                <Link to="/cart">View cart</Link>
              </Button>
              <Button asChild variant="soft">
                <Link to="/shop">Open shop</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel
            title="Current subscription"
            icon={<CreditCard className="h-5 w-5" />}
            subtitle="Your plan, billing period, and included benefits."
            action={
              <Button asChild variant="soft" size="sm">
                <Link to="/plans">{primary ? "Manage plan" : "Browse plans"}</Link>
              </Button>
            }
          >
            {!primary ? (
              <EmptyState message="You do not have an active subscription yet.">
                <Button asChild className="mt-4" variant="hero">
                  <Link to="/plans">Browse plans</Link>
                </Button>
              </EmptyState>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.85fr)]">
                <div>
                  <h3 className="font-display text-2xl font-bold text-primary">
                    {primary.plan?.name ?? "Plan unavailable"}
                  </h3>
                  <p className="mt-2 max-w-prose text-sm leading-7 text-muted-foreground">
                    {primary.plan?.description ?? "Plan details are no longer available."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2.5 py-1">
                      Paid: <strong>{ksh(primary.amountPaid)}</strong>
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1 capitalize">
                      Cycle: <strong>{primary.plan?.billingCycle ?? "Unavailable"}</strong>
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1">
                      Renews: <strong>{formatDate(primary.currentPeriodEnd)}</strong>
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold">Included features</p>
                  {primary.plan?.features.length ? (
                    <ul className="mt-3 space-y-2">
                      {primary.plan.features.map((feature) => (
                        <li key={feature} className="flex gap-2 text-sm leading-6">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      No plan features have been listed.
                    </p>
                  )}
                </div>
              </div>
            )}
          </Panel>

          <Panel
            title="Account details"
            icon={<CircleUserRound className="h-5 w-5" />}
            subtitle="The essentials you use most often."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailChip label="Email" value={dashboard.profile.email} />
              <DetailChip label="Phone" value={dashboard.profile.phone || "Not provided"} />
              <DetailChip label="Active plans" value={String(dashboard.summary.activePlans)} />
              <DetailChip
                label="Unread notifications"
                value={String(dashboard.summary.unreadNotifications)}
              />
            </div>
          </Panel>
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Programs</p>
              <h2 className="mt-1 font-display text-2xl font-bold">My programs</h2>
            </div>
            <Button asChild variant="soft" size="sm">
              <Link to="/programs">Browse all</Link>
            </Button>
          </div>
          {dashboard.programs.length ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {dashboard.programs.map((program) => (
                <ProgramCard key={program.programRef} program={program} />
              ))}
            </div>
          ) : (
            <EmptyState message="No programs are available through your account yet." />
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel
            title="Upcoming appointments"
            icon={<CalendarDays className="h-5 w-5" />}
            subtitle="Pending and approved bookings."
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to="/history" search={{ tab: "appointments" }}>
                  View all
                </Link>
              </Button>
            }
          >
            {dashboard.appointments.length ? (
              <div className="divide-y divide-border">
                {dashboard.appointments.map((appointment) => (
                  <div key={appointment.appointmentRef} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {appointment.service?.name ?? "Wellness appointment"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          with {appointment.specialist}
                        </p>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {appointment.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(appointment.scheduledAt, true)}
                      </span>
                      {appointment.service?.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {appointment.service.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="You have no upcoming appointments." />
            )}
          </Panel>

          <Panel
            title="Recent orders"
            icon={<Package className="h-5 w-5" />}
            subtitle="Recent purchases and invoices."
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to="/history">View all</Link>
              </Button>
            }
          >
            {dashboard.orders.length ? (
              <div className="divide-y divide-border">
                {dashboard.orders.map((order) => (
                  <OrderRow key={order.orderRef} order={order} />
                ))}
              </div>
            ) : (
              <EmptyState message="You have not placed any orders yet." />
            )}
          </Panel>
        </section>

        <Panel
          title="Notifications"
          icon={<Bell className="h-5 w-5" />}
          subtitle={`${dashboard.summary.unreadNotifications} unread notification${
            dashboard.summary.unreadNotifications === 1 ? "" : "s"
          }`}
          action={
            dashboard.summary.unreadNotifications > dashboard.notifications.length ? (
              <Badge variant="secondary">Showing latest {dashboard.notifications.length}</Badge>
            ) : null
          }
        >
          {dashboard.notifications.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {dashboard.notifications.map((notification) => (
                <div
                  key={notification.notificationRef}
                  className="rounded-[1rem] border border-border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold">{notification.title}</h3>
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {formatDate(notification.createdAt, true)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="You are all caught up." />
          )}
        </Panel>
      </div>
    </main>
  );
}

function Panel({
  title,
  icon,
  subtitle,
  action,
  children,
}: {
  title: string;
  icon: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.25rem] border border-border bg-white p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-2 font-display text-xl font-bold">
            {icon}
            {title}
          </h2>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function QuickStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[1rem] bg-muted p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 truncate font-display text-2xl font-bold" title={value}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[1rem] bg-[#263930] p-4">
      <span className="mt-0.5 text-[#f6f8f5]">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs text-[#f6f8f5]/70">{label}</dt>
        <dd className="mt-1 break-all text-sm font-medium text-[#f6f8f5]">{value}</dd>
      </div>
    </div>
  );
}

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] bg-muted p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-sm font-medium leading-6">{value}</p>
    </div>
  );
}

function ProgramCard({ program }: { program: ApiDashboardProgram }) {
  return (
    <article className="overflow-hidden rounded-[1rem] border border-border bg-white shadow-[var(--shadow-soft)]">
      <div className="aspect-[16/9] bg-muted">
        {program.thumbnail ? (
          <img
            src={apiAssetUrl(program.thumbnail)}
            alt={program.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="capitalize">
            {program.difficultyLevel}
          </Badge>
          {program.access.enrolled && <Badge variant="outline">Enrolled</Badge>}
          {program.access.viaSubscription && <Badge variant="outline">Subscription</Badge>}
        </div>
        <h3 className="mt-3 font-display text-xl font-bold">{program.title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {program.trainer?.name ?? "Level Up coaching team"} · {program.duration}
        </p>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>{program.workoutSchedule.length} schedule items</span>
          <span>{program.videos?.length ?? 0} videos</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="hero">
            <Link to="/programs/$slug" params={{ slug: program.programRef }}>
              View program
            </Link>
          </Button>
          {program.videos?.[0]?.url && (
            <Button asChild size="sm" variant="soft">
              <a href={apiAssetUrl(program.videos?.[0]?.url)} target="_blank" rel="noreferrer">
                <PlayCircle className="h-4 w-4" />
                Watch
              </a>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function OrderRow({ order }: { order: ApiDashboardOrder }) {
  const [downloading, setDownloading] = useState(false);

  const downloadInvoice = async () => {
    setDownloading(true);
    try {
      const invoice = await ordersApi.invoice(order.orderRef);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(invoice, null, 2)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${order.orderRef}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invoice could not be downloaded");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/orders/$orderRef"
            params={{ orderRef: order.orderRef }}
            className="font-mono text-xs font-semibold transition-colors hover:text-primary"
          >
            {order.orderRef}
          </Link>
          <Badge variant="secondary" className="capitalize">
            {order.status}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {order.itemCount} {order.itemCount === 1 ? "item" : "items"} ·{" "}
          {formatDate(order.createdAt)}
        </p>
        <p className="mt-1 font-semibold text-primary">{ksh(order.total)}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        title="Download invoice"
        disabled={downloading}
        onClick={() => void downloadInvoice()}
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ReceiptText className="h-4 w-4" />
        )}
        <span className="sr-only">Download invoice</span>
      </Button>
    </div>
  );
}

function EmptyState({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div className="mt-5 rounded-[1rem] border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
      <p>{message}</p>
      {children}
    </div>
  );
}

function CenteredState({
  icon,
  title,
  message,
  children,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-[65vh] max-w-7xl place-items-center px-4 py-16 sm:px-6">
      <div className="max-w-md rounded-[1.25rem] border border-border bg-white p-8 text-center shadow-[var(--shadow-soft)]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10">
          {icon}
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{message}</p>
        {children}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.25rem] border border-border bg-white p-6 shadow-[var(--shadow-soft)]">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-72 max-w-full" />
            <Skeleton className="h-5 w-96 max-w-full" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-[1rem]" />
            ))}
          </div>
        </div>
        <Skeleton className="h-[18rem] rounded-[1.25rem]" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Skeleton className="h-[28rem] rounded-[1.25rem]" />
        <Skeleton className="h-[28rem] rounded-[1.25rem]" />
      </div>

      <Skeleton className="h-[22rem] rounded-[1.25rem]" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[22rem] rounded-[1.25rem]" />
        <Skeleton className="h-[22rem] rounded-[1.25rem]" />
      </div>
      <Skeleton className="h-[18rem] rounded-[1.25rem]" />
    </div>
  );
}
