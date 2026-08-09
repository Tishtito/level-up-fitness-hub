import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Loader2, Package, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ordersApi, type ApiOrder } from "@/lib/api";
import { useAuthState } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";
import { apiAssetUrl } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { usePaymentStatus } from "@/lib/use-payment-status";
import { cn } from "@/lib/utils";

type Search = { paymentRef?: string };

export const Route = createFileRoute("/orders/$orderRef")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    paymentRef: typeof search.paymentRef === "string" ? search.paymentRef : undefined,
  }),
  head: () => ({ meta: [{ title: "Order - Level Up Fitness" }] }),
  component: OrderPage,
});

const KSh = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);

const deliveryLabels: Record<ApiOrder["deliveryMethod"], string> = {
  standard: "Standard delivery",
  express: "Express delivery",
  pickup: "Pickup in store",
};

const statusStyles: Record<ApiOrder["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-success/15 text-success",
  processing: "bg-amber-100 text-amber-800",
  shipped: "bg-primary/15 text-primary",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-muted text-muted-foreground",
};

function OrderPage() {
  const { orderRef } = Route.useParams();
  const search = Route.useSearch();
  const { session, isHydrated } = useAuthState();
  const queryClient = useQueryClient();

  const orderQuery = useQuery({
    queryKey: ["order", orderRef],
    queryFn: () => ordersApi.get(orderRef),
    enabled: !!session,
    retry: false,
  });

  // Keep polling while an M-Pesa prompt is outstanding; the order flips to `paid` server-side.
  const paymentQuery = usePaymentStatus(search.paymentRef);
  const payment = paymentQuery.data;

  const order = orderQuery.data;
  // Gate on the method, not just the status: a cash-on-delivery payment is `pending`
  // forever, which is not the same thing as an outstanding M-Pesa prompt.
  const awaitingMpesa =
    payment?.method === "mpesa" &&
    (payment.status === "pending" || payment.status === "processing");
  const payOnDelivery = !search.paymentRef && order?.status === "pending";
  // The thank-you framing belongs to the moment right after checkout. Reached from history,
  // an order from last month should just look like an order.
  const justPlaced =
    !!search.paymentRef ||
    (!!order?.createdAt && Date.now() - new Date(order.createdAt).getTime() < 10 * 60 * 1000);

  // The webhook flips the order to `paid` server-side, so re-read it once the prompt clears.
  useEffect(() => {
    if (payment?.status !== "succeeded") return;
    void queryClient.invalidateQueries({ queryKey: ["order", orderRef] });
  }, [payment?.status, orderRef, queryClient]);

  if (!isHydrated)
    return (
      <Centered>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Centered>
    );

  if (!session) {
    return (
      <Centered>
        <div className="card-elevated max-w-md rounded-3xl p-8 text-center">
          <h1 className="font-display text-2xl font-bold">Login to view this order</h1>
          <a href={loginUrlFor({ redirect: `/orders/${orderRef}` })} className="mt-6 inline-block">
            <Button variant="hero">Login to continue</Button>
          </a>
        </div>
      </Centered>
    );
  }

  if (orderQuery.isLoading)
    return (
      <Centered>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Centered>
    );

  if (orderQuery.isError || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Order not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {orderQuery.error instanceof Error
            ? orderQuery.error.message
            : "We could not load this order."}
        </p>
        <Button asChild className="mt-6" variant="hero">
          <Link to="/shop">Back to shop</Link>
        </Button>
      </div>
    );
  }

  const address = order.shippingAddress;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6">
      <Link
        to="/history"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to your activity
      </Link>

      {justPlaced ? (
        <div className="card-elevated mt-4 rounded-3xl p-8 text-center sm:p-10">
          {awaitingMpesa ? (
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          ) : (
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          )}
          <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
            {awaitingMpesa ? "Waiting for your M-Pesa confirmation" : "Thank you for your order"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {awaitingMpesa ? (
              "Approve the prompt on your phone. This page updates automatically."
            ) : payOnDelivery ? (
              <>
                Have <span className="font-semibold text-foreground">{KSh(order.total)}</span> ready
                for the rider when your order arrives.
              </>
            ) : (
              "We have received your order and will be in touch about delivery."
            )}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="outline" className="rounded-full">
              Order {order.orderRef}
            </Badge>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                statusStyles[order.status],
              )}
            >
              {order.status}
            </span>
          </div>
        </div>
      ) : (
        <header className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">Order {order.orderRef}</h1>
            {order.createdAt && (
              <p className="mt-2 text-sm text-muted-foreground">
                Placed {formatDate(order.createdAt)}
              </p>
            )}
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold capitalize",
              statusStyles[order.status],
            )}
          >
            {order.status}
          </span>
        </header>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="card-elevated rounded-3xl p-6">
          <h2 className="font-display text-lg font-bold">Items</h2>
          <ul className="mt-4 space-y-4">
            {order.items.map((item) => (
              <li key={item.productRef} className="flex gap-3">
                {item.image ? (
                  <img
                    src={apiAssetUrl(item.image)}
                    alt=""
                    aria-hidden
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-muted">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Qty: {item.quantity} &middot; {KSh(item.unitPrice)} each
                  </p>
                </div>
                <p className="text-sm font-semibold">{KSh(item.total)}</p>
              </li>
            ))}
          </ul>

          <div className="mt-5 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{KSh(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>-{KSh(order.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span>{order.deliveryFee ? KSh(order.deliveryFee) : "Free"}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t pt-4 font-display text-xl font-bold">
            <span>Total</span>
            <span>{KSh(order.total)}</span>
          </div>
        </section>

        <section className="card-elevated h-fit rounded-3xl p-6">
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold">
            <Truck className="h-4 w-4 text-primary" />
            {deliveryLabels[order.deliveryMethod] ?? "Delivery"}
          </h2>
          <div className="mt-4 space-y-1 text-sm">
            <p className="font-medium">{address?.fullName}</p>
            <p className="text-muted-foreground">{address?.phone}</p>
            {address?.email && <p className="text-muted-foreground">{address.email}</p>}
            <p className="pt-2 text-muted-foreground">{address?.addressLine}</p>
            <p className="text-muted-foreground">
              {[address?.city, address?.county].filter(Boolean).join(", ")}
            </p>
            {address?.instructions && (
              <p className="pt-2 text-xs text-muted-foreground">Note: {address.instructions}</p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="hero">
              <Link to="/shop">Continue shopping</Link>
            </Button>
            <Button asChild variant="soft">
              <Link to="/history">Your activity</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-[60vh] place-items-center px-4">{children}</div>;
}
