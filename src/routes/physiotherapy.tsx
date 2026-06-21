import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Activity, Bandage, Calendar as CalendarIcon, HeartPulse, Loader2, MapPin, Star } from "lucide-react";
import { toast } from "sonner";

import physioImg from "@/assets/physio.jpg";
import { Button } from "@/components/ui/button";
import { appointmentsApi, servicesApi, type ApiAppointment, type ApiWellnessService } from "@/lib/api";
import { useAuthSession } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";

export const Route = createFileRoute("/physiotherapy")({
  head: () => ({
    meta: [
      { title: "Physiotherapy - Level Up Fitness" },
      { name: "description", content: "Book in-person physiotherapy, recovery, and rehabilitation sessions." },
    ],
  }),
  component: PhysiotherapyPage,
});

const serviceIcons = [Activity, HeartPulse, Bandage];

const fallbackServices = [
  { icon: Activity, name: "Sports Therapy", price: "KES 7,000", desc: "Performance recovery and mobility work." },
  { icon: HeartPulse, name: "Injury Recovery", price: "KES 12,000", desc: "Structured support following an injury." },
  { icon: Bandage, name: "Rehabilitation", price: "KES 18,000", desc: "Long-term rehabilitation with measurable goals." },
];

const fallbackTherapists = [
  { name: "Dr. Aisha Kimani", spec: "Musculoskeletal", rating: 4.9 },
  { name: "Mark Otieno, PT", spec: "Sports & Performance", rating: 4.8 },
  { name: "Lila Hassan, DPT", spec: "Post-op Rehabilitation", rating: 5.0 },
];

const weekdayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const shortWeekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ksh = (value: number) => new Intl.NumberFormat("en-KE", {
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
  if (status === "cancelled" || status === "rejected" || status === "no_show") return "bg-muted text-muted-foreground";
  return "bg-amber-100 text-amber-700";
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

  const services = servicesQuery.data?.data.services ?? [];
  const selectedService = services.find((service) => service.serviceRef === selectedServiceRef) ?? services[0];
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
  const upcomingAppointments = (appointmentsQuery.data?.data.appointments ?? [])
    .filter((appointment) => physiotherapyServiceRefs.has(appointment.serviceRef));

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
    onError: (error) => toast.error(error instanceof Error ? error.message : "Appointment booking failed"),
  });

  const cancelMutation = useMutation({
    mutationFn: (appointmentRef: string) => appointmentsApi.cancel(appointmentRef),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      void queryClient.invalidateQueries({ queryKey: ["customer", "appointments", "upcoming"] });
      void queryClient.invalidateQueries({ queryKey: ["customer", "dashboard"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Appointment cancellation failed"),
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
    <main className="mx-auto max-w-7xl space-y-16 px-4 pb-16 pt-10 sm:px-6">
      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Recovery & rehab</p>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Move better. Recover faster.</h1>
          <p className="mt-4 text-muted-foreground">Hands-on physiotherapy with certified therapists at our Nairobi clinic, built around you.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="hero" size="lg" onClick={() => scrollToBooking()}>Book session</Button>
            <Button variant="soft" size="lg" onClick={() => document.getElementById("therapists")?.scrollIntoView({ behavior: "smooth" })}>View therapists</Button>
          </div>
        </div>
        <img src={physioImg} alt="Physiotherapy session" className="w-full rounded-3xl shadow-[var(--shadow-elegant)]" loading="lazy" width={1024} height={768} />
      </section>

      <section>
        <h2 className="font-display text-3xl font-bold">Physiotherapy services</h2>
        {servicesQuery.isLoading ? (
          <LoadingState message="Loading physiotherapy services..." />
        ) : servicesQuery.isError ? (
          <div className="card-elevated mt-6 rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">{servicesQuery.error instanceof Error ? servicesQuery.error.message : "Services could not be loaded."}</p>
            <Button className="mt-4" variant="soft" onClick={() => void servicesQuery.refetch()}>Try again</Button>
          </div>
        ) : services.length ? (
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {services.map((service, index) => {
              const Icon = serviceIcons[index % serviceIcons.length];
              return (
                <div key={service.serviceRef} className="card-elevated rounded-2xl p-6">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground"><Icon className="h-5 w-5" /></div>
                  <h3 className="mt-4 font-display text-xl font-bold">{service.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                  <p className="mt-4 font-display text-2xl font-bold text-primary">{ksh(service.price)}</p>
                  <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                    <li>{service.duration} minutes</li>
                    <li>{service.specialist}</li>
                    <li>{service.availableDays.length ? service.availableDays.join(", ") : "Flexible days"}</li>
                  </ul>
                  <Button variant="hero" className="mt-5 w-full" onClick={() => scrollToBooking(service.serviceRef)}>Select</Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {fallbackServices.map((service) => (
              <div key={service.name} className="card-elevated rounded-2xl p-6">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground"><service.icon className="h-5 w-5" /></div>
                <h3 className="mt-4 font-display text-xl font-bold">{service.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{service.desc}</p>
                <p className="mt-4 font-display text-2xl font-bold text-primary">{service.price}</p>
                <Button variant="soft" className="mt-5 w-full" onClick={() => scrollToBooking()}>View availability</Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="booking" className="grid scroll-mt-24 gap-8 lg:grid-cols-3">
        <div className="card-elevated rounded-2xl p-6 lg:col-span-2">
          <h2 className="inline-flex items-center gap-2 font-display text-2xl font-bold"><CalendarIcon className="h-6 w-6 text-primary" /> Schedule appointment</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose a physiotherapy service, then select an available day and time.</p>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {services.length ? services.map((service) => (
                <button
                  key={service.serviceRef}
                  type="button"
                  onClick={() => setSelectedServiceRef(service.serviceRef)}
                  className={`rounded-xl border p-4 text-left text-sm transition ${selectedService?.serviceRef === service.serviceRef ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
                >
                  <span className="font-semibold">{service.name}</span>
                  <span className="mt-1 block text-muted-foreground">{service.specialist} · {ksh(service.price)}</span>
                </button>
              )) : (
                <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground sm:col-span-2">No bookable physiotherapy services are available yet.</div>
              )}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Day</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedService && availableDates.length ? availableDates.map((date) => {
                const value = dateValue(date);
                return (
                  <button key={value} type="button" onClick={() => setSelectedDate(value)} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${selectedDate === value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-surface"}`}>{dateLabel(date)}</button>
                );
              }) : <p className="text-sm text-muted-foreground">No available days configured.</p>}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</p>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {selectedService ? availableSlots.map((time) => (
                <button key={time} type="button" onClick={() => setSlot(time)} className={`rounded-xl px-3 py-2 text-sm font-medium transition ${slot === time ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-surface"}`}>{time}</button>
              )) : <p className="col-span-full text-sm text-muted-foreground">Select a service first.</p>}
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="physiotherapy-notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</label>
            <textarea
              id="physiotherapy-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Describe your injury, symptoms, recovery goal, or anything the therapist should know."
              className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
            />
          </div>

          <Button onClick={confirmBooking} disabled={!selectedService || !selectedDate || !slot || bookMutation.isPending} variant="hero" size="lg" className="mt-6 w-full sm:w-auto">
            {bookMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {session ? "Confirm booking" : "Login to book"}
          </Button>
        </div>

        <div className="card-elevated rounded-2xl p-6">
          <h3 className="inline-flex items-center gap-2 font-display text-xl font-bold"><MapPin className="h-5 w-5 text-primary" /> Clinic</h3>
          <p className="mt-1 text-sm text-muted-foreground">{selectedService?.location || "Level Up Recovery Clinic"}</p>
          <p className="text-sm">{selectedService?.specialist || "Physiotherapy specialist"}</p>
          <div className="mt-4 grid aspect-square place-items-center rounded-xl bg-[image:var(--gradient-hero)] text-primary-foreground"><MapPin className="h-10 w-10" /></div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl font-bold">Your upcoming physiotherapy appointments</h2>
        {!session ? (
          <div className="card-elevated mt-6 rounded-2xl p-6 text-sm text-muted-foreground">Login to view physiotherapy appointments you have booked.</div>
        ) : appointmentsQuery.isLoading ? (
          <LoadingState message="Loading your appointments..." />
        ) : appointmentsQuery.isError ? (
          <div className="card-elevated mt-6 rounded-2xl p-6 text-sm text-muted-foreground">Your appointments could not be loaded.</div>
        ) : upcomingAppointments.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {upcomingAppointments.map((appointment) => {
              const service = services.find((item) => item.serviceRef === appointment.serviceRef);
              const cancellable = appointment.status === "pending" || appointment.status === "approved";
              return (
                <div key={appointment.appointmentRef} className="card-elevated rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-lg font-bold">{service?.name || "Physiotherapy appointment"}</p>
                      <p className="text-sm text-muted-foreground">{appointmentDateLabel(appointment.scheduledAt)}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${appointmentStatusClass(appointment.status)}`}>{appointment.status.replace("_", " ")}</span>
                  </div>
                  <p className="mt-3 text-sm">with {appointment.specialist}</p>
                  {service?.location && <p className="mt-1 text-sm text-muted-foreground">{service.location}</p>}
                  {appointment.notes && <p className="mt-2 text-sm text-muted-foreground">{appointment.notes}</p>}
                  {cancellable && (
                    <Button variant="soft" size="sm" className="mt-4" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(appointment.appointmentRef)}>Cancel appointment</Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card-elevated mt-6 rounded-2xl p-6 text-sm text-muted-foreground">You do not have upcoming physiotherapy appointments yet.</div>
        )}
      </section>

      <section id="therapists" className="scroll-mt-24">
        <h2 className="font-display text-3xl font-bold">Our therapists</h2>
        {services.length ? (
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {services.map((service) => (
              <TherapistCard key={service.serviceRef} name={service.specialist} specialty={service.name} onBook={() => scrollToBooking(service.serviceRef)} />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {fallbackTherapists.map((therapist) => (
              <TherapistCard key={therapist.name} name={therapist.name} specialty={therapist.spec} rating={therapist.rating} onBook={() => scrollToBooking()} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function TherapistCard({ name, specialty, rating, onBook }: { name: string; specialty: string; rating?: number; onBook: () => void }) {
  return (
    <div className="card-elevated rounded-2xl p-6 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-2xl font-bold text-primary">{name.charAt(0)}</div>
      <h3 className="mt-4 font-display font-bold">{name}</h3>
      <p className="text-sm text-muted-foreground">{specialty}</p>
      <p className="mt-2 inline-flex items-center gap-1 text-sm"><Star className="h-3.5 w-3.5 fill-primary text-primary" /> {rating ?? "Available"}</p>
      <Button variant="soft" className="mt-4" onClick={onBook}>Book</Button>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="card-elevated mt-6 grid place-items-center rounded-2xl py-12 text-muted-foreground">
      <Loader2 className="mb-3 h-7 w-7 animate-spin" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
