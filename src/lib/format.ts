import type { ApiAppointment, ApiOrder, ApiWellnessService } from "@/lib/api";

/** Kenyan shillings, whole units. Previously copy-pasted into seven route files. */
export const ksh = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value || 0);

export const formatDate = (value: string, withTime = false) =>
  new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
  }).format(new Date(value));

/** "Mon, Jun 3, 09:00 AM" — the booking pages' appointment format. */
export const appointmentDateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-KE", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export function appointmentStatusClass(status: ApiAppointment["status"]) {
  if (status === "approved" || status === "attended") return "bg-primary/15 text-primary";
  if (status === "cancelled" || status === "rejected" || status === "no_show")
    return "bg-muted text-muted-foreground";
  return "bg-amber-100 text-amber-700";
}

export function orderStatusClass(status: ApiOrder["status"]) {
  if (status === "paid" || status === "delivered") return "bg-success/15 text-success";
  if (status === "shipped") return "bg-primary/15 text-primary";
  if (status === "cancelled" || status === "refunded") return "bg-muted text-muted-foreground";
  return "bg-amber-100 text-amber-800";
}

const DEFAULT_TIME_SLOTS = ["09:00", "11:00", "15:00"];

/**
 * The next `count` dates matching a service's `availableDays`, looking up to 21 days ahead.
 * Shared by the booking pages and the reschedule picker.
 */
export function nextAvailableDays(availableDays: string[] | undefined, count = 6) {
  const days = (availableDays ?? []).map((day) => day.toLowerCase());
  const dates: string[] = [];

  for (let offset = 0; offset < 21 && dates.length < count; offset += 1) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    if (!days.length || days.includes(weekday)) {
      dates.push(date.toISOString().slice(0, 10));
    }
  }

  return dates;
}

export function serviceTimeSlots(service?: Pick<ApiWellnessService, "availableTimeSlots">) {
  return service?.availableTimeSlots?.length ? service.availableTimeSlots : DEFAULT_TIME_SLOTS;
}

/** Local date + slot → an ISO instant, matching how the booking pages build `scheduledAt`. */
export function toScheduledAt(date: string, slot: string) {
  return new Date(`${date}T${slot}:00`).toISOString();
}
