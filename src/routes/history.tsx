import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Lock,
  MapPin,
  Package,
  ReceiptText,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  appointmentsApi,
  ordersApi,
  servicesApi,
  type ApiAppointment,
  type ApiOrder,
  type ApiWellnessService,
} from "@/lib/api";
import { useAuthState } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";
import {
  appointmentDateLabel,
  appointmentStatusClass,
  formatDate,
  ksh,
  nextAvailableDays,
  orderStatusClass,
  serviceTimeSlots,
  toScheduledAt,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const ORDER_STATUSES: ApiOrder["status"][] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const APPOINTMENT_STATUSES: ApiAppointment["status"][] = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "attended",
  "no_show",
];

/** The backend 409s on shipped/delivered, and cancelling restocks — so guard here too. */
const CANCELLABLE_ORDER_STATUSES = new Set<ApiOrder["status"]>(["pending", "paid", "processing"]);

type Tab = "orders" | "appointments";
type Search = { tab?: Tab; status?: string; page?: number };

export const Route = createFileRoute("/history")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const page = Number(search.page);
    return {
      tab: search.tab === "appointments" ? "appointments" : undefined,
      status: typeof search.status === "string" && search.status ? search.status : undefined,
      page: Number.isInteger(page) && page > 1 ? page : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Your activity - Level Up Fitness" },
      { name: "description", content: "Every order and appointment on your account." },
    ],
  }),
  component: HistoryPage,
});

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

/** 1 … p-1 p p+1 … total */
function pageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  return sorted.flatMap((page, index) =>
    index > 0 && page - sorted[index - 1] > 1 ? (["ellipsis", page] as const) : [page],
  );
}

function HistoryPagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1 pt-6">
      {page > 1 && (
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
      )}
      {pageWindow(page, totalPages).map((entry, index) =>
        entry === "ellipsis" ? (
          <span
            key={`gap-${index}`}
            className="grid h-9 w-9 place-items-center text-muted-foreground"
            aria-hidden
          >
            ...
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onPage(entry)}
            aria-current={entry === page ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: entry === page ? "outline" : "ghost", size: "icon" }),
              "h-9 w-9",
            )}
          >
            {entry}
          </button>
        ),
      )}
      {page < totalPages && (
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => onPage(page + 1)}>
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </nav>
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

function EmptyState({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div className="rounded-[1rem] border border-dashed border-border px-5 py-12 text-center text-sm text-muted-foreground">
      <p>{message}</p>
      {children}
    </div>
  );
}

function RowsSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between gap-3 py-4 first:pt-0">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      ))}
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
    <div className="mx-auto grid min-h-[65vh] max-w-7xl place-items-center px-4">
      <div className="max-w-md rounded-[1.25rem] border border-border bg-white p-8 text-center shadow-[var(--shadow-soft)]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10">
          {icon}
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {children}
      </div>
    </div>
  );
}

function OrderRow({ order, onCancel }: { order: ApiOrder; onCancel: () => void }) {
  const [downloading, setDownloading] = useState(false);

  async function downloadInvoice() {
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
      toast.error(error instanceof Error ? error.message : "Invoice download failed");
    } finally {
      setDownloading(false);
    }
  }

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
      <div className="min-w-[12rem] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/orders/$orderRef"
            params={{ orderRef: order.orderRef }}
            className="font-mono text-xs font-semibold transition-colors hover:text-primary"
          >
            {order.orderRef}
          </Link>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
              orderStatusClass(order.status),
            )}
          >
            {statusLabel(order.status)}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {itemCount} item{itemCount === 1 ? "" : "s"}
          {order.createdAt ? ` · ${formatDate(order.createdAt)}` : ""}
        </p>
        <p className="mt-1 font-semibold text-primary">{ksh(order.total)}</p>
      </div>

      <div className="flex items-center gap-2">
        {CANCELLABLE_ORDER_STATUSES.has(order.status) && (
          <Button variant="soft" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void downloadInvoice()}
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ReceiptText className="h-4 w-4" />
          )}
          <span className="sr-only">Download invoice for {order.orderRef}</span>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link to="/orders/$orderRef" params={{ orderRef: order.orderRef }}>
            View
          </Link>
        </Button>
      </div>
    </div>
  );
}

