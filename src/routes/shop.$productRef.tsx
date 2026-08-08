import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Heart, Loader2, Minus, Package, Plus, Star } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cartApi, productsApi, type ApiProduct } from "@/lib/api";
import { useAuthSession } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";
import { apiAssetUrl } from "@/lib/env";
import { CART_QUERY_KEY } from "@/lib/use-cart-count";

export const Route = createFileRoute("/shop/$productRef")({
  head: () => ({
    meta: [
      { title: "Product - Level Up Fitness" },
      { name: "description", content: "View a Level Up Fitness shop product." },
    ],
  }),
  component: ProductDetailPage,
});

const categoryLabels: Record<ApiProduct["category"], string> = {
  supplements: "Supplements",
  gym_apparel: "Gym apparel",
  fitness_equipment: "Fitness equipment",
  resistance_bands: "Resistance bands",
  water_bottles: "Water bottles",
  protein_shakers: "Protein shakers",
  accessories: "Accessories",
};

const KSh = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);

function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square animate-pulse rounded-[1.25rem] bg-muted" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 w-20 animate-pulse rounded-[0.75rem] bg-muted" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-4 w-28 animate-pulse rounded-full bg-muted" />
          <div className="h-12 w-full animate-pulse rounded-[1rem] bg-muted" />
          <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-muted" />
          <div className="h-10 w-40 animate-pulse rounded-xl bg-muted" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}

/** Main image carousel plus a thumbnail strip that drives it. */
function ProductGallery({ product }: { product: ApiProduct }) {
  const images = product.images ?? [];
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;

    const syncActiveIndex = () => setActiveIndex(carouselApi.selectedScrollSnap());
    syncActiveIndex();
    carouselApi.on("select", syncActiveIndex);
    return () => {
      carouselApi.off("select", syncActiveIndex);
    };
  }, [carouselApi]);

  if (!images.length) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-[1.25rem] bg-muted text-muted-foreground">
        <Package className="h-16 w-16" />
        <p className="text-sm font-medium">{categoryLabels[product.category]}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Carousel setApi={setCarouselApi} className="w-full">
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={image}>
              <div className="aspect-square overflow-hidden rounded-[1.25rem] bg-muted">
                <img
                  src={apiAssetUrl(image)}
                  alt={`${product.name} — photo ${index + 1} of ${images.length}`}
                  className="h-full w-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-3" />
            <CarouselNext className="right-3" />
          </>
        )}
      </Carousel>

      {images.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => carouselApi?.scrollTo(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === activeIndex}
              className={`h-20 w-20 overflow-hidden rounded-[0.75rem] border-2 bg-muted transition ${
                index === activeIndex
                  ? "border-primary"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={apiAssetUrl(image)}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductDetailPage() {
  const { productRef } = Route.useParams();
  const session = useAuthSession();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [wished, setWished] = useState(false);

  const productQuery = useQuery({
    queryKey: ["public", "product", productRef],
    queryFn: () => productsApi.get(productRef),
    retry: false,
  });

  const addItemMutation = useMutation({
    mutationFn: (amount: number) => cartApi.addItem(productRef, amount),
    onSuccess: () => {
      toast.success("Added to cart");
      void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not add item"),
  });

  if (productQuery.isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <section className="card-elevated rounded-[1.25rem] p-8 sm:p-10">
          <p className="text-sm font-semibold text-primary">Shop</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Product not found</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            We could not find that product, or it is no longer available. Try again or browse the
            rest of the shop.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => void productQuery.refetch()} variant="hero">
              Retry
            </Button>
            <Button asChild variant="soft">
              <Link to="/shop">
                Back to shop
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const product = productQuery.data;
  const price = product.discountPrice ?? product.price;
  const inStock = product.stockQuantity > 0;
  const lowStock = inStock && product.stockQuantity <= product.lowStockThreshold;
  const maxQuantity = Math.max(product.stockQuantity, 1);

  function addToCart() {
    if (!session) {
      window.location.assign(
        loginUrlFor({ redirect: `/shop/${productRef}`, addProductRef: productRef }),
      );
      return;
    }
    addItemMutation.mutate(quantity);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
        <Link to="/shop">
          <ArrowLeft className="h-4 w-4" />
          Back to shop
        </Link>
      </Button>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery product={product} />

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
              {categoryLabels[product.category]}
            </Badge>
            {lowStock && (
              <Badge className="rounded-full bg-amber-100 text-amber-800 shadow-none hover:bg-amber-100">
                Low stock
              </Badge>
            )}
            {!inStock && (
              <Badge variant="outline" className="rounded-full">
                Out of stock
              </Badge>
            )}
          </div>

          <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">{product.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {product.brand || "Level Up selection"} · SKU {product.sku}
          </p>

          <div className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-primary text-primary" />
            {product.rating?.toFixed(1) ?? "0.0"}
          </div>

          <div className="mt-6 flex items-end gap-3">
            <p className="font-display text-4xl font-bold">{KSh(price)}</p>
            {product.discountPrice ? (
              <p className="pb-1 text-sm text-muted-foreground line-through">
                {KSh(product.price)}
              </p>
            ) : null}
          </div>

          <p className="mt-6 max-w-prose whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-xl border border-border">
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-l-xl rounded-r-none"
                disabled={quantity <= 1}
                onClick={() => setQuantity((current) => Math.max(current - 1, 1))}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium" aria-live="polite">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-l-none rounded-r-xl"
                disabled={quantity >= maxQuantity}
                onClick={() => setQuantity((current) => Math.min(current + 1, maxQuantity))}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="hero"
              size="lg"
              onClick={addToCart}
              disabled={addItemMutation.isPending || !inStock}
              className="min-w-40"
            >
              {addItemMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Add to cart
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <Button
              variant="soft"
              size="lg"
              onClick={() => setWished((current) => !current)}
              aria-pressed={wished}
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={`h-4 w-4 ${wished ? "fill-current text-primary" : ""}`} />
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {inStock
              ? `${product.stockQuantity} available for immediate checkout.`
              : "Out of stock right now — check back soon."}
          </p>
        </div>
      </div>
    </div>
  );
}
