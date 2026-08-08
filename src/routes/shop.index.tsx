import { useEffect, useMemo, useRef, useState } from "react";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  Package,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cartApi, productsApi, type ApiProduct } from "@/lib/api";
import { useAuthSession } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";
import { apiAssetUrl } from "@/lib/env";
import { CART_QUERY_KEY } from "@/lib/use-cart-count";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

const categoryValues: ApiProduct["category"][] = [
  "supplements",
  "gym_apparel",
  "fitness_equipment",
  "resistance_bands",
  "water_bottles",
  "protein_shakers",
  "accessories",
];

const categoryLabels: Record<ApiProduct["category"], string> = {
  supplements: "Supplements",
  gym_apparel: "Gym apparel",
  fitness_equipment: "Equipment",
  resistance_bands: "Resistance bands",
  water_bottles: "Water bottles",
  protein_shakers: "Protein shakers",
  accessories: "Accessories",
};

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "name", label: "Name A-Z" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];

type ShopSearch = {
  category?: ApiProduct["category"];
  q?: string;
  sort?: SortValue;
  minPrice?: number;
  maxPrice?: number;
  inStock?: true;
  page?: number;
};

const emptyProducts: ApiProduct[] = [];

/** Empty string must not become 0 — an empty price box means "no bound". */
function parsePrice(value: unknown) {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "Shop - Level Up Fitness" },
      {
        name: "description",
        content:
          "Premium gym apparel, supplements, equipment, resistance bands, water bottles & shakers.",
      },
    ],
  }),
  // Filters live in the URL so results are shareable and survive back-navigation.
  // Defaults are left undefined so a clean /shop stays clean.
  validateSearch: (search: Record<string, unknown>): ShopSearch => {
    const sort = sortOptions.find((option) => option.value === search.sort)?.value;
    const page = Number(search.page);

    return {
      category: categoryValues.find((value) => value === search.category),
      q: typeof search.q === "string" && search.q.trim() ? search.q.trim() : undefined,
      sort: sort && sort !== "newest" ? sort : undefined,
      minPrice: parsePrice(search.minPrice),
      maxPrice: parsePrice(search.maxPrice),
      inStock: search.inStock === true || search.inStock === "true" ? true : undefined,
      page: Number.isInteger(page) && page > 1 ? page : undefined,
    };
  },
  component: ShopPage,
});

const KSh = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);

function productImage(product: ApiProduct) {
  return apiAssetUrl(product.images?.[0]) || "";
}

function ProductCard({
  product,
  wished,
  onToggleWish,
  onAdd,
  adding,
}: {
  product: ApiProduct;
  wished: boolean;
  onToggleWish: () => void;
  onAdd: () => void;
  adding: boolean;
}) {
  const image = productImage(product);
  const price = product.discountPrice ?? product.price;
  const outOfStock = product.stockQuantity < 1;
  const lowStock = !outOfStock && product.stockQuantity <= product.lowStockThreshold;

  const status = outOfStock
    ? { label: "Out of stock", className: "bg-foreground text-background" }
    : product.discountPrice
      ? { label: "Sale", className: "bg-primary text-primary-foreground" }
      : lowStock
        ? { label: "Low stock", className: "bg-amber-100 text-amber-800" }
        : null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1rem] border border-border bg-white shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link
          to="/shop/$productRef"
          params={{ productRef: product.productRef }}
          className="block h-full w-full"
          aria-label={`View ${product.name}`}
        >
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Package className="h-12 w-12" />
            </div>
          )}
        </Link>

        {status ? (
          <span
            className={cn(
              "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
              status.className,
            )}
          >
            {status.label}
          </span>
        ) : null}

        <button
          type="button"
          onClick={onToggleWish}
          className={cn(
            "absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 backdrop-blur transition hover:scale-105",
            wished ? "text-primary" : "text-muted-foreground",
          )}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
        >
          <Heart className={cn("h-4 w-4", wished && "fill-current")} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-6">
          <Link
            to="/shop/$productRef"
            params={{ productRef: product.productRef }}
            className="transition-colors hover:text-primary"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="text-[11px] text-muted-foreground">Price</p>
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="font-display text-lg font-bold">{KSh(price)}</p>
              {product.discountPrice ? (
                <p className="text-xs text-muted-foreground line-through">{KSh(product.price)}</p>
              ) : null}
            </div>
          </div>
          <Button
            variant="hero"
            size="icon"
            onClick={onAdd}
            disabled={adding || outOfStock}
            aria-label={`Add ${product.name} to cart`}
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}

