import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Dumbbell, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Login — Level Up Fitness" },
      { name: "description", content: "Secure sign in for Level Up Fitness administrators." },
    ],
  }),
  component: AdminLoginPage,
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = emailRegex.test(email);
  const passwordValid = password.length >= 8;
  const canSubmit = emailValid && passwordValid && !loading;

  const emailError = touched.email && !emailValid ? "Enter a valid email address." : null;
  const pwdError = touched.password && !passwordValid ? "Password must be at least 8 characters." : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!emailValid || !passwordValid) return;
    setError(null);
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1100));
      setError("Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Form side */}
        <div className="flex items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#111C30]">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#111C30] text-white">
                <Dumbbell className="h-5 w-5" />
              </span>
              Level Up Fitness Admin
            </Link>

            <div className="rounded-2xl border border-border bg-white p-8 shadow-[var(--shadow-elegant)]">
              <h1 className="font-display text-2xl font-bold text-[#111C30]">Welcome Back</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to manage your fitness platform
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
                  <Label htmlFor="email" className="text-[#111C30]">Email</Label>
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
                      className="h-11 rounded-xl pl-9 focus-visible:ring-2 focus-visible:ring-[#7B2EFF]"
                    />
                  </div>
                  {emailError && <p className="text-xs text-destructive">{emailError}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-[#111C30]">Password</Label>
                    <button
                      type="button"
                      className="text-xs font-medium text-[#7B2EFF] hover:underline"
                    >
                      Forgot password?
                    </button>
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

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={remember}
                    onCheckedChange={(v) => setRemember(!!v)}
                  />
                  <Label htmlFor="remember" className="cursor-pointer text-sm font-normal text-[#111C30]">
                    Remember me on this device
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="h-11 w-full rounded-xl bg-[#7B2EFF] text-white hover:bg-[#7B2EFF]/90"
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
                    <span className="bg-white px-3 text-xs uppercase tracking-wider text-muted-foreground">
                      or
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-xl border-border text-[#111C30] hover:border-[#7B2EFF] hover:bg-transparent hover:text-[#7B2EFF]"
                >
                  <GoogleIcon className="h-4 w-4" />
                  Continue with Google
                </Button>
              </form>

              <div className="mt-6 flex items-start gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#7B2EFF]" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-[#111C30]">Secure access for authorized administrators only</p>
                  <p className="mt-0.5">Two-factor authentication may be required.</p>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Unauthorized access is prohibited and monitored.
            </p>
          </div>
        </div>

        {/* Right illustration panel */}
        <aside className="relative hidden bg-[#111C30] lg:flex lg:items-center lg:justify-center">
          <div className="max-w-md px-12 text-white">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-medium">
              <Lock className="h-3.5 w-3.5" /> Admin Portal
            </div>
            <h2 className="font-display text-4xl font-bold leading-tight">
              Manage the entire Level Up Fitness platform.
            </h2>
            <p className="mt-4 text-sm text-white/70">
              Members, trainers, programs, nutrition plans, physiotherapy bookings, and the shop —
              all from one secure dashboard.
            </p>

            <ul className="mt-10 space-y-4">
              {[
                "Role-based access for staff & trainers",
                "Audited activity & device sessions",
                "Two-factor authentication ready",
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