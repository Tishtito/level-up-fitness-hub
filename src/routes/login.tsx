import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ApiError, authApi } from "@/lib/api";
import {
  completeAuthContinuation,
  parseAuthContinuation,
  signupUrlFor,
  verifyEmailUrlFor,
} from "@/lib/auth-continuation";
import { GOOGLE_CLIENT_ID } from "@/lib/env";
import levelUpLogo from "@/assets/level-up-logo.jpeg";
import heroStudio from "@/assets/home/hero-studio.webp";

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number | boolean>,
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

export const Route = createFileRoute("/login")({
  validateSearch: parseAuthContinuation,
  head: () => ({
    meta: [
      { title: "Login — Level Up Fitness" },
      {
        name: "description",
        content:
          "Sign in to manage your cart, subscriptions, programs, and Level Up Fitness dashboard.",
      },
    ],
  }),
  component: LoginPage,
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const emailValid = emailRegex.test(email);
  const passwordValid = password.length >= 8;
  const canSubmit = emailValid && passwordValid && !loading;

  const emailError = touched.email && !emailValid ? "Enter a valid email address." : null;
  const pwdError =
    touched.password && !passwordValid ? "Password must be at least 8 characters." : null;

  const finishLogin = useCallback(
    async (role: string) => {
      try {
        const next = await completeAuthContinuation(
          search,
          role === "TRAINER" ? "/trainer" : "/dashboard",
        );
        window.location.replace(next);
      } catch (continuationError) {
        setError(
          continuationError instanceof Error
            ? `You are signed in, but we could not complete your previous action: ${continuationError.message}`
            : "You are signed in, but we could not complete your previous action. Please try it again.",
        );
      }
    },
    [search],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!emailValid || !passwordValid) return;
    setError(null);
    setUnverifiedEmail(null);
    setLoading(true);
    try {
      const session = await authApi.login(email.trim(), password);
      await finishLogin(session.user.role);
    } catch (loginError) {
      if (loginError instanceof ApiError && loginError.code === "EMAIL_NOT_VERIFIED") {
        const details = loginError.details as { email?: string } | undefined;
        setUnverifiedEmail(details?.email ?? email.trim());
      }
      setError(
        loginError instanceof Error ? loginError.message : "Login failed. Please try again.",
      );
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  const handleGoogleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        setError("Google did not return a usable credential. Please try again.");
        return;
      }

      setError(null);
      setUnverifiedEmail(null);
      setLoading(true);
      try {
        const session = await authApi.googleCustomerLogin(response.credential);
        await finishLogin(session.user.role);
      } catch (googleError) {
        setError(
          googleError instanceof Error
            ? googleError.message
            : "Google login failed. Please try again.",
        );
        setLoading(false);
        return;
      }

      setLoading(false);
    },
    [finishLogin],
  );

  async function resendVerification() {
    if (!unverifiedEmail) return;
    setLoading(true);
    try {
      await authApi.resendVerificationCode(unverifiedEmail);
      setError("A fresh verification code has been sent to your email.");
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "Could not resend the verification code.",
      );
    } finally {
      setLoading(false);
    }
  }

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
      if (!cancelled) setError("Google login could not load. Please use email and password.");
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
                Member access
              </p>
              <h1 className="mt-3 max-w-[12ch] font-display text-2xl font-bold tracking-[-0.02em] text-foreground sm:max-w-none sm:text-4xl">
                Welcome back.
              </h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
                Sign in to continue your cart, subscriptions, programs, and dashboard.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  <p className="font-medium">{error}</p>
                  {unverifiedEmail && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-lg border-destructive/20 bg-white text-destructive hover:bg-destructive/5"
                        onClick={resendVerification}
                        disabled={loading}
                      >
                        Resend code
                      </Button>
                      <a
                        href={verifyEmailUrlFor(unverifiedEmail, search)}
                        className="inline-flex h-9 items-center rounded-lg px-2 text-sm font-medium text-destructive underline-offset-4 hover:underline"
                      >
                        Enter code
                      </a>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
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
                      placeholder="admin@levelupfitness.com"
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
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground">
                      Password
                    </Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-medium text-foreground/70 hover:text-foreground"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPwd ? "text" : "password"}
                      autoComplete="current-password"
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

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={remember}
                    onCheckedChange={(v) => setRemember(!!v)}
                  />
                  <Label
                    htmlFor="remember"
                    className="cursor-pointer text-sm font-normal text-foreground/80"
                  >
                    Remember me on this device
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="h-11 w-full rounded-xl bg-primary text-primary-foreground shadow-none hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                    </>
                  ) : (
                    "Sign In"
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
                  <div className="flex min-h-11 w-full justify-center overflow-hidden rounded-lg border border-border/80 bg-white">
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

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border/60 bg-background px-4 py-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="text-xs leading-5 text-muted-foreground">
                  <p className="font-medium text-foreground">Secure member access</p>
                  <p>Your cart, plans, and checkout stay protected behind your account.</p>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              New here?{" "}
              <a
                href={signupUrlFor(search)}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Create an account
              </a>
            </p>
          </div>
        </main>

        <aside className="relative hidden overflow-hidden lg:block">
          <img
            src={heroStudio}
            alt="Level Up Fitness coaches guiding a training session in a bright Nairobi studio"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,35,29,0.92)_0%,rgba(20,35,29,0.56)_55%,rgba(20,35,29,0.28)_100%)]" />
          <div className="relative flex h-full flex-col justify-between p-10 xl:p-14 text-white">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/90">
                <Lock className="h-3.5 w-3.5" />
                Member login
              </div>
              <p className="max-w-xs text-right text-xs leading-5 text-white/72">
                One account for programs, nutrition, recovery, and shopping.
              </p>
            </div>

            <div className="max-w-xl pb-4">
              <p className="text-sm font-medium text-white/70">A quiet place to return.</p>
              <blockquote className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl">
                Care beyond the workout.
                <span className="mt-3 block text-white/80">
                  Pick up exactly where your fitness journey left off.
                </span>
              </blockquote>
            </div>

            <div className="grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                "Saved cart and checkout",
                "Active plans and programs",
                "Appointments and order history",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/85"
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
