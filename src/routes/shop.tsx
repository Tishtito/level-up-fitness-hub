import { useDeferredValue, useMemo, useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Heart,
  Loader2,
  Package,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cartApi, productsApi, type ApiProduct } from "@/lib/api";
import { useAuthSession } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";
import { apiAssetUrl } from "@/lib/env";

export const Route = createFileRoute("/shop")({
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
  component: ShopPage,
});

const categories: { value: "all" | ApiProduct["category"]; label: string }[] = [
  { value: "all", label: "All items" },
  { value: "supplements", label: "Supplements" },
  { value: "gym_apparel", label: "Gym apparel" },
  { value: "fitness_equipment", label: "Equipment" },
  { value: "resistance_bands", label: "Resistance bands" },
  { value: "water_bottles", label: "Water bottles" },
  { value: "protein_shakers", label: "Protein shakers" },
  { value: "accessories", label: "Accessories" },
];

const emptyProducts: ApiProduct[] = [];

const categoryHighlights: Record<Exclude<ApiProduct["category"], undefined>, string> = {
  supplements: "Recovery and support",
  gym_apparel: "Training essentials",
  fitness_equipment: "Home and studio",
  resistance_bands: "Portable training",
  water_bottles: "Daily carry",
  protein_shakers: "Mix and go",
  accessories: "Small upgrades",
};

const KSh = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);

function productImage(product: ApiProduct) {
  return apiAssetUrl(product.images?.[0]) || "";
}

function shopFallback(product: ApiProduct) {
  const category = categoryHighlights[product.category];
  return {
    title: product.name,
    label: category,
  };
}

