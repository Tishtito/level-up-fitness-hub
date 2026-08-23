import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { enquiriesApi, type ApiEnquiryInput, type ApiOrganisationType } from "@/lib/api";
import { KENYA_COUNTIES } from "@/lib/kenya-counties";
import { useAuthSession } from "@/lib/auth";

export const Route = createFileRoute("/corporate")({
  head: () => ({
    meta: [
      { title: "Corporate & Schools - Level Up Fitness" },
      {
        name: "description",
        content:
          "Wellness days, team bootcamps, ongoing workplace programmes and school fitness events across Kenya.",
      },
    ],
  }),
  component: CorporatePage,
});

const offerings = [
  {
    title: "Wellness days",
    body: "A half or full day activation at your office or off-site. Includes a pre-event consult, warm-up, group workouts and recovery.",
  },
  {
    title: "Team-building bootcamps",
    body: "Outdoor circuits built around your team. Mixed-ability friendly, scaled by fitness level, finishing with a group challenge.",
  },
  {
    title: "Ongoing wellness programmes",
    body: "Monthly classes for staff — strength, mobility, HIIT — at your workplace or a partner gym, with attendance reporting.",
  },
  {
    title: "School fitness events",
    body: "Sports days, fitness assessments and skill clinics for primary and secondary schools, run by coaches vetted to work with minors.",
  },
];

const organisationTypes: { value: ApiOrganisationType; label: string }[] = [
  { value: "company", label: "Company" },
  { value: "school", label: "School" },
  { value: "ngo", label: "NGO" },
  { value: "government", label: "Government" },
];

const emptyForm = {
  organisationName: "",
  organisationType: "company" as ApiOrganisationType,
  contactName: "",
  email: "",
  phone: "",
  county: "",
  city: "",
  headcount: "",
  preferredDate: "",
  budget: "",
  message: "",
  website: "", // honeypot
};

type FormState = typeof emptyForm;
type FieldName = keyof FormState;

const REQUIRED: FieldName[] = ["organisationName", "contactName", "email", "county", "message"];

function fieldError(field: FieldName, value: string): string | null {
  const trimmed = value.trim();
  if (REQUIRED.includes(field) && !trimmed) return "Required";
  if (field === "email" && trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address";
  }
  if (field === "message" && trimmed && trimmed.length < 10) return "Tell us a little more";
  return null;
}

