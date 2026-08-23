import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { programCategoriesApi } from "@/lib/api";
import { humanizeProgramCategory, programCategoryLabels } from "@/lib/program-display";

/**
 * Public category list for the storefront. Categories are admin-managed, so the labels and
 * the filter chips can no longer be a compiled-in map.
 */
export function useProgramCategories() {
  const query = useQuery({
    queryKey: ["public", "program-categories"],
    queryFn: () => programCategoriesApi.publicList({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(() => query.data?.data.categories ?? [], [query.data]);

  const bySlug = useMemo(
    () => new Map(categories.map((category) => [category.slug, category])),
    [categories],
  );

  // Falls back to the three static labels, then to the humanized slug — so a label is never
  // blank on the first render or for a category created after this bundle shipped.
  const labelFor = useCallback(
    (slug: string) =>
      bySlug.get(slug)?.name ?? programCategoryLabels[slug] ?? humanizeProgramCategory(slug),
    [bySlug],
  );

  return { query, categories, labelFor };
}