function ShopSkeleton() {
  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div className="space-y-4">
          <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
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
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="aspect-[4/5] animate-pulse rounded-[1.25rem] bg-muted" />
          <div className="aspect-[4/5] animate-pulse rounded-[1.25rem] bg-muted" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-[1rem] bg-muted p-5">
          <div className="h-4 w-24 animate-pulse rounded-full bg-background/50" />
          <div className="mt-4 space-y-2">
            <div className="h-10 w-full animate-pulse rounded-xl bg-background/50" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-background/50" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-background/50" />
          </div>
        </aside>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-[1rem] bg-muted">
              <div className="aspect-square animate-pulse bg-muted" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-24 animate-pulse rounded-full bg-background/50" />
                <div className="h-6 w-full animate-pulse rounded-full bg-background/50" />
                <div className="h-4 w-3/4 animate-pulse rounded-full bg-background/50" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-background/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
  const fallback = shopFallback(product);
  const lowStock = product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1rem] bg-white shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
            <Package className="h-12 w-12" />
            <p className="text-sm font-medium">{fallback.label}</p>
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full bg-white/90 text-foreground shadow-sm">
            {product.category.replaceAll("_", " ")}
          </Badge>
          {lowStock && (
            <Badge className="rounded-full bg-amber-100 text-amber-800 shadow-none hover:bg-amber-100">
              Low stock
            </Badge>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleWish}
          className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-sm backdrop-blur transition hover:scale-105 ${
            wished ? "text-primary" : "text-muted-foreground"
          }`}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-4 w-4 ${wished ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold leading-tight">{product.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {product.brand || "Level Up selection"}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            {product.rating?.toFixed(1) ?? "0.0"}
          </span>
        </div>

        <p className="mt-3 line-clamp-3 max-w-prose text-sm leading-6 text-muted-foreground">
          {product.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2.5 py-1">{fallback.label}</span>
          <span className="rounded-full bg-muted px-2.5 py-1">
            {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock"}
          </span>
        </div>

        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Price</p>
            <p className="font-display text-2xl font-bold">{KSh(price)}</p>
            {product.discountPrice ? (
              <p className="text-xs text-muted-foreground line-through">{KSh(product.price)}</p>
            ) : null}
          </div>
          <Button
            size="sm"
            variant="hero"
            onClick={onAdd}
            disabled={adding || product.stockQuantity < 1}
            className="min-w-28"
          >
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add to cart"}
          </Button>
        </div>
      </div>
    </article>
  );
}

function FeaturedProduct({
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
  const fallback = shopFallback(product);

  return (
    <article className="grid overflow-hidden rounded-[1.25rem] border border-border bg-white shadow-[var(--shadow-elegant)] lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative min-h-[20rem] bg-muted">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Package className="h-16 w-16" />
          </div>
        )}
        <button
          type="button"
          onClick={onToggleWish}
          className={`absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-sm backdrop-blur transition hover:scale-105 ${
            wished ? "text-primary" : "text-muted-foreground"
          }`}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-4 w-4 ${wished ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="flex flex-col justify-between p-6 sm:p-8">
        <div>
          <Badge variant="secondary" className="rounded-full">
            Featured product
          </Badge>
          <p className="mt-4 text-sm font-semibold text-primary">{fallback.label}</p>
          <h2 className="mt-2 max-w-xl font-display text-3xl font-bold sm:text-4xl">
            {product.name}
          </h2>
          <p className="mt-4 max-w-prose text-sm leading-7 text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Price", value: KSh(price) },
              { label: "Rating", value: product.rating?.toFixed(1) ?? "0.0" },
              {
                label: "Stock",
                value: product.stockQuantity > 0 ? `${product.stockQuantity}` : "0",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-[0.9rem] bg-muted p-4">
                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                <p className="mt-2 font-display text-xl font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            variant="hero"
            size="lg"
            onClick={onAdd}
            disabled={adding || product.stockQuantity < 1}
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to cart"}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-sm text-muted-foreground">
            {product.stockQuantity > 0
              ? "Available for immediate checkout."
              : "Out of stock right now."}
          </p>
        </div>
      </div>
    </article>
  );
}

function ShopPage() {
  const session = useAuthSession();
  const [category, setCategory] = useState<"all" | ApiProduct["category"]>("all");
  const [query, setQuery] = useState("");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [activeProductRef, setActiveProductRef] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(query);

  const productsQuery = useQuery({
    queryKey: ["shop", "products", category, deferredQuery],
    queryFn: () =>
      productsApi.publicList({
        search: deferredQuery,
        category: category === "all" ? undefined : category,
        limit: 60,
      }),
  });

  const addItemMutation = useMutation({
    mutationFn: (productRef: string) => cartApi.addItem(productRef, 1),
    onMutate: (productRef) => {
      setActiveProductRef(productRef);
    },
    onSuccess: () => toast.success("Added to cart"),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not add item"),
    onSettled: () => setActiveProductRef(null),
  });

  const products = productsQuery.data?.data.products ?? emptyProducts;
  const featuredProduct = useMemo(
    () =>
      products.find((product) => product.images?.length && product.stockQuantity > 0) ??
      products[0] ??
      null,
    [products],
  );
  const supportingProducts = useMemo(
    () => products.filter((product) => product.productRef !== featuredProduct?.productRef),
    [featuredProduct?.productRef, products],
  );

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

  const counts = {
    products,
    inStock: products.filter((product) => product.stockQuantity > 0).length,
    discounted: products.filter((product) => product.discountPrice).length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
      <div className="space-y-12">
        {productsQuery.isLoading ? (
          <ShopSkeleton />
        ) : productsQuery.isError ? (
          <section className="card-elevated rounded-[1.25rem] p-8 sm:p-10">
            <p className="text-sm font-semibold text-primary">Shop</p>
            <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">
              Shop products are unavailable
            </h1>
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
          </section>
        ) : (
          <>
            <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div className="space-y-6">
                <p className="text-sm font-semibold text-primary">Shop</p>
                <h1 className="max-w-2xl font-display text-5xl font-bold leading-[0.92] tracking-[-0.035em] text-balance sm:text-6xl">
                  Useful gear, clearly chosen.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                  Browse supplements, apparel, and training essentials with cleaner filters, direct
                  cart actions, and a featured product path that does not flatten every item into
                  the same box.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="hero" size="lg">
                    <Link to="/cart">
                      View cart
                      <ShoppingBag className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="soft" size="lg">
                    <Link to="/programs">Browse programs</Link>
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1rem] bg-white p-4 shadow-[var(--shadow-soft)]">
                    <p className="text-xs font-medium text-muted-foreground">Products</p>
                    <p className="mt-2 font-display text-2xl font-bold">{counts.products.length}</p>
                  </div>
                  <div className="rounded-[1rem] bg-white p-4 shadow-[var(--shadow-soft)]">
                    <p className="text-xs font-medium text-muted-foreground">In stock</p>
                    <p className="mt-2 font-display text-2xl font-bold">{counts.inStock}</p>
                  </div>
                  <div className="rounded-[1rem] bg-white p-4 shadow-[var(--shadow-soft)]">
                    <p className="text-xs font-medium text-muted-foreground">Discounted</p>
                    <p className="mt-2 font-display text-2xl font-bold">{counts.discounted}</p>
                  </div>
                </div>
              </div>

              {featuredProduct ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {products.slice(0, 2).map((product) => (
                    <div
                      key={product.productRef}
                      className="overflow-hidden rounded-[1.25rem] border border-border bg-white shadow-[var(--shadow-elegant)]"
                    >
                      <div className="aspect-[4/5] bg-muted">
                        {productImage(product) ? (
                          <img
                            src={productImage(product)}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            width={1024}
                            height={1280}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <Package className="h-14 w-14" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-[1.25rem] border border-border bg-muted">
                  <div className="aspect-[4/3] bg-muted" />
                </div>
              )}
            </section>

            <section className="grid gap-6 lg:grid-cols-[220px_1fr]">
              <aside className="h-fit rounded-[1rem] border border-border bg-white p-5 shadow-[var(--shadow-soft)] lg:sticky lg:top-24">
                <p className="inline-flex items-center gap-2 font-display text-lg font-semibold">
                  <SlidersHorizontal className="h-4 w-4" />
                  Categories
                </p>
                <div className="mt-4 flex flex-wrap gap-2 lg:flex-col">
                  {categories.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setCategory(item.value)}
                      className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                        category === item.value
                          ? "bg-[#f2553d] text-[#14231d]"
                          : "bg-muted text-foreground hover:bg-surface"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </aside>

              <div className="space-y-6">
                <div className="rounded-[1rem] border border-border bg-white p-4 shadow-[var(--shadow-soft)]">
                  <label className="flex items-center gap-3">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search products, supplements, or equipment"
                      className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    />
                  </label>
                </div>

                {featuredProduct ? (
                  <FeaturedProduct
                    product={featuredProduct}
                    wished={wishlist.includes(featuredProduct.productRef)}
                    onToggleWish={() => toggleWish(featuredProduct.productRef)}
                    onAdd={() => addToCart(featuredProduct)}
                    adding={
                      addItemMutation.isPending && activeProductRef === featuredProduct.productRef
                    }
                  />
                ) : null}

                {supportingProducts.length > 0 ? (
                  <div className="space-y-4">
                    <div className="max-w-2xl">
                      <p className="text-sm font-semibold text-muted-foreground">All products</p>
                      <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                        Commerce grid with product focus, not just uniform tiles.
                      </h2>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {supportingProducts.map((product) => (
                        <ProductCard
                          key={product.productRef}
                          product={product}
                          wished={wishlist.includes(product.productRef)}
                          onToggleWish={() => toggleWish(product.productRef)}
                          onAdd={() => addToCart(product)}
                          adding={
                            addItemMutation.isPending && activeProductRef === product.productRef
                          }
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1rem] border border-border bg-white p-8 text-center text-muted-foreground shadow-[var(--shadow-soft)]">
                    No products match your search.
                  </div>
                )}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[1.25rem] bg-[#14231d] p-8 text-[#f6f8f5] shadow-[var(--shadow-elegant)]">
                <p className="text-sm font-semibold text-[#f6f8f5]/75">Shop notes</p>
                <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                  Simple buying, with the right item already in view.
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      title: "Search fast",
                      body: "Use the search bar to narrow the collection before you commit to a category.",
                    },
                    {
                      title: "Save for later",
                      body: "Wishlist items without losing the path back to cart or checkout.",
                    },
                    {
                      title: "Checkout cleanly",
                      body: "Add items to cart and move into checkout without leaving this flow.",
                    },
                  ].map((step, index) => (
                    <div key={step.title} className="rounded-[1rem] bg-[#263930] p-4">
                      <p className="text-xs font-semibold text-[#f6f8f5]/70">0{index + 1}</p>
                      <h3 className="mt-2 font-display text-xl font-bold">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#f6f8f5]/80">{step.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-border bg-white p-8 shadow-[var(--shadow-soft)]">
                <p className="text-sm font-semibold text-primary">Need the cart now?</p>
                <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                  See what you already saved.
                </h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  Items added from the shop and homepage stay in your cart, ready for checkout when
                  you are.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild variant="hero">
                    <Link to="/cart">
                      Open cart
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="soft">
                    <Link to="/nutrition">Nutrition support</Link>
                  </Button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
