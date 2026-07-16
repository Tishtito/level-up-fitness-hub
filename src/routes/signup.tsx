import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Lock, Mail, User, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { authApi } from "@/lib/api";
import {
  completeAuthContinuation,
  loginUrlFor,
  parseAuthContinuation,
  verifyEmailUrlFor,
} from "@/lib/auth-continuation";
import { GOOGLE_CLIENT_ID } from "@/lib/env";
import levelUpLogo from "@/assets/level-up-logo.jpeg";
import programMobility from "@/assets/home/program-mobility.webp";

type GoogleCredentialResponse = {
  credential?: string;
};

export const Route = createFileRoute("/signup")({
  validateSearch: parseAuthContinuation,
  head: () => ({
    meta: [
      { title: "Sign Up — Level Up Fitness" },
      {
        name: "description",
        content: "Create your Level Up Fitness account and start your transformation.",
      },
    ],
  }),
  component: SignUpPage,
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SignUpPage() {
  const search = Route.useSearch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [touched, setTouched] = useState<{
    name?: boolean;
    email?: boolean;
    password?: boolean;
    confirm?: boolean;
    agree?: boolean;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const nameValid = name.trim().length >= 2;
  const emailValid = emailRegex.test(email);
  const passwordValid = password.length >= 8;
  const confirmValid = confirm === password && confirm.length > 0;
  const canSubmit = nameValid && emailValid && passwordValid && confirmValid && agree && !loading;

  const nameError = touched.name && !nameValid ? "Enter your full name." : null;
  const emailError = touched.email && !emailValid ? "Enter a valid email address." : null;
  const pwdError =
    touched.password && !passwordValid ? "Password must be at least 8 characters." : null;
  const confirmError = touched.confirm && !confirmValid ? "Passwords do not match." : null;
  const agreeError = touched.agree && !agree ? "You must agree to the terms." : null;

  const finishAuthentication = useCallback(async () => {
    try {
      const next = await completeAuthContinuation(search);
      window.location.replace(next);
    } catch (continuationError) {
      setError(
        continuationError instanceof Error
          ? `Your account is ready, but the previous action failed: ${continuationError.message}`
          : "Your account is ready, but the previous action could not be completed.",
      );
    }
  }, [search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true, agree: true });
    if (!nameValid || !emailValid || !passwordValid || !confirmValid || !agree) return;
    setError(null);
    setLoading(true);
    let result: Awaited<ReturnType<typeof authApi.register>>;
    try {
      result = await authApi.register({ name: name.trim(), email: email.trim(), password });
    } catch (registrationError) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : "Registration failed. Please try again.",
      );
      setLoading(false);
      return;
    }

    if ("verificationRequired" in result) {
      toast.success("Verification code sent");
      window.location.replace(verifyEmailUrlFor(result.user.email, search));
      return;
    }

    try {
      toast.success("Account created");
      await finishAuthentication();
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        setError("Google did not return a usable credential. Please try again.");
        return;
      }

      setError(null);
      setLoading(true);
      try {
        await authApi.googleCustomerLogin(response.credential);
        toast.success("Account ready");
        await finishAuthentication();
      } catch (googleError) {
        setError(
          googleError instanceof Error
            ? googleError.message
            : "Google sign up failed. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [finishAuthentication],
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return;

    let cancelled = false;
    const renderGoogleButton = () => {
      if (cancelled || !window.google || !googleButtonRef.current) return;
      const containerWidth =
        googleButtonRef.current.parentElement?.clientWidth ?? window.innerWidth;
      const buttonWidth = Math.max(280, Math.min(360, Math.floor(containerWidth - 2)));
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        type: "standard",
        text: "continue_with",
        shape: "pill",
        width: buttonWidth,
      });
    };

    if (window.google) {
      renderGoogleButton();
      return () => {
        cancelled = true;
        window.google?.accounts.id.cancel();
      };
    }

    const existingScript = document.getElementById("google-identity-services");
    if (existingScript) {
      existingScript.addEventListener("load", renderGoogleButton, { once: true });
      return () => {
        cancelled = true;
        existingScript.removeEventListener("load", renderGoogleButton);
      };
    }

    const script = document.createElement("script");
    script.id = "google-identity-services";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", renderGoogleButton, { once: true });
    script.addEventListener("error", () => {
      if (!cancelled) setError("Google sign up could not load. Please use email and password.");
    });
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener("load", renderGoogleButton);
      window.google?.accounts.id.cancel();
    };
  }, [handleGoogleCredential]);

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
                <span className="mt-1 block text-[10px] tracking-[0.24em] text-muted-foreground uppercase">
                  Fitness Hub
                </span>
              </span>
            </Link>

            <div className="mt-4 rounded-2xl border border-border/60 bg-white p-5 shadow-[var(--shadow-soft)] sm:mt-8 sm:p-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Create account
              </p>
              <h1 className="mt-3 max-w-[12ch] font-display text-2xl font-bold tracking-[-0.02em] text-foreground sm:max-w-none sm:text-4xl">
                Start your membership.
              </h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
                Join for training, nutrition, recovery, and shop access in one account.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  <p className="font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-foreground">
                    Full name
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      autoComplete="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                      aria-invalid={!!nameError}
                      className="h-11 rounded-lg border-border/80 bg-white pl-9 shadow-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    />
                  </div>
                  {nameError && <p className="text-xs text-destructive">{nameError}</p>}
                </div>

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
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      aria-invalid={!!emailError}
                      className="h-11 rounded-lg border-border/80 bg-white pl-9 shadow-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    />
                  </div>
                  {emailError && <p className="text-xs text-destructive">{emailError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPwd ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                      aria-invalid={!!pwdError}
                      className="h-11 rounded-lg border-border/80 bg-white pl-9 pr-10 shadow-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      aria-label={showPwd ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {pwdError && <p className="text-xs text-destructive">{pwdError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-sm font-medium text-foreground">
                    Confirm password
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                      aria-invalid={!!confirmError}
                      className="h-11 rounded-lg border-border/80 bg-white pl-9 pr-10 shadow-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmError && <p className="text-xs text-destructive">{confirmError}</p>}
                </div>

                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <Checkbox id="agree" checked={agree} onCheckedChange={(v) => setAgree(!!v)} />
                    <div className="pt-0.5 text-sm text-foreground/80">
                      <Label htmlFor="agree" className="cursor-pointer font-normal">
                        I agree to the terms and privacy policy.
                      </Label>
                    </div>
                  </div>
                  {agreeError && <p className="text-xs text-destructive">{agreeError}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="h-11 w-full rounded-xl bg-primary text-primary-foreground shadow-none hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                      or
                    </span>
                  </div>
                </div>

                {GOOGLE_CLIENT_ID ? (
                  <div
                    className={`flex min-h-11 w-full justify-center overflow-hidden rounded-lg border border-border/80 bg-white ${
                      !agree ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    <div ref={googleButtonRef} className="flex w-full justify-center" />
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="h-11 w-full rounded-lg border-border/80 bg-white text-foreground"
                  >
                    <GoogleIcon className="h-4 w-4" />
                    Continue with Google
                  </Button>
                )}
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <a
                  href={loginUrlFor(search)}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </main>

        <aside className="relative hidden overflow-hidden lg:block">
          <img
            src={programMobility}
            alt="A member working through a mobility session in a bright fitness studio"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,35,29,0.92)_0%,rgba(20,35,29,0.56)_54%,rgba(20,35,29,0.22)_100%)]" />
          <div className="relative flex h-full flex-col justify-between p-10 xl:p-14 text-white">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/90">
              <ShieldCheck className="h-3.5 w-3.5" />
              Member portal
            </div>

            <div className="max-w-xl pb-4">
              <p className="text-sm font-medium text-white/70">Everything starts here.</p>
              <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl">
                Training, nutrition, and recovery in one account.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-white/78 sm:text-base">
                Join a system that keeps your plans, appointments, and shopping connected from the
                start.
              </p>
            </div>

            <div className="grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                "Programs matched to your goal",
                "Nutrition and physio access",
                "Shop, checkout, and bookings",
              ].map((item) => (
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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.6 12.227c0-.71-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.227c1.887-1.74 2.987-4.302 2.987-7.351Zm-9.6 9.6c2.7 0 4.964-.895 6.618-2.422l-3.227-2.51c-.895.6-2.04.955-3.391.955-2.605 0-4.81-1.76-5.6-4.123H3.064v2.59A9.596 9.596 0 0 0 12 21.827Zm-5.6-9.51A5.77 5.77 0 0 1 6.1 10.5c0-.632.109-1.245.3-1.818v-2.59H3.064A9.6 9.6 0 0 0 2.4 12c0 1.55.372 3.014 1.027 4.317l3.336-2.59h-.363ZM12 6.382c1.47 0 2.787.505 3.823 1.495l2.864-2.864C16.96 3.408 14.695 2.4 12 2.4 8.18 2.4 4.876 4.59 3.064 7.91L6.4 10.5c.79-2.363 2.995-4.118 5.6-4.118Z"
      />
    </svg>
  );
}
