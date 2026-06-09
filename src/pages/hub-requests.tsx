import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequestStatusBadge } from "@/lib/status-badges";
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
import { apiFetch, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { adminPanel, adminSearchInput, adminSelectTrigger } from "@/lib/admin-desk-ui";
import { PORTAL_PAGE_LEAD, PORTAL_PAGE_TITLE } from "@/lib/portal-typography";
import { PORTAL_PAGE_GUTTER_X } from "@/lib/student-ui";
import { bookRequestMatchesSearch } from "@/lib/title-match";
import { formatDistanceToNow } from "date-fns";
import { portalPathsForUser } from "@/lib/app-paths";
import {
  type BookRequestRow,
  bookRequestAssignedHubId,
  isActiveBookRequest,
  normalizeBookRequestStatus,
} from "@/lib/book-requests";
import { toast } from "sonner";
import { Loader2, Shield, Package, CheckSquare, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Hub = { id: string; name: string; location?: string };

type StatusFilter =
  | "all"
  | "active"
  | "pending"
  | "available_for_collection"
  | "delivered"
  | "cancelled"
  | "lease_requested"
  | "lease_approved"
  | "lease_active"
  | "lease_return_pending"
  | "lease_completed"
  | "lease_refunded";

function fmtDeskReqDate(iso: string | undefined | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function deskInventoryHref(
  inventoryPath: string,
  hubId: string,
  bookTitle: string | null | undefined,
): string {
  const p = new URLSearchParams();
  p.set("hubId", hubId);
  const t = bookTitle?.trim();
  if (t) p.set("q", t);
  return `${inventoryPath}?${p.toString()}`;
}

export default function HubBookRequestsPage() {
  const { token, user, loading } = useAuth();
  const inShell = useStudentShell();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [searchTitle, setSearchTitle] = useState("");

  // Claim dialog
  const [claimTarget, setClaimTarget] = useState<BookRequestRow | null>(null);
  const [claimHubId, setClaimHubId] = useState("");

  // Assign-copy dialog
  const [assignTarget, setAssignTarget] = useState<BookRequestRow | null>(null);

  const deskPaths = useMemo(() => (user ? portalPathsForUser(user) : null), [user]);

  const hubsQ = useQuery({
    queryKey: ["catalog", "hubs", "hub-requests"],
    enabled: !!token && !!user?.hubStaffHubIds.length,
    queryFn: () => apiFetch<{ hubs: Hub[] }>("/api/catalog/hubs", { token: token! }),
  });

  const deskRequestsQ = useQuery({
    queryKey: ["book-requests", "hub", token],
    enabled: !!token && !!user?.hubStaffHubIds.length,
    queryFn: () =>
      apiFetch<{ requests: BookRequestRow[] }>("/api/book-requests/hub", {
        token: token!,
      }),
    refetchInterval: 30_000,
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const claimMutation = useMutation({
    mutationFn: async (input: { id: string; hubId: string }) =>
      apiFetch<{ request: BookRequestRow }>(`/api/book-requests/${input.id}/claim`, {
        method: "POST",
        token: token!,
        body: JSON.stringify({ confirm: true, hubId: input.hubId }),
      }),
    onSuccess: () => {
      toast.success("Request claimed. Student has been notified.");
      setClaimTarget(null);
      setClaimHubId("");
      void qc.invalidateQueries({ queryKey: ["book-requests"] });
      void qc.invalidateQueries({ queryKey: ["hub", "overview"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not claim request"),
  });

  const assignCopyMutation = useMutation({
    mutationFn: async (input: { id: string; verified: boolean }) =>
      apiFetch<{ request: BookRequestRow; warning?: string | null }>(
        `/api/book-requests/${input.id}/assign-copy`,
        {
          method: "POST",
          token: token!,
          body: JSON.stringify({
            confirm: true,
            assignmentVerified: input.verified,
          }),
        },
      ),
    onSuccess: (data) => {
      if (data.warning) {
        toast.warning(data.warning);
      } else {
        toast.success("Copy assigned to request.");
      }
      setAssignTarget(null);
      void qc.invalidateQueries({ queryKey: ["book-requests"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not assign copy"),
  });

  const releaseAssignmentMutation = useMutation({
    mutationFn: async (id: string) =>
      apiFetch<{ request: BookRequestRow }>(`/api/book-requests/${id}/release-assignment`, {
        method: "POST",
        token: token!,
      }),
    onSuccess: () => {
      toast.success("Copy assignment released.");
      void qc.invalidateQueries({ queryKey: ["book-requests"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not release assignment"),
  });

  const verifyAssignmentMutation = useMutation({
    mutationFn: async (id: string) =>
      apiFetch<{ request: BookRequestRow }>(`/api/book-requests/${id}/verify-assignment`, {
        method: "POST",
        token: token!,
      }),
    onSuccess: () => {
      toast.success("Assignment verified — copy is shelf-confirmed.");
      void qc.invalidateQueries({ queryKey: ["book-requests"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not verify assignment"),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────

  const hubName = useCallback(
    (id: string | null | undefined) => {
      if (!id) return "Unassigned";
      return hubsQ.data?.hubs.find((h) => h.id === id)?.name ?? `${id.slice(0, 8)}…`;
    },
    [hubsQ.data?.hubs],
  );

  const hubLocation = useCallback(
    (id: string | null | undefined) => hubsQ.data?.hubs.find((h) => h.id === id)?.location ?? null,
    [hubsQ.data?.hubs],
  );

  const requestsRaw = deskRequestsQ.data?.requests ?? [];
  const requestsSorted = [...requestsRaw].sort((a, b) => {
    const order = [
      "pending",
      "lease_requested",
      "available_for_collection",
      "lease_approved",
      "lease_active",
      "lease_return_pending",
      "delivered",
      "lease_completed",
      "lease_refunded",
      "cancelled",
    ];
    const ai = order.indexOf(normalizeBookRequestStatus(a.status) as string);
    const bi = order.indexOf(normalizeBookRequestStatus(b.status) as string);
    if (ai !== bi) return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tb - ta;
  });

  const filteredRequests = useMemo(() => {
    let rows = requestsSorted;
    if (statusFilter === "active") {
      rows = rows.filter((r) => isActiveBookRequest(r.status));
    } else if (statusFilter !== "all") {
      rows = rows.filter((r) => normalizeBookRequestStatus(r.status) === statusFilter);
    }
    if (searchTitle.trim()) {
      rows = rows.filter((r) =>
        bookRequestMatchesSearch(
          r.bookTitle,
          [r.notes, r.author, r.isbn].filter(Boolean).join(" "),
          searchTitle,
          hubName(bookRequestAssignedHubId(r)),
        ),
      );
    }
    return rows;
  }, [requestsSorted, statusFilter, searchTitle, hubName]);

  const staffHubs = useMemo(() => {
    const ids = user?.hubStaffHubIds ?? [];
    return (hubsQ.data?.hubs ?? []).filter((h) => ids.includes(h.id));
  }, [hubsQ.data?.hubs, user?.hubStaffHubIds]);

  // ── Action predicates ─────────────────────────────────────────────────────

  const canClaim = (r: BookRequestRow) =>
    normalizeBookRequestStatus(r.status) === "pending" && !bookRequestAssignedHubId(r);

  const isAssignedToMyHub = (r: BookRequestRow) => {
    const hid = bookRequestAssignedHubId(r);
    return !!hid && (user?.hubStaffHubIds.includes(hid) ?? false);
  };

  const canAssignCopy = (r: BookRequestRow) =>
    isAssignedToMyHub(r) &&
    (normalizeBookRequestStatus(r.status) === "pending" ||
      normalizeBookRequestStatus(r.status) === "lease_requested" ||
      normalizeBookRequestStatus(r.status) === "lease_approved") &&
    !r.assignedCopyId;

  const canReleaseAssignment = (r: BookRequestRow) => isAssignedToMyHub(r) && !!r.assignedCopyId;

  const canVerifyAssignment = (r: BookRequestRow) =>
    isAssignedToMyHub(r) && !!r.assignedCopyId && !r.assignmentVerified;

  const topPad = inShell ? "" : "pt-24";

  if (loading) {
    return (
      <div className={cn("flex min-h-[50dvh] items-center justify-center", topPad)}>
        <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (!user?.hubStaffHubIds.length) {
    return (
      <div
        className={cn(
          "mx-auto max-w-lg pb-20 text-center",
          PORTAL_PAGE_GUTTER_X,
          inShell ? "pt-8" : "pt-28",
        )}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-border">
          <Shield className="h-7 w-7 text-foreground-muted" />
        </div>
        <h1 className="mt-6 font-serif text-2xl font-light tracking-tight">
          Book requests restricted
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Hub staff memberships unlock this queue.
        </p>
        <Button asChild className="mt-8 rounded-md">
          <Link href={user ? portalPathsForUser(user).borrow : "/library"}>Back to catalog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(topPad, "pb-10 lg:pb-10")}>
      {/* ── Header ── */}
      <div className="mb-6 border-b border-border pb-5">
        <h1 className={cn("mt-1", PORTAL_PAGE_TITLE)}>Book Requests</h1>
        <p className={cn("mt-4 max-w-2xl", PORTAL_PAGE_LEAD)}>
          All student requests are broadcast network-wide. Claim requests your hub can fulfill,
          assign a physical copy, and mark assignments as verified before the student collects.
        </p>
        <div className="mt-4 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-end">
          <div className="flex min-w-0 flex-[3] flex-col gap-1.5">
            <Label htmlFor="hub-req-search" className="section-kicker">
              Search
            </Label>
            <Input
              id="hub-req-search"
              className={adminSearchInput}
              placeholder="Title, author, ISBN, student…"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label htmlFor="hub-req-status" className="section-kicker">
              Status
            </Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger id="hub-req-status" className={cn(adminSelectTrigger, "text-primary")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="available_for_collection">Available for Collection</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="lease_requested">Lease Requested</SelectItem>
                <SelectItem value="lease_approved">Lease Approved</SelectItem>
                <SelectItem value="lease_active">Lease Active</SelectItem>
                <SelectItem value="lease_return_pending">Return Pending</SelectItem>
                <SelectItem value="lease_completed">Lease Completed</SelectItem>
                <SelectItem value="lease_refunded">Lease Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Request queue ── */}
      <section className={cn(adminPanel, "overflow-hidden")} aria-label="Book request queue">
        <div className="border-b border-border px-4 py-3">
          <h2 className="section-kicker">Request queue</h2>
          <p className="mt-1 caption-scale font-medium text-foreground-muted">
            {filteredRequests.length} shown · {requestsSorted.length} total
          </p>
        </div>

        {deskRequestsQ.isError ? (
          <p className="px-4 py-10 text-sm text-destructive">
            {deskRequestsQ.error instanceof ApiError
              ? deskRequestsQ.error.message
              : "Could not load requests."}
          </p>
        ) : deskRequestsQ.isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-9 w-9 animate-spin text-foreground-muted" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <p className="px-4 py-10 text-sm text-foreground-muted">
            No requests match these filters.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filteredRequests.map((r) => {
              const assignedHub = bookRequestAssignedHubId(r);
              const claimedElsewhere = !!assignedHub && !isAssignedToMyHub(r);
              const showClaim = canClaim(r);
              const nStatus = normalizeBookRequestStatus(r.status);
              const showInventory =
                isAssignedToMyHub(r) &&
                (nStatus === "pending" ||
                  nStatus === "available_for_collection" ||
                  nStatus === "lease_requested" ||
                  nStatus === "lease_approved");
              const showAssign = canAssignCopy(r);
              const showRelease = canReleaseAssignment(r);
              const showVerify = canVerifyAssignment(r);

              return (
                <li key={r.id} className="px-4 py-4 md:px-5 md:py-5">
                  <div className="rounded-xl border border-border bg-card/50 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      {/* ── Info ── */}
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-normal text-foreground">
                            {r.bookTitle?.trim() || "Book request"}
                          </h3>
                          <RequestStatusBadge status={r.status} />
                        </div>
                        {r.author?.trim() ? (
                          <p className="caption-scale text-foreground-muted">Author: {r.author}</p>
                        ) : null}
                        {r.isbn?.trim() ? (
                          <p className="caption-scale text-foreground-muted">ISBN: {r.isbn}</p>
                        ) : null}
                        {r.notes?.trim() ? (
                          <p className="rounded-xl border border-border px-3 py-2 body-scale text-foreground-muted">
                            {r.notes}
                          </p>
                        ) : null}

                        {/* Metadata grid */}
                        <div className="grid gap-2 rounded-xl border border-border px-3 py-2.5 caption-scale sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-foreground-muted">Student</p>
                            <p className="text-foreground">{r.requesterPublicId ?? "Student"}</p>
                          </div>
                          <div>
                            <p className="text-foreground-muted">Assigned hub</p>
                            <p className="text-foreground">{hubName(assignedHub)}</p>
                            {hubLocation(assignedHub) ? (
                              <p className="text-foreground-subtle">{hubLocation(assignedHub)}</p>
                            ) : null}
                          </div>
                          <div>
                            <p className="text-foreground-muted">Requested</p>
                            <p className="text-foreground">{fmtDeskReqDate(r.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-foreground-muted">Updated</p>
                            <p className="text-foreground">
                              {r.createdAt
                                ? formatDistanceToNow(new Date(r.updatedAt ?? r.createdAt), {
                                    addSuffix: true,
                                  })
                                : "—"}
                            </p>
                          </div>
                        </div>

                        {/* Assigned copy ref */}
                        {r.assignedCopyId && (
                          <div className="flex flex-wrap gap-3 rounded-xl border border-border px-3 py-2 caption-scale">
                            <div>
                              <span className="text-foreground-muted">Copy ref: </span>
                              <span className="font-mono text-foreground">
                                {(r as any).assignedCopyRefId ?? r.assignedCopyId.slice(0, 8) + "…"}
                              </span>
                            </div>
                            <div>
                              <span className="text-foreground-muted">Shelf verified: </span>
                              <span
                                className={
                                  r.assignmentVerified
                                    ? "font-semibold text-success"
                                    : "text-foreground-muted"
                                }
                              >
                                {r.assignmentVerified ? "Yes" : "No"}
                              </span>
                            </div>
                          </div>
                        )}

                        {claimedElsewhere ? (
                          <p className="caption-scale font-medium text-foreground-muted">
                            Claimed by {hubName(assignedHub)} — no further action available.
                          </p>
                        ) : null}
                      </div>

                      {/* ── Actions ── */}
                      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-48">
                        {showClaim ? (
                          <Button
                            type="button"
                            size="sm"
                            className="h-9 rounded-md"
                            disabled={claimMutation.isPending}
                            onClick={() => {
                              if (staffHubs.length === 1) {
                                claimMutation.mutate({
                                  id: r.id,
                                  hubId: staffHubs[0]!.id,
                                });
                              } else {
                                setClaimTarget(r);
                                setClaimHubId(staffHubs[0]?.id ?? "");
                              }
                            }}
                          >
                            I have this book
                          </Button>
                        ) : null}

                        {showInventory && assignedHub && deskPaths ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-md"
                            asChild
                          >
                            <Link
                              href={deskInventoryHref(
                                deskPaths.inventory,
                                assignedHub,
                                r.bookTitle,
                              )}
                            >
                              Open inventory
                            </Link>
                          </Button>
                        ) : null}

                        {showAssign ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-md"
                            disabled={assignCopyMutation.isPending}
                            onClick={() => setAssignTarget(r)}
                          >
                            <Package className="mr-1.5 h-4 w-4" />
                            Assign copy
                          </Button>
                        ) : null}

                        {showVerify ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-md border-success/30 text-success hover:bg-success/5"
                            disabled={verifyAssignmentMutation.isPending}
                            onClick={() => verifyAssignmentMutation.mutate(r.id)}
                          >
                            <CheckSquare className="mr-1.5 h-4 w-4" />
                            {verifyAssignmentMutation.isPending
                              ? "Verifying…"
                              : "Mark shelf-verified"}
                          </Button>
                        ) : null}

                        {showRelease ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 rounded-md text-muted-foreground hover:text-destructive"
                            disabled={releaseAssignmentMutation.isPending}
                            onClick={() => releaseAssignmentMutation.mutate(r.id)}
                          >
                            <RotateCcw className="mr-1.5 h-4 w-4" />
                            {releaseAssignmentMutation.isPending ? "Releasing…" : "Release copy"}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Claim dialog ── */}
      <Dialog open={!!claimTarget} onOpenChange={(o) => !o && setClaimTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Claim for your hub</DialogTitle>
            <DialogDescription>
              This assigns the request to your hub and notifies the student that the book is
              available for collection.
            </DialogDescription>
          </DialogHeader>
          {claimTarget ? (
            <div className="space-y-3 py-2">
              <p className="text-sm font-medium text-foreground">{claimTarget.bookTitle}</p>
              <div className="space-y-1.5">
                <Label htmlFor="claim-hub">Your hub</Label>
                <Select value={claimHubId} onValueChange={setClaimHubId}>
                  <SelectTrigger id="claim-hub">
                    <SelectValue placeholder="Select hub" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffHubs.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setClaimTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!claimTarget || !claimHubId || claimMutation.isPending}
              onClick={() => {
                if (!claimTarget || !claimHubId) return;
                claimMutation.mutate({
                  id: claimTarget.id,
                  hubId: claimHubId,
                });
              }}
            >
              {claimMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Claiming…
                </>
              ) : (
                "Confirm claim"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assign Copy dialog ── */}
      <Dialog open={!!assignTarget} onOpenChange={(o) => !o && setAssignTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign a physical copy</DialogTitle>
            <DialogDescription>
              The system will match the first available copy in your inventory whose title matches
              this request. Choose whether the copy has been physically verified on the shelf.
            </DialogDescription>
          </DialogHeader>
          {assignTarget ? (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">{assignTarget.bookTitle}</p>
            </div>
          ) : null}
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => setAssignTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!assignTarget || assignCopyMutation.isPending}
              onClick={() =>
                assignTarget &&
                assignCopyMutation.mutate({
                  id: assignTarget.id,
                  verified: false,
                })
              }
            >
              Assign (not verified)
            </Button>
            <Button
              type="button"
              disabled={!assignTarget || assignCopyMutation.isPending}
              onClick={() =>
                assignTarget &&
                assignCopyMutation.mutate({
                  id: assignTarget.id,
                  verified: true,
                })
              }
            >
              {assignCopyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning…
                </>
              ) : (
                "Assign (shelf-verified)"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
