import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Lock, Minus, Package, Plus, Smartphone, Tag, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cartApi, ordersApi, paymentsApi, type ApiCart } from "@/lib/api";
import { useAuthSession } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";
import { apiAssetUrl } from "@/lib/env";
import { CART_QUERY_KEY } from "@/lib/use-cart-count";
import { usePaymentStatus } from "@/lib/use-payment-status";

type Search = { orderRef?: string; paymentRef?: string; mode?: "pay_now" | "pay_on_delivery" };
export const Route = createFileRoute("/cart")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    orderRef: typeof search.orderRef === "string" ? search.orderRef : undefined,
    paymentRef: typeof search.paymentRef === "string" ? search.paymentRef : undefined,
    mode: search.mode === "pay_now" || search.mode === "pay_on_delivery" ? search.mode : undefined,
  }),
  head: () => ({ meta: [{ title: "Cart & Checkout - Level Up Fitness" }, { name: "description", content: "Checkout securely with M-Pesa or pay on delivery." }] }),
  component: CartPage,
});

const KSh = (value: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);

function CartPage() {
  const session = useAuthSession();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [promo, setPromo] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const cartQuery = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: cartApi.get,
    enabled: !!session,
  });
  const paymentQuery = usePaymentStatus(search.mode === "pay_now" ? search.paymentRef : undefined);
  const updateCart = (cart: ApiCart) => queryClient.setQueryData(CART_QUERY_KEY, cart);
  const updateQty = useMutation({ mutationFn: ({ productRef, quantity }: { productRef: string; quantity: number }) => cartApi.updateItem(productRef, quantity), onSuccess: updateCart, onError: showError });
  const removeItem = useMutation({ mutationFn: cartApi.removeItem, onSuccess: updateCart, onError: showError });
  const clearCart = useMutation({ mutationFn: cartApi.clear, onSuccess: updateCart, onError: showError });
  const applyPromo = useMutation({ mutationFn: cartApi.applyPromo, onSuccess: (cart) => { updateCart(cart); toast.success("Promo code applied"); }, onError: showError });

  const checkout = useMutation({
    mutationFn: async (mode: "pay_now" | "pay_on_delivery") => {
      if (!search.orderRef && !cartQuery.data?.items.length) throw new Error("Your cart is empty");
      const orderRef = search.orderRef ?? (await ordersApi.create({})).orderRef;
      const payment = await paymentsApi.initiate({ orderRef, method: mode === "pay_now" ? "mpesa" : "cash_on_delivery", phoneNumber: mode === "pay_now" ? phoneNumber : undefined });
      return { orderRef, payment, mode };
    },
    onSuccess: ({ orderRef, payment, mode }) => {
      void navigate({ to: "/cart", search: { orderRef, paymentRef: payment.paymentRef, mode }, replace: true });
      toast.success(mode === "pay_on_delivery" ? "Order placed" : payment.status === "failed" ? "M-Pesa prompt failed" : payment.status === "cancelled" ? "M-Pesa prompt cancelled" : "M-Pesa prompt sent");
      void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
    onError: showError,
  });

  useEffect(() => {
    if (paymentQuery.data?.status === "succeeded") toast.success("M-Pesa payment confirmed", { description: `Order ${search.orderRef} is paid.` });
  }, [paymentQuery.data?.status, search.orderRef]);

  if (!session) return <div className="mx-auto grid min-h-[65vh] max-w-7xl place-items-center px-4"><div className="card-elevated max-w-md rounded-3xl p-8 text-center"><Lock className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-4 font-display text-3xl font-bold">Login to view your cart</h1><a href={loginUrlFor({ redirect: "/cart" })} className="mt-6 inline-block"><Button variant="hero">Login to continue</Button></a></div></div>;
  if (cartQuery.isLoading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (cartQuery.isError) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="font-display text-2xl font-bold">Cart could not be loaded</h1><Button className="mt-5" onClick={() => cartQuery.refetch()}>Try again</Button></div>;

  const cart = cartQuery.data;
  const items = cart?.items ?? [];
  const canCreateOrder = items.length > 0;
  const activePayment = paymentQuery.data;
  const waiting = activePayment?.status === "pending" || activePayment?.status === "processing";
  const payableTotal = activePayment?.amount ?? cart?.totals.total ?? 0;

  return <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6">
    <div className="mb-8 flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Shop</p><h1 className="mt-2 font-display text-4xl font-bold">Your Cart</h1></div>{items.length > 0 && <Button variant="ghost" onClick={() => clearCart.mutate()} disabled={clearCart.isPending}><Trash2 className="h-4 w-4" /> Clear</Button>}</div>
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {items.map((item) => <div key={item.productRef} className="card-elevated flex flex-wrap items-center gap-4 rounded-2xl p-4">
          {item.image ? <img src={apiAssetUrl(item.image)} alt={item.name} className="h-20 w-20 rounded-2xl object-cover" /> : <div className="grid h-20 w-20 place-items-center rounded-2xl bg-surface"><Package className="h-8 w-8 text-muted-foreground" /></div>}
          <div className="min-w-[180px] flex-1"><h3 className="font-display font-semibold">{item.name}</h3><p className="text-sm text-muted-foreground">{KSh(item.unitPrice)}</p></div>
          <div className="flex items-center gap-1 rounded-full bg-muted p-1"><button className="grid h-7 w-7 place-items-center" onClick={() => updateQty.mutate({ productRef: item.productRef, quantity: Math.max(1, item.quantity - 1) })}><Minus className="h-3 w-3" /></button><span className="w-6 text-center text-sm font-semibold">{item.quantity}</span><button className="grid h-7 w-7 place-items-center" onClick={() => updateQty.mutate({ productRef: item.productRef, quantity: item.quantity + 1 })}><Plus className="h-3 w-3" /></button></div>
          <p className="w-24 text-right font-display font-bold">{KSh(item.unitPrice * item.quantity)}</p><button onClick={() => removeItem.mutate(item.productRef)} aria-label="Remove item"><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
        </div>)}
        {!items.length && <div className="card-elevated rounded-2xl p-10 text-center"><p className="text-muted-foreground">{search.orderRef ? "Your order has been created. Complete its payment on the right." : "Your cart is empty."}</p>{!search.orderRef && <Button asChild className="mt-4" variant="hero"><Link to="/shop">Continue shopping</Link></Button>}</div>}
        {items.length > 0 && <div className="card-elevated rounded-2xl p-5"><p className="inline-flex items-center gap-2 font-display font-semibold"><Tag className="h-4 w-4 text-primary" /> Promo code</p><div className="mt-3 flex gap-2"><Input value={promo} onChange={(event) => setPromo(event.target.value)} placeholder="Enter code" /><Button variant="soft" onClick={() => applyPromo.mutate(promo)} disabled={!promo.trim() || applyPromo.isPending}>Apply</Button></div></div>}
      </div>
      <aside className="card-elevated h-fit space-y-5 rounded-3xl p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-xl font-bold">Order Summary</h2>
        <div className="space-y-2 text-sm"><Row label="Subtotal" value={KSh(cart?.totals.subtotal ?? activePayment?.amount ?? 0)} /><Row label="Discount" value={`-${KSh(cart?.totals.discount ?? 0)}`} /><Row label="Delivery" value={KSh(cart?.totals.deliveryFee ?? 0)} /><div className="border-t" /><Row label="Total" value={KSh(payableTotal)} bold /></div>
        <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pay now with</p><div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#43B02A] bg-[#43B02A]/10 p-3 text-sm font-semibold text-[#2E7D1E]"><Smartphone className="h-5 w-5 text-[#43B02A]" /> M-Pesa</div><Input className="mt-3" inputMode="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="0712 345 678" /></div>
        {search.paymentRef && <PaymentNotice mode={search.mode} paymentRef={search.paymentRef} orderRef={search.orderRef} status={activePayment?.status} loading={paymentQuery.isLoading} />}
        <Button className="w-full" size="lg" variant="mpesa" onClick={() => checkout.mutate("pay_now")} disabled={(!search.orderRef && !canCreateOrder) || checkout.isPending || waiting || phoneNumber.replace(/\D/g, "").length < 9}>{checkout.isPending || waiting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}{activePayment?.status === "failed" || activePayment?.status === "cancelled" ? "Retry M-Pesa" : `Pay now ${KSh(payableTotal)}`}</Button>
        <Button className="w-full" size="lg" variant="soft" onClick={() => checkout.mutate("pay_on_delivery")} disabled={!canCreateOrder || checkout.isPending || !!search.paymentRef}><Wallet className="h-4 w-4" /> Pay on delivery</Button>
        <p className="text-center text-xs text-muted-foreground">Orders are marked paid only after Safaricom confirms the transaction.</p>
      </aside>
    </div>
  </div>;
}

function PaymentNotice({ mode, paymentRef, orderRef, status, loading }: { mode?: string; paymentRef: string; orderRef?: string; status?: string; loading: boolean }) {
  const label = mode === "pay_on_delivery" ? "Order placed" : status === "succeeded" ? "Payment confirmed" : status === "cancelled" ? "M-Pesa prompt cancelled" : status === "failed" ? "Payment not completed" : "Waiting for M-Pesa confirmation";
  return <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm"><p className="font-semibold text-primary">{label}</p>{loading && <Loader2 className="mt-2 h-4 w-4 animate-spin" />}<p className="mt-1 text-muted-foreground">Order: {orderRef}</p><p className="text-muted-foreground">Payment: {paymentRef}</p></div>;
}
function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) { return <div className={`flex justify-between ${bold ? "font-display text-lg font-bold" : ""}`}><span className={bold ? "" : "text-muted-foreground"}>{label}</span><span>{value}</span></div>; }
function showError(error: unknown) { toast.error(error instanceof Error ? error.message : "Operation failed"); }
