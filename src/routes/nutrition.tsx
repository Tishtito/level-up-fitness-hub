import { useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Apple,
  Calendar as CalendarIcon,
  Loader2,
  MapPin,
  Salad,
  Star,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";

import nutritionCare from "@/assets/home/nutrition-care.webp";
import nutritionDetail from "@/assets/nutrition.jpg";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  appointmentsApi,
  servicesApi,
  type ApiAppointment,
  type ApiWellnessService,
} from "@/lib/api";
import { useAuthSession } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";

export const Route = createFileRoute("/nutrition")({
  head: () => ({
    meta: [
      { title: "Nutritionist Services - Level Up Fitness" },
      {
        name: "description",
        content: "Book in-person nutritionist consultations, meal planning and diet packages.",
      },
    ],
  }),
  component: NutritionPage,
});

const fallbackServices = [
  {
    icon: Apple,
    name: "Single consultation",
    price: "KES 2,500",
    desc: "60-minute one-on-one nutrition assessment.",
    features: ["Full diet review", "Custom recommendations", "Email follow-up"],
  },
  {
    icon: Salad,
    name: "Meal planning",
    price: "KES 5,000",
    desc: "Personalized meal planning support.",
    features: ["Weekly meal plans", "Shopping lists", "Recipe guidance"],
  },
  {
    icon: Utensils,
    name: "Premium coaching",
    price: "KES 12,000",
    desc: "Ongoing nutrition coaching.",
    features: ["Multiple sessions", "Progress reviews", "Accountability support"],
  },
];

const fallbackNutritionists = [
  { name: "Dr. Naomi Wairimu", spec: "Sports nutrition", rating: 4.9 },
  { name: "Sarah Patel, RD", spec: "Weight management", rating: 4.8 },
  { name: "James Otieno, MSc", spec: "Clinical and performance", rating: 4.9 },
];

const emptyServices: ApiWellnessService[] = [];

const KSh = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);

const weekdayLabels = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const shortWeekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function nextAvailableDays(availableDays: string[]) {
  const allowed = new Set(availableDays.map((day) => day.toLowerCase()));
  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < 21 && dates.length < 6; offset += 1) {
    const candidate = new Date(cursor);
    candidate.setDate(cursor.getDate() + offset);
    if (allowed.size === 0 || allowed.has(weekdayLabels[candidate.getDay()].toLowerCase())) {
      dates.push(candidate);
    }
  }

  return dates;
}

