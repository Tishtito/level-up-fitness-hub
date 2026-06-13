import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Apple, Calendar as CalendarIcon, Loader2, MapPin, Salad, Star, Utensils } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { appointmentsApi, servicesApi, type ApiAppointment, type ApiWellnessService } from "@/lib/api";
import { useAuthSession } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";
import nutritionImg from "@/assets/nutrition.jpg";

export const Route = createFileRoute("/nutrition")({
  head: () => ({
    meta: [
      { title: "Nutritionist Services - Level Up Fitness" },
      { name: "description", content: "Book in-person nutritionist consultations, meal planning and diet packages." },
    ],
  }),
  component: NutritionPage,
});

const packageIcons = [Apple, Salad, Utensils];

const fallbackServices = [
  { icon: Apple, name: "Single Consultation", price: "KES 2,500", desc: "60-min one-on-one nutrition assessment.", features: ["Full diet review", "Custom recommendations", "Email follow-up"] },
  { icon: Salad, name: "Meal Planning", price: "KES 5,000", desc: "Personalized meal planning support.", features: ["Weekly meal plans", "Shopping lists", "Recipe guidance"] },
  { icon: Utensils, name: "Premium Coaching", price: "KES 12,000", desc: "Ongoing nutrition coaching.", features: ["Multiple sessions", "Progress reviews", "Accountability support"] },
];

const fallbackNutritionists = [
  { name: "Dr. Naomi Wairimu", spec: "Sports Nutrition", rating: 4.9 },
  { name: "Sarah Patel, RD", spec: "Weight Management", rating: 4.8 },
  { name: "James Otieno, MSc", spec: "Clinical & Performance", rating: 4.9 },
];

const KSh = (value: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);

const weekdayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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
  if (status === "cancelled" || status === "rejected" || status === "no_show") return "bg-muted text-muted-foreground";
  return "bg-amber-100 text-amber-700";
}

