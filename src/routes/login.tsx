import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { completeAuthContinuation, registerUrlFor, type AuthContinuation } from "@/lib/auth-continuation";

export const Route = createFileRoute("/login")({
  validateSearch: (search): AuthContinuation => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    addProductRef: typeof search.addProductRef === "string" ? search.addProductRef : undefined,
    planRef: typeof search.planRef === "string" ? search.planRef : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Login - Level Up Fitness" },
      { name: "description", content: "Login to subscribe, manage your cart, and access your Level Up dashboard." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await authApi.login(email, password);
      const next = await completeAuthContinuation(search);
      toast.success("Welcome back");
      window.location.assign(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-7xl place-items-center px-4 pt-10 sm:px-6">
      <div className="card-elevated w-full max-w-md rounded-3xl p-8">
        <div className="mb-6">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Login</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to continue your cart, subscription, or dashboard.</p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Login
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          New to Level Up?{" "}
          <a href={registerUrlFor(search)} className="font-semibold text-primary hover:underline">
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
}
