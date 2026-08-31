import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Award, BookOpen, CheckCircle2, Clock, DollarSign, Loader2, Lock, Mail, Pencil, PlayCircle, Upload, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import * as tus from "tus-js-client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, trainerPortalApi, type ApiProgram, type ApiTrainerDashboard } from "@/lib/api";
import { useAuthState } from "@/lib/auth";
import { loginUrlFor } from "@/lib/auth-continuation";
import { apiAssetUrl } from "@/lib/env";

export const Route = createFileRoute("/trainer")({
  head: () => ({
    meta: [
      { title: "Trainer Dashboard - Level Up Fitness" },
      { name: "description", content: "Manage assigned clients and program content." },
    ],
  }),
  component: TrainerDashboardPage,
});

const ksh = (value: number) => new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
}).format(value || 0);

function TrainerDashboardPage() {
  const { session, isHydrated } = useAuthState();
  const queryClient = useQueryClient();
  const [editingProgram, setEditingProgram] = useState<ApiProgram | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    if (!session) {
      window.location.replace(loginUrlFor({ redirect: "/trainer" }));
    } else if (session.user.role !== "TRAINER") {
      window.location.replace("/dashboard");
    }
  }, [isHydrated, session]);

  const dashboardQuery = useQuery({
    queryKey: ["trainer", "dashboard"],
    queryFn: trainerPortalApi.dashboard,
    enabled: isHydrated && session?.user.role === "TRAINER",
  });

  const saveContentMutation = useMutation({
    mutationFn: async (input: {
      program: ApiProgram;
      workoutSchedule: string[];
      nutritionNotes: string;
      thumbnail: File | null;
    }) => {
      await trainerPortalApi.updateContent(input.program.programRef, {
        workoutSchedule: input.workoutSchedule,
        nutritionNotes: input.nutritionNotes.trim() || undefined,
      });
      if (input.thumbnail) await trainerPortalApi.uploadThumbnail(input.program.programRef, input.thumbnail);
    },
    onSuccess: () => {
      toast.success("Program content updated");
      setEditingProgram(null);
      void queryClient.invalidateQueries({ queryKey: ["trainer", "dashboard"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Program update failed"),
  });

  const removeVideoMutation = useMutation({
    mutationFn: ({ programRef, uid }: { programRef: string; uid: string }) =>
      trainerPortalApi.removeVideo(programRef, uid),
    onSuccess: () => {
      toast.success("Video removed");
      void queryClient.invalidateQueries({ queryKey: ["trainer", "dashboard"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Video removal failed"),
  });

  if (!isHydrated || (session?.user.role === "TRAINER" && dashboardQuery.isLoading)) {
    return <CenteredState icon={<Loader2 className="h-8 w-8 animate-spin text-primary" />} title="Loading trainer portal" message="Preparing your assigned programs and clients." />;
  }
  if (!session || session.user.role !== "TRAINER") return null;

  if (dashboardQuery.isError) {
    const missingProfile = dashboardQuery.error instanceof ApiError && dashboardQuery.error.status === 404;
    return <CenteredState
      icon={<Lock className="h-8 w-8 text-primary" />}
      title={missingProfile ? "Trainer profile not configured" : "Trainer portal unavailable"}
      message={missingProfile
        ? "Your account has the TRAINER role, but an administrator has not created your trainer profile yet."
        : dashboardQuery.error.message}
    />;
  }

  const dashboard = dashboardQuery.data;
  if (!dashboard) return null;
  if (dashboard.trainer.status !== "verified") return <VerificationState dashboard={dashboard} />;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pt-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Trainer portal</p>
          <h1 className="mt-2 font-display text-4xl font-bold">{dashboard.trainer.name || session.user.name}</h1>
          <p className="text-muted-foreground">{dashboard.summary.assignedClients} assigned clients · {dashboard.summary.activePrograms} active programs</p>
        </div>
        <Badge className="border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Verified trainer</Badge>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Clients" value={String(dashboard.summary.assignedClients)} sub="Unique enrolled clients" />
        <Stat icon={BookOpen} label="Programs" value={String(dashboard.summary.assignedPrograms)} sub={dashboard.summary.activePrograms + " currently active"} />
        <Stat icon={Clock} label="Hourly rate" value={ksh(dashboard.summary.hourlyRate)} sub="Current profile rate" />
        <Stat icon={DollarSign} label="Lifetime earnings" value={ksh(dashboard.summary.earningsTotal)} sub="Recorded earnings" />
      </div>

      <TrainerProfile dashboard={dashboard} />

      <section className="space-y-4">
        <div><h2 className="font-display text-2xl font-bold">Assigned programs</h2><p className="text-sm text-muted-foreground">Manage workout schedules, nutrition notes, thumbnails, and videos.</p></div>
        {dashboard.programs.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {dashboard.programs.map((program) => <ProgramCard key={program.programRef} program={program} onManage={() => setEditingProgram(program)} />)}
          </div>
        ) : <EmptyState message="No programs have been assigned to your profile yet." />}
      </section>

      <section className="space-y-4">
        <div><h2 className="font-display text-2xl font-bold">Assigned clients</h2><p className="text-sm text-muted-foreground">Clients enrolled in your assigned programs.</p></div>
        <Card>
          <CardContent className="p-0">
            {dashboard.clients.length ? (
              <Table>
                <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Email</TableHead><TableHead>Programs</TableHead></TableRow></TableHeader>
                <TableBody>
                  {dashboard.clients.map((client) => (
                    <TableRow key={client.userRef}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell><div className="flex flex-wrap gap-1">{client.programRefs.map((ref) => <Badge key={ref} variant="secondary">{dashboard.programs.find((program) => program.programRef === ref)?.title ?? ref}</Badge>)}</div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <div className="p-10 text-center text-sm text-muted-foreground">No clients are enrolled in your programs yet.</div>}
          </CardContent>
        </Card>
      </section>

      <ContentDialog
        program={editingProgram}
        saving={saveContentMutation.isPending}
        removingVideo={removeVideoMutation.isPending}
        onOpenChange={(open) => !open && setEditingProgram(null)}
        onSave={(values) => editingProgram && saveContentMutation.mutate({ program: editingProgram, ...values })}
        onRemoveVideo={(uid) => editingProgram && removeVideoMutation.mutate({ programRef: editingProgram.programRef, uid })}
        onVideosChanged={() => void queryClient.invalidateQueries({ queryKey: ["trainer", "dashboard"] })}
      />
    </div>
  );
}

function TrainerProfile({ dashboard }: { dashboard: ApiTrainerDashboard }) {
  const trainer = dashboard.trainer;
  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="card-elevated p-6"><h2 className="font-display text-xl font-bold">Professional profile</h2><p className="mt-3 text-sm text-muted-foreground">{trainer.bio || "No trainer bio has been added."}</p><div className="mt-4 flex flex-wrap gap-2">{trainer.specialties.map((specialty) => <Badge key={specialty} variant="secondary" className="capitalize">{specialty}</Badge>)}</div></div>
      <div className="card-elevated p-6"><h2 className="font-display text-xl font-bold">Certifications</h2><div className="mt-4 space-y-2">{trainer.certifications.length ? trainer.certifications.map((certification) => <div key={certification} className="flex items-center gap-2 text-sm"><Award className="h-4 w-4 text-primary" />{certification}</div>) : <p className="text-sm text-muted-foreground">No certifications recorded.</p>}</div></div>
    </section>
  );
}

function ProgramCard({ program, onManage }: { program: ApiProgram; onManage: () => void }) {
  const thumbnail = apiAssetUrl(program.thumbnail);
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted">{thumbnail ? <img src={thumbnail} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><BookOpen className="h-9 w-9 text-muted-foreground" /></div>}</div>
      <CardHeader className="pb-3"><div className="flex items-start justify-between gap-2"><CardTitle className="text-lg">{program.title}</CardTitle><Badge variant={program.status === "active" ? "default" : "secondary"} className="capitalize">{program.status}</Badge></div></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center text-sm"><Metric label="Clients" value={program.enrolledUsers?.length ?? 0} /><Metric label="Videos" value={program.videos?.length ?? 0} /><Metric label="Schedule" value={program.workoutSchedule.length} /></div>
        <Button variant="soft" className="w-full" onClick={onManage}><Pencil className="h-4 w-4" />Manage content</Button>
      </CardContent>
    </Card>
  );
}

/** An upload in flight, tracked outside the form so a large transfer never blocks a save. */
type VideoUpload = { id: string; name: string; progress: number; status: "uploading" | "processing" | "error" };

type ContentValues = { workoutSchedule: string[]; nutritionNotes: string; thumbnail: File | null };

function ContentDialog({ program, saving, removingVideo, onOpenChange, onSave, onRemoveVideo, onVideosChanged }: {
  program: ApiProgram | null;
  saving: boolean;
  removingVideo: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: ContentValues) => void;
  onRemoveVideo: (uid: string) => void;
  onVideosChanged: () => void;
}) {
  const [schedule, setSchedule] = useState("");
  const [nutritionNotes, setNutritionNotes] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [uploads, setUploads] = useState<VideoUpload[]>([]);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!program) return;
    setSchedule(program.workoutSchedule.join("\n"));
    setNutritionNotes(program.nutritionNotes ?? "");
    setThumbnail(null);
    setUploads([]);
  }, [program]);

  /**
   * Uploads straight to Cloudflare over tus, outside the save mutation: these transfers run for
   * minutes on a large file and must not hold the dialog open or roll back a metadata edit.
   */
  async function startUploads(files: File[]) {
    if (!program) return;
    const programRef = program.programRef;

    await Promise.all(files.map(async (file) => {
      const id = `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`;
      const title = file.name.replace(/\.[^.]+$/, "");
      setUploads((current) => [...current, { id, name: title, progress: 0, status: "uploading" }]);

      try {
        const { uid, uploadUrl } = await trainerPortalApi.createVideoUpload(programRef, {
          title,
          sizeBytes: file.size,
        });

        await new Promise<void>((resolve, reject) => {
          const upload = new tus.Upload(file, {
            uploadUrl,
            // Cloudflare requires a multiple of 256KiB.
            chunkSize: 50 * 1024 * 1024,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            metadata: { name: title, filetype: file.type },
            onProgress: (sent, total) => {
              const progress = total ? Math.round((sent / total) * 100) : 0;
              setUploads((current) => current.map((item) => (item.id === id ? { ...item, progress } : item)));
            },
            onError: reject,
            onSuccess: () => resolve(),
          });
          upload.start();
        });

        setUploads((current) =>
          current.map((item) => (item.id === id ? { ...item, status: "processing", progress: 100 } : item)));
        await trainerPortalApi.confirmVideo(programRef, uid);
        setUploads((current) => current.filter((item) => item.id !== id));
        toast.success(`${title} uploaded`);
        onVideosChanged();
      } catch (error) {
        setUploads((current) =>
          current.map((item) => (item.id === id ? { ...item, status: "error" } : item)));
        toast.error(error instanceof Error ? error.message : "Upload failed");
      }
    }));
  }

  const scheduleItems = useMemo(() => schedule.split("\n").map((item) => item.trim()).filter(Boolean), [schedule]);

  return (
    <Dialog open={Boolean(program)} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader><DialogTitle>Manage {program?.title}</DialogTitle><DialogDescription>Update assigned program content. Pricing and publication remain admin-managed.</DialogDescription></DialogHeader>
        <div className="space-y-5 overflow-y-auto pr-2">
          <div className="space-y-2"><Label>Workout schedule</Label><Textarea rows={6} value={schedule} onChange={(event) => setSchedule(event.target.value)} placeholder="One schedule item per line" /></div>
          <div className="space-y-2"><Label>Nutrition notes</Label><Textarea rows={5} value={nutritionNotes} onChange={(event) => setNutritionNotes(event.target.value)} /></div>
          <div className="space-y-2"><Label>Replace thumbnail</Label><Input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setThumbnail(event.target.files?.[0] ?? null)} /></div>
          <div className="space-y-2">
            <Label>Upload videos</Label>
            <Input
              ref={videoInputRef}
              type="file"
              multiple
              accept="video/*"
              onChange={(event) => {
                void startUploads(Array.from(event.target.files ?? []));
                if (videoInputRef.current) videoInputRef.current.value = "";
              }}
            />
            <p className="text-xs text-muted-foreground">
              Uploads go straight to Cloudflare and resume if the connection drops.
            </p>
            {uploads.map((upload) => (
              <div key={upload.id} className="space-y-1 rounded-md border p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium">{upload.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {upload.status === "error" ? "Failed" : upload.status === "processing" ? "Processing…" : `${upload.progress}%`}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${upload.status === "processing" ? 100 : upload.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-3"><Label>Saved videos</Label>{(program?.videos ?? []).length ? (program?.videos ?? []).map((video) => (
            <div key={video.uid} className="flex items-center justify-between gap-3 rounded-md border p-3">
              <span className="flex min-w-0 items-center gap-2 text-sm font-medium"><PlayCircle className="h-4 w-4 shrink-0" /><span className="truncate">{video.title}</span><span className="shrink-0 text-xs capitalize text-muted-foreground">{video.status}</span></span>
              <Button size="sm" variant="destructive" disabled={removingVideo} onClick={() => onRemoveVideo(video.uid)}>Remove</Button>
            </div>
          )) : <p className="text-sm text-muted-foreground">No videos uploaded yet.</p>}</div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={saving} onClick={() => onSave({ workoutSchedule: scheduleItems, nutritionNotes, thumbnail })}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Save content</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VerificationState({ dashboard }: { dashboard: ApiTrainerDashboard }) {
  const inactive = dashboard.trainer.status === "inactive";
  return <CenteredState icon={inactive ? <Lock className="h-8 w-8 text-destructive" /> : <Clock className="h-8 w-8 text-primary" />} title={inactive ? "Trainer profile inactive" : "Verification pending"} message={inactive ? "Your trainer profile is inactive. Contact an administrator for assistance." : "An administrator must verify the profile before client and program access is enabled."}><div className="mt-5 flex flex-wrap justify-center gap-2">{dashboard.trainer.specialties.map((specialty) => <Badge key={specialty} variant="secondary" className="capitalize">{specialty}</Badge>)}</div><p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4" />{dashboard.trainer.email}</p></CenteredState>;
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string; sub: string }) { return <div className="card-elevated p-6"><div className="grid h-11 w-11 place-items-center bg-primary text-primary-foreground"><Icon className="h-5 w-5" /></div><p className="mt-4 text-xs uppercase text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{sub}</p></div>; }
function Metric({ label, value }: { label: string; value: number }) { return <div><p className="font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>; }
function EmptyState({ message }: { message: string }) { return <div className="border border-dashed p-10 text-center text-sm text-muted-foreground">{message}</div>; }
function CenteredState({ icon, title, message, children }: { icon: ReactNode; title: string; message: string; children?: ReactNode }) { return <div className="mx-auto grid min-h-[65vh] max-w-7xl place-items-center px-4 pt-10 sm:px-6"><div className="card-elevated max-w-lg p-8 text-center">{icon}<h1 className="mt-4 font-display text-3xl font-bold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{message}</p>{children}</div></div>; }
