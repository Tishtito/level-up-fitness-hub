import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Loader2, Lock, ShieldAlert, User } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi, ApiError } from "@/lib/api";
import { useAuthState } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";
import { apiAssetUrl } from "@/lib/env";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Level Up Fitness" },
      { name: "description", content: "Manage your Level Up Fitness account details." },
    ],
  }),
  component: ProfilePage,
});

const MIN_PASSWORD_LENGTH = 8;
// Mirrors the API's phone pattern so the user sees the problem before a round trip.
const phoneRegex = /^[0-9+()\-\s]{7,30}$/;

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16 pt-8 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded-full bg-muted" />
      <div className="card-elevated space-y-4 rounded-[1.25rem] p-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CenteredState({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <section className="card-elevated rounded-[1.25rem] p-8 text-center sm:p-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10">
          <Lock className="h-8 w-8 text-primary" />
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{message}</p>
      </section>
    </div>
  );
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return fallback;
}

function ProfilePage() {
  const { session, isHydrated } = useAuthState();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isHydrated) return;
    if (!session) window.location.replace(loginUrlFor({ redirect: "/profile" }));
  }, [isHydrated, session]);

  // Seeded from the API rather than the cached session, so a stale localStorage user can never
  // be written back over fresher server state.
  const profileQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    enabled: isHydrated && Boolean(session),
    staleTime: 30_000,
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [seeded, setSeeded] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const user = profileQuery.data;

  // Seed once so an in-flight edit is not clobbered by a background refetch.
  useEffect(() => {
    if (!user || seeded) return;
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    setAvatarUrl(user.avatarUrl ?? "");
    setSeeded(true);
  }, [user, seeded]);

  const nameError = name.trim().length < 2 ? "Name must be at least 2 characters." : "";
  const phoneError = phone.trim() && !phoneRegex.test(phone.trim())
    ? "Enter a valid phone number."
    : "";
  const avatarError = avatarUrl.trim() && !/^(https?:\/\/|\/uploads\/)/.test(avatarUrl.trim())
    ? "Must be a full https:// link or an /uploads/ path."
    : "";
  const profileValid = !nameError && !phoneError && !avatarError;

  const saveProfile = useMutation({
    // Empty string means "clear this field" — the API maps it to null.
    mutationFn: () =>
      authApi.updateProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      }),
    onSuccess: (updated) => {
      toast.success("Profile updated");
      queryClient.setQueryData(["auth", "me"], updated);
      // The dashboard Account card reads the same fields from /dashboard/me.
      void queryClient.invalidateQueries({ queryKey: ["customer", "dashboard"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not update your profile")),
  });

  const passwordMismatch = Boolean(confirmPassword) && newPassword !== confirmPassword;
  const passwordValid =
    currentPassword.length >= MIN_PASSWORD_LENGTH &&
    newPassword.length >= MIN_PASSWORD_LENGTH &&
    !passwordMismatch;

  const changePassword = useMutation({
    mutationFn: () => authApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success("Password changed", {
        description: "You have been signed out on your other devices.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    // Deliberately keeps the inputs so a mistyped current password can be corrected.
    onError: (error) => toast.error(errorMessage(error, "Could not change your password")),
  });

  if (!isHydrated || (session && profileQuery.isLoading)) return <ProfileSkeleton />;

  if (!session) {
    return (
      <CenteredState
        title="Login to view your profile"
        message="Your account details are available after login."
      />
    );
  }

  if (profileQuery.isError || !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <section className="card-elevated rounded-[1.25rem] p-8 sm:p-10">
          <h1 className="font-display text-3xl font-bold">Profile unavailable</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            We could not load your account details. Try again in a moment.
          </p>
          <Button className="mt-6" variant="hero" onClick={() => void profileQuery.refetch()}>
            Retry
          </Button>
        </section>
      </div>
    );
  }

  const avatarPreview = apiAssetUrl(avatarUrl.trim() || user.avatarUrl);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 pb-16 pt-8 sm:px-6">
      <header>
        <p className="text-sm font-semibold text-primary">Account</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Your profile</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          Update how your name and contact details appear across Level Up Fitness.
        </p>
      </header>

      <section className="card-elevated rounded-[1.25rem] p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10">
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-7 w-7 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-semibold">{user.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="truncate text-sm text-muted-foreground">{user.email}</span>
              {user.emailVerifiedAt ? (
                <Badge variant="secondary" className="gap-1 rounded-full">
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 rounded-full text-amber-700">
                  <ShieldAlert className="h-3 w-3" />
                  Unverified
                </Badge>
              )}
            </div>
          </div>
        </div>

        <form
          className="mt-6 grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (profileValid) saveProfile.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="profile-name">Full name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(nameError)}
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-phone">Phone</Label>
            <Input
              id="profile-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="07XX XXX XXX"
              aria-invalid={Boolean(phoneError)}
            />
            {phoneError ? (
              <p className="text-xs text-destructive">{phoneError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Leave empty to remove your number.</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="profile-avatar">Avatar URL</Label>
            <Input
              id="profile-avatar"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://…"
              aria-invalid={Boolean(avatarError)}
            />
            {avatarError && <p className="text-xs text-destructive">{avatarError}</p>}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={user.email} readOnly disabled />
            <p className="text-xs text-muted-foreground">
              Contact support to change the email on your account.
            </p>
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" variant="hero" disabled={!profileValid || saveProfile.isPending}>
              {saveProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
            </Button>
          </div>
        </form>
      </section>

      <section className="card-elevated rounded-[1.25rem] p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Change password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Changing your password signs you out everywhere else.
        </p>

        <form
          className="mt-6 grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (passwordValid) changePassword.mutate();
          }}
        >
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              At least {MIN_PASSWORD_LENGTH} characters.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              aria-invalid={passwordMismatch}
            />
            {passwordMismatch && (
              <p className="text-xs text-destructive">Passwords do not match.</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <Button
              type="submit"
              variant="soft"
              disabled={!passwordValid || changePassword.isPending}
            >
              {changePassword.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Update password"
              )}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