function Field({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  ...rest
}: {
  id: FieldName;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string | null;
} & Omit<React.ComponentProps<typeof Input>, "id" | "value" | "onChange" | "onBlur">) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function CorporatePage() {
  const session = useAuthSession();
  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm,
    contactName: session?.user.name ?? "",
    email: session?.user.email ?? "",
    phone: session?.user.phone ?? "",
  }));
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [sent, setSent] = useState<string | null>(null);

  const errors = REQUIRED.reduce<Partial<Record<FieldName, string>>>((acc, field) => {
    const error = fieldError(field, form[field]);
    if (error) acc[field] = error;
    return acc;
  }, {});
  const emailError = fieldError("email", form.email);
  const canSubmit = Object.keys(errors).length === 0 && !emailError;

  const submit = useMutation({
    mutationFn: () => {
      const payload: ApiEnquiryInput = {
        organisationName: form.organisationName.trim(),
        organisationType: form.organisationType,
        contactName: form.contactName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        county: form.county.trim(),
        city: form.city.trim() || null,
        headcount: form.headcount ? Number(form.headcount) : null,
        preferredDate: form.preferredDate || null,
        budget: form.budget ? Number(form.budget) : null,
        message: form.message.trim(),
        website: form.website || null,
      };
      return enquiriesApi.create(payload);
    },
    onSuccess: (enquiry) => setSent(enquiry.enquiryRef),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Your enquiry could not be sent"),
  });

  const bind = (field: FieldName) => ({
    value: form[field],
    onChange: (value: string) => setForm((current) => ({ ...current, [field]: value })),
    onBlur: () => setTouched((current) => ({ ...current, [field]: true })),
    error: touched[field] ? (field === "email" ? emailError : errors[field]) : undefined,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Corporate</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mt-6 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          For organisations
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.02em] sm:text-5xl">
          Move your team together.
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          We bring vetted coaches, programmes and event logistics to companies, schools and NGOs
          across Kenya. You keep the team — we handle the rest.
        </p>
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {offerings.map((offering) => (
          <div key={offering.title} className="rounded-[1rem] border border-border p-5">
            <h2 className="font-display text-base font-bold uppercase tracking-wide">
              {offering.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{offering.body}</p>
          </div>
        ))}
      </div>

      {sent ? (
        <section className="card-elevated mt-12 rounded-[1.25rem] p-10 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h2 className="mt-4 font-display text-2xl font-bold sm:text-3xl">Enquiry received</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Thanks — our team will get back to you within 1–2 working days. We have emailed a copy
            to <span className="font-medium text-foreground">{form.email.trim()}</span>.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">Reference: {sent}</p>
          <Button asChild className="mt-6" variant="soft">
            <Link to="/">Back to home</Link>
          </Button>
        </section>
      ) : (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">Tell us about your team</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ll come back within 1–2 working days with options.
          </p>

          <form
            className="mt-6 grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!canSubmit) {
                setTouched(Object.fromEntries(REQUIRED.map((field) => [field, true])));
                return;
              }
              submit.mutate();
            }}
          >
            <Field id="organisationName" label="Organisation name" {...bind("organisationName")} />

            <div className="space-y-1.5">
              <Label htmlFor="organisationType">Type</Label>
              <Select
                value={form.organisationType}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    organisationType: value as ApiOrganisationType,
                  }))
                }
              >
                <SelectTrigger id="organisationType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {organisationTypes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Field
              id="contactName"
              label="Your name"
              autoComplete="name"
              {...bind("contactName")}
            />
            <Field id="email" label="Email" type="email" autoComplete="email" {...bind("email")} />
            <Field id="phone" label="Phone" inputMode="tel" autoComplete="tel" {...bind("phone")} />

            <div className="space-y-1.5">
              <Label htmlFor="county">County</Label>
              <Select
                value={form.county}
                onValueChange={(value) => {
                  setForm((current) => ({ ...current, county: value }));
                  setTouched((current) => ({ ...current, county: true }));
                }}
              >
                <SelectTrigger id="county" aria-invalid={!!(touched.county && errors.county)}>
                  <SelectValue placeholder="Select county" />
                </SelectTrigger>
                <SelectContent>
                  {KENYA_COUNTIES.map((county) => (
                    <SelectItem key={county} value={county}>
                      {county}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {touched.county && errors.county && (
                <p className="text-xs font-medium text-destructive">{errors.county}</p>
              )}
            </div>

            <Field id="city" label="City or town" autoComplete="address-level2" {...bind("city")} />
            <Field
              id="headcount"
              label="Approx. headcount"
              type="number"
              min={1}
              inputMode="numeric"
              {...bind("headcount")}
            />
            <Field
              id="preferredDate"
              label="Preferred date"
              type="date"
              {...bind("preferredDate")}
            />
            <Field
              id="budget"
              label="Indicative budget (KES)"
              type="number"
              min={0}
              inputMode="numeric"
              {...bind("budget")}
            />

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="message">What are you looking for?</Label>
              <Textarea
                id="message"
                rows={5}
                placeholder="Tell us about your team, goals, format, location, dates — anything else."
                value={form.message}
                onChange={(event) =>
                  setForm((current) => ({ ...current, message: event.target.value }))
                }
                onBlur={() => setTouched((current) => ({ ...current, message: true }))}
                aria-invalid={!!(touched.message && errors.message)}
              />
              {touched.message && errors.message && (
                <p className="text-xs font-medium text-destructive">{errors.message}</p>
              )}
            </div>

            {/* Honeypot: hidden from sight and from assistive tech. Bots fill it, people don't. */}
            <div aria-hidden className="hidden">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(event) =>
                  setForm((current) => ({ ...current, website: event.target.value }))
                }
              />
            </div>

            <div className="flex justify-end sm:col-span-2">
              <Button type="submit" variant="hero" size="lg" disabled={submit.isPending}>
                {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Send enquiry
              </Button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