function NutritionPage() {
  const session = useAuthSession();
  const queryClient = useQueryClient();
  const [selectedServiceRef, setSelectedServiceRef] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
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

  const services = servicesQuery.data?.data.services ?? [];
  const selectedService = services.find((service) => service.serviceRef === selectedServiceRef) ?? services[0];
  const availableDates = useMemo(() => nextAvailableDays(selectedService?.availableDays ?? []), [selectedService?.availableDays]);
  const availableSlots = selectedService?.availableTimeSlots?.length ? selectedService.availableTimeSlots : ["09:00", "11:00", "15:00"];
  const nutritionServiceRefs = useMemo(() => new Set(services.map((service) => service.serviceRef)), [services]);
  const upcomingNutritionAppointments = (appointmentsQuery.data?.data.appointments ?? []).filter((appointment) => nutritionServiceRefs.has(appointment.serviceRef));

  useEffect(() => {
    if (!selectedServiceRef && services[0]) setSelectedServiceRef(services[0].serviceRef);
  }, [selectedServiceRef, services]);

  useEffect(() => {
    setSelectedDate(availableDates[0] ? dateValue(availableDates[0]) : "");
    setSlot(null);
  }, [availableDates, selectedServiceRef]);

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedService || !selectedDate || !slot) throw new Error("Choose a service, date, and time first");
      const scheduledAt = new Date(`${selectedDate}T${slot}:00`).toISOString();
      return appointmentsApi.book({
        serviceRef: selectedService.serviceRef,
        scheduledAt,
        specialist: selectedService.specialist,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Appointment booked", { description: "Your nutrition appointment is pending approval." });
      setNotes("");
      setSlot(null);
      void queryClient.invalidateQueries({ queryKey: ["customer", "appointments", "upcoming"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Appointment booking failed"),
  });

  const cancelMutation = useMutation({
    mutationFn: (appointmentRef: string) => appointmentsApi.cancel(appointmentRef),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      void queryClient.invalidateQueries({ queryKey: ["customer", "appointments", "upcoming"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Appointment cancellation failed"),
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
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 space-y-16">
      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">In-person service</p>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Nutrition that works for your body</h1>
          <p className="mt-4 text-muted-foreground">Sit down with a certified nutritionist, get a tailored plan and finally enjoy food that fuels your goals.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="hero" size="lg" onClick={() => scrollToBooking()}>Book Appointment</Button>
            <Button variant="soft" size="lg" onClick={() => document.getElementById("team")?.scrollIntoView({ behavior: "smooth" })}>Meet the Team</Button>
          </div>
        </div>
        <img src={nutritionImg} alt="Healthy meal" className="w-full rounded-[2rem] shadow-[var(--shadow-elegant)]" loading="lazy" width={1024} height={768} />
      </section>

      <section>
        <h2 className="font-display text-3xl font-bold">Nutrition services</h2>
        {servicesQuery.isLoading ? (
          <div className="card-elevated mt-6 grid place-items-center rounded-3xl py-12 text-muted-foreground">
            <Loader2 className="mb-3 h-7 w-7 animate-spin" />
            <p className="text-sm font-medium">Loading nutrition services...</p>
          </div>
        ) : services.length > 0 ? (
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {services.map((service, index) => {
              const Icon = packageIcons[index % packageIcons.length];
              return (
                <div key={service.serviceRef} className="card-elevated rounded-3xl p-6">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground"><Icon className="h-5 w-5" /></div>
                  <h3 className="mt-4 font-display text-xl font-bold">{service.name}</h3>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                  <p className="mt-4 font-display text-3xl font-bold gradient-text">{KSh(service.price)}</p>
                  <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                    <li>{service.duration} minutes</li>
                    <li>{service.specialist}</li>
                    <li>{service.availableDays.length ? service.availableDays.join(", ") : "Flexible days"}</li>
                  </ul>
                  <Button variant="hero" className="mt-6 w-full" onClick={() => scrollToBooking(service.serviceRef)}>Select</Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {fallbackServices.map((service) => (
              <div key={service.name} className="card-elevated rounded-3xl p-6">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground"><service.icon className="h-5 w-5" /></div>
                <h3 className="mt-4 font-display text-xl font-bold">{service.name}</h3>
                <p className="text-sm text-muted-foreground">{service.desc}</p>
                <p className="mt-4 font-display text-3xl font-bold gradient-text">{service.price}</p>
                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">{service.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
                <Button variant="hero" className="mt-6 w-full" onClick={() => scrollToBooking()}>Select</Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="booking" className="grid scroll-mt-24 gap-8 lg:grid-cols-3">
        <div className="card-elevated rounded-3xl p-6 lg:col-span-2">
          <h2 className="inline-flex items-center gap-2 font-display text-2xl font-bold"><CalendarIcon className="h-6 w-6 text-primary" /> Book your session</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose a nutrition service, then pick an available day and time.</p>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {services.length > 0 ? services.map((service) => (
                <button
                  key={service.serviceRef}
                  type="button"
                  onClick={() => setSelectedServiceRef(service.serviceRef)}
                  className={`rounded-2xl border p-4 text-left text-sm transition ${selectedService?.serviceRef === service.serviceRef ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
                >
                  <span className="font-semibold">{service.name}</span>
                  <span className="mt-1 block text-muted-foreground">{service.specialist} · {KSh(service.price)}</span>
                </button>
              )) : (
                <div className="rounded-2xl border border-border p-4 text-sm text-muted-foreground sm:col-span-2">No backend nutrition services are available yet.</div>
              )}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Day</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {availableDates.length > 0 ? availableDates.map((date) => {
                const value = dateValue(date);
                return (
                  <button key={value} type="button" onClick={() => setSelectedDate(value)} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${selectedDate === value ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]" : "bg-muted hover:bg-surface"}`}>{dateLabel(date)}</button>
                );
              }) : <p className="text-sm text-muted-foreground">No available days configured.</p>}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</p>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {availableSlots.map((time) => (
                <button key={time} type="button" onClick={() => setSlot(time)} className={`rounded-xl px-3 py-2 text-sm font-medium transition ${slot === time ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-surface"}`}>{time}</button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="nutrition-notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</label>
            <textarea
              id="nutrition-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Share your goal, dietary restrictions, or anything the nutritionist should know."
              className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
            />
          </div>

          <Button onClick={confirmBooking} disabled={!selectedService || !selectedDate || !slot || bookMutation.isPending} variant="hero" size="lg" className="mt-6 w-full sm:w-auto">
            {bookMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {session ? "Confirm Booking" : "Login to Book"}
          </Button>
        </div>

        <div className="card-elevated rounded-3xl p-6">
          <h3 className="inline-flex items-center gap-2 font-display text-xl font-bold"><MapPin className="h-5 w-5 text-primary" /> Location</h3>
          <p className="mt-1 text-sm text-muted-foreground">{selectedService?.location || "Level Up Wellness Center"}</p>
          <p className="text-sm">{selectedService?.specialist || "Nutrition specialist"}</p>
          <div className="mt-4 grid aspect-square place-items-center rounded-2xl bg-[image:var(--gradient-hero)] text-primary-foreground">
            <MapPin className="h-10 w-10" />
          </div>
        </div>
      </section>

      <section className="scroll-mt-24">
        <h2 className="font-display text-3xl font-bold">Your upcoming nutrition appointments</h2>
        {!session ? (
          <div className="card-elevated mt-6 rounded-3xl p-6 text-sm text-muted-foreground">
            Login to view nutrition appointments you have booked.
          </div>
        ) : appointmentsQuery.isLoading ? (
          <div className="card-elevated mt-6 grid place-items-center rounded-3xl py-10 text-muted-foreground">
            <Loader2 className="mb-3 h-7 w-7 animate-spin" />
            <p className="text-sm font-medium">Loading your appointments...</p>
          </div>
        ) : upcomingNutritionAppointments.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {upcomingNutritionAppointments.map((appointment) => {
              const service = services.find((item) => item.serviceRef === appointment.serviceRef);
              const cancellable = appointment.status === "pending" || appointment.status === "approved";
              return (
                <div key={appointment.appointmentRef} className="card-elevated rounded-3xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-lg font-bold">{service?.name || "Nutrition appointment"}</p>
                      <p className="text-sm text-muted-foreground">{appointmentDateLabel(appointment.scheduledAt)}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${appointmentStatusClass(appointment.status)}`}>{appointment.status.replace("_", " ")}</span>
                  </div>
                  <p className="mt-3 text-sm">with {appointment.specialist}</p>
                  {appointment.notes && <p className="mt-2 text-sm text-muted-foreground">{appointment.notes}</p>}
                  {cancellable && (
                    <Button variant="soft" size="sm" className="mt-4" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(appointment.appointmentRef)}>
                      Cancel appointment
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card-elevated mt-6 rounded-3xl p-6 text-sm text-muted-foreground">
            You do not have upcoming nutrition appointments yet.
          </div>
        )}
      </section>

      <section id="team" className="scroll-mt-24">
        <h2 className="font-display text-3xl font-bold">Meet our nutritionists</h2>
        {services.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {services.map((service) => (
              <div key={service.serviceRef} className="card-elevated rounded-3xl p-6 text-center">
                <div className="mx-auto h-20 w-20 rounded-full bg-[image:var(--gradient-primary)]" />
                <h4 className="mt-4 font-display font-bold">{service.specialist}</h4>
                <p className="text-sm text-muted-foreground">{service.name}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-sm"><Star className="h-3.5 w-3.5 fill-primary text-primary" /> Available</p>
                <Button variant="soft" className="mt-4" onClick={() => scrollToBooking(service.serviceRef)}>Book</Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {fallbackNutritionists.map((nutritionist) => (
              <div key={nutritionist.name} className="card-elevated rounded-3xl p-6 text-center">
                <div className="mx-auto h-20 w-20 rounded-full bg-[image:var(--gradient-primary)]" />
                <h4 className="mt-4 font-display font-bold">{nutritionist.name}</h4>
                <p className="text-sm text-muted-foreground">{nutritionist.spec}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-sm"><Star className="h-3.5 w-3.5 fill-primary text-primary" /> {nutritionist.rating}</p>
                <Button variant="soft" className="mt-4" onClick={() => scrollToBooking()}>Book</Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
