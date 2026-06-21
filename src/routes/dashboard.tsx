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
import { useEffect, useState, type ReactNode } from "react";
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
      { name: "description", content: "View your subscriptions, programs, appointments, orders, and notifications." },
    ],
  }),
  component: Dashboard,
});

const ksh = (value: number) => new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
}).format(value || 0);

const formatDate = (value: string, withTime = false) => new Intl.DateTimeFormat("en-KE", {
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

  if (!isHydrated || (!session && !isHydrated)) return <DashboardSkeleton />;

  if (!session) {
    return <CenteredState icon={<Lock className="h-9 w-9 text-primary" />} title="Login to view your dashboard" message="Your account overview is available after login." />;
  }

  if (session.user.role !== "CUSTOMER") {
    return <CenteredState icon={<Lock className="h-9 w-9 text-primary" />} title="Customer dashboard unavailable" message="This dashboard is available to customer accounts." />;
  }

  if (dashboardQuery.isLoading) return <DashboardSkeleton />;

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <CenteredState
        icon={<RefreshCw className="h-9 w-9 text-primary" />}
        title="Dashboard could not be loaded"
        message={dashboardQuery.error instanceof Error ? dashboardQuery.error.message : "Please try again."}
      >
        <Button className="mt-5" variant="hero" onClick={() => void dashboardQuery.refetch()}>
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
      </CenteredState>
    );
  }

  return <DashboardContent dashboard={dashboardQuery.data} />;
}

function DashboardContent({ dashboard }: { dashboard: ApiCustomerDashboard }) {
  const primary = dashboard.primarySubscription;
  const renewal = primary ? formatDate(primary.currentPeriodEnd) : "Choose a plan to get started";

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Welcome back</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Hey, {dashboard.profile.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {primary ? `Your ${primary.plan?.name ?? "subscription"} is active until ${renewal}.` : "Explore a plan or program when you are ready."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="soft"><Link to="/programs">Browse programs</Link></Button>
          <Button asChild variant="hero"><Link to="/plans">{primary ? "Manage plan" : "Choose a plan"}</Link></Button>
        </div>
      </header>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="Account summary">
        <Stat icon={<CreditCard className="h-5 w-5" />} label="Active plan" value={primary?.plan?.name ?? "No plan"} sub={primary ? `Renews ${renewal}` : "View available plans"} />
        <Stat icon={<BookOpen className="h-5 w-5" />} label="My programs" value={String(dashboard.summary.accessiblePrograms)} sub="Available to you" />
        <Stat icon={<CalendarDays className="h-5 w-5" />} label="Upcoming bookings" value={String(dashboard.summary.upcomingBookings)} sub="Pending or approved" />
        <Stat icon={<Package className="h-5 w-5" />} label="Recent orders" value={String(dashboard.summary.recentOrders)} sub="Active or completed" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <SubscriptionPanel dashboard={dashboard} />
        <AccountPanel dashboard={dashboard} />
      </section>

      <ProgramsPanel programs={dashboard.programs} />

      <section className="grid gap-6 lg:grid-cols-2">
        <AppointmentsPanel dashboard={dashboard} />
        <OrdersPanel orders={dashboard.orders} />
      </section>

      <NotificationsPanel dashboard={dashboard} />
    </main>
  );
}

function Stat({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="card-elevated rounded-2xl p-6">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">{icon}</span>
      <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-display text-2xl font-bold" title={value}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function SubscriptionPanel({ dashboard }: { dashboard: ApiCustomerDashboard }) {
  const subscription = dashboard.primarySubscription;
  return (
    <div className="card-elevated rounded-2xl p-6 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-2 font-display text-xl font-bold"><CreditCard className="h-5 w-5 text-primary" /> Current subscription</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your plan, billing period, and included benefits.</p>
        </div>
        {subscription && <Badge className="capitalize">{subscription.status}</Badge>}
      </div>
      {!subscription ? (
        <EmptyState message="You do not have an active subscription yet."><Button asChild className="mt-4" variant="hero"><Link to="/plans">Browse plans</Link></Button></EmptyState>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)]">
          <div>
            <h3 className="font-display text-3xl font-bold text-primary">{subscription.plan?.name ?? "Plan unavailable"}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{subscription.plan?.description ?? "Plan details are no longer available."}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <span className="rounded-lg bg-muted px-3 py-2">Paid: <strong>{ksh(subscription.amountPaid)}</strong></span>
              <span className="rounded-lg bg-muted px-3 py-2 capitalize">Cycle: <strong>{subscription.plan?.billingCycle ?? "Unavailable"}</strong></span>
              <span className="rounded-lg bg-muted px-3 py-2">Renews: <strong>{formatDate(subscription.currentPeriodEnd)}</strong></span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Included features</h3>
            {subscription.plan?.features.length ? (
              <ul className="mt-3 space-y-2">
                {subscription.plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{feature}</li>)}
              </ul>
            ) : <p className="mt-3 text-sm text-muted-foreground">No plan features have been listed.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function AccountPanel({ dashboard }: { dashboard: ApiCustomerDashboard }) {
  const profile = dashboard.profile;
  return (
    <div className="card-elevated rounded-2xl p-6">
      <h2 className="inline-flex items-center gap-2 font-display text-xl font-bold"><CircleUserRound className="h-5 w-5 text-primary" /> Account</h2>
      <div className="mt-5 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-primary/10 font-display text-lg font-bold text-primary">
          {profile.avatarUrl ? <img src={apiAssetUrl(profile.avatarUrl)} alt="" className="h-full w-full object-cover" /> : profile.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0"><p className="truncate font-semibold">{profile.name}</p><Badge variant="secondary" className="mt-1 capitalize">{profile.status}</Badge></div>
      </div>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div className="min-w-0"><dt className="text-xs text-muted-foreground">Email</dt><dd className="break-all font-medium">{profile.email}</dd></div></div>
        <div className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><dt className="text-xs text-muted-foreground">Phone</dt><dd className="font-medium">{profile.phone || "Not provided"}</dd></div></div>
        <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><dt className="text-xs text-muted-foreground">Email verification</dt><dd className="font-medium">{profile.emailVerified ? "Verified" : "Verification pending"}</dd></div></div>
      </dl>
    </div>
  );
}

function ProgramsPanel({ programs }: { programs: ApiDashboardProgram[] }) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-2xl font-bold">My programs</h2><p className="text-sm text-muted-foreground">Programs included in your plan or assigned through enrollment.</p></div><Button asChild variant="soft" size="sm"><Link to="/programs">Browse all</Link></Button></div>
      {programs.length ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => <ProgramCard key={program.programRef} program={program} />)}
        </div>
      ) : <EmptyState message="No programs are available through your account yet." />}
    </section>
  );
}

function ProgramCard({ program }: { program: ApiDashboardProgram }) {
  return (
    <article className="card-elevated overflow-hidden rounded-2xl">
      <div className="aspect-[16/9] bg-muted">
        {program.thumbnail ? <img src={apiAssetUrl(program.thumbnail)} alt={program.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><BookOpen className="h-10 w-10 text-muted-foreground" /></div>}
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-2"><Badge variant="secondary" className="capitalize">{program.difficultyLevel}</Badge>{program.access.enrolled && <Badge variant="outline">Enrolled</Badge>}</div>
        <h3 className="mt-3 font-display text-xl font-bold">{program.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{program.trainer?.name ?? "Level Up coaching team"} · {program.duration}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground"><span>{program.workoutSchedule.length} schedule items</span><span>{program.videos.length} videos</span></div>
        <div className="mt-4 flex flex-wrap gap-2"><Button asChild size="sm" variant="hero"><Link to="/programs/$slug" params={{ slug: program.programRef }}>View program</Link></Button>{program.videos[0]?.url && <Button asChild size="sm" variant="soft"><a href={apiAssetUrl(program.videos[0].url)} target="_blank" rel="noreferrer"><PlayCircle className="h-4 w-4" /> Watch</a></Button>}</div>
      </div>
    </article>
  );
}

function AppointmentsPanel({ dashboard }: { dashboard: ApiCustomerDashboard }) {
  return (
    <section className="card-elevated rounded-2xl p-6">
      <h2 className="inline-flex items-center gap-2 font-display text-xl font-bold"><CalendarDays className="h-5 w-5 text-primary" /> Upcoming appointments</h2>
      {dashboard.appointments.length ? <div className="mt-5 divide-y divide-border">{dashboard.appointments.map((appointment) => <div key={appointment.appointmentRef} className="py-4 first:pt-0 last:pb-0"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{appointment.service?.name ?? "Wellness appointment"}</p><p className="mt-1 text-sm text-muted-foreground">with {appointment.specialist}</p></div><Badge variant="secondary" className="capitalize">{appointment.status.replace("_", " ")}</Badge></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatDate(appointment.scheduledAt, true)}</span>{appointment.service?.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{appointment.service.location}</span>}</div></div>)}</div> : <EmptyState message="You have no upcoming appointments." />}
    </section>
  );
}

function OrdersPanel({ orders }: { orders: ApiDashboardOrder[] }) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const downloadInvoice = async (order: ApiDashboardOrder) => {
    setDownloading(order.orderRef);
    try {
      const invoice = await ordersApi.invoice(order.orderRef);
      const url = URL.createObjectURL(new Blob([JSON.stringify(invoice, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${order.orderRef}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invoice could not be downloaded");
    } finally {
      setDownloading(null);
    }
  };
  return (
    <section className="card-elevated rounded-2xl p-6">
      <h2 className="inline-flex items-center gap-2 font-display text-xl font-bold"><Package className="h-5 w-5 text-primary" /> Recent orders</h2>
      {orders.length ? <div className="mt-5 divide-y divide-border">{orders.map((order) => <div key={order.orderRef} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"><div><div className="flex flex-wrap items-center gap-2"><p className="font-mono text-xs font-semibold">{order.orderRef}</p><Badge variant="secondary" className="capitalize">{order.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{order.itemCount} {order.itemCount === 1 ? "item" : "items"} · {formatDate(order.createdAt)}</p><p className="mt-1 font-semibold text-primary">{ksh(order.total)}</p></div><Button type="button" variant="ghost" size="icon" title="Download invoice" disabled={downloading === order.orderRef} onClick={() => void downloadInvoice(order)}>{downloading === order.orderRef ? <Loader2 className="h-4 w-4 animate-spin" /> : <ReceiptText className="h-4 w-4" />}<span className="sr-only">Download invoice</span></Button></div>)}</div> : <EmptyState message="You have not placed any orders yet." />}
    </section>
  );
}

function NotificationsPanel({ dashboard }: { dashboard: ApiCustomerDashboard }) {
  return (
    <section className="card-elevated rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="inline-flex items-center gap-2 font-display text-xl font-bold"><Bell className="h-5 w-5 text-primary" /> Notifications</h2><p className="mt-1 text-sm text-muted-foreground">{dashboard.summary.unreadNotifications} unread notification{dashboard.summary.unreadNotifications === 1 ? "" : "s"}</p></div>{dashboard.summary.unreadNotifications > dashboard.notifications.length && <Badge variant="secondary">Showing latest {dashboard.notifications.length}</Badge>}</div>
      {dashboard.notifications.length ? <div className="mt-5 grid gap-3 md:grid-cols-2">{dashboard.notifications.map((notification) => <div key={notification.notificationRef} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{notification.title}</h3><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" /></div><p className="mt-2 text-sm text-muted-foreground">{notification.message}</p><p className="mt-3 text-xs text-muted-foreground">{formatDate(notification.createdAt, true)}</p></div>)}</div> : <EmptyState message="You are all caught up." />}
    </section>
  );
}

function EmptyState({ message, children }: { message: string; children?: ReactNode }) {
  return <div className="mt-5 rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground"><p>{message}</p>{children}</div>;
}

function CenteredState({ icon, title, message, children }: { icon: ReactNode; title: string; message: string; children?: ReactNode }) {
  return <div className="mx-auto grid min-h-[65vh] max-w-7xl place-items-center px-4 py-16 sm:px-6"><div className="card-elevated max-w-md rounded-2xl p-8 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10">{icon}</div><h1 className="mt-4 font-display text-3xl font-bold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{message}</p>{children}</div></div>;
}

function DashboardSkeleton() {
  return <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6"><div className="space-y-3"><Skeleton className="h-4 w-28" /><Skeleton className="h-11 w-72 max-w-full" /><Skeleton className="h-5 w-96 max-w-full" /></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-44 rounded-2xl" />)}</div><div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-72 rounded-2xl lg:col-span-2" /><Skeleton className="h-72 rounded-2xl" /></div><Skeleton className="h-72 rounded-2xl" /></div>;
}
