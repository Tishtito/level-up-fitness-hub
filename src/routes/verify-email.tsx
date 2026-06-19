import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { completeAuthContinuation, parseAuthContinuation, type AuthContinuation } from "@/lib/auth-continuation";

type VerifyEmailSearch = AuthContinuation & {
  email?: string;
  code?: string;
};

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>): VerifyEmailSearch => ({
    ...parseAuthContinuation(search),
    email: optionalString(search.email),
    code: optionalString(search.code),
  }),
  head: () => ({
    meta: [
      { title: "Verify Email - Level Up Fitness" },
      { name: "description", content: "Verify your Level Up Fitness account email." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const search = Route.useSearch();
  const [email, setEmail] = useState(search.email ?? "");
  const [code, setCode] = useState(search.code ?? "");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await authApi.verifyEmail({ email: email.trim(), code: code.trim() });
      toast.success("Email verified");
      const next = await completeAuthContinuation(search);
      window.location.replace(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed");
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    try {
      await authApi.resendVerificationCode(email.trim());
      toast.success("A fresh verification code has been sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resend verification code");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-7xl place-items-center px-4 pt-10 sm:px-6">
      <div className="card-elevated w-full max-w-md rounded-3xl p-8">
        <div className="mb-6">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground">
            <MailCheck className="h-5 w-5" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Verify email</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Enter your code</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a 6-digit code to your email. Verify it to finish creating your account.
          </p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="code">Verification code</Label>
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
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading || code.length !== 6}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Verify email
          </Button>
        </form>

        <Button type="button" variant="ghost" className="mt-4 w-full" onClick={resend} disabled={resending || !email.trim()}>
          {resending && <Loader2 className="h-4 w-4 animate-spin" />} Resend code
        </Button>
      </div>
    </div>
  );
}
