import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CreditCard, Loader2, Lock, Minus, Package, Plus, Smartphone, Tag, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cartApi, ordersApi, paymentsApi, type ApiCart } from "@/lib/api";
import { useAuthSession } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart & Checkout - Level Up Fitness" },
      { name: "description", content: "Review your cart and check out securely with Card, M-Pesa, or PayPal." },
    ],
  }),
  component: CartPage,
});

const KSh = (value: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);

function CartPage() {
  const session = useAuthSession();
  const queryClient = useQueryClient();
  const [promo, setPromo] = useState("");
  const [method, setMethod] = useState<"card" | "mpesa" | "paypal">("mpesa");
  const [phoneNumber, setPhoneNumber] = useState("");

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.get,
    enabled: !!session,
  });

  const updateCart = (cart: ApiCart) => queryClient.setQueryData(["cart"], cart);

  const updateQtyMutation = useMutation({
    mutationFn: ({ productRef, quantity }: { productRef: string; quantity: number }) => cartApi.updateItem(productRef, quantity),
    onSuccess: updateCart,
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not update cart"),
  });

  const removeMutation = useMutation({
    mutationFn: (productRef: string) => cartApi.removeItem(productRef),
    onSuccess: updateCart,
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not remove item"),
  });

  const promoMutation = useMutation({
    mutationFn: (promoCode: string) => cartApi.applyPromo(promoCode),
    onSuccess: (cart) => {
      updateCart(cart);
      toast.success("Promo code applied");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Invalid promo code"),
  });

  const clearMutation = useMutation({
    mutationFn: cartApi.clear,
    onSuccess: updateCart,
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not clear cart"),
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const cart = cartQuery.data;
      if (!cart || cart.items.length === 0) throw new Error("Your cart is empty");
      const order = await ordersApi.create({});
      return paymentsApi.initiate({
        orderRef: order.orderRef,
        amount: order.total,
        method,
        phoneNumber: method === "mpesa" ? phoneNumber || undefined : undefined,
      });
    },
    onSuccess: (payment) => {
      toast.success("Payment initiated", { description: `Reference: ${payment.paymentRef}` });
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Checkout failed"),
  });

  if (!session) {
    return (
      <div className="mx-auto grid min-h-[65vh] max-w-7xl place-items-center px-4 pt-10 sm:px-6">
        <div className="card-elevated max-w-md rounded-3xl p-8 text-center">
          <Lock className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 font-display text-3xl font-bold">Login to view your cart</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your cart, checkout, and payments are available after login.</p>
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
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Checkout</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Your cart</h1>
        </div>
        {items.length > 0 && (
          <Button variant="soft" onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending}>
            Clear cart
          </Button>
        )}
      </header>

      {cartQuery.isLoading ? (
        <div className="card-elevated grid place-items-center rounded-3xl py-16 text-muted-foreground">
          <Loader2 className="mb-3 h-8 w-8 animate-spin" />
          <p className="text-sm font-medium">Loading cart...</p>
        </div>
      ) : cartQuery.isError ? (
        <div className="card-elevated rounded-3xl p-10 text-center text-destructive">
          <p className="text-sm font-medium">Cart could not be loaded.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.productRef} className="card-elevated flex flex-wrap items-center gap-4 rounded-2xl p-4">
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-surface text-muted-foreground">
                  <Package className="h-8 w-8" />
                </div>
                <div className="min-w-[180px] flex-1">
                  <h3 className="font-display font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{KSh(item.unitPrice)}</p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                  <button
                    onClick={() => updateQtyMutation.mutate({ productRef: item.productRef, quantity: Math.max(1, item.quantity - 1) })}
                    className="grid h-7 w-7 place-items-center rounded-full hover:bg-background"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQtyMutation.mutate({ productRef: item.productRef, quantity: item.quantity + 1 })}
                    className="grid h-7 w-7 place-items-center rounded-full hover:bg-background"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <p className="w-24 text-right font-display font-bold">{KSh(item.unitPrice * item.quantity)}</p>
                <button onClick={() => removeMutation.mutate(item.productRef)} className="text-muted-foreground hover:text-destructive" aria-label="Remove item">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <div className="card-elevated rounded-2xl p-10 text-center">
                <p className="text-muted-foreground">Your cart is empty.</p>
                <Link to="/shop" className="mt-4 inline-block">
                  <Button variant="hero">Continue Shopping</Button>
                </Link>
              </div>
            )}

            <div className="card-elevated rounded-2xl p-5">
              <p className="font-display font-semibold inline-flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" /> Promo code
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Try: LEVELUP10</p>
              <div className="mt-3 flex gap-2">
                <Input value={promo} onChange={(event) => setPromo(event.target.value)} placeholder="Enter code" />
                <Button variant="soft" onClick={() => promoMutation.mutate(promo)} disabled={!promo.trim() || promoMutation.isPending}>
                  Apply
                </Button>
              </div>
            </div>
          </div>

          <aside className="card-elevated h-fit rounded-3xl p-6 lg:sticky lg:top-24 space-y-5">
            <h2 className="font-display text-xl font-bold">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <Row label="Subtotal" value={KSh(cart?.totals.subtotal ?? 0)} />
              {(cart?.totals.discount ?? 0) > 0 && <Row label="Discount" value={`-${KSh(cart?.totals.discount ?? 0)}`} muted />}
              <Row label="Delivery" value={(cart?.totals.deliveryFee ?? 0) === 0 ? "Free" : KSh(cart?.totals.deliveryFee ?? 0)} />
              <div className="my-2 border-t border-border" />
              <Row label="Total" value={KSh(cart?.totals.total ?? 0)} bold />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Method</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { key: "card", icon: CreditCard, label: "Card" },
                  { key: "mpesa", icon: Smartphone, label: "M-Pesa" },
                  { key: "paypal", icon: Wallet, label: "PayPal" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setMethod(item.key as typeof method)}
                    className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-xs font-medium transition ${
                      method === item.key ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                ))}
              </div>
              {method === "mpesa" && (
                <Input className="mt-3" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="M-Pesa phone number" />
              )}
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={() => checkoutMutation.mutate()}
              disabled={items.length === 0 || checkoutMutation.isPending}
            >
              {checkoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Pay Securely {KSh(cart?.totals.total ?? 0)}
            </Button>
            <p className="text-center text-xs text-muted-foreground">Payments are processed through the backend payment provider.</p>
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-display text-lg font-bold" : ""} ${muted ? "text-success" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
