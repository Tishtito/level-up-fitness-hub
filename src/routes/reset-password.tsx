import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";

type ResetPasswordSearch = {
  email?: string;
  code?: string;
};

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => ({
    email: optionalString(search.email),
    code: optionalString(search.code),
  }),
  head: () => ({
    meta: [
      { title: "Reset Password - Level Up Fitness" },
      { name: "description", content: "Reset your Level Up Fitness password." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const search = Route.useSearch();
  const [email, setEmail] = useState(search.email ?? "");
  const [code, setCode] = useState(search.code ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ email: email.trim(), code: code.trim(), password });
      toast.success("Password reset successful");
      window.location.replace("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset password");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-7xl place-items-center px-4 pt-10 sm:px-6">
      <div className="card-elevated w-full max-w-md rounded-3xl p-8">
        <div className="mb-6">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground">
            <KeyRound className="h-5 w-5" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Reset password</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Create a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Use the code from your email to update your password.</p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="code">Reset code</Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading || code.length !== 6}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Reset password
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Back to{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            login
          </Link>
        </p>
      </div>
    </div>
  );
}