function dateValue(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function dateLabel(date: Date) {
  return `${shortWeekdayLabels[date.getDay()]} ${date.getDate()}`;
}

function appointmentDateLabel(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function appointmentStatusClass(status: ApiAppointment["status"]) {
  if (status === "approved" || status === "attended") return "bg-primary/15 text-primary";
  if (status === "cancelled" || status === "rejected" || status === "no_show")
    return "bg-muted text-muted-foreground";
  return "bg-amber-100 text-amber-700";
}

function NutritionSkeleton() {
  return (
    <div className="space-y-16">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-4">
          <div className="h-4 w-28 animate-pulse rounded-full bg-muted" />
          <div className="h-16 w-full max-w-2xl animate-pulse rounded-[1rem] bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-full max-w-2xl animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-full max-w-xl animate-pulse rounded-full bg-muted" />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="h-11 w-40 animate-pulse rounded-xl bg-muted" />
            <div className="h-11 w-36 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
        <div className="overflow-hidden rounded-[1.25rem] border border-border bg-muted">
          <div className="aspect-[4/3] animate-pulse bg-muted" />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7 overflow-hidden rounded-[1rem] border border-border bg-muted">
          <div className="aspect-[16/10] animate-pulse bg-muted" />
        </div>
        <div className="xl:col-span-5 grid gap-4">
          <div className="h-40 animate-pulse rounded-[1rem] bg-muted" />
          <div className="h-40 animate-pulse rounded-[1rem] bg-muted" />
          <div className="h-40 animate-pulse rounded-[1rem] bg-muted" />
        </div>
      </section>
    </div>
  );
}

function NutritionPage() {
  const session = useAuthSession();
  const queryClient = useQueryClient();
  const [selectedServiceRef, setSelectedServiceRef] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [slot, setSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const servicesQuery = useQuery({
    queryKey: ["public", "services", "nutritionist"],
    queryFn: () => servicesApi.publicList({ type: "nutritionist", limit: 50 }),
  });

  const appointmentsQuery = useQuery({
    queryKey: ["customer", "appointments", "upcoming"],
    queryFn: () => appointmentsApi.upcoming({ limit: 50 }),
    enabled: !!session,
  });

  const services = servicesQuery.data?.data.services ?? emptyServices;
  const selectedService =
    services.find((service) => service.serviceRef === selectedServiceRef) ?? services[0];
  const availableDates = useMemo(
    () => nextAvailableDays(selectedService?.availableDays ?? []),
    [selectedService?.availableDays],
  );
  const availableSlots = selectedService?.availableTimeSlots?.length
    ? selectedService.availableTimeSlots
    : ["09:00", "11:00", "15:00"];
  const nutritionServiceRefs = useMemo(
    () => new Set(services.map((service) => service.serviceRef)),
    [services],
  );
  const upcomingNutritionAppointments = (appointmentsQuery.data?.data.appointments ?? []).filter(
    (appointment) => nutritionServiceRefs.has(appointment.serviceRef),
  );

  useEffect(() => {
    if (!selectedServiceRef && services[0]) setSelectedServiceRef(services[0].serviceRef);
  }, [selectedServiceRef, services]);

  useEffect(() => {
    setSelectedDate(availableDates[0] ? dateValue(availableDates[0]) : "");
    setSlot(null);
  }, [availableDates, selectedServiceRef]);

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedService || !selectedDate || !slot)
        throw new Error("Choose a service, date, and time first");
      const scheduledAt = new Date(`${selectedDate}T${slot}:00`).toISOString();
      return appointmentsApi.book({
        serviceRef: selectedService.serviceRef,
        scheduledAt,
        specialist: selectedService.specialist,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Appointment booked", {
        description: "Your nutrition appointment is pending approval.",
      });
      setNotes("");
      setSlot(null);
      void queryClient.invalidateQueries({ queryKey: ["customer", "appointments", "upcoming"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Appointment booking failed"),
  });

  const cancelMutation = useMutation({
    mutationFn: (appointmentRef: string) => appointmentsApi.cancel(appointmentRef),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      void queryClient.invalidateQueries({ queryKey: ["customer", "appointments", "upcoming"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Appointment cancellation failed"),
  });

  function confirmBooking() {
    if (!session) {
      window.location.assign(loginUrlFor({ redirect: "/nutrition" }));
      return;
    }
    bookMutation.mutate();
  }

  function scrollToBooking(serviceRef?: string) {
    if (serviceRef) setSelectedServiceRef(serviceRef);
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
      <div className="space-y-16">
        {servicesQuery.isLoading ? (
          <NutritionSkeleton />
        ) : servicesQuery.isError ? (
          <section className="card-elevated rounded-[1.25rem] p-8 sm:p-10">
            <p className="text-sm font-semibold text-primary">Nutrition</p>
            <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">
              Nutrition services are unavailable
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              We could not load the current nutrition services. Try again or come back when the
              connection is stable.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => void servicesQuery.refetch()} variant="hero">
                Retry
              </Button>
              <Button asChild variant="soft">
                <a href="#booking">Jump to booking</a>
              </Button>
            </div>
          </section>
        ) : (
          <>
            <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="space-y-6">
                <p className="text-sm font-semibold text-primary">In-person service</p>
                <h1 className="max-w-2xl font-display text-5xl font-bold leading-[0.92] tracking-[-0.035em] text-balance sm:text-6xl">
                  Nutrition sessions that fit the way you train, work, and recover.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                  Meet a certified nutritionist in Nairobi, get a tailored meal plan, and keep the
                  next step visible with direct booking, clear pricing, and practical support.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="hero" size="lg" onClick={() => scrollToBooking()}>
                    Book appointment
                  </Button>
                  <Button
                    variant="soft"
                    size="lg"
                    onClick={() =>
                      document.getElementById("team")?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Meet the nutritionists
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Services", value: services.length || fallbackServices.length },
                    { label: "Appointment slots", value: availableSlots.length },
                    { label: "Support focus", value: "Meal plans" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[1rem] bg-white p-4 shadow-[var(--shadow-soft)]"
                    >
                      <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                      <p className="mt-2 font-display text-2xl font-bold">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="overflow-hidden rounded-[1.25rem] border border-border bg-white shadow-[var(--shadow-elegant)]">
                <img
                  src={nutritionCare}
                  alt="A nutrition professional reviews a balanced meal plan with a client"
                  className="h-full min-h-[24rem] w-full object-cover"
                  loading="lazy"
                  width={1536}
                  height={1024}
                />
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-12">
              <div className="xl:col-span-7 rounded-[1.25rem] bg-[#111827] p-8 text-[#f8fafc] shadow-[var(--shadow-elegant)]">
                <p className="text-sm font-semibold text-[#f8fafc]/75">Nutrition services</p>
                <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                  Direct, specific, and easy to compare.
                </h2>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {(services.length ? services : fallbackServices).map((service, index) => {
                    const item = service as ApiWellnessService | (typeof fallbackServices)[number];
                    const Icon = "icon" in item ? item.icon : [Apple, Salad, Utensils][index % 3];
                    return (
                      <button
                        key={"serviceRef" in item ? item.serviceRef : item.name}
                        type="button"
                        onClick={() => "serviceRef" in item && scrollToBooking(item.serviceRef)}
                        className="flex h-full flex-col rounded-[1rem] bg-[#1f2937] p-4 text-left transition hover:-translate-y-0.5"
                      >
                        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#5b2c83] text-white">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="mt-4 font-display text-xl font-bold">
                          {"name" in item ? item.name : ""}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[#f8fafc]/80">
                          {"description" in item ? item.description : item.desc}
                        </p>
                        <p className="mt-4 font-display text-2xl font-bold text-[#f8fafc]">
                          {"price" in item && typeof item.price === "number"
                            ? KSh(item.price)
                            : item.price}
                        </p>
                        <div className="mt-auto pt-4 text-sm text-[#f8fafc]/70">
                          {"serviceRef" in item
                            ? "Tap to use this service in the booking form."
                            : "Tap to jump to booking."}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                id="booking"
                className="xl:col-span-5 scroll-mt-24 rounded-[1.25rem] border border-border bg-white p-8 shadow-[var(--shadow-soft)]"
              >
                <h2 className="inline-flex items-center gap-2 font-display text-2xl font-bold">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                  Book your session
                </h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Choose a service, then pick an available day and time. The flow keeps the next
                  step short and explicit.
                </p>

                <div className="mt-6 space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Service
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {services.length > 0 ? (
                        services.map((service) => (
                          <button
                            key={service.serviceRef}
                            type="button"
                            onClick={() => setSelectedServiceRef(service.serviceRef)}
                            className={`rounded-[0.9rem] border p-4 text-left text-sm transition ${
                              selectedService?.serviceRef === service.serviceRef
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted"
                            }`}
                          >
                            <span className="font-semibold">{service.name}</span>
                            <span className="mt-1 block text-muted-foreground">
                              {service.specialist} · {KSh(service.price)}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-[0.9rem] border border-border p-4 text-sm text-muted-foreground sm:col-span-2">
                          No backend nutrition services are available yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Day
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {availableDates.length > 0 ? (
                        availableDates.map((date) => {
                          const value = dateValue(date);
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setSelectedDate(value)}
                              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                                selectedDate === value
                                  ? "bg-[#5b2c83] text-white"
                                  : "bg-muted hover:bg-surface"
                              }`}
                            >
                              {dateLabel(date)}
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No available days configured.
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Time
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {selectedService ? (
                        availableSlots.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSlot(time)}
                            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                              slot === time
                                ? "bg-[#5b2c83] text-white"
                                : "bg-muted hover:bg-surface"
                            }`}
                          >
                            {time}
                          </button>
                        ))
                      ) : (
                        <p className="col-span-full text-sm text-muted-foreground">
                          Select a service first.
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="nutrition-notes"
                      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Notes
                    </label>
                    <Textarea
                      id="nutrition-notes"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Share your goal, dietary restrictions, or anything the nutritionist should know."
                      className="mt-2 min-h-28 rounded-[0.9rem] border-border bg-background px-4 py-3 text-sm"
                    />
                  </div>

                  <Button
                    onClick={confirmBooking}
                    disabled={!selectedService || !selectedDate || !slot || bookMutation.isPending}
                    variant="hero"
                    size="lg"
                    className="w-full"
                  >
                    {bookMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {session ? "Confirm booking" : "Login to book"}
                  </Button>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[1.25rem] border border-border bg-white p-8 shadow-[var(--shadow-soft)]">
                <p className="text-sm font-semibold text-primary">Upcoming appointments</p>
                <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                  What you have already booked
                </h2>
                {!session ? (
                  <div className="mt-6 rounded-[1rem] bg-muted p-5 text-sm text-muted-foreground">
                    Login to view nutrition appointments you have booked.
                  </div>
                ) : appointmentsQuery.isLoading ? (
                  <div className="mt-6 grid place-items-center rounded-[1rem] bg-muted py-10 text-muted-foreground">
                    <Loader2 className="mb-3 h-7 w-7 animate-spin" />
                    <p className="text-sm font-medium">Loading your appointments...</p>
                  </div>
                ) : upcomingNutritionAppointments.length > 0 ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {upcomingNutritionAppointments.map((appointment) => {
                      const service = services.find(
                        (item) => item.serviceRef === appointment.serviceRef,
                      );
                      const cancellable =
                        appointment.status === "pending" || appointment.status === "approved";
                      return (
                        <article
                          key={appointment.appointmentRef}
                          className="rounded-[1rem] bg-muted p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-display text-lg font-bold">
                                {service?.name || "Nutrition appointment"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {appointmentDateLabel(appointment.scheduledAt)}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${appointmentStatusClass(appointment.status)}`}
                            >
                              {appointment.status.replace("_", " ")}
                            </span>
                          </div>
                          <p className="mt-3 text-sm">with {appointment.specialist}</p>
                          {appointment.notes && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {appointment.notes}
                            </p>
                          )}
                          {cancellable && (
                            <Button
                              variant="soft"
                              size="sm"
                              className="mt-4"
                              disabled={cancelMutation.isPending}
                              onClick={() => cancelMutation.mutate(appointment.appointmentRef)}
                            >
                              Cancel appointment
                            </Button>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-6 rounded-[1rem] bg-muted p-5 text-sm text-muted-foreground">
                    You do not have upcoming nutrition appointments yet.
                  </div>
                )}
              </div>

              <div
                id="team"
                className="rounded-[1.25rem] bg-[#111827] p-8 text-[#f8fafc] shadow-[var(--shadow-elegant)]"
              >
                <p className="text-sm font-semibold text-[#f8fafc]/75">Meet the nutritionists</p>
                <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                  Practical support for meals, habits, and progress.
                </h2>
                <div className="mt-6 grid gap-4">
                  {services.length > 0
                    ? services.map((service) => (
                        <article
                          key={service.serviceRef}
                          className="rounded-[1rem] bg-[#1f2937] p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-display text-xl font-bold">
                                {service.specialist}
                              </h3>
                              <p className="text-sm text-[#f8fafc]/75">{service.name}</p>
                            </div>
                            <span className="inline-flex items-center gap-1 text-sm text-[#f8fafc]/80">
                              <span
                                className="h-2 w-2 rounded-full bg-[#7ed957]"
                                aria-hidden="true"
                              />
                              Available
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-[#f8fafc]/80">
                            {service.description}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#f8fafc]/70">
                            <span className="rounded-full bg-white/10 px-2.5 py-1">
                              {service.duration} min
                            </span>
                            <span className="rounded-full bg-white/10 px-2.5 py-1">
                              {service.location || "Nairobi clinic"}
                            </span>
                          </div>
                          <Button
                            variant="soft"
                            className="mt-4"
                            onClick={() => scrollToBooking(service.serviceRef)}
                          >
                            Book
                          </Button>
                        </article>
                      ))
                    : fallbackNutritionists.map((nutritionist) => (
                        <article
                          key={nutritionist.name}
                          className="rounded-[1rem] bg-[#1f2937] p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-display text-xl font-bold">
                                {nutritionist.name}
                              </h3>
                              <p className="text-sm text-[#f8fafc]/75">{nutritionist.spec}</p>
                            </div>
                            <span className="inline-flex items-center gap-1 text-sm text-[#f8fafc]/80">
                              <Star className="h-3.5 w-3.5 fill-[#1769aa] text-[#1769aa]" />
                              {nutritionist.rating}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-[#f8fafc]/80">
                            Nutrition guidance tailored to your training and recovery goals.
                          </p>
                          <Button variant="soft" className="mt-4" onClick={() => scrollToBooking()}>
                            Book
                          </Button>
                        </article>
                      ))}
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="overflow-hidden rounded-[1.25rem] border border-border bg-white shadow-[var(--shadow-soft)]">
                <img
                  src={nutritionDetail}
                  alt="A nutrition consultation focused on meal planning and balance"
                  className="h-full min-h-[18rem] w-full object-cover"
                  loading="lazy"
                  width={1536}
                  height={1024}
                />
              </div>
              <div className="rounded-[1.25rem] border border-border bg-white p-8 shadow-[var(--shadow-soft)]">
                <p className="text-sm font-semibold text-primary">Location</p>
                <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                  Nairobi consultations with a clear place to start.
                </h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  {selectedService?.location || "Level Up Wellness Center"}.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1rem] bg-muted p-4">
                    <p className="text-xs font-medium text-muted-foreground">Specialist</p>
                    <p className="mt-2 font-display text-xl font-bold">
                      {selectedService?.specialist || "Nutrition specialist"}
                    </p>
                  </div>
                  <div className="rounded-[1rem] bg-muted p-4">
                    <p className="text-xs font-medium text-muted-foreground">Next slot</p>
                    <p className="mt-2 font-display text-xl font-bold">
                      {availableSlots[0] || "09:00"}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  Nairobi, Kenya
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
