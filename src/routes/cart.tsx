import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, Trash2, CreditCard, Smartphone, Wallet, Tag, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart & Checkout — Level Up Fitness" },
      { name: "description", content: "Review your cart and check out securely with Card, M-Pesa, or PayPal." },
    ],
  }),
  component: CartPage,
});

const initial = [
  { name: "Whey Protein 2kg", emoji: "🥤", price: 42, qty: 1 },
  { name: "Performance Tee", emoji: "👕", price: 32, qty: 2 },
  { name: "Resistance Band Set", emoji: "🎯", price: 24, qty: 1 },
];

function CartPage() {
  const [items, setItems] = useState(initial);
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState<"card" | "mpesa" | "paypal">("card");

  const subtotal = items.reduce((a, b) => a + b.price * b.qty, 0);
  const shipping = subtotal > 100 ? 0 : 8;
  const total = Math.max(0, subtotal - discount) + shipping;

  const updateQty = (n: string, d: number) => setItems(s => s.map(i => i.name === n ? { ...i, qty: Math.max(1, i.qty + d) } : i));
  const remove = (n: string) => setItems(s => s.filter(i => i.name !== n));
  const applyPromo = () => {
    if (promo.toUpperCase() === "LEVELUP") { setDiscount(15); toast.success("Promo applied: -$15"); }
    else toast.error("Invalid promo code");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Checkout</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Your cart</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          {items.map((i) => (
            <div key={i.name} className="card-elevated flex items-center gap-4 rounded-2xl p-4">
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-surface text-4xl">{i.emoji}</div>
              <div className="flex-1">
                <h3 className="font-display font-semibold">{i.name}</h3>
                <p className="text-sm text-muted-foreground">${i.price}</p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                <button onClick={() => updateQty(i.name, -1)} className="grid h-7 w-7 place-items-center rounded-full hover:bg-background"><Minus className="h-3 w-3" /></button>
                <span className="w-6 text-center text-sm font-semibold">{i.qty}</span>
                <button onClick={() => updateQty(i.name, 1)} className="grid h-7 w-7 place-items-center rounded-full hover:bg-background"><Plus className="h-3 w-3" /></button>
              </div>
              <p className="font-display font-bold w-16 text-right">${i.price * i.qty}</p>
              <button onClick={() => remove(i.name)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="card-elevated rounded-2xl p-10 text-center">
              <p className="text-muted-foreground">Your cart is empty.</p>
              <Link to="/shop" className="mt-4 inline-block"><Button variant="hero">Continue Shopping</Button></Link>
            </div>
          )}

          <div className="card-elevated rounded-2xl p-5">
            <p className="font-display font-semibold inline-flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /> Promo code</p>
            <p className="text-xs text-muted-foreground mt-1">Try: LEVELUP</p>
            <div className="mt-3 flex gap-2">
              <input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Enter code" className="flex-1 rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <Button variant="soft" onClick={applyPromo}>Apply</Button>
            </div>
          </div>
        </div>

        <aside className="card-elevated h-fit rounded-3xl p-6 lg:sticky lg:top-24 space-y-5">
          <h2 className="font-display text-xl font-bold">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <Row label="Subtotal" value={`$${subtotal}`} />
            {discount > 0 && <Row label="Discount" value={`-$${discount}`} muted />}
            <Row label="Shipping" value={shipping === 0 ? "Free" : `$${shipping}`} />
            <div className="border-t border-border my-2" />
            <Row label="Total" value={`$${total}`} bold />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Method</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                { k: "card", icon: CreditCard, label: "Card" },
                { k: "mpesa", icon: Smartphone, label: "M-Pesa" },
                { k: "paypal", icon: Wallet, label: "PayPal" },
              ].map((m) => (
                <button key={m.k} onClick={() => setMethod(m.k as typeof method)} className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-xs font-medium transition ${method === m.k ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>
                  <m.icon className="h-5 w-5" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <Button variant="hero" size="lg" className="w-full" onClick={() => toast.success("Order placed!", { description: `Total $${total} · ${method.toUpperCase()}` })}>
            <Lock className="h-4 w-4" /> Pay Securely ${total}
          </Button>
          <p className="text-center text-xs text-muted-foreground">256-bit SSL encrypted checkout</p>
        </aside>
      </div>
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
