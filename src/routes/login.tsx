import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dumbbell,
  Eye,
  EyeOff,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setError("Invalid email or password. Please try again.");
  };

  const isFormEmpty = !email.trim() || !password;

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC]">
      {/* Left — Login Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-[440px]">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-2.5">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#7B2EFF] text-white">
                <Dumbbell className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold text-[#111C30]">
                Level Up Fitness{" "}
                <span className="text-[#7B2EFF]">Admin</span>
              </span>
            </Link>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-[0_10px_40px_-12px_rgba(17,28,48,0.12)] sm:p-10">
            {/* Heading */}
            <div className="mb-8">
              <h1 className="font-display text-2xl font-bold text-[#111C30] sm:text-3xl">
                Welcome Back
              </h1>
              <p className="mt-2 text-sm text-[#475569]">
                Sign in to manage your fitness platform
              </p>
            </div>

            {/* Global error */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-[#111C30]"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@levelup.fit"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                    if (error) setError("");
                  }}
                  className={`mt-1.5 h-11 rounded-xl border-[#E2E8F0] bg-white px-4 text-[#111C30] placeholder:text-[#94A3B8] focus-visible:ring-[#7B2EFF] ${emailError ? "border-red-400" : ""}`}
                />
                {emailError && (
                  <p className="mt-1.5 text-xs text-red-500">{emailError}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-[#111C30]"
                >
                  Password
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                      if (error) setError("");
                    }}
                    className={`h-11 rounded-xl border-[#E2E8F0] bg-white px-4 pr-11 text-[#111C30] placeholder:text-[#94A3B8] focus-visible:ring-[#7B2EFF] ${passwordError ? "border-red-400" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] transition-colors hover:text-[#7B2EFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7B2EFF] rounded-md"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-1.5 text-xs text-red-500">{passwordError}</p>
                )}
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked === true)
                    }
                  />
                  <Label
                    htmlFor="remember"
                    className="cursor-pointer text-sm text-[#475569]"
                  >
                    Remember me
                  </Label>
                </div>
                <Link
                  to="/login"
                  className="text-sm font-medium text-[#7B2EFF] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In */}
              <Button
                type="submit"
                disabled={isFormEmpty || isLoading}
                className="h-12 w-full rounded-xl bg-[#7B2EFF] text-base font-medium text-white transition-shadow hover:shadow-[var(--shadow-elegant)] disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#E2E8F0]" />
              <span className="text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
                or
              </span>
              <div className="h-px flex-1 bg-[#E2E8F0]" />
            </div>

            {/* Google */}
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full rounded-xl border-[#E2E8F0] bg-white text-sm font-medium text-[#111C30] hover:bg-[#F8FAFC] hover:text-[#111C30]"
            >
              <GoogleIcon className="mr-2 h-5 w-5 text-[#111C30]" />
              Continue with Google
            </Button>
          </div>

          {/* Security footer */}
          <div className="mt-8 space-y-2 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-[#94A3B8]">
              <Lock className="h-3.5 w-3.5" />
              <span>Secure access for authorized administrators only</span>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Two-factor authentication may be required
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F1F5F9] px-3 py-1.5 text-xs font-medium text-[#111C30]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#7B2EFF]" />
              Admin-only access
            </div>
          </div>
        </div>
      </div>

      {/* Right — Dark Panel (Desktop) */}
      <div className="relative hidden w-[42%] items-center justify-center overflow-hidden bg-[#111C30] lg:flex">
        {/* Decorative circles */}
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-[#7B2EFF]/20" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full border border-[#7B2EFF]/20" />
        <div className="absolute right-1/4 top-1/3 h-40 w-40 rounded-full border border-[#7B2EFF]/10" />

        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Center content */}
        <div className="relative z-10 px-12 text-center">
          <div className="mx-auto mb-8 grid h-20 w-20 place-items-center rounded-3xl border-2 border-[#7B2EFF]">
            <ShieldCheck className="h-10 w-10 text-[#7B2EFF]" />
          </div>
          <h2 className="font-display text-3xl font-bold text-white">
            Secure Admin Portal
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#94A3B8]">
            Manage your fitness platform with confidence. Track members,
            programs, and operations from one central dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
