import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { programsApi, type ApiProgram } from "@/lib/api";
import { ksh } from "@/lib/format";
import {
  programCategoryLabels as categoryLabels,
  programImage,
  programTrainerName,
} from "@/lib/program-display";
import { cn } from "@/lib/utils";
import { useProgramCategories } from "@/hooks/use-program-categories";

type Search = { category?: string };

// Static slugs, used only until the public category list resolves so the chip row does not
// pop in. The authoritative list comes from useProgramCategories().
const fallbackCategoryValues = Object.keys(categoryLabels);

export const Route = createFileRoute("/programs/")({
  // Accepts any slug: categories are admin-managed, so whitelisting against a compiled-in
  // list would silently drop links to categories created after this bundle shipped.
  validateSearch: (search: Record<string, unknown>): Search => ({
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Training Programs - Level Up Fitness" },
      {
        name: "description",
        content:
          "Body transformation, weight loss, and muscle building programs led by certified coaches.",
      },
    ],
  }),
  component: ProgramsPage,
});

const emptyPrograms: ApiProgram[] = [];

function ProgramCard({ program, categoryLabel }: { program: ApiProgram; categoryLabel: string }) {
  return (
    <Link
      to="/programs/$slug"
      params={{ slug: program.programRef }}
      className="group flex h-full flex-col overflow-hidden rounded-[1rem] border border-border bg-white shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={programImage(program)}
          alt=""
          aria-hidden
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Surfaced because it changes what happens on click — a subscription program
            cannot be bought outright. */}
        {program.subscriptionRequired && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
            Subscription
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold uppercase tracking-wide text-primary">
            {categoryLabel}
          </span>
          <span className="capitalize text-muted-foreground">{program.difficultyLevel}</span>
        </div>

        <h2 className="mt-3 line-clamp-2 font-display text-xl font-bold leading-tight">
          {program.title}
        </h2>

        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {program.duration} &middot; {programTrainerName(program)}
          </span>
        </p>

        <p className="mt-auto pt-4 font-display text-lg font-bold">{ksh(program.price)}</p>
      </div>
    </Link>
  );
}

function ProgramsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[1rem] border border-border bg-white">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgramsPage() {
  const search = Route.useSearch();

  const programsQuery = useQuery({
    queryKey: ["public", "programs"],
    queryFn: () => programsApi.publicList({ limit: 50 }),
  });

  const { categories, labelFor } = useProgramCategories();
  // Fall back to the static slugs while the category query is in flight.
  const chipCategories = categories.length
    ? categories.map((category) => category.slug)
    : fallbackCategoryValues;

  const allPrograms = programsQuery.data?.data.programs ?? emptyPrograms;
  // Filtered in the client: one cached fetch covers the whole catalogue, so switching
  // chips is instant and never refetches.
  const programs = search.category
    ? allPrograms.filter((program) => program.category === search.category)
    : allPrograms;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Programs</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mt-6">
        <h1 className="font-display text-4xl font-bold tracking-[-0.02em] sm:text-5xl">Programs</h1>
        <p className="mt-2 text-sm text-muted-foreground">Guided training paths for every goal.</p>
      </header>

      <div className="mt-6 inline-flex flex-wrap items-center gap-1 rounded-2xl bg-muted p-1 text-sm">
        <Link
          to="/programs"
          search={{}}
          className={cn(
            "rounded-full px-4 py-2 font-medium transition",
            !search.category
              ? "bg-background shadow-[var(--shadow-soft)]"
              : "text-muted-foreground",
          )}
        >
          All
        </Link>
        {chipCategories.map((value) => (
          <Link
            key={value}
            to="/programs"
            search={{ category: value }}
            className={cn(
              "rounded-full px-4 py-2 font-medium transition",
              search.category === value
                ? "bg-background shadow-[var(--shadow-soft)]"
                : "text-muted-foreground",
            )}
          >
            {labelFor(value)}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        {programsQuery.isLoading ? (
          <ProgramsSkeleton />
        ) : programsQuery.isError ? (
          <section className="card-elevated rounded-[1.25rem] p-8 sm:p-10">
            <p className="text-sm font-semibold text-primary">Programs</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
              Training programs are unavailable
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              We could not load the current program list. Try again or return once the connection is
              stable.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => void programsQuery.refetch()} variant="hero">
                Retry
              </Button>
              <Button asChild variant="soft">
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          </section>
        ) : programs.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <ProgramCard
                key={program.programRef}
                program={program}
                categoryLabel={labelFor(program.category)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-border px-6 py-16 text-center">
            <h2 className="font-display text-xl font-bold">
              {search.category ? "No programs in this category yet" : "No programs available yet"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {search.category
                ? "Try another training path."
                : "Check back soon — new programs are added regularly."}
            </p>
            {search.category && (
              <Button asChild className="mt-6" variant="soft">
                <Link to="/programs" search={{}}>
                  Show all programs
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>

      <section className="card-elevated mt-10 flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] p-6">
        <p className="text-sm text-muted-foreground">
          A membership unlocks multiple programs at once.
        </p>
        <Button asChild variant="hero">
          <Link to="/plans">
            View plans
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
