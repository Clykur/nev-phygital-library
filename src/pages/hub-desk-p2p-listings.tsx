import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudentShell } from "@/components/layout/StudentAppShell";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError, apiPublicUrl } from "@/lib/api";
import { portalPathsForUser } from "@/lib/app-paths";
import { adminPanel, adminSearchInput, adminSelectTrigger } from "@/lib/admin-desk-ui";
import { PORTAL_PAGE_LEAD, PORTAL_PAGE_TITLE } from "@/lib/portal-typography";
import { PORTAL_INLINE_LINK, PORTAL_KICKER_COLOR, PORTAL_PAGE_GUTTER_X } from "@/lib/student-ui";
import { cn } from "@/lib/utils";
import { p2pShelfStatusRank } from "@/lib/catalog-sort";
import { shelfFilterChipOnDarkClass } from "@/lib/status-badges";
import { CatalogBookCard, addedLabel, catalogRefLabel } from "@/pages/library";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

type Hub = { id: string; name: string; kind?: string };

type P2pListingRow = {
  id: string;
  ownerId: string;
  hubId: string;
  bookTitle: string;
  coverImageUrl?: string | null;
  price: number;
  borrowPrice: number;
  type: string;
  status: string;
  dropoffHubId: string | null;
  createdAt: string;
  updatedAt: string;
};

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="section-kicker">{children}</h2>
  );
}

function p2pStepIndex(status: string) {
  if (status === "listed") return 0;
  if (status === "pending_dropoff") return 1;
  if (status === "available" || status === "reserved" || status === "sold") return 2;
  return -1;
}

function P2pPipelineProgress({ status }: { status: string }) {
  if (status === "rejected" || status === "cancelled") {
    return (
      <div className="mt-3 space-y-1 w-full text-left">
        <p className="caption-scale font-medium text-destructive">Pipeline ended ({status})</p>
      </div>
    );
  }
  const steps = ["Listed", "Pending drop-off", "Approved & On-shelf"];
  const idx = p2pStepIndex(status);
  return (
    <div className="mt-3 space-y-1.5 w-full text-left opacity-90">
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <span
            key={s}
            className={cn(
              "h-1 flex-1 rounded-sm transition-colors",
              idx >= i ? "bg-primary/80" : "bg-overlay-glass"
            )}
            title={s}
          />
        ))}
      </div>
      <div className="flex justify-between caption-scale font-medium text-primary-foreground/70 px-0.5">
        <span>Listed</span>
        <span>Drop-off</span>
        <span>Shelf</span>
      </div>
    </div>
  );
}

export default function HubDeskP2pListingsPage() {
  const { token, user, loading } = useAuth();
  const inShell = useStudentShell();
  const isSuperAdmin = user?.baseRole === "super_admin";
  const qc = useQueryClient();
  const [hubId, setHubId] = useState<string>("all");
  const [statusQ, setStatusQ] = useState<string>("pending_dropoff");
  const [q, setQ] = useState("");

  const topPad = inShell ? "" : "pt-24";
  const overviewHubId =
    user && user.hubStaffHubIds.length === 1 ? user.hubStaffHubIds[0]! : hubId === "all" ? undefined : hubId;

  const listUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (overviewHubId) p.set("hubId", overviewHubId);
    if (isSuperAdmin && !overviewHubId) p.set("scope", "platform");
    const qs = p.toString();
    return `/api/hub/desk-p2p-listings${qs ? `?${qs}` : ""}`;
  }, [isSuperAdmin, overviewHubId]);

  const hubsQ = useQuery({
    queryKey: ["catalog", "hubs", "p2p-desk"],
    enabled: !!token && !!user?.hubStaffHubIds.length,
    queryFn: () => apiFetch<{ hubs: Hub[] }>("/api/catalog/hubs", { token: token! }),
  });

  const listQ = useQuery({
    queryKey: ["hub", "desk-p2p-listings", listUrl, token],
    enabled: !!token && !!user?.hubStaffHubIds.length,
    queryFn: () => apiFetch<{ listings: P2pListingRow[] }>(listUrl, { token: token! }),
  });

  const updateStatusMutation = useMutation<
    unknown,
    ApiError,
    { listingId: string; status: "approved" | "rejected" }
  >({
    mutationFn: (vars) =>
      apiFetch(`/api/hub/p2p-submissions/${vars.listingId}/status`, {
        token: token!,
        method: "PUT",
        body: JSON.stringify({ status: vars.status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hub", "desk-p2p-listings"] });
      toast.success("Submission status updated.");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const rows = listQ.data?.listings ?? [];
  const filtered = useMemo(() => {
    let r = rows;
    if (statusQ !== "all") {
      r = r.filter((l) => l.status === statusQ);
    }
    const t = q.trim().toLowerCase();
    if (t) {
      r = r.filter((l) => l.bookTitle.toLowerCase().includes(t));
    }
    /** Same ordering as All copies: status rank, then newest activity, then id (see API `hubP2pPipelineListingsOrderBy`). */
    return [...r].sort((a, b) => {
      const d = p2pShelfStatusRank(a.status) - p2pShelfStatusRank(b.status);
      if (d !== 0) return d;
      const ta = new Date(a.updatedAt).getTime();
      const tb = new Date(b.updatedAt).getTime();
      if (tb !== ta) return tb - ta;
      return b.id.localeCompare(a.id);
    });
  }, [rows, statusQ, q]);

  if (loading) {
    return (
      <div className={cn("flex min-h-[50dvh] items-center justify-center", topPad)}>
        <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (!user?.hubStaffHubIds.length) {
    return (
      <div className={cn("mx-auto max-w-lg pb-20 text-center", PORTAL_PAGE_GUTTER_X, inShell ? "pt-8" : "pt-28")}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center">
          <Shield className="h-7 w-7 text-foreground-muted" />
        </div>
        <h1 className="mt-6 h4-scale font-semibold text-foreground">Restricted</h1>
        <p className="mt-2 body-scale text-foreground-muted">Hub staff only.</p>
        <Button asChild className="mt-8 rounded-full">
          <Link href={user ? portalPathsForUser(user).overview : "/library"}>Back</Link>
        </Button>
      </div>
    );
  }

  const p = portalPathsForUser(user!);

  const clearP2pListingFilters = () => {
    setQ("");
    setStatusQ("all");
    if (user && user.hubStaffHubIds.length > 1) {
      setHubId("all");
    }
  };

  return (
    <div className={cn(topPad, "pb-10 lg:pb-10")}>
      <div className="mb-6 w-full min-w-0 border-b border-border pb-5">
        <div className="w-full min-w-0 max-w-none">
          <h1 className={cn("mt-1", PORTAL_PAGE_TITLE)}>P2P Listings</h1>
          <p className={cn("mt-2 w-full max-w-none", PORTAL_PAGE_LEAD)}>
            Peer <span className="font-semibold text-foreground">listings that do not have a physical copy yet</span>{" "}
            (pipeline only, e.g. listed, awaiting drop-off). This is <span className="italic">not</span> on-shelf
            inventory. For physically verifiable stock, use{" "}
            <Link href={p.inventory} className={PORTAL_INLINE_LINK}>
              All copies
            </Link>
            . Typical path: <span className="font-mono caption-scale font-medium">listed</span> →
            <span className="font-mono caption-scale font-medium"> pending_dropoff</span> → staff approve →
            <span className="font-mono caption-scale font-medium"> available</span> (copy on shelf) → sold or borrow.
            Rejection ends the pipeline before a physical <span className="font-mono caption-scale font-medium">books</span> row exists.
          </p>
        </div>

        <div className="mt-4 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-end sm:gap-3">
          <div className="flex min-w-0 w-full flex-[3] flex-col gap-1.5 sm:min-w-[20rem] lg:min-w-[28rem]">
            <Label
              htmlFor="p2p-desk-search"
              className="section-kicker"
            >
              Search title
            </Label>
            <Input
              id="p2p-desk-search"
              className={adminSearchInput}
              placeholder="Contains…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {user.hubStaffHubIds.length > 1 ? (
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Label
                htmlFor="p2p-desk-scope"
                className="section-kicker"
              >
                Scope
              </Label>
              <Select
                value={hubId}
                onValueChange={(v) => {
                  setHubId(v);
                }}
              >
                <SelectTrigger id="p2p-desk-scope" className={cn(adminSelectTrigger, "text-primary")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All managed hubs</SelectItem>
                  {user.hubStaffHubIds.map((id) => (
                    <SelectItem key={id} value={id}>
                      {hubsQ.data?.hubs.find((h) => h.id === id)?.name ?? id.slice(0, 8) + "…"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label
              htmlFor="p2p-desk-status"
              className="section-kicker"
            >
              Status
            </Label>
            <Select value={statusQ} onValueChange={setStatusQ}>
              <SelectTrigger id="p2p-desk-status" className={cn(adminSelectTrigger, "text-primary")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending_dropoff">Needs Review (Pending Drop-off)</SelectItem>
                <SelectItem value="approved">Approved (On-shelf)</SelectItem>
                <SelectItem value="all">All Pipeline</SelectItem>
                <SelectItem value="listed">Listed (Online)</SelectItem>
                <SelectItem value="available">Available at Hub</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full shrink-0 rounded-md sm:min-w-[8.5rem] sm:w-auto"
            onClick={clearP2pListingFilters}
          >
            Reset filters
          </Button>
        </div>
      </div>

      <section className={cn(adminPanel, "overflow-hidden")} aria-label="P2P pipeline listings">
        <div className="border-b border-border px-4 py-3">
          <SectionLabel>Pipeline (no physical copy yet)</SectionLabel>
          <p className="mt-1 caption-scale font-medium text-foreground-muted">
            {listQ.isLoading
              ? "…"
              : `${filtered.length} shown · ${rows.length} in scope`}
            . Excludes any listing that already has a row in <span className="font-semibold text-foreground">Inventory</span>.
          </p>
        </div>
        {listQ.isError ? (
          <p className="px-4 py-10 text-sm text-destructive sm:px-4">
            {listQ.error instanceof ApiError ? listQ.error.message : "Could not load listings."}
          </p>
        ) : listQ.isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-9 w-9 animate-spin text-foreground-muted" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center body-scale text-foreground-muted sm:px-6">
            <p>
              {rows.length === 0
                ? "No pipeline listings in this scope. Every P2P listing here is still pre–physical book."
                : "No listings match these filters."}
            </p>
            {rows.length > 0 && filtered.length === 0 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3 rounded-md"
                onClick={clearP2pListingFilters}
              >
                Reset filters
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-2 items-stretch gap-5 p-4 sm:gap-6 sm:p-6 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((l) => {
              const hubName = hubsQ.data?.hubs.find((h) => h.id === l.hubId)?.name ?? "Managed hub";
              const canManage = l.status === "pending_dropoff";
              return (
                <div key={l.id} className="flex min-w-0 flex-col gap-1.5">
                  <CatalogBookCard
                    title={l.bookTitle}
                    coverUrl={l.coverImageUrl ? apiPublicUrl(l.coverImageUrl) : undefined}
                    hubName={hubName}
                    refDisplay={catalogRefLabel(l.id, null)}
                    addedText={addedLabel(l.createdAt)}
                    addedAtTitle={l.createdAt ? new Date(l.createdAt).toLocaleString() : undefined}
                    fullIdForTitle={l.id}
                    isSample={false}
                    pipelineListingStatus={l.status}
                    action={
                      canManage ? (
                        <div className="space-y-2 text-left">
                          <p className="body-scale font-medium leading-snug text-primary/20">
                            Action required
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              className="h-auto rounded-md px-2.5 py-1 body-scale font-normal"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  listingId: l.id,
                                  status: "approved",
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-auto rounded-md px-2.5 py-1 body-scale font-normal"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  listingId: l.id,
                                  status: "rejected",
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 text-left body-scale font-normal text-on-media-muted">
                          <p className="font-medium leading-snug text-primary/20">
                            Peer pipeline (no physical copy yet)
                          </p>
                          {l.type ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={shelfFilterChipOnDarkClass}>
                                {l.type.replace(/_/g, " ")}
                              </span>
                            </div>
                          ) : null}
                          <p className="font-medium tabular-nums">
                            ₹{l.borrowPrice.toLocaleString("en-IN")} borrow · ₹
                            {l.price.toLocaleString("en-IN")} buy
                          </p>
                          <P2pPipelineProgress status={l.status} />
                        </div>
                      )
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}