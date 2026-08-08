import { useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Bandage,
  Calendar as CalendarIcon,
  HeartPulse,
  Loader2,
  MapPin,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import physioHero from "@/assets/home/program-mobility.webp";
import physioDetail from "@/assets/physio.jpg";
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

export const Route = createFileRoute("/physiotherapy")({
  head: () => ({
    meta: [
      { title: "Physiotherapy - Level Up Fitness" },
      {
        name: "description",
        content: "Book in-person physiotherapy, recovery, and rehabilitation sessions.",
      },
    ],
  }),
  component: PhysiotherapyPage,
});

const fallbackServices = [
  {
    icon: Activity,
    name: "Sports therapy",
    price: "KES 7,000",
    desc: "Performance recovery and mobility work.",
    features: ["Movement screen", "Recovery plan", "Hands-on support"],
  },
  {
    icon: HeartPulse,
    name: "Injury recovery",
    price: "KES 12,000",
    desc: "Structured support following an injury.",
    features: ["Assessment", "Targeted treatment", "Progress reviews"],
  },
  {
    icon: Bandage,
    name: "Rehabilitation",
    price: "KES 18,000",
    desc: "Long-term rehabilitation with measurable goals.",
    features: ["Guided return", "Strength work", "Follow-up plan"],
  },
];

const fallbackTherapists = [
  { name: "Dr. Aisha Kimani", spec: "Musculoskeletal", rating: 4.9 },
  { name: "Mark Otieno, PT", spec: "Sports and performance", rating: 4.8 },
  { name: "Lila Hassan, DPT", spec: "Post-op rehabilitation", rating: 5.0 },
];

const emptyServices: ApiWellnessService[] = [];

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

const ksh = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);

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

