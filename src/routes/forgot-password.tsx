import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";

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
    <div className="mx-auto grid min-h-[70vh] max-w-7xl place-items-center px-4 pt-10 sm:px-6">
      <div className="card-elevated w-full max-w-md rounded-3xl p-8">
        <div className="mb-6">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground">
            <Mail className="h-5 w-5" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Password reset</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Get a reset code</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your account email and we will send a reset code.</p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Send reset code
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Remembered your password?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
