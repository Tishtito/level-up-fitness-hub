import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import {
  completeAuthContinuation,
  parseAuthContinuation,
  type AuthContinuation,
} from "@/lib/auth-continuation";
import levelUpLogo from "@/assets/level-up-logo.jpeg";
import programMobility from "@/assets/home/program-mobility.webp";

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
    <div className="min-h-screen overflow-x-hidden bg-background">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <main className="flex items-center justify-center px-3 py-6 sm:px-8 sm:py-10 lg:px-10">
          <div className="w-full max-w-lg">
            <Link
              to="/"
              className="hidden items-center gap-3 text-sm font-medium text-foreground sm:inline-flex"
            >
              <img
                src={levelUpLogo}
                alt="Level Up Fitness"
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="leading-none">
                Level<span className="text-primary">Up</span>
                <span className="mt-1 block text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  Fitness Hub
                </span>
              </span>
            </Link>

            <div className="mt-4 rounded-2xl border border-border/60 bg-white p-5 shadow-[var(--shadow-soft)] sm:mt-8 sm:p-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Verify email
              </p>
              <h1 className="mt-3 max-w-[12ch] font-display text-2xl font-bold tracking-[-0.02em] text-foreground sm:max-w-none sm:text-4xl">
                Enter your code.
              </h1>
              <p className="mt-3 max-w-[26ch] text-sm leading-6 text-muted-foreground sm:max-w-md sm:text-base">
                We sent a 6-digit code to your email. Verify it to finish creating your account.
              </p>

              <div className="mt-6 rounded-2xl border border-border/60 bg-background p-4 text-sm text-muted-foreground">
                If the message is delayed, request another code after checking spam or promotional
                folders.
              </div>

              <form className="mt-6 space-y-4" onSubmit={submit}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="h-11 rounded-lg border-border/80 bg-white shadow-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium text-foreground">
                    Verification code
                  </Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    className="h-11 rounded-lg border-border/80 bg-white shadow-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                </div>
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={loading || code.length !== 6}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />} Verify email
                </Button>
              </form>

              <Button
                type="button"
                variant="ghost"
                className="mt-4 w-full"
                onClick={resend}
                disabled={resending || !email.trim()}
              >
                {resending && <Loader2 className="h-4 w-4 animate-spin" />} Resend code
              </Button>
            </div>
          </div>
        </main>

        <aside className="relative hidden overflow-hidden lg:block">
          <img
            src={programMobility}
            alt="Athletic mobility session in a bright Nairobi studio"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,35,29,0.92)_0%,rgba(20,35,29,0.56)_54%,rgba(20,35,29,0.22)_100%)]" />
          <div className="relative flex h-full flex-col justify-between p-10 xl:p-14 text-white">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/90">
              <MailCheck className="h-3.5 w-3.5" />
              Email verification
            </div>

            <div className="max-w-xl pb-4">
              <p className="text-sm font-medium text-white/70">A final security check.</p>
              <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl">
                Confirm the inbox tied to your new account.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-white/78 sm:text-base">
                Verifying email keeps orders, memberships, and plan access tied to the right person.
              </p>
            </div>

            <div className="grid max-w-xl gap-3 sm:grid-cols-3">
              {["6-digit code", "Resend if needed", "Finish sign-up"].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/85"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