function PhysioSkeleton() {
  return (
    <div className="space-y-16">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-4">
          <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
          <div className="h-16 w-full max-w-2xl animate-pulse rounded-[1rem] bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-full max-w-2xl animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-full max-w-xl animate-pulse rounded-full bg-muted" />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="h-11 w-36 animate-pulse rounded-xl bg-muted" />
            <div className="h-11 w-40 animate-pulse rounded-xl bg-muted" />
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

function PhysiotherapyPage() {
  const session = useAuthSession();
  const queryClient = useQueryClient();
  const [selectedServiceRef, setSelectedServiceRef] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [slot, setSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const servicesQuery = useQuery({
    queryKey: ["public", "services", "physiotherapy"],
    queryFn: () => servicesApi.publicList({ type: "physiotherapy", limit: 50 }),
  });

  const appointmentsQuery = useQuery({
    queryKey: ["customer", "appointments", "upcoming"],
    queryFn: () => appointmentsApi.upcoming({ limit: 50 }),
    enabled: Boolean(session),
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
  const physiotherapyServiceRefs = useMemo(
    () => new Set(services.map((service) => service.serviceRef)),
    [services],
  );
  const upcomingAppointments = (appointmentsQuery.data?.data.appointments ?? []).filter(
    (appointment) => physiotherapyServiceRefs.has(appointment.serviceRef),
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
      if (!selectedService || !selectedDate || !slot) {
        throw new Error("Choose a service, date, and time first");
      }
      return appointmentsApi.book({
        serviceRef: selectedService.serviceRef,
        specialist: selectedService.specialist,
        scheduledAt: new Date(`${selectedDate}T${slot}:00`).toISOString(),
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Appointment booked", {
        description: "Your physiotherapy appointment is pending approval.",
      });
      setNotes("");
      setSlot(null);
      void queryClient.invalidateQueries({ queryKey: ["customer", "appointments", "upcoming"] });
      void queryClient.invalidateQueries({ queryKey: ["customer", "dashboard"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Appointment booking failed"),
  });

  const cancelMutation = useMutation({
    mutationFn: (appointmentRef: string) => appointmentsApi.cancel(appointmentRef),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      void queryClient.invalidateQueries({ queryKey: ["customer", "appointments", "upcoming"] });
      void queryClient.invalidateQueries({ queryKey: ["customer", "dashboard"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Appointment cancellation failed"),
  });

  function confirmBooking() {
    if (!session) {
      window.location.assign(loginUrlFor({ redirect: "/physiotherapy" }));
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
          <PhysioSkeleton />
        ) : servicesQuery.isError ? (
          <section className="card-elevated rounded-[1.25rem] p-8 sm:p-10">
            <p className="text-sm font-semibold text-primary">Physiotherapy</p>
            <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">
              Physiotherapy services are unavailable
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              We could not load the current physiotherapy services. Try again or come back when the
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
                <p className="text-sm font-semibold text-primary">Recovery and rehab</p>
                <h1 className="max-w-2xl font-display text-5xl font-bold leading-[0.92] tracking-[-0.035em] text-balance sm:text-6xl">
                  Recovery sessions that help you move with more confidence.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                  Work with a physiotherapy team in Nairobi on mobility, injury recovery, and
                  rehabilitation. Keep the clinic, the specialist, and the next booking step in
                  view.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="hero" size="lg" onClick={() => scrollToBooking()}>
                    Book session
                  </Button>
                  <Button
                    variant="soft"
                    size="lg"
                    onClick={() =>
                      document.getElementById("therapists")?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Meet the therapists
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Services", value: services.length || fallbackServices.length },
                    { label: "Appointments", value: availableSlots.length },
                    { label: "Focus", value: "Mobility" },
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
                  src={physioHero}
                  alt="A guided mobility session in a bright studio"
                  className="h-full min-h-[24rem] w-full object-cover"
                  loading="lazy"
                  width={1536}
                  height={1024}
                />
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-12">
              <div className="xl:col-span-7 rounded-[1.25rem] bg-[#14231d] p-8 text-[#f6f8f5] shadow-[var(--shadow-elegant)]">
                <p className="text-sm font-semibold text-[#f6f8f5]/75">Physiotherapy services</p>
                <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                  Recovery paths without the generic clinic layout.
                </h2>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {(services.length ? services : fallbackServices).map((service, index) => {
                    const item = service as ApiWellnessService | (typeof fallbackServices)[number];
                    const Icon =
                      "icon" in item ? item.icon : [Activity, HeartPulse, Bandage][index % 3];
                    const price = typeof item.price === "number" ? ksh(item.price) : item.price;
                    return (
                      <button
                        key={"serviceRef" in item ? item.serviceRef : item.name}
                        type="button"
                        onClick={() => "serviceRef" in item && scrollToBooking(item.serviceRef)}
                        className="flex h-full flex-col rounded-[1rem] bg-[#263930] p-4 text-left transition hover:-translate-y-0.5"
                      >
                        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#6d3bef] text-white">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="mt-4 font-display text-xl font-bold">{item.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-[#f6f8f5]/80">
                          {"description" in item ? item.description : item.desc}
                        </p>
                        <p className="mt-4 font-display text-2xl font-bold text-[#f6f8f5]">
                          {price}
                        </p>
                        <div className="mt-auto pt-4 text-sm text-[#f6f8f5]/70">
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
                  Schedule appointment
                </h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Choose a therapy service, then select an available day and time.
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
                              {service.specialist} · {ksh(service.price)}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-[0.9rem] border border-border p-4 text-sm text-muted-foreground sm:col-span-2">
                          No bookable physiotherapy services are available yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Day
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedService && availableDates.length > 0 ? (
                        availableDates.map((date) => {
                          const value = dateValue(date);
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setSelectedDate(value)}
                              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                                selectedDate === value
                                  ? "bg-[#6d3bef] text-white"
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
                                ? "bg-[#6d3bef] text-white"
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
                      htmlFor="physiotherapy-notes"
                      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Notes
                    </label>
                    <Textarea
                      id="physiotherapy-notes"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Describe your injury, symptoms, recovery goal, or anything the therapist should know."
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
                    Login to view physiotherapy appointments you have booked.
                  </div>
                ) : appointmentsQuery.isLoading ? (
                  <div className="mt-6 grid place-items-center rounded-[1rem] bg-muted py-10 text-muted-foreground">
                    <Loader2 className="mb-3 h-7 w-7 animate-spin" />
                    <p className="text-sm font-medium">Loading your appointments...</p>
                  </div>
                ) : upcomingAppointments.length > 0 ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {upcomingAppointments.map((appointment) => {
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
                                {service?.name || "Physiotherapy appointment"}
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
                          {service?.location && (
                            <p className="mt-1 text-sm text-muted-foreground">{service.location}</p>
                          )}
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
                    You do not have upcoming physiotherapy appointments yet.
                  </div>
                )}
              </div>

              <div
                id="therapists"
                className="rounded-[1.25rem] bg-[#14231d] p-8 text-[#f6f8f5] shadow-[var(--shadow-elegant)]"
              >
                <p className="text-sm font-semibold text-[#f6f8f5]/75">Our therapists</p>
                <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                  Practical recovery support, not a sterile clinic wall.
                </h2>
                <div className="mt-6 grid gap-4">
                  {services.length > 0
                    ? services.map((service) => (
                        <article
                          key={service.serviceRef}
                          className="rounded-[1rem] bg-[#263930] p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-display text-xl font-bold">
                                {service.specialist}
                              </h3>
                              <p className="text-sm text-[#f6f8f5]/75">{service.name}</p>
                            </div>
                            <span className="inline-flex items-center gap-1 text-sm text-[#f6f8f5]/80">
                              <Star className="h-3.5 w-3.5 fill-[#6d3bef] text-[#6d3bef]" />
                              Available
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-[#f6f8f5]/80">
                            {service.description}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#f6f8f5]/70">
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
                    : fallbackTherapists.map((therapist) => (
                        <article key={therapist.name} className="rounded-[1rem] bg-[#263930] p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-display text-xl font-bold">{therapist.name}</h3>
                              <p className="text-sm text-[#f6f8f5]/75">{therapist.spec}</p>
                            </div>
                            <span className="inline-flex items-center gap-1 text-sm text-[#f6f8f5]/80">
                              <Star className="h-3.5 w-3.5 fill-[#6d3bef] text-[#6d3bef]" />
                              {therapist.rating}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-[#f6f8f5]/80">
                            Recovery sessions tailored to your injury, mobility, or
                            return-to-training goal.
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
                  src={physioDetail}
                  alt="A physiotherapy session focused on guided recovery"
                  className="h-full min-h-[18rem] w-full object-cover"
                  loading="lazy"
                  width={1536}
                  height={1024}
                />
              </div>
              <div className="rounded-[1.25rem] border border-border bg-white p-8 shadow-[var(--shadow-soft)]">
                <p className="text-sm font-semibold text-primary">Clinic</p>
                <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                  A clear place to recover and get moving again.
                </h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  {selectedService?.location || "Level Up Recovery Clinic"}.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1rem] bg-muted p-4">
                    <p className="text-xs font-medium text-muted-foreground">Specialist</p>
                    <p className="mt-2 font-display text-xl font-bold">
                      {selectedService?.specialist || "Physiotherapy specialist"}
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
