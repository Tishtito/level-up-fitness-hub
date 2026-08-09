import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Lock, Minus, Package, Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cartApi, type ApiCart } from "@/lib/api";
import { useAuthSession } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";
import { apiAssetUrl } from "@/lib/env";
import { CART_QUERY_KEY } from "@/lib/use-cart-count";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag - Level Up Fitness" },
      { name: "description", content: "Review your bag before checkout." },
    ],
  }),
  component: CartPage,
});

const KSh = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);

function showError(error: unknown) {
  toast.error(error instanceof Error ? error.message : "Operation failed");
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between", bold && "font-display text-lg font-bold")}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="card-elevated flex items-center gap-4 rounded-2xl p-4">
            <Skeleton className="h-20 w-20 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-1/5" />
            </div>
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-72 rounded-3xl" />
    </div>
  );
}

function CartPage() {
  const session = useAuthSession();
  const queryClient = useQueryClient();
  const [promo, setPromo] = useState("");

  const cartQuery = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: cartApi.get,
    enabled: !!session,
  });

  const updateCart = (cart: ApiCart) => queryClient.setQueryData(CART_QUERY_KEY, cart);
  const updateQty = useMutation({
    mutationFn: ({ productRef, quantity }: { productRef: string; quantity: number }) =>
      cartApi.updateItem(productRef, quantity),
    onSuccess: updateCart,
    onError: showError,
  });
  const removeItem = useMutation({
    mutationFn: cartApi.removeItem,
    onSuccess: updateCart,
    onError: showError,
  });
  const clearCart = useMutation({
    mutationFn: cartApi.clear,
    onSuccess: updateCart,
    onError: showError,
  });
  const applyPromo = useMutation({
    mutationFn: cartApi.applyPromo,
    onSuccess: (cart) => {
      updateCart(cart);
      toast.success("Promo code applied");
    },
    onError: showError,
  });

  if (!session) {
    return (
      <div className="mx-auto grid min-h-[65vh] max-w-7xl place-items-center px-4">
        <div className="card-elevated max-w-md rounded-3xl p-8 text-center">
          <Lock className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 font-display text-3xl font-bold">Login to view your bag</h1>
          <a href={loginUrlFor({ redirect: "/cart" })} className="mt-6 inline-block">
            <Button variant="hero">Login to continue</Button>
          </a>
        </div>
      </div>
    );
  }

  const cart = cartQuery.data;
  const items = cart?.items ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Shop</p>
          <h1 className="mt-2 font-display text-4xl font-bold">
            Your bag{items.length > 0 ? ` (${items.length})` : ""}
          </h1>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" onClick={() => clearCart.mutate()} disabled={clearCart.isPending}>
            <Trash2 className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {cartQuery.isLoading ? (
        <CartSkeleton />
      ) : cartQuery.isError ? (
        <div className="card-elevated rounded-3xl p-10 text-center">
          <h2 className="font-display text-2xl font-bold">Your bag could not be loaded</h2>
          <Button className="mt-5" variant="hero" onClick={() => void cartQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="card-elevated rounded-3xl p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl font-bold">Your bag is empty</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse the shop and add something to get started.
          </p>
          <Button asChild className="mt-6" variant="hero">
            <Link to="/shop">Continue shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map((item) => {
              const atStockLimit =
                item.stockQuantity !== undefined && item.quantity >= item.stockQuantity;

              return (
                <div
                  key={item.productRef}
                  className="card-elevated flex flex-wrap items-center gap-4 rounded-2xl p-4"
                >
                  {item.image ? (
                    <img
                      src={apiAssetUrl(item.image)}
                      alt={item.name}
                      className="h-20 w-20 rounded-2xl object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-20 w-20 place-items-center rounded-2xl bg-surface">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  <div className="min-w-[180px] flex-1">
                    <h3 className="font-display font-semibold">
                      <Link
                        to="/shop/$productRef"
                        params={{ productRef: item.productRef }}
                        className="transition-colors hover:text-primary"
                      >
                        {item.name}
                      </Link>
                    </h3>
                    <p className="text-sm text-muted-foreground">{KSh(item.unitPrice)}</p>
                    {atStockLimit && (
                      <p className="mt-1 text-xs font-medium text-amber-700">
                        Only {item.stockQuantity} left
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                    <button
                      type="button"
                      className="grid h-7 w-7 place-items-center rounded-full transition hover:bg-background disabled:opacity-40"
                      onClick={() =>
                        updateQty.mutate({
                          productRef: item.productRef,
                          quantity: item.quantity - 1,
                        })
                      }
                      disabled={item.quantity <= 1 || updateQty.isPending}
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold" aria-live="polite">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="grid h-7 w-7 place-items-center rounded-full transition hover:bg-background disabled:opacity-40"
                      onClick={() =>
                        updateQty.mutate({
                          productRef: item.productRef,
                          quantity: item.quantity + 1,
                        })
                      }
                      disabled={atStockLimit || updateQty.isPending}
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <p className="w-24 text-right font-display font-bold">
                    {KSh(item.unitPrice * item.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem.mutate(item.productRef)}
                    aria-label={`Remove ${item.name}`}
                    className="text-muted-foreground transition hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}

            <div className="card-elevated rounded-2xl p-5">
              <p className="inline-flex items-center gap-2 font-display font-semibold">
                <Tag className="h-4 w-4 text-primary" /> Promo code
              </p>
              <div className="mt-3 flex gap-2">
                <Input
                  value={promo}
                  onChange={(event) => setPromo(event.target.value)}
                  placeholder="Enter code"
                  aria-label="Promo code"
                />
                <Button
                  variant="soft"
                  onClick={() => applyPromo.mutate(promo)}
                  disabled={!promo.trim() || applyPromo.isPending}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>

          <aside className="card-elevated h-fit space-y-5 rounded-3xl p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-xl font-bold">Order summary</h2>
            <div className="space-y-2 text-sm">
              <SummaryRow label="Subtotal" value={KSh(cart?.totals.subtotal ?? 0)} />
              <SummaryRow label="Discount" value={`-${KSh(cart?.totals.discount ?? 0)}`} />
              <SummaryRow label="Delivery" value={KSh(cart?.totals.deliveryFee ?? 0)} />
              <div className="border-t" />
              <SummaryRow label="Total" value={KSh(cart?.totals.total ?? 0)} bold />
            </div>
            <Button asChild className="w-full" size="lg" variant="hero">
              <Link to="/checkout">
                Proceed to checkout
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Delivery is priced at checkout once you pick a method.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
