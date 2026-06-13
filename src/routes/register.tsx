import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { completeAuthContinuation, loginUrlFor, parseAuthContinuation } from "@/lib/auth-continuation";

export const Route = createFileRoute("/register")({
  validateSearch: parseAuthContinuation,
  head: () => ({
    meta: [
      { title: "Create Account - Level Up Fitness" },
      { name: "description", content: "Create your Level Up Fitness account." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const search = Route.useSearch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await authApi.register({ name, email, phone: phone || undefined, password });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
      setLoading(false);
      return;
    }

    try {
      const next = await completeAuthContinuation(search);
      toast.success("Account created");
      window.location.replace(next);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Account created, but the previous action failed: ${error.message}`
          : "Account created, but the previous action could not be completed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-7xl place-items-center px-4 pt-10 sm:px-6">
      <div className="card-elevated w-full max-w-md rounded-3xl p-8">
        <div className="mb-6">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground">
            <UserPlus className="h-5 w-5" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Create account</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Start leveling up</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create an account only when you need cart, checkout, subscriptions, or your dashboard.</p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Create account
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href={loginUrlFor(search)} className="font-semibold text-primary hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
