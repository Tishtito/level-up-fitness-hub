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

type GoogleCredentialResponse = {
  credential?: string;
};

export const Route = createFileRoute("/signup")({
  validateSearch: parseAuthContinuation,
  head: () => ({
    meta: [
      { title: "Sign Up — Level Up Fitness" },
      { name: "description", content: "Create your Level Up Fitness account and start your transformation." },
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
  const pwdError = touched.password && !passwordValid ? "Password must be at least 8 characters." : null;
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
      setError(registrationError instanceof Error ? registrationError.message : "Registration failed. Please try again.");
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

  const handleGoogleCredential = useCallback(async (response: GoogleCredentialResponse) => {
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
      setError(googleError instanceof Error ? googleError.message : "Google sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [finishAuthentication]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return;

    let cancelled = false;
    const renderGoogleButton = () => {
      if (cancelled || !window.google || !googleButtonRef.current) return;
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
        width: 360,
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
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Form side */}
        <div className="flex items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#111C30]">
              <img src={levelUpLogo} alt="Level Up Fitness" className="h-11 w-11 rounded-full object-cover shadow-sm" />
              Level Up Fitness
            </Link>

            <div className="rounded-2xl border border-border bg-white p-8 shadow-[var(--shadow-elegant)]">
              <h1 className="font-display text-2xl font-bold text-[#111C30]">Create your account</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Start your fitness journey today
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#111C30]">Full name</Label>
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
                      className="h-11 rounded-xl pl-9 focus-visible:ring-2 focus-visible:ring-[#7B2EFF]"
                    />
                  </div>
                  {nameError && <p className="text-xs text-destructive">{nameError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#111C30]">Email</Label>
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
                      className="h-11 rounded-xl pl-9 focus-visible:ring-2 focus-visible:ring-[#7B2EFF]"
                    />
                  </div>
                  {emailError && <p className="text-xs text-destructive">{emailError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#111C30]">Password</Label>
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
                      className="h-11 rounded-xl pl-9 pr-10 focus-visible:ring-2 focus-visible:ring-[#7B2EFF]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      aria-label={showPwd ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#7B2EFF]"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {pwdError && <p className="text-xs text-destructive">{pwdError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-[#111C30]">Confirm password</Label>
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
                      className="h-11 rounded-xl pl-9 pr-10 focus-visible:ring-2 focus-visible:ring-[#7B2EFF]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#7B2EFF]"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmError && <p className="text-xs text-destructive">{confirmError}</p>}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="agree"
                      checked={agree}
                      onCheckedChange={(v) => setAgree(!!v)}
                    />
                    <Label htmlFor="agree" className="cursor-pointer text-sm font-normal text-[#111C30]">
                      I agree to the{" "}
                      <Link to="/" className="font-medium text-[#7B2EFF] hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/" className="font-medium text-[#7B2EFF] hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                  {agreeError && <p className="text-xs text-destructive">{agreeError}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="h-11 w-full rounded-xl bg-[#7B2EFF] text-white hover:bg-[#7B2EFF]/90"
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
                    <span className="bg-white px-3 text-xs uppercase tracking-wider text-muted-foreground">
                      or
                    </span>
                  </div>
                </div>

                {GOOGLE_CLIENT_ID ? (
                  <div className={`flex min-h-11 w-full justify-center overflow-hidden rounded-xl border border-border ${!agree ? "pointer-events-none opacity-50" : ""}`}>
                    <div ref={googleButtonRef} className="flex w-full justify-center" />
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="h-11 w-full rounded-xl border-border text-[#111C30]"
                  >
                    <GoogleIcon className="h-4 w-4" />
                    Continue with Google
                  </Button>
                )}
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <a href={loginUrlFor(search)} className="font-medium text-[#7B2EFF] hover:underline">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Right illustration panel */}
        <aside className="relative hidden bg-[#111C30] lg:flex lg:items-center lg:justify-center">
          <div className="max-w-md px-12 text-white">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-medium">
              <ShieldCheck className="h-3.5 w-3.5" /> Member Portal
            </div>
            <h2 className="font-display text-4xl font-bold leading-tight">
              Transform your body. Elevate your life.
            </h2>
            <p className="mt-4 text-sm text-white/70">
              Join thousands of members accessing world-class training, nutrition, physiotherapy, and a curated wellness shop.
            </p>

            <ul className="mt-10 space-y-4">
              {[
                "Personalized workout & nutrition plans",
                "Live trainer sessions & progress tracking",
                "Curated wellness shop with member perks",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/85">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#7B2EFF]">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
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
