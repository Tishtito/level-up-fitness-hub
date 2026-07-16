import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import levelUpLogo from "@/assets/level-up-logo.jpeg";
import heroStudio from "@/assets/home/hero-studio.webp";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password - Level Up Fitness" },
      { name: "description", content: "Request a Level Up Fitness password reset code." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      toast.success("If that email exists, a reset code has been sent");
      window.location.replace(`/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send reset instructions");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
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
                Password reset
              </p>
              <h1 className="mt-3 max-w-[12ch] font-display text-2xl font-bold tracking-[-0.02em] text-foreground sm:max-w-none sm:text-4xl">
                Get a reset code.
              </h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
                Enter your account email and we’ll send a code to start the reset flow.
              </p>

              <div className="mt-6 rounded-2xl border border-border/60 bg-background p-4 text-sm text-muted-foreground">
                Use the same email you used to create your account. If you do not see the message,
                check spam.
              </div>

              <form className="mt-6 space-y-4" onSubmit={submit}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="h-11 rounded-lg border-border/80 bg-white pl-9 shadow-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />} Send reset code
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Remembered your password?{" "}
                <Link
                  to="/login"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Login
                </Link>
              </p>
            </div>
          </div>
        </main>

        <aside className="relative hidden overflow-hidden lg:block">
          <img
            src={heroStudio}
            alt="Coached training session inside a bright Nairobi studio"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,35,29,0.92)_0%,rgba(20,35,29,0.56)_54%,rgba(20,35,29,0.22)_100%)]" />
          <div className="relative flex h-full flex-col justify-between p-10 xl:p-14 text-white">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/90">
              <Mail className="h-3.5 w-3.5" />
              Reset access
            </div>

            <div className="max-w-xl pb-4">
              <p className="text-sm font-medium text-white/70">A secure recovery step.</p>
              <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl">
                Get back into your account without friction.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-white/78 sm:text-base">
                Your cart, subscriptions, and bookings stay tied to the same member profile.
              </p>
            </div>

            <div className="grid max-w-xl gap-3 sm:grid-cols-3">
              {["Reset code by email", "Recover your profile", "Continue where you left off"].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/85"
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
