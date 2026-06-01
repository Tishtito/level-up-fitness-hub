import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, Loader2, Package, Search, ShoppingBag, SlidersHorizontal, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cartApi, productsApi, type ApiProduct } from "@/lib/api";
import { useAuthSession } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";
import { apiAssetUrl } from "@/lib/env";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop - Level Up Fitness" },
      { name: "description", content: "Premium gym apparel, supplements, equipment, resistance bands, water bottles & shakers." },
    ],
  }),
  component: ShopPage,
});

const categories: { value: "all" | ApiProduct["category"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "supplements", label: "Supplements" },
  { value: "gym_apparel", label: "Gym apparel" },
  { value: "fitness_equipment", label: "Equipment" },
  { value: "resistance_bands", label: "Resistance bands" },
  { value: "water_bottles", label: "Water bottles" },
  { value: "protein_shakers", label: "Protein shakers" },
  { value: "accessories", label: "Accessories" },
];

const KSh = (value: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);

function productImage(product: ApiProduct) {
  return apiAssetUrl(product.images?.[0]) || "";
}

function ShopPage() {
  const session = useAuthSession();
  const [category, setCategory] = useState<"all" | ApiProduct["category"]>("all");
  const [query, setQuery] = useState("");
  const [wishlist, setWishlist] = useState<string[]>([]);

  const productsQuery = useQuery({
    queryKey: ["shop", "products", category, query],
    queryFn: () =>
      productsApi.publicList({
        search: query,
        category: category === "all" ? undefined : category,
        limit: 60,
      }),
  });

  const addItemMutation = useMutation({
    mutationFn: (productRef: string) => cartApi.addItem(productRef, 1),
    onSuccess: () => toast.success("Added to cart"),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not add item"),
  });

  const products = productsQuery.data?.data.products ?? [];

  function addToCart(product: ApiProduct) {
    if (!session) {
      window.location.assign(loginUrlFor({ redirect: "/shop", addProductRef: product.productRef }));
      return;
    }
    addItemMutation.mutate(product.productRef);
  }

  function toggleWish(productRef: string) {
    setWishlist((current) =>
      current.includes(productRef) ? current.filter((item) => item !== productRef) : [...current, productRef],
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Shop</p>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Gear that performs</h1>
          <p className="mt-2 text-muted-foreground">Hand-picked apparel, supplements & equipment.</p>
        </div>
        <Link to="/cart">
          <Button variant="hero">
            <ShoppingBag className="h-4 w-4" /> View Cart
          </Button>
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="card-elevated h-fit rounded-3xl p-5 lg:sticky lg:top-24">
          <p className="font-display font-semibold inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" /> Categories
          </p>
          <ul className="mt-3 space-y-1">
            {categories.map((item) => (
              <li key={item.value}>
                <button
                  onClick={() => setCategory(item.value)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                    category === item.value ? "bg-[image:var(--gradient-primary)] text-primary-foreground" : "hover:bg-surface/60"
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="space-y-6">
          <div className="card-elevated flex items-center gap-3 rounded-2xl p-3">
            <Search className="ml-2 h-5 w-5 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products..."
              className="w-full bg-transparent py-2 text-sm outline-none"
            />
          </div>

          {productsQuery.isLoading ? (
            <div className="card-elevated grid place-items-center rounded-3xl py-16 text-muted-foreground">
              <Loader2 className="mb-3 h-8 w-8 animate-spin" />
              <p className="text-sm font-medium">Loading products...</p>
            </div>
          ) : productsQuery.isError ? (
            <div className="card-elevated rounded-3xl p-10 text-center text-destructive">
              <p className="text-sm font-medium">Products could not be loaded.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const image = productImage(product);
                const price = product.discountPrice ?? product.price;
                const wished = wishlist.includes(product.productRef);

                return (
                  <article key={product.productRef} className="card-elevated group rounded-3xl p-5">
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
                      {image ? (
                        <img src={image} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-muted-foreground">
                          <Package className="h-14 w-14" />
                        </div>
                      )}
                      <button
                        onClick={() => toggleWish(product.productRef)}
                        className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/85 backdrop-blur transition ${
                          wished ? "text-destructive" : "text-muted-foreground"
                        }`}
                        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <Heart className={`h-4 w-4 ${wished ? "fill-current" : ""}`} />
                      </button>
                    </div>
                    <div className="mt-4 flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display font-semibold">{product.name}</h3>
                        <p className="text-xs text-muted-foreground">{categories.find((item) => item.value === product.category)?.label}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 fill-primary text-primary" /> {product.rating?.toFixed(1) ?? "0.0"}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-display text-lg font-bold gradient-text">{KSh(price)}</span>
                        {product.discountPrice ? <span className="ml-2 text-xs text-muted-foreground line-through">{KSh(product.price)}</span> : null}
                      </div>
                      <Button size="sm" variant="hero" onClick={() => addToCart(product)} disabled={addItemMutation.isPending || product.stockQuantity < 1}>
                        {addItemMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
                      </Button>
                    </div>
                  </article>
                );
              })}
              {products.length === 0 && (
                <p className="col-span-full py-10 text-center text-muted-foreground">No products match your search.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
