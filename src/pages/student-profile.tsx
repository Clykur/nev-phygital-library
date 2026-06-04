import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useStudentShell } from "@/components/layout/StudentAppShell";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch, apiUrl } from "@/lib/api";
import { userFacingErrorMessage } from "@/lib/error-messages";
import { hubKindLabel, hubMembershipRoleLabel } from "@/lib/hub-display";
import { isHubAccount } from "@/lib/app-paths";
import { isPremiumOk } from "@/lib/rbac";
import { STATUS_CHIP_EMERALD } from "@/lib/status-chip-tones";
import { PORTAL_PAGE_CONTAINER } from "@/lib/student-ui";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Building2, Camera, Loader2, Sparkles } from "lucide-react";

type HubRow = { id: string; name: string; kind?: string };

function fmtPremiumUntil(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

export default function StudentProfilePage() {
  const { user, loading, token, refreshUser, activateDemoPremium } = useAuth();
  const inShell = useStudentShell();
  const hubDesk = !!user && isHubAccount(user);

  const hubsQ = useQuery({
    queryKey: ["catalog", "hubs", "profile", user?.userId],
    enabled: !!token && !!user?.hubStaffHubIds.length,
    queryFn: () => apiFetch<{ hubs: HubRow[] }>("/api/catalog/hubs", { token: token! }),
  });
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeBusy, setUpgradeBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const top = inShell ? "" : "pt-24";
  const pageWrap = inShell ? "w-full" : PORTAL_PAGE_CONTAINER;
  const outline = "rounded-md border border-border bg-background";

  const runUpgrade = async () => {
    setUpgradeBusy(true);
    try {
      await activateDemoPremium(1);
      toast.success("Premium active for this demo.");
      setUpgradeOpen(false);
    } catch (e) {
      toast.error(userFacingErrorMessage(e));
    } finally {
      setUpgradeBusy(false);
    }
  };

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !token) return;
    setUploadBusy(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(apiUrl("/api/uploads/profile-image"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        let msg = res.statusText;
        try {
          const j = (await res.json()) as { error?: string };
          if (j.error) msg = j.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      await refreshUser();
      toast.success("Profile photo updated.");
    } catch (err) {
      toast.error(userFacingErrorMessage(err));
    } finally {
      setUploadBusy(false);
    }
  };

  if (loading) {
    return (
      <div
        className={cn(
          "flex min-h-[40dvh] flex-col items-center justify-center gap-3 text-muted-foreground",
          top,
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading profile…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={cn("min-h-[100dvh] bg-background pb-20", top)}>
      <div className={cn("mx-auto", pageWrap)}>
        <div className="mb-8 border-b border-border/30 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#64748B]">
            {user?.baseRole === "super_admin" ? "Super admin" : hubDesk ? "Hub portal" : "Student"}
          </p>
          <h1 className="mt-1 font-[var(--font-display)] text-lg font-bold tracking-tight text-foreground">
            Profile
          </h1>
        </div>

        <section className={cn(outline, "overflow-hidden p-6 sm:p-8")}>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              <ProfileAvatar name={user.name} size="lg" className="ring-2 ring-border/50" />
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={onPickPhoto}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-9 w-9 rounded-md p-0 shadow-md"
                disabled={uploadBusy}
                aria-label="Upload profile photo"
                onClick={() => fileRef.current?.click()}
              >
                {uploadBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="font-serif text-xl font-light text-foreground">{user.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                JPEG, PNG, WebP, or GIF · up to 5&nbsp;MB. Replaces your previous photo.
              </p>
              <p className="mt-4 border-t border-border/40 pt-4 text-xs leading-relaxed text-muted-foreground">
                Your photo is stored in the{" "}
                <span className="font-medium text-foreground">profile-images</span> bucket and only
                shown here and in the sidebar after you sign in.
              </p>
            </div>
          </div>
        </section>

        {user.hubMemberships.length > 0 ? (
          <section className={cn(outline, "mt-8 overflow-hidden p-6 sm:p-8")}>
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              Library desk access
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Your account stays <span className="font-medium text-foreground">base role: user</span>.
              Desk permissions come from hub membership (college, public, government, or other
              libraries).
            </p>
            <ul className="mt-4 space-y-2">
              {user.hubMemberships.map((m) => {
                const hub = hubsQ.data?.hubs.find((h) => h.id === m.hubId);
                return (
                  <li key={`${m.hubId}-${m.role}`} className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
                    <span className="font-medium text-foreground">{hub?.name ?? "Hub"}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {hubKindLabel(hub?.kind)} · {hubMembershipRoleLabel(m.role)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section className={cn(outline, "mt-8 overflow-hidden p-6 sm:p-8")}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Details
          </h3>
          <dl className="mt-4 space-y-4 text-sm">
            <div className="flex flex-col gap-1 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium text-foreground">{user.phone || "—"}</dd>
            </div>
            <div className="flex flex-col gap-1 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-muted-foreground">Registration date</dt>
              <dd className="font-medium text-foreground">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
              </dd>
            </div>
            <div className="flex flex-col gap-1 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-muted-foreground">Account status</dt>
              <dd>
                <span className={cn(
                  "inline-flex h-7 items-center rounded-md border px-3 text-[11px] font-semibold uppercase tracking-wide",
                  user.accountStatus === "active" ? STATUS_CHIP_EMERALD : "border-border bg-muted text-foreground"
                )}>
                  {user.accountStatus}
                </span>
              </dd>
            </div>
            <div className="flex flex-col gap-1 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-muted-foreground">Role</dt>
              <dd>
                <span className="inline-flex h-7 items-center rounded-md border border-border bg-muted/30 px-3 text-[11px] font-semibold uppercase tracking-wide text-foreground">
                  {user.baseRole}
                </span>
              </dd>
            </div>
            <div className="flex flex-col gap-1 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-muted-foreground">Premium</dt>
              <dd>
                <span
                  className={cn(
                    "inline-flex h-7 items-center rounded-md border px-3 text-[11px] font-semibold uppercase tracking-wide",
                    isPremiumOk(user) ? STATUS_CHIP_EMERALD : "border-border bg-muted text-foreground",
                  )}
                >
                  {isPremiumOk(user)
                    ? user.baseRole === "super_admin"
                      ? "Full access"
                      : "Active"
                    : "Not active"}
                </span>
              </dd>
            </div>
            <div className="flex flex-col gap-1 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-muted-foreground">Current plan</dt>
              <dd className="font-medium text-foreground">{isPremiumOk(user) ? "Premium" : "Free"}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-muted-foreground">Premium until</dt>
              <dd className="font-medium text-foreground">
                {user.baseRole === "super_admin" && !user.premiumActive
                  ? "— (all features)"
                  : user.premiumUntil
                    ? fmtPremiumUntil(user.premiumUntil)
                    : user.premiumActive
                      ? "Active"
                      : "—"}
              </dd>
            </div>
          </dl>

          {!isPremiumOk(user) && (
            <Button
              type="button"
              className="mt-8 h-11 w-full rounded-none font-semibold sm:w-auto"
              onClick={() => setUpgradeOpen(true)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade to Premium
            </Button>
          )}
        </section>
      </div>

      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="w-[calc(100%-32px)] sm:w-full rounded-none sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-[var(--font-display)] text-lg font-bold tracking-tight">
              Demo premium
            </DialogTitle>
            <DialogDescription>
              Unlock borrow, requests, and peer buy/sell for this prototype session.
            </DialogDescription>
          </DialogHeader>
          <Button
            className="h-11 w-full rounded-none font-semibold"
            disabled={upgradeBusy}
            onClick={() => void runUpgrade()}
          >
            {upgradeBusy ? "Applying…" : "Activate 1 month"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
