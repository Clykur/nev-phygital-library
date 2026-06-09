import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { isPremiumOk } from "@/lib/rbac";
import { apiFetch, ApiError } from "@/lib/api";
import { useStudentShell } from "@/components/layout/StudentAppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PORTAL_PAGE_CONTAINER } from "@/lib/student-ui";
import { PORTAL_PAGE_LEAD, PORTAL_PAGE_TITLE } from "@/lib/portal-typography";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Loader2,
  BookOpen,
  CheckCircle2,
  Clock,
  XCircle,
  Bell,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import {
  bookRequestStatusLabel,
  normalizeBookRequestStatus,
  isActiveBookRequest,
  type BookRequestRow,
} from "@/lib/book-requests";
import { portalPathsForUser } from "@/lib/app-paths";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Hub = { id: string; name: string; location?: string };

type NotifRow = {
  id: string;
  kind: string;
  body: string;
  bookRequestId?: string | null;
  readAt?: string | null;
  createdAt?: string;
};

const REQUEST_NOTIF_KINDS = new Set([
  "book_request_new",
  "book_request_available",
  "book_request_ready",
  "book_request_delivered",
  "book_request_routed",
  "book_request_fulfilled",
  "book_request_cancelled",
  "book_request_expired",
  "book_request_picked",
]);

function fmtDate(iso: string | undefined | null) {
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

function fmtRelative(iso: string | undefined | null) {
  if (!iso) return "—";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "—";
  }
}

function stepIndex(status: string): number {
  const n = normalizeBookRequestStatus(status);
  if (n === "pending" || n === "lease_requested") return 0;
  if (n === "available_for_collection" || n === "lease_approved") return 1;
  if (n === "delivered" || n === "lease_active") return 2;
  return -1;
}

function StatusIcon({ status }: { status: string }) {
  const n = normalizeBookRequestStatus(status);
  if (n === "delivered" || n === "lease_active" || n === "lease_completed")
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />;
  if (n === "cancelled" || n === "lease_refunded")
    return <XCircle className="h-4 w-4 shrink-0 text-destructive" />;
  if (n === "available_for_collection" || n === "lease_approved")
    return <AlertCircle className="h-4 w-4 shrink-0 text-success" />;
  return <Clock className="h-4 w-4 shrink-0 text-primary" />;
}

function ProgressBar({ status }: { status: string }) {
  const idx = stepIndex(status);
  const steps = ["Pending", "Ready", "Delivered"];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <span
            key={s}
            title={s}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              idx >= i ? "bg-primary/70" : "bg-muted",
            )}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {steps[Math.max(0, Math.min(idx, steps.length - 1))] ?? "Requested"}
      </p>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const n = normalizeBookRequestStatus(status);
  const label = bookRequestStatusLabel(status);
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center whitespace-nowrap rounded-md border px-2.5 text-[11px] font-semibold uppercase tracking-wide",
        (n === "pending" || n === "lease_requested") &&
          "border-primary/30 bg-primary/10 text-primary",
        (n === "available_for_collection" || n === "lease_approved") &&
          "border-success/30 bg-success/10 text-success",
        (n === "delivered" || n === "lease_active" || n === "lease_completed") &&
          "border-border bg-background text-muted-foreground",
        (n === "cancelled" || n === "lease_refunded") &&
          "border-destructive/30 bg-destructive/10 text-destructive",
        n === "lease_return_pending" && "border-primary/30 bg-primary/10 text-primary",
      )}
    >
      {label}
    </span>
  );
}

function NotifKindLabel({ kind }: { kind: string }) {
  const map: Record<string, string> = {
    book_request_available: "Book Available",
    book_request_ready: "Book Ready",
    book_request_delivered: "Delivered",
    book_request_cancelled: "Cancelled",
    book_request_expired: "Expired",
    book_request_routed: "Routed",
    book_request_fulfilled: "Fulfilled",
    book_request_picked: "Picked",
    book_request_new: "New Request",
  };
  return (
    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {map[kind] ?? kind.replace(/_/g, " ")}
    </span>
  );
}

// ── Request Form ────────────────────────────────────────────────────────────

