import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Heart, Star, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Level Up Fitness" },
      { name: "description", content: "Premium gym apparel, supplements, equipment, resistance bands, water bottles & shakers." },
    ],
  }),
  component: ShopPage,
});

const categories = ["All", "Apparel", "Supplements", "Equipment", "Bands", "Bottles", "Shakers"];

const products = [
  { name: "Whey Protein 2kg", cat: "Supplements", price: 42, rating: 4.8, emoji: "🥤" },
  { name: "Pre-Workout Boost", cat: "Supplements", price: 28, rating: 4.6, emoji: "⚡" },
  { name: "Performance Tee", cat: "Apparel", price: 32, rating: 4.7, emoji: "👕" },
  { name: "Compression Leggings", cat: "Apparel", price: 48, rating: 4.9, emoji: "🩱" },
  { name: "Adjustable Dumbbells", cat: "Equipment", price: 189, rating: 4.9, emoji: "🏋️" },
  { name: "Yoga Mat Pro", cat: "Equipment", price: 54, rating: 4.8, emoji: "🧘" },
  { name: "Resistance Band Set", cat: "Bands", price: 24, rating: 4.7, emoji: "🎯" },
  { name: "Heavy Pull Band", cat: "Bands", price: 18, rating: 4.5, emoji: "🪢" },
  { name: "Insulated Water Bottle", cat: "Bottles", price: 22, rating: 4.9, emoji: "💧" },
  { name: "Steel 1L Bottle", cat: "Bottles", price: 28, rating: 4.6, emoji: "🧊" },
  { name: "Premium Shaker", cat: "Shakers", price: 18, rating: 4.7, emoji: "🧴" },
  { name: "Smart Shaker Bottle", cat: "Shakers", price: 26, rating: 4.5, emoji: "🥛" },
];

function ShopPage() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [wishlist, setWishlist] = useState<string[]>([]);

  const filtered = useMemo(() =>
    products.filter(p => (cat === "All" || p.cat === cat) && p.name.toLowerCase().includes(q.toLowerCase())),
  [cat, q]);

  const toggleWish = (n: string) => {
    setWishlist((w) => w.includes(n) ? w.filter(x => x !== n) : [...w, n]);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Shop</p>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Gear that performs</h1>
          <p className="mt-2 text-muted-foreground">Hand-picked apparel, supplements & equipment.</p>
        </div>
        <Link to="/cart"><Button variant="hero"><ShoppingBag className="h-4 w-4" /> View Cart</Button></Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="card-elevated h-fit rounded-3xl p-5 lg:sticky lg:top-24">
          <p className="font-display font-semibold inline-flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Categories</p>
          <ul className="mt-3 space-y-1">
            {categories.map((c) => (
              <li key={c}>
                <button onClick={() => setCat(c)} className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${cat === c ? "bg-[image:var(--gradient-primary)] text-primary-foreground" : "hover:bg-surface/60"}`}>{c}</button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="space-y-6">
          <div className="card-elevated flex items-center gap-3 rounded-2xl p-3">
            <Search className="h-5 w-5 text-muted-foreground ml-2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." className="w-full bg-transparent py-2 text-sm outline-none" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <article key={p.name} className="card-elevated group rounded-3xl p-5">
                <div className="relative aspect-square rounded-2xl bg-surface grid place-items-center text-7xl">
                  {p.emoji}
                  <button onClick={() => toggleWish(p.name)} className={`absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/80 backdrop-blur transition ${wishlist.includes(p.name) ? "text-destructive" : "text-muted-foreground"}`}>
                    <Heart className={`h-4 w-4 ${wishlist.includes(p.name) ? "fill-current" : ""}`} />
                  </button>
                </div>
                <div className="mt-4 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-semibold">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.cat}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs"><Star className="h-3 w-3 fill-primary text-primary" /> {p.rating}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-display text-lg font-bold gradient-text">${p.price}</span>
                  <Button size="sm" variant="hero" onClick={() => toast.success(`Added ${p.name} to cart`)}>Add</Button>
                </div>
              </article>
            ))}
            {filtered.length === 0 && <p className="col-span-full text-center text-muted-foreground py-10">No products match your search.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