function FilterPanel({
  category,
  onCategoryChange,
  minPrice,
  maxPrice,
  inStock,
  onMinPriceChange,
  onMaxPriceChange,
  onInStockChange,
  onApply,
  onReset,
}: {
  category?: ApiProduct["category"];
  onCategoryChange: (value?: ApiProduct["category"]) => void;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onInStockChange: (value: boolean) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-base font-semibold">Category</p>
        <div className="mt-3 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onCategoryChange(undefined)}
            className={cn(
              "rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-muted",
              !category ? "font-semibold text-primary" : "text-muted-foreground",
            )}
          >
            All items
          </button>
          {categoryValues.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onCategoryChange(value)}
              className={cn(
                "rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-muted",
                category === value ? "font-semibold text-primary" : "text-muted-foreground",
              )}
            >
              {categoryLabels[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <p className="font-display text-base font-semibold">Filter by</p>

        <fieldset className="mt-4">
          <legend className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Price
          </legend>
          <div className="mt-3 flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={minPrice}
              onChange={(event) => onMinPriceChange(event.target.value)}
              placeholder="Min"
              aria-label="Minimum price"
              className="h-9"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={maxPrice}
              onChange={(event) => onMaxPriceChange(event.target.value)}
              placeholder="Max"
              aria-label="Maximum price"
              className="h-9"
            />
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Availability
          </legend>
          <div className="mt-3 flex items-center gap-2">
            <Checkbox
              id="shop-in-stock"
              checked={inStock}
              onCheckedChange={(value) => onInStockChange(value === true)}
            />
            <Label htmlFor="shop-in-stock" className="text-sm font-normal text-muted-foreground">
              In stock only
            </Label>
          </div>
        </fieldset>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="hero" className="flex-1" onClick={onApply}>
          Apply
        </Button>
        <Button variant="soft" size="icon" onClick={onReset} aria-label="Clear all filters">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
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

function ShopPagination({ page, totalPages }: { page: number; totalPages: number }) {
  const linkClass = (isActive: boolean) =>
    cn(buttonVariants({ variant: isActive ? "outline" : "ghost", size: "icon" }), "h-9 w-9");

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1 pt-4">
      {page > 1 ? (
        <Link
          to="/shop"
          search={(prev: ShopSearch) => ({ ...prev, page: page - 1 > 1 ? page - 1 : undefined })}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1")}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Link>
      ) : null}

      {pageWindow(page, totalPages).map((entry, index) =>
        entry === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="grid h-9 w-9 place-items-center text-muted-foreground"
            aria-hidden
          >
            ...
          </span>
        ) : (
          <Link
            key={entry}
            to="/shop"
            search={(prev: ShopSearch) => ({ ...prev, page: entry > 1 ? entry : undefined })}
            className={linkClass(entry === page)}
            aria-label={`Go to page ${entry}`}
            aria-current={entry === page ? "page" : undefined}
          >
            {entry}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          to="/shop"
          search={(prev: ShopSearch) => ({ ...prev, page: page + 1 })}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1")}
          aria-label="Go to next page"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </nav>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[1rem] border border-border bg-white">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-end justify-between gap-3 pt-2">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ShopPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const session = useAuthSession();
  const queryClient = useQueryClient();

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [activeProductRef, setActiveProductRef] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const page = search.page ?? 1;

  function setSearch(patch: Partial<ShopSearch>, replace = false) {
    // Any filter change invalidates the current page — patch.page is undefined
    // unless a page was explicitly requested, so this resets to page 1.
    void navigate({
      to: "/shop",
      search: (prev: ShopSearch) => ({ ...prev, ...patch, page: patch.page }),
      replace,
    });
  }

  // --- search box: local state, debounced into the URL -----------------------
  const [queryInput, setQueryInput] = useState(search.q ?? "");
  const pushedQuery = useRef(search.q ?? "");

  useEffect(() => {
    const urlQuery = search.q ?? "";
    if (urlQuery === pushedQuery.current) return; // our own push echoing back
    pushedQuery.current = urlQuery;
    setQueryInput(urlQuery);
  }, [search.q]);

  useEffect(() => {
    const next = queryInput.trim();
    if (next === pushedQuery.current) return;
    const timer = setTimeout(() => {
      pushedQuery.current = next;
      setSearch({ q: next || undefined }, true);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput]);

  // --- price / availability: staged, committed by Apply ----------------------
  const [minPriceInput, setMinPriceInput] = useState(search.minPrice?.toString() ?? "");
  const [maxPriceInput, setMaxPriceInput] = useState(search.maxPrice?.toString() ?? "");
  const [inStockDraft, setInStockDraft] = useState(Boolean(search.inStock));

  useEffect(() => {
    setMinPriceInput(search.minPrice?.toString() ?? "");
    setMaxPriceInput(search.maxPrice?.toString() ?? "");
    setInStockDraft(Boolean(search.inStock));
  }, [search.minPrice, search.maxPrice, search.inStock]);

  const productsQuery = useQuery({
    queryKey: ["shop", "products", search],
    queryFn: () =>
      productsApi.publicList({
        page,
        limit: PAGE_SIZE,
        search: search.q,
        category: search.category,
        sort: search.sort,
        minPrice: search.minPrice,
        maxPrice: search.maxPrice,
        inStock: search.inStock,
      }),
    placeholderData: keepPreviousData,
  });

  const addItemMutation = useMutation({
    mutationFn: (productRef: string) => cartApi.addItem(productRef, 1),
    onMutate: (productRef) => {
      setActiveProductRef(productRef);
    },
    onSuccess: () => {
      toast.success("Added to cart");
      void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not add item"),
    onSettled: () => setActiveProductRef(null),
  });

  const products = productsQuery.data?.data.products ?? emptyProducts;
  const pagination = productsQuery.data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  function addToCart(product: ApiProduct) {
    if (!session) {
      window.location.assign(loginUrlFor({ redirect: "/shop", addProductRef: product.productRef }));
      return;
    }
    addItemMutation.mutate(product.productRef);
  }

  function toggleWish(productRef: string) {
    setWishlist((current) =>
      current.includes(productRef)
        ? current.filter((item) => item !== productRef)
        : [...current, productRef],
    );
  }

  function applyFilters() {
    setSearch({
      minPrice: parsePrice(minPriceInput),
      maxPrice: parsePrice(maxPriceInput),
      inStock: inStockDraft || undefined,
    });
    setFiltersOpen(false);
  }

  function resetFilters() {
    pushedQuery.current = "";
    setQueryInput("");
    void navigate({ to: "/shop", search: {} });
    setFiltersOpen(false);
  }

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; clear: Partial<ShopSearch> }[] = [];

    if (search.category) {
      chips.push({
        key: "category",
        label: categoryLabels[search.category],
        clear: { category: undefined },
      });
    }
    if (search.q) {
      chips.push({ key: "q", label: `"${search.q}"`, clear: { q: undefined } });
    }
    if (search.minPrice !== undefined || search.maxPrice !== undefined) {
      const from = search.minPrice !== undefined ? KSh(search.minPrice) : "Any";
      const to = search.maxPrice !== undefined ? KSh(search.maxPrice) : "Any";
      chips.push({
        key: "price",
        label: `${from} - ${to}`,
        clear: { minPrice: undefined, maxPrice: undefined },
      });
    }
    if (search.inStock) {
      chips.push({ key: "inStock", label: "In stock only", clear: { inStock: undefined } });
    }

    return chips;
  }, [search.category, search.q, search.minPrice, search.maxPrice, search.inStock]);

  const heading = search.category ? categoryLabels[search.category] : "All products";

  const filterPanel = (
    <FilterPanel
      category={search.category}
      onCategoryChange={(value) => {
        setSearch({ category: value });
        setFiltersOpen(false);
      }}
      minPrice={minPriceInput}
      maxPrice={maxPriceInput}
      inStock={inStockDraft}
      onMinPriceChange={setMinPriceInput}
      onMaxPriceChange={setMaxPriceInput}
      onInStockChange={setInStockDraft}
      onApply={applyFilters}
      onReset={resetFilters}
    />
  );

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
            {search.category ? (
              <BreadcrumbLink asChild>
                <Link to="/shop">Shop</Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>Shop</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {search.category ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{categoryLabels[search.category]}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : null}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden h-fit rounded-[1rem] border border-border bg-white p-5 shadow-[var(--shadow-soft)] lg:sticky lg:top-24 lg:block">
          {filterPanel}
        </aside>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex min-w-56 flex-1 items-center gap-3 rounded-[1rem] border border-border bg-white px-4 shadow-[var(--shadow-soft)]">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="sr-only">Search products</span>
              <Input
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                placeholder="Search products, supplements, or equipment"
                className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </label>

            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="soft" className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[19rem] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="font-display">Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">{filterPanel}</div>
              </SheetContent>
            </Sheet>

            <Select
              value={search.sort ?? "newest"}
              onValueChange={(value) =>
                setSearch({ sort: value === "newest" ? undefined : (value as SortValue) })
              }
            >
              <SelectTrigger className="w-52" aria-label="Sort products">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h1 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
              {heading}
            </h1>
            {productsQuery.isSuccess ? (
              <p className="text-sm text-muted-foreground">
                {total} {total === 1 ? "product" : "products"}
              </p>
            ) : null}
          </div>

          {activeFilters.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setSearch(chip.clear)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button
                type="button"
                onClick={resetFilters}
                className="px-2 py-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Clear all
              </button>
            </div>
          ) : null}

          {productsQuery.isLoading ? (
            <ProductGridSkeleton />
          ) : productsQuery.isError ? (
            <div className="card-elevated rounded-[1.25rem] p-8 sm:p-10">
              <p className="text-sm font-semibold text-primary">Shop</p>
              <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                Shop products are unavailable
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                We could not load the current product collection. Try again or return once the
                connection is stable.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => void productsQuery.refetch()} variant="hero">
                  Retry
                </Button>
                <Button asChild variant="soft">
                  <Link to="/">Back to home</Link>
                </Button>
              </div>
            </div>
          ) : products.length > 0 ? (
            <div
              className={cn(
                "space-y-8 transition-opacity",
                productsQuery.isPlaceholderData && "opacity-60",
              )}
            >
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.productRef}
                    product={product}
                    wished={wishlist.includes(product.productRef)}
                    onToggleWish={() => toggleWish(product.productRef)}
                    onAdd={() => addToCart(product)}
                    adding={addItemMutation.isPending && activeProductRef === product.productRef}
                  />
                ))}
              </div>

              {totalPages > 1 ? <ShopPagination page={page} totalPages={totalPages} /> : null}
            </div>
          ) : (
            <div className="rounded-[1.25rem] border border-border bg-white p-12 text-center shadow-[var(--shadow-soft)]">
              <Package className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 font-display text-xl font-bold">
                No products match these filters
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try a wider price range or a different category.
              </p>
              <Button className="mt-6" variant="soft" onClick={resetFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
