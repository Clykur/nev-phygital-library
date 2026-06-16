import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Card, CardContent } from "@/components/ui/card";
import { PORTAL_PAGE_CONTAINER } from "@/lib/student-ui";
import {
  PORTAL_DIALOG_DESC,
  PORTAL_DIALOG_TITLE,
  PORTAL_PAGE_TITLE,
} from "@/lib/portal-typography";
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

  const hubsQ = useQuery({
    queryKey: ["catalog", "hubs", "profile", user?.userId],
    enabled: !!token && !!user?.hubStaffHubIds.length,
    queryFn: () => apiFetch<{ hubs: HubRow[] }>("/api/catalog/hubs", { token: token! }),
  });
  const qc = useQueryClient();
  const profileQ = useQuery({
    queryKey: ["user-profile"],
    enabled: !!token,
    queryFn: () => apiFetch<any>("/api/user/profile", { token: token! }),
  });

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeBusy, setUpgradeBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressValue, setAddressValue] = useState("");
  const [saving, setSaving] = useState(false);

  // Hub profile editing state
  const [hubAddress, setHubAddress] = useState("");
  const [hubCity, setHubCity] = useState("");
  const [hubDistrict, setHubDistrict] = useState("");
  const [hubState, setHubState] = useState("");
  const [hubPostalCode, setHubPostalCode] = useState("");
  const [hubLatitude, setHubLatitude] = useState<number | null>(null);
  const [hubLongitude, setHubLongitude] = useState<number | null>(null);
  const [geolocating, setGeolocating] = useState(false);

  const handleUseLocationForHub = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setHubLatitude(lat);
        setHubLongitude(lng);
        try {
          const res = await apiFetch<{ success: boolean; data: any }>(
            `/api/geo/reverse-geocode?latitude=${lat}&longitude=${lng}`,
          );
          if (res.success && res.data) {
            const { city: resolvedCity, region, postal_code, address_line1 } = res.data;
            if (address_line1) {
              setHubAddress(address_line1);
            } else {
              setHubAddress([resolvedCity, region].filter(Boolean).join(", "));
            }
            if (resolvedCity) setHubCity(resolvedCity);
            if (resolvedCity) setHubDistrict(resolvedCity);
            if (region) setHubState(region);
            if (postal_code) setHubPostalCode(postal_code);
            toast.success("Location coordinates and address resolved successfully!");
          }
        } catch (err) {
          console.error("Error reverse geocoding:", err);
          toast.error("Coordinates captured, but failed to resolve address.");
        } finally {
          setGeolocating(false);
        }
      },
      (err) => {
        console.error("Error getting location:", err);
        setGeolocating(false);
        toast.error("Could not obtain location permission or coordinates.");
      },
      { timeout: 10000 },
    );
  };

  const startEditing = () => {
    const profile = profileQ.data || user;
    setName(profile?.name || "");
    setEmail(profile?.email || "");
    if (isHubAccount(user)) {
      setPhone(hubProfileQ.data?.hub?.contactPhone || profile?.phone || "");
      const hub = hubProfileQ.data?.hub;
      setHubAddress(hub?.address || "");
      setHubCity(hub?.city || "");
      setHubDistrict(hub?.district || "");
      setHubState(hub?.state || "");
      setHubPostalCode(hub?.postalCode || "");
      setHubLatitude(hub?.latitude ?? null);
      setHubLongitude(hub?.longitude ?? null);
    } else {
      setPhone(profile?.phone || "");
    }
    setAddressValue(profileQ.data?.address || "");
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    if (!email.trim()) {
      toast.error("Email cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch<{ ok: boolean; message: string }>("/api/user/profile", {
        method: "PUT",
        token: token!,
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          address: addressValue.trim() || null,
        }),
      });

      if (!res.ok) {
        throw new Error(res.message || "Failed to update profile");
      }

      if (isHubAccount(user)) {
        const hubRes = await apiFetch<{ ok: boolean; message: string }>("/api/auth/hub-profile", {
          method: "PUT",
          token: token!,
          body: JSON.stringify({
            address: hubAddress.trim() || null,
            city: hubCity.trim() || null,
            district: hubDistrict.trim() || null,
            state: hubState.trim() || null,
            postalCode: hubPostalCode.trim() || null,
            contactPhone: phone.trim() || null,
            latitude: hubLatitude,
            longitude: hubLongitude,
          }),
        });

        if (!hubRes.ok) {
          throw new Error(hubRes.message || "Failed to update hub profile details");
        }
      }

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      await refreshUser();
      void qc.invalidateQueries({ queryKey: ["user-profile"] });
      void qc.invalidateQueries({ queryKey: ["hub-profile"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const top = inShell ? "" : "pt-24";
  const pageWrap = inShell
    ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
    : cn(PORTAL_PAGE_CONTAINER, "py-8 space-y-8");
  const fmtPremiumUntil = (value: string | Date) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

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
  const hubProfileQ = useQuery({
    queryKey: ["hub-profile"],
    enabled: !!token && user?.baseRole === "hub",
    queryFn: () =>
      apiFetch<{
        hub: {
          latitude: null;
          longitude: null;
          name: string;
          kind: string;
          address: string;
          city: string;
          district: string;
          state: string;
          postalCode: string;
          contactPhone: string;
        };
      }>("/api/auth/hub-profile", { token: token! }),
  });
  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !token) return;
    setUploadBusy(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(apiUrl("/api/user/profile/upload-image"), {
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
    <div className={cn("min-h-[100dvh] bg-background font-sans text-foreground", top)}>
      <div className={cn("mx-auto w-full", pageWrap)}>
        <header className="border-b border-border pb-6 font-sans">
          <h1 className={PORTAL_PAGE_TITLE}>Profile</h1>
        </header>

        <Card variant="default" className="overflow-hidden">
          <CardContent className="p-6 sm:p-8">
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
                  className="absolute -bottom-1 -right-1 h-9 w-9 rounded-md p-0 shadow-sm"
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
                <h2 className="h4-scale font-semibold leading-snug text-foreground">{user.name}</h2>
                <p className="mt-1 body-scale text-foreground-muted leading-relaxed">
                  {user.email}
                </p>
                <p className="mt-3 body-scale font-normal leading-normal text-foreground-muted">
                  JPEG, PNG, WebP, or GIF · up to 5&nbsp;MB. Replaces your previous photo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {user.hubMemberships.length > 0 ? (
          <Card variant="default" className="overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <h3 className="flex items-center gap-2 section-kicker">
                <Building2 className="h-3.5 w-3.5" />
                Library desk access
              </h3>
              <ul className="mt-4 space-y-2">
                {user.hubMemberships.map((m) => {
                  const hub = hubsQ.data?.hubs.find((h) => h.id === m.hubId);
                  return (
                    <li
                      key={`${m.hubId}-${m.role}`}
                      className="rounded-xl border border-border  px-3 py-2 body-scale font-normal leading-relaxed"
                    >
                      <span className="font-semibold text-foreground">{hub?.name ?? "Hub"}</span>
                      <span className="mt-0.5 block caption-scale font-medium text-foreground-muted">
                        {hubKindLabel(hub?.kind)} · {hubMembershipRoleLabel(m.role)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <Card variant="default" className="overflow-hidden font-sans">
          <CardContent className="p-6 sm:p-8 text-left">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
              <h3 className="section-kicker font-bold text-lg text-foreground">Profile Details</h3>
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={startEditing}
                  className="rounded-xl font-semibold border border-border"
                >
                  Edit Profile
                </Button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4 font-sans text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface border border-border focus:border-primary rounded-xl p-3 text-xs text-foreground outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface border border-border focus:border-primary rounded-xl p-3 text-xs text-foreground outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-surface border border-border focus:border-primary rounded-xl p-3 text-xs text-foreground outline-none transition"
                    placeholder="e.g., +91 98765 43210"
                  />
                </div>

                {!isHubAccount(user) ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Address
                    </label>
                    <textarea
                      rows={3}
                      value={addressValue}
                      onChange={(e) => setAddressValue(e.target.value)}
                      className="w-full bg-surface border border-border focus:border-primary rounded-xl p-3 text-xs text-foreground outline-none resize-none transition"
                      placeholder="Enter your complete address..."
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                          Address
                        </label>
                        <button
                          type="button"
                          onClick={handleUseLocationForHub}
                          disabled={geolocating}
                          className="text-xs font-semibold text-primary hover:text-primary-hover disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                        >
                          {geolocating ? "Locating..." : "Use Current Location"}
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={hubAddress}
                        onChange={(e) => setHubAddress(e.target.value)}
                        className="w-full bg-surface border border-border focus:border-primary rounded-xl p-3 text-xs text-foreground outline-none resize-none transition"
                        placeholder="Enter hub address..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        City
                      </label>
                      <input
                        type="text"
                        value={hubCity}
                        onChange={(e) => setHubCity(e.target.value)}
                        className="w-full bg-surface border border-border focus:border-primary rounded-xl p-3 text-xs text-foreground outline-none transition"
                        placeholder="City"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        District
                      </label>
                      <input
                        type="text"
                        value={hubDistrict}
                        onChange={(e) => setHubDistrict(e.target.value)}
                        className="w-full bg-surface border border-border focus:border-primary rounded-xl p-3 text-xs text-foreground outline-none transition"
                        placeholder="District"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        State
                      </label>
                      <input
                        type="text"
                        value={hubState}
                        onChange={(e) => setHubState(e.target.value)}
                        className="w-full bg-surface border border-border focus:border-primary rounded-xl p-3 text-xs text-foreground outline-none transition"
                        placeholder="State"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        PIN Code
                      </label>
                      <input
                        type="text"
                        value={hubPostalCode}
                        onChange={(e) => setHubPostalCode(e.target.value)}
                        className="w-full bg-surface border border-border focus:border-primary rounded-xl p-3 text-xs text-foreground outline-none transition"
                        placeholder="PIN Code"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                    className="w-1/3 rounded-xl font-semibold border border-border"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary-hover"
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <dl className="mt-4 space-y-4 body-scale font-normal leading-relaxed">
                <div className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-foreground-muted">Phone</dt>
                  <dd className="font-semibold text-foreground">
                    {isHubAccount(user)
                      ? (hubProfileQ.data?.hub?.contactPhone ?? "—")
                      : profileQ.data?.phone || user?.phone || "—"}
                  </dd>
                </div>
                {!isHubAccount(user) && (
                  <div className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <dt className="text-foreground-muted">Address</dt>
                    <dd className="font-semibold text-foreground text-right max-w-md">
                      {profileQ.data?.address || "—"}
                    </dd>
                  </div>
                )}
                <div className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-foreground-muted">Registration date</dt>
                  <dd className="font-semibold text-foreground">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-foreground-muted">Account status</dt>
                  <dd>
                    <span
                      className={cn(
                        "inline-flex h-7 items-center rounded-md border px-3 caption-scale font-medium uppercase tracking-wide",
                        user.accountStatus === "active"
                          ? STATUS_CHIP_EMERALD
                          : "border-border bg-background text-foreground",
                      )}
                    >
                      {user.accountStatus}
                    </span>
                  </dd>
                </div>
                <div className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-foreground-muted">Role</dt>
                  <dd>
                    <span className="inline-flex h-7 items-center rounded-xl border border-border  px-3 caption-scale font-medium uppercase tracking-wide text-foreground">
                      {user.baseRole}
                    </span>
                  </dd>
                </div>
                {isHubAccount(user) && hubProfileQ && (
                  <>
                    <h3 className="section-kicker border-t border-border pt-4 mt-4 block">
                      Address
                    </h3>
                    <dl className="mt-4 space-y-4">
                      <div className="flex justify-between border-b border-border pb-4">
                        <dt className="text-foreground-muted">Address</dt>
                        <dd className="font-semibold text-right">
                          {hubProfileQ.data?.hub.address || "—"}
                        </dd>
                      </div>

                      <div className="flex justify-between border-b border-border pb-4">
                        <dt className="text-foreground-muted">City</dt>
                        <dd className="font-semibold">{hubProfileQ.data?.hub.city || "—"}</dd>
                      </div>

                      <div className="flex justify-between border-b border-border pb-4">
                        <dt className="text-foreground-muted">District</dt>
                        <dd className="font-semibold">{hubProfileQ.data?.hub.district || "—"}</dd>
                      </div>

                      <div className="flex justify-between border-b border-border pb-4">
                        <dt className="text-foreground-muted">State</dt>
                        <dd className="font-semibold">{hubProfileQ.data?.hub.state || "—"}</dd>
                      </div>

                      <div className="flex justify-between">
                        <dt className="text-foreground-muted">PIN Code</dt>
                        <dd className="font-semibold">{hubProfileQ.data?.hub.postalCode || "—"}</dd>
                      </div>
                    </dl>
                  </>
                )}
                {!isHubAccount(user) && (
                  <>
                    <div className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <dt className="text-foreground-muted">Premium</dt>
                      <dd>
                        <span
                          className={cn(
                            "inline-flex h-7 items-center rounded-md border px-3 caption-scale font-medium uppercase tracking-wide",
                            isPremiumOk(user)
                              ? STATUS_CHIP_EMERALD
                              : "border-border bg-background text-foreground",
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

                    <div className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <dt className="text-foreground-muted">Current plan</dt>
                      <dd className="font-semibold text-foreground">
                        {isPremiumOk(user) ? "Premium" : "Free"}
                      </dd>
                    </div>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <dt className="text-foreground-muted">Premium until</dt>
                      <dd className="font-semibold text-foreground">
                        {user.baseRole === "super_admin" && !user.premiumActive
                          ? "— (all features)"
                          : user.premiumUntil
                            ? fmtPremiumUntil(user.premiumUntil)
                            : user.premiumActive
                              ? "Active"
                              : "—"}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="font-sans w-[calc(100%-32px)] sm:w-full rounded-xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className={PORTAL_DIALOG_TITLE}>Demo premium</DialogTitle>
            <DialogDescription className={PORTAL_DIALOG_DESC}>
              Unlock borrow, requests, and peer buy/sell for this prototype session.
            </DialogDescription>
          </DialogHeader>
          <Button
            className="h-11 w-full rounded-xl font-semibold"
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