function RequestForm({ onSuccess, activeCount }: { onSuccess: () => void; activeCount: number }) {
  const { token, user } = useAuth();
  const isPremium = user ? isPremiumOk(user) : false;
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);
  const [isLongTermLease, setIsLongTermLease] = useState(false);

  const submit = useMutation({
    mutationFn: () =>
      apiFetch<{ request: BookRequestRow }>("/api/book-requests/", {
        method: "POST",
        token: token!,
        body: JSON.stringify({
          bookTitle: title,
          author,
          isbn,
          notes,
          isLongTermLease: isPremium ? isLongTermLease : false,
        }),
      }),
    onSuccess: () => {
      toast.success("Request submitted! Hubs across the network have been notified.");
      setTitle("");
      setAuthor("");
      setIsbn("");
      setNotes("");
      setIsLongTermLease(false);
      setOpen(false);
      onSuccess();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not submit request"),
  });

  const canSubmit = title.trim().length > 0 && !submit.isPending;
  const atLimit = activeCount >= 3;

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <PlusCircle className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Request a Book</p>
            <p className="text-xs text-muted-foreground">
              {atLimit
                ? "3 active requests limit reached — complete or cancel one first"
                : "Ask any network hub to source a title for you"}
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          {atLimit ? (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              You already have 3 active book requests. Complete or cancel one before adding another.
            </p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (canSubmit) submit.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="req-title">
                  Book title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="req-title"
                  placeholder="e.g. Atomic Habits"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={500}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="req-author">Author (optional)</Label>
                  <Input
                    id="req-author"
                    placeholder="e.g. James Clear"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    maxLength={300}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="req-isbn">ISBN (optional)</Label>
                  <Input
                    id="req-isbn"
                    placeholder="978-0-..."
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    maxLength={32}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="req-notes">Notes (optional)</Label>
                <Textarea
                  id="req-notes"
                  placeholder="Edition, language preference, urgency, etc."
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={2000}
                  className="resize-none"
                />
              </div>
              {isPremium && (
                <div className="space-y-2 pt-2">
                  <Label>Request Type</Label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input
                        type="radio"
                        checked={!isLongTermLease}
                        onChange={() => setIsLongTermLease(false)}
                        className="h-4 w-4 accent-primary"
                      />
                      Standard Borrow
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input
                        type="radio"
                        checked={isLongTermLease}
                        onChange={() => setIsLongTermLease(true)}
                        className="h-4 w-4 accent-primary"
                      />
                      Long-Term Lease
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Premium benefit: Leases allow you to hold a copy for an extended period.
                  </p>
                </div>
              )}
              <Button type="submit" disabled={!canSubmit} className="w-full sm:w-auto">
                {submit.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

// ── Confirm Collection Dialog ───────────────────────────────────────────────

function ConfirmCollectionDialog({
  request,
  hubName,
  onClose,
  onConfirm,
  isPending,
}: {
  request: BookRequestRow | null;
  hubName: string;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={!!request} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm collection</DialogTitle>
          <DialogDescription>
            Please physically collect your copy at{" "}
            <span className="font-semibold text-foreground">{hubName}</span> before confirming here.
          </DialogDescription>
        </DialogHeader>
        {request && (
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground">{request.bookTitle}</p>
            {hubName && <p className="mt-1 text-xs text-muted-foreground">{hubName}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button disabled={!request || isPending} onClick={() => request && onConfirm(request.id)}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming…
              </>
            ) : (
              "I've collected it"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Cancel Confirm Dialog ───────────────────────────────────────────────────

function CancelRequestDialog({
  request,
  onClose,
  onConfirm,
  isPending,
}: {
  request: BookRequestRow | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={!!request} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel request?</DialogTitle>
          <DialogDescription>
            This will withdraw your request. If a copy was reserved for you, it will be released
            back to inventory.
          </DialogDescription>
        </DialogHeader>
        {request && (
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground">{request.bookTitle}</p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Keep request
          </Button>
          <Button
            variant="destructive"
            disabled={!request || isPending}
            onClick={() => request && onConfirm(request.id)}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling…
              </>
            ) : (
              "Cancel request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function StudentRequestsPage() {
  const { token, user } = useAuth();
  const inShell = useStudentShell();
  const qc = useQueryClient();
  const portalPaths = portalPathsForUser(user);

  const [collectTarget, setCollectTarget] = useState<BookRequestRow | null>(null);
  const [cancelTarget, setCancelTarget] = useState<BookRequestRow | null>(null);

  const hubsQ = useQuery({
    queryKey: ["catalog", "hubs", "student-requests"],
    enabled: !!token,
    queryFn: () => apiFetch<{ hubs: Hub[] }>("/api/catalog/hubs", { token: token! }),
  });

  const reqQ = useQuery({
    queryKey: ["book-requests", "mine"],
    enabled: !!token,
    queryFn: () =>
      apiFetch<{ requests: BookRequestRow[] }>("/api/book-requests/mine", {
        token: token!,
      }),
    refetchInterval: 30_000,
  });

  const notifQ = useQuery({
    queryKey: ["notifications", "mine", "requests-page"],
    enabled: !!token,
    queryFn: () =>
      apiFetch<{ notifications: NotifRow[] }>("/api/notifications/mine", {
        token: token!,
      }),
    refetchInterval: 60_000,
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/book-requests/${id}/confirm-delivery`, {
        method: "POST",
        token: token!,
      }),
    onSuccess: () => {
      toast.success("Collection confirmed. Thank you!");
      setCollectTarget(null);
      void qc.invalidateQueries({ queryKey: ["book-requests"] });
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not confirm collection"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/book-requests/${id}/cancel`, {
        method: "POST",
        token: token!,
      }),
    onSuccess: () => {
      toast.success("Request cancelled.");
      setCancelTarget(null);
      void qc.invalidateQueries({ queryKey: ["book-requests"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not cancel request"),
  });

  const hubName = (id: string | null | undefined) => {
    if (!id) return "Unassigned";
    return hubsQ.data?.hubs.find((h) => h.id === id)?.name ?? "Hub";
  };

  const requests = useMemo(() => {
    const rows = reqQ.data?.requests ?? [];
    return [...rows].sort((a, b) => {
      const ta = a.updatedAt
        ? new Date(a.updatedAt).getTime()
        : a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;
      const tb = b.updatedAt
        ? new Date(b.updatedAt).getTime()
        : b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;
      return tb - ta;
    });
  }, [reqQ.data?.requests]);

  const activeRequests = useMemo(
    () => requests.filter((r) => isActiveBookRequest(r.status)),
    [requests],
  );

  const recentNotifs = useMemo(() => {
    const rows = (notifQ.data?.notifications ?? []).filter((n) => REQUEST_NOTIF_KINDS.has(n.kind));
    return [...rows]
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 5);
  }, [notifQ.data?.notifications]);

  // Scroll-to-focus support (e.g. from notification links)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (!ref) return;
    const el = document.querySelector(`[data-request-id="${CSS.escape(ref)}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-primary/40", "bg-primary/5");
    const t = window.setTimeout(
      () => el.classList.remove("ring-2", "ring-primary/40", "bg-primary/5"),
      2600,
    );
    return () => window.clearTimeout(t);
  }, [reqQ.data?.requests]);

  return (
    <div className={cn(PORTAL_PAGE_CONTAINER, "space-y-8 py-8")}>
      <header className="border-b border-border pb-6">
        <h1 className={PORTAL_PAGE_TITLE}>My Book Requests</h1>
        <p className={cn(PORTAL_PAGE_LEAD, "mt-2")}>
          Request any book from the network — hubs will notify you when it's available for
          collection.
        </p>
      </header>

      {/* Inline notifications */}
      {recentNotifs.length > 0 && (
        <section className="mb-6" aria-label="Request notifications">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <Bell className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Recent updates</h2>
            </div>
            <ul className="divide-y divide-border">
              {recentNotifs.map((n) => (
                <li key={n.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <NotifKindLabel kind={n.kind} />
                      <p className="mt-0.5 text-sm leading-relaxed text-foreground">{n.body}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {fmtRelative(n.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Request submission */}
      <div className="mb-8">
        <RequestForm
          activeCount={activeRequests.length}
          onSuccess={() => void qc.invalidateQueries({ queryKey: ["book-requests"] })}
        />
      </div>

      {/* Active requests */}
      {activeRequests.length > 0 && (
        <>
          <section className="mb-8" aria-label="Active requests">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Active ({activeRequests.length})
            </h2>
            <div className="space-y-3">
              {activeRequests.map((r) => {
                const assignedHubId =
                  (r as any).assignedHubId ?? (r as any).fulfilledByHubId ?? r.hubId ?? null;
                const hub = hubName(assignedHubId);
                const n = normalizeBookRequestStatus(r.status);
                const isReady = n === "available_for_collection";
                const isPending = n === "pending";
                return (
                  <div
                    key={r.id}
                    data-request-id={r.id}
                    className={cn(
                      "rounded-xl border bg-card p-5 transition-all",
                      isReady ? "border-success/40 bg-success/5" : "border-border",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusIcon status={r.status} />
                          <span className="font-semibold text-foreground">
                            {r.bookTitle?.trim() || "Book request"}
                          </span>
                          {r.isLongTermLease && (
                            <span className="inline-flex h-5 items-center rounded bg-primary/10 px-1.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                              Lease
                            </span>
                          )}
                          <StatusChip status={r.status} />
                        </div>
                        {r.author?.trim() && (
                          <p className="text-xs text-muted-foreground">by {r.author}</p>
                        )}
                        {isReady && (
                          <p className="text-sm font-medium text-success">Ready at: {hub}</p>
                        )}
                        {isPending && !assignedHubId && (
                          <p className="text-xs text-muted-foreground">
                            Broadcast to all hubs — awaiting claim
                          </p>
                        )}
                        <ProgressBar status={r.status} />
                      </div>

                      <div className="flex shrink-0 flex-col gap-2">
                        {isReady && (
                          <Button
                            size="sm"
                            className="h-9 rounded-lg bg-success text-success-foreground hover:bg-success/90"
                            onClick={() => setCollectTarget(r)}
                          >
                            <CheckCircle2 className="mr-1.5 h-4 w-4" />
                            I've collected it
                          </Button>
                        )}
                        {isPending && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 rounded-lg border-destructive/30 text-destructive hover:bg-destructive/5"
                            onClick={() => setCancelTarget(r)}
                          >
                            Cancel request
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                      {r.isbn && <span>ISBN: {r.isbn}</span>}
                      <span>Requested {fmtDate(r.createdAt)}</span>
                      {r.updatedAt && r.updatedAt !== r.createdAt && (
                        <span>Updated {fmtRelative(r.updatedAt)}</span>
                      )}
                    </div>

                    {r.notes?.trim() && (
                      <p className="mt-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                        {r.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
          <Separator className="my-6" />
        </>
      )}

      {/* All / Historical requests */}
      <section aria-label="All requests">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            All requests ({requests.length})
          </h2>
        </div>

        {reqQ.isLoading ? (
          <div className="flex items-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading your requests…</span>
          </div>
        ) : reqQ.isError ? (
          <p className="py-8 text-sm text-destructive">
            {reqQ.error instanceof ApiError ? reqQ.error.message : "Could not load requests."}
          </p>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-foreground">No requests yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Use the form above to request a book from the network
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {requests.map((r) => {
                const assignedHubId =
                  (r as any).assignedHubId ?? (r as any).fulfilledByHubId ?? r.hubId ?? null;
                const n = normalizeBookRequestStatus(r.status);
                const isReady = n === "available_for_collection";
                const isPending = n === "pending";
                const isActive = isReady || isPending;
                return (
                  <li key={r.id} data-request-id={r.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusIcon status={r.status} />
                          <span className="font-medium text-foreground">
                            {r.bookTitle?.trim() || "Book request"}
                          </span>
                          {r.isLongTermLease && (
                            <span className="inline-flex h-5 items-center rounded bg-primary/10 px-1.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                              Lease
                            </span>
                          )}
                          <StatusChip status={r.status} />
                        </div>
                        {r.author?.trim() && (
                          <p className="text-xs text-muted-foreground">by {r.author}</p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                          {assignedHubId && (
                            <span>
                              Hub: <span className="text-foreground">{hubName(assignedHubId)}</span>
                            </span>
                          )}
                          <span>Requested {fmtDate(r.createdAt)}</span>
                          {r.updatedAt && r.updatedAt !== r.createdAt && (
                            <span>Updated {fmtRelative(r.updatedAt)}</span>
                          )}
                        </div>
                      </div>
                      {isActive && (
                        <div className="flex shrink-0 flex-col gap-2">
                          {isReady && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg"
                              onClick={() => setCollectTarget(r)}
                            >
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-success" />
                              Confirm collection
                            </Button>
                          )}
                          {isPending && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 rounded-lg text-destructive hover:bg-destructive/5 hover:text-destructive"
                              onClick={() => setCancelTarget(r)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* Dialogs */}
      <ConfirmCollectionDialog
        request={collectTarget}
        hubName={hubName(
          (collectTarget as any)?.assignedHubId ??
            (collectTarget as any)?.fulfilledByHubId ??
            collectTarget?.hubId,
        )}
        onClose={() => setCollectTarget(null)}
        onConfirm={(id) => confirmMutation.mutate(id)}
        isPending={confirmMutation.isPending}
      />
      <CancelRequestDialog
        request={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={(id) => cancelMutation.mutate(id)}
        isPending={cancelMutation.isPending}
      />
    </div>
  );
}