function AppointmentRow({
  appointment,
  service,
  onCancel,
  onReschedule,
}: {
  appointment: ApiAppointment;
  service?: ApiWellnessService;
  onCancel: () => void;
  onReschedule: () => void;
}) {
  const upcoming = new Date(appointment.scheduledAt).getTime() > Date.now();
  // The backend has no transition guard on cancel — it would happily cancel an attended or
  // long-past booking — so the decision lives entirely here.
  const changeable =
    upcoming && (appointment.status === "pending" || appointment.status === "approved");

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0">
      <div className="min-w-[12rem] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{service?.name ?? "Wellness appointment"}</p>
          <Badge variant="secondary" className="capitalize">
            {statusLabel(appointment.status)}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">with {appointment.specialist}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {appointmentDateLabel(appointment.scheduledAt)}
          </span>
          {service?.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {service.location}
            </span>
          )}
        </div>
        {appointment.notes && (
          <p className="mt-2 text-xs text-muted-foreground">Note: {appointment.notes}</p>
        )}
      </div>

      {changeable && (
        <div className="flex items-center gap-2">
          <Button variant="soft" size="sm" onClick={onReschedule}>
            Reschedule
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

function RescheduleDialog({
  appointment,
  service,
  onClose,
  onConfirm,
  pending,
}: {
  appointment: ApiAppointment | null;
  service?: ApiWellnessService;
  onClose: () => void;
  onConfirm: (scheduledAt: string) => void;
  pending: boolean;
}) {
  const days = useMemo(() => nextAvailableDays(service?.availableDays), [service?.availableDays]);
  const slots = serviceTimeSlots(service);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");

  useEffect(() => {
    setDate(days[0] ?? "");
    setSlot("");
  }, [appointment?.appointmentRef, days]);

  return (
    <Dialog open={!!appointment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Reschedule appointment</DialogTitle>
          <DialogDescription>
            Pick a new slot. The booking returns to <strong>pending</strong> for the specialist to
            approve again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Date
            </p>
            <div className="flex flex-wrap gap-2">
              {days.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setDate(day)}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm transition",
                    date === day
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-secondary",
                  )}
                >
                  {formatDate(day)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Time
            </p>
            <div className="flex flex-wrap gap-2">
              {slots.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSlot(option)}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm transition",
                    slot === option
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-secondary",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="soft" onClick={onClose}>
            Keep current time
          </Button>
          <Button
            variant="hero"
            disabled={!date || !slot || pending}
            onClick={() => onConfirm(toScheduledAt(date, slot))}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm new time
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HistoryPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, isHydrated } = useAuthState();

  const tab: Tab = search.tab ?? "orders";
  const page = search.page ?? 1;

  const [cancelOrder, setCancelOrder] = useState<ApiOrder | null>(null);
  const [cancelAppointment, setCancelAppointment] = useState<ApiAppointment | null>(null);
  const [rescheduling, setRescheduling] = useState<ApiAppointment | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    if (!session) window.location.replace(loginUrlFor({ redirect: "/history" }));
  }, [isHydrated, session]);

  function setSearch(patch: Partial<Search>) {
    // Any tab or filter change invalidates the current page.
    void navigate({
      to: "/history",
      search: (prev: Search) => ({ ...prev, ...patch, page: patch.page }),
    });
  }

  const ordersQuery = useQuery({
    queryKey: ["customer", "orders", search.status ?? "all", page],
    queryFn: () => ordersApi.list({ page, limit: PAGE_SIZE, status: search.status }),
    enabled: isHydrated && !!session && tab === "orders",
  });

  const appointmentsQuery = useQuery({
    queryKey: ["customer", "appointments", "history", search.status ?? "all", page],
    queryFn: () =>
      appointmentsApi.mine({ page, limit: PAGE_SIZE, status: search.status, sort: "recent" }),
    enabled: isHydrated && !!session && tab === "appointments",
  });

  // Appointments carry no service details — only the dashboard joins them server-side.
  const servicesQuery = useQuery({
    queryKey: ["public", "services", "all"],
    queryFn: () => servicesApi.publicList({ limit: 100 }),
    enabled: tab === "appointments",
    staleTime: 300_000,
  });

  const servicesByRef = useMemo(() => {
    const services = servicesQuery.data?.data.services ?? [];
    return new Map(services.map((service) => [service.serviceRef, service]));
  }, [servicesQuery.data]);

  function refreshAppointments() {
    void queryClient.invalidateQueries({ queryKey: ["customer", "appointments"] });
    void queryClient.invalidateQueries({ queryKey: ["customer", "dashboard"] });
  }

  const cancelOrderMutation = useMutation({
    mutationFn: ordersApi.cancel,
    onSuccess: () => {
      toast.success("Order cancelled");
      void queryClient.invalidateQueries({ queryKey: ["customer", "orders"] });
      void queryClient.invalidateQueries({ queryKey: ["customer", "dashboard"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not cancel the order"),
    onSettled: () => setCancelOrder(null),
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: appointmentsApi.cancel,
    onSuccess: () => {
      toast.success("Appointment cancelled");
      refreshAppointments();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not cancel"),
    onSettled: () => setCancelAppointment(null),
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ ref, scheduledAt }: { ref: string; scheduledAt: string }) =>
      appointmentsApi.reschedule(ref, scheduledAt),
    onSuccess: () => {
      toast.success("Appointment rescheduled", { description: "It is pending approval again." });
      refreshAppointments();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not reschedule"),
    onSettled: () => setRescheduling(null),
  });

  if (!isHydrated) {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-6 h-[28rem] rounded-[1.25rem]" />
      </main>
    );
  }

  if (!session) {
    return (
      <CenteredState
        icon={<Lock className="h-9 w-9 text-primary" />}
        title="Login to view your activity"
        message="Your orders and appointments are available after login."
      />
    );
  }

  const activeQuery = tab === "orders" ? ordersQuery : appointmentsQuery;
  const orders = ordersQuery.data?.data.orders ?? [];
  const appointments = appointmentsQuery.data?.data.appointments ?? [];
  const pagination = activeQuery.data?.pagination;
  const statusOptions = tab === "orders" ? ORDER_STATUSES : APPOINTMENT_STATUSES;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Account</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Your activity</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every order and appointment on your account, not just the latest few.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1 text-sm">
          {(["orders", "appointments"] as const).map((value) => (
            <Link
              key={value}
              to="/history"
              search={{ tab: value === "orders" ? undefined : value }}
              className={cn(
                "rounded-full px-4 py-2 font-medium capitalize transition",
                tab === value
                  ? "bg-background shadow-[var(--shadow-soft)]"
                  : "text-muted-foreground",
              )}
            >
              {value}
            </Link>
          ))}
        </div>

        <Select
          value={search.status ?? "all"}
          onValueChange={(value) => setSearch({ status: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="w-48" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status} className="capitalize">
                {statusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        {tab === "orders" ? (
          <Panel
            title="Orders"
            icon={<Package className="h-5 w-5" />}
            subtitle={pagination ? `${pagination.total} in total` : undefined}
          >
            {ordersQuery.isLoading ? (
              <RowsSkeleton />
            ) : ordersQuery.isError ? (
              <EmptyState message="Your orders could not be loaded.">
                <Button className="mt-4" variant="hero" onClick={() => void ordersQuery.refetch()}>
                  <RefreshCw className="h-4 w-4" /> Try again
                </Button>
              </EmptyState>
            ) : orders.length ? (
              <>
                <div className="divide-y divide-border">
                  {orders.map((order) => (
                    <OrderRow
                      key={order.orderRef}
                      order={order}
                      onCancel={() => setCancelOrder(order)}
                    />
                  ))}
                </div>
                <HistoryPagination
                  page={page}
                  totalPages={pagination?.totalPages ?? 1}
                  onPage={(next) => setSearch({ page: next > 1 ? next : undefined })}
                />
              </>
            ) : (
              <EmptyState
                message={
                  search.status
                    ? "No orders with that status."
                    : "You have not placed any orders yet."
                }
              >
                <Button asChild className="mt-4" variant="hero">
                  <Link to="/shop">Browse the shop</Link>
                </Button>
              </EmptyState>
            )}
          </Panel>
        ) : (
          <Panel
            title="Appointments"
            icon={<CalendarDays className="h-5 w-5" />}
            subtitle={pagination ? `${pagination.total} in total` : undefined}
          >
            {appointmentsQuery.isLoading ? (
              <RowsSkeleton />
            ) : appointmentsQuery.isError ? (
              <EmptyState message="Your appointments could not be loaded.">
                <Button
                  className="mt-4"
                  variant="hero"
                  onClick={() => void appointmentsQuery.refetch()}
                >
                  <RefreshCw className="h-4 w-4" /> Try again
                </Button>
              </EmptyState>
            ) : appointments.length ? (
              <>
                <div className="divide-y divide-border">
                  {appointments.map((appointment) => (
                    <AppointmentRow
                      key={appointment.appointmentRef}
                      appointment={appointment}
                      service={servicesByRef.get(appointment.serviceRef)}
                      onCancel={() => setCancelAppointment(appointment)}
                      onReschedule={() => setRescheduling(appointment)}
                    />
                  ))}
                </div>
                <HistoryPagination
                  page={page}
                  totalPages={pagination?.totalPages ?? 1}
                  onPage={(next) => setSearch({ page: next > 1 ? next : undefined })}
                />
              </>
            ) : (
              <EmptyState
                message={
                  search.status
                    ? "No appointments with that status."
                    : "You have not booked any appointments yet."
                }
              >
                <Button asChild className="mt-4" variant="hero">
                  <Link to="/nutrition">Book a session</Link>
                </Button>
              </EmptyState>
            )}
          </Panel>
        )}
      </div>

      <AlertDialog open={!!cancelOrder} onOpenChange={(open) => !open && setCancelOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              Order {cancelOrder?.orderRef} will be cancelled and its items returned to stock. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep order</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelOrder && cancelOrderMutation.mutate(cancelOrder.orderRef)}
            >
              Cancel order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!cancelAppointment}
        onOpenChange={(open) => !open && setCancelAppointment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              Your {cancelAppointment ? appointmentDateLabel(cancelAppointment.scheduledAt) : ""}{" "}
              booking will be cancelled. You can always book a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                cancelAppointment &&
                cancelAppointmentMutation.mutate(cancelAppointment.appointmentRef)
              }
            >
              Cancel appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RescheduleDialog
        appointment={rescheduling}
        service={rescheduling ? servicesByRef.get(rescheduling.serviceRef) : undefined}
        onClose={() => setRescheduling(null)}
        pending={rescheduleMutation.isPending}
        onConfirm={(scheduledAt) =>
          rescheduling &&
          rescheduleMutation.mutate({ ref: rescheduling.appointmentRef, scheduledAt })
        }
      />
    </main>
  );
}
