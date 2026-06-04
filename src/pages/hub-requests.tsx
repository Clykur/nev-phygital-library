import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getStatusColorClasses, uniformBadgeShape } from "@/lib/status-badges";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useStudentShell } from "@/components/layout/StudentAppShell";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PORTAL_KICKER_COLOR, PORTAL_PAGE_GUTTER_X } from "@/lib/student-ui";
import { bookRequestMatchesSearch, normalizeBookTitle } from "@/lib/title-match";
import { formatDistanceToNow } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { portalPathsForUser } from "@/lib/app-paths";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Loader2, Shield } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Hub = { id: string; name: string; kind?: string };

type HubDeskRequestRow = {
  id: string;
  userId: string;
  requesterPublicId?: string | null;
  hubId: string;
  bookTitle?: string | null;
  notes?: string | null;
  status: string;
  assignedCopyId?: string | null;
  assignedCopyRefId?: string | null;
  assignmentVerified?: boolean;
  assignedAt?: string | null;
  assignedBy?: string | null;
  readyAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** One border, flat panel — matches hub overview. */
const outline = "rounded-md border border-border bg-background";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">{children}</h2>
  );
}

const ACTIVE_PIPELINE = ["requested", "routed", "fulfilled", "ready"] as const;

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

function deskRequestSimpleLabel(status: string): string {
  switch (status) {
    case "requested":
      return "New request";
    case "routed":
      return "Finding the book";
    case "fulfilled":
      return "Set aside";
    case "ready":
      return "Ready for pickup";
    case "picked":
      return "Picked";
    case "expired":
      return "Timed out";
    case "cancelled":
      return "Withdrawn";
    default:
      return status.replace(/_/g, " ");
  }
}

function DeskRequestStatusBadge({ status }: { status: string }) {
  const label = deskRequestSimpleLabel(status);
  return (
    <span
      className={cn(
        uniformBadgeShape,
        getStatusColorClasses(status)
      )}
    >
      {label}
    </span>
  );
}

const DESK_PROGRESS_LABELS = ["Requested", "Finding", "Set aside", "Ready for pickup", "Picked"] as const;

function deskProgressIndex(status: string): number {
  switch (status) {
    case "requested":
      return 0;
    case "routed":
      return 1;
    case "fulfilled":
      return 2;
    case "ready":
      return 3;
    case "picked":
      return 4;
    default:
      return -1;
  }
}

function DeskRequestProgress({ status }: { status: string }) {
  const active = deskProgressIndex(status);
  if (active < 0) {
    const closed =
      status === "expired"
        ? "Timed out — closed"
        : status === "cancelled"
          ? "Withdrawn — closed"
          : "Closed";
    return <p className="text-[11px] text-muted-foreground">{closed}</p>;
  }
  return (
    <div
      className="flex flex-wrap items-center gap-x-0.5 gap-y-1"
      role="list"
      aria-label="Request progress"
    >
      {DESK_PROGRESS_LABELS.map((label, i) => (
        <span key={label} className="flex items-center">
          {i > 0 ? (
            <span className="mx-0.5 text-[10px] text-muted-foreground/50" aria-hidden>
              →
            </span>
          ) : null}
          <span
            role="listitem"
            className={cn(
              "inline-flex h-6 items-center rounded-md border px-2 text-[10px] font-medium",
              i === active
                ? "border-primary/30 bg-primary/10 text-foreground"
                : i < active
                  ? "border-emerald-500/30 bg-emerald-500/10 text-secondary/80 dark:text-emerald-200/90"
                  : "border-border/70 bg-background text-muted-foreground",
            )}
          >
            {i < active ? "✓ " : ""}
            {label}
          </span>
        </span>
      ))}
    </div>
  );
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

function deskStaffHint(status: string): string {
  switch (status) {
    case "requested":
      return "Tap Start helping. Inventory is the source of truth. When a copy is reserved for this title, assignment updates automatically.";
    case "routed":
      return "Use Open inventory with this title. Adding or reserving a matching copy triggers desk assignment in the background.";
    case "fulfilled":
      return "Copy is set aside. Mark ready for pickup to notify the member; then complete pickup at desk.";
    case "ready":
      return "After their catalog checkout, tap Mark complete to close.";
    default:
      return "";
  }
}

function deskNextAction(r: HubDeskRequestRow): string {
  switch (r.status) {
    case "requested":
      return "Start helping. Use Inventory to surface or add a matching copy.";
    case "routed":
      return "Link a copy in Inventory; when it’s reserved, this request moves to Set aside.";
    case "fulfilled":
      return r.assignedCopyId
        ? "Mark ready for pickup (member gets notified)."
        : "Wait for a reserved copy from Inventory (assignment runs when availability updates).";
    case "ready":
      return "Member borrows or buys on the catalog — then Mark complete.";
    case "picked":
      return "Closed.";
    case "expired":
      return "Timed out — no further action.";
    case "cancelled":
      return "Withdrawn — no further action.";
    default:
      return "";
  }
}

type StatusFilter =
  | "all"
  | "active"
  | "requested"
  | "routed"
  | "fulfilled"
  | "ready"
  | "picked"
  | "expired"
  | "cancelled";

function requestAgeIsPriority(iso: string | undefined) {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() > 48 * 60 * 60 * 1000;
}

export default function HubBookRequestsPage() {
  const { token, user, loading } = useAuth();
  const inShell = useStudentShell();
  const qc = useQueryClient();
  const [requestsHubId, setRequestsHubId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [searchTitle, setSearchTitle] = useState("");
  const isSuperAdmin = user?.baseRole === "super_admin";

  const deskPaths = useMemo(() => (user ? portalPathsForUser(user) : null), [user]);

  const hubsQ = useQuery({
    queryKey: ["catalog", "hubs", "hub-requests"],
    enabled: !!token && !!user?.hubStaffHubIds.length,
    queryFn: () => apiFetch<{ hubs: Hub[] }>("/api/catalog/hubs", { token: token! }),
  });

  const matchBooksUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", "500");
    params.set("offset", "0");
    params.set("status", "available");
    if (requestsHubId === "all" && isSuperAdmin) {
      params.set("scope", "platform");
    } else if (requestsHubId !== "all") {
      params.set("hubId", requestsHubId);
    }
    return `/api/hub/books?${params.toString()}`;
  }, [requestsHubId, isSuperAdmin]);

  const matchBooksQ = useQuery({
    queryKey: ["hub", "books", "available-titles", matchBooksUrl, token],
    enabled: !!token && !!user?.hubStaffHubIds.length,
    queryFn: () =>
      apiFetch<{
        books: Array<{ id: string; hubId: string; title: string; status: string }>;
      }>(matchBooksUrl, { token: token! }),
  });

  const availableByHubTitle = useMemo(() => {
    const books = matchBooksQ.data?.books ?? [];
    const m = new Map<string, number>();
    for (const b of books) {
      if (b.status !== "available") continue;
      const k = `${b.hubId}::${normalizeBookTitle(b.title)}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [matchBooksQ.data?.books]);

  const matchAvailableForRequest = (r: HubDeskRequestRow) => {
    const t = r.bookTitle?.trim();
    if (!t) return 0;
    return availableByHubTitle.get(`${r.hubId}::${normalizeBookTitle(t)}`) ?? 0;
  };

  const deskRequestsQ = useQuery({
    queryKey: ["book-requests", "hub", token, requestsHubId],
    enabled: !!token && !!user?.hubStaffHubIds.length,
    queryFn: async () => {
      const q =
        requestsHubId === "all" ? "" : `?hubId=${encodeURIComponent(requestsHubId)}`;
      const data = await apiFetch<{ requests: HubDeskRequestRow[] }>(`/api/book-requests/hub${q}`, {
        token: token!,
      });
      const sweepBody = requestsHubId === "all" ? {} : { hubId: requestsHubId };
      void (async () => {
        try {
          const r = await apiFetch<{ processed: number; linked: number }>(
            "/api/hub/desk/sweep-assignments",
            {
              method: "POST",
              token: token!,
              body: JSON.stringify(sweepBody),
            },
          );
          if (r.linked > 0) {
            void qc.invalidateQueries({ queryKey: ["book-requests", "hub"] });
            void qc.invalidateQueries({ queryKey: ["hub", "overview"] });
            void qc.invalidateQueries({ queryKey: ["hub", "books"] });
          }
        } catch {
          /* sweep is best-effort */
        }
      })();
      return data;
    },
  });

  const patchDeskRequest = useMutation({
    mutationFn: async (input: { id: string; status: "routed" | "ready" | "picked" }) => {
      return apiFetch<{ request: HubDeskRequestRow }>(`/api/book-requests/${input.id}`, {
        method: "PATCH",
        token: token!,
        body: JSON.stringify({ status: input.status }),
      });
    },
    onSuccess: (data) => {
      toast.success("Saved.");
      qc.setQueryData<{ requests: HubDeskRequestRow[] }>(
        ["book-requests", "hub", token, requestsHubId],
        (old) =>
          old
            ? {
              requests: old.requests.map((r) => (r.id === data.request.id ? data.request : r)),
            }
            : old,
      );
      void qc.invalidateQueries({ queryKey: ["book-requests", "hub"] });
      void qc.invalidateQueries({ queryKey: ["hub", "overview"] });
      void qc.invalidateQueries({ queryKey: ["hub", "books"] });
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 409) {
        toast.error("Verify the copy on shelf before completing pickup.");
      } else {
        toast.error(e instanceof ApiError ? e.message : "Could not update request");
      }
    },
  });

  const [adminCloseTarget, setAdminCloseTarget] = useState<HubDeskRequestRow | null>(null);
  const [adminCloseReason, setAdminCloseReason] = useState("");
  const [reassignTarget, setReassignTarget] = useState<HubDeskRequestRow | null>(null);
  const [reassignHubOpen, setReassignHubOpen] = useState(false);
  const [reassignHubId, setReassignHubId] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [overrideTarget, setOverrideTarget] = useState<HubDeskRequestRow | null>(null);
  const [overrideTo, setOverrideTo] = useState<"routed" | "ready" | "requested" | "picked">("routed");
  const [assignTarget, setAssignTarget] = useState<HubDeskRequestRow | null>(null);

  const adminCloseReq = useMutation({
    mutationFn: async (input: { id: string; outcome: "cancelled" | "expired"; reason?: string }) => {
      return apiFetch<{ request: HubDeskRequestRow }>(`/api/admin/book-requests/${input.id}/close`, {
        method: "POST",
        token: token!,
        body: JSON.stringify({ confirm: true, outcome: input.outcome, reason: input.reason || undefined }),
      });
    },
    onSuccess: () => {
      setAdminCloseTarget(null);
      setAdminCloseReason("");
      void qc.invalidateQueries({ queryKey: ["book-requests", "hub"] });
      void qc.invalidateQueries({ queryKey: ["hub", "overview"] });
      void qc.invalidateQueries({ queryKey: ["hub", "books"] });
      toast.success("Request closed (audit log updated).");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Close failed"),
  });

  const adminReassignReq = useMutation({
    mutationFn: async (input: { id: string; hubId: string; reason?: string }) => {
      return apiFetch<{ request: HubDeskRequestRow }>(`/api/admin/book-requests/${input.id}/reassign-hub`, {
        method: "POST",
        token: token!,
        body: JSON.stringify({ confirm: true, hubId: input.hubId, reason: input.reason || undefined }),
      });
    },
    onSuccess: () => {
      setReassignTarget(null);
      setReassignHubOpen(false);
      setReassignHubId("");
      setReassignReason("");
      void qc.invalidateQueries({ queryKey: ["book-requests", "hub"] });
      void qc.invalidateQueries({ queryKey: ["hub", "overview"] });
      void qc.invalidateQueries({ queryKey: ["hub", "books"] });
      void qc.invalidateQueries({ queryKey: ["hub", "books", "available-titles"] });
      toast.success("Request moved to the selected hub (audit).");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Reassign failed"),
  });

  const adminOverrideStatus = useMutation({
    mutationFn: async (input: { id: string; to: string }) => {
      return apiFetch<{ request: HubDeskRequestRow }>(`/api/admin/book-requests/${input.id}/override-status`, {
        method: "POST",
        token: token!,
        body: JSON.stringify({ confirm: true, to: input.to }),
      });
    },
    onSuccess: () => {
      setOverrideTarget(null);
      void qc.invalidateQueries({ queryKey: ["book-requests", "hub"] });
      void qc.invalidateQueries({ queryKey: ["hub", "overview"] });
      void qc.invalidateQueries({ queryKey: ["hub", "books"] });
      toast.success("Status updated (audit).");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Override failed"),
  });

  const assignCopyReq = useMutation({
    mutationFn: async (input: { id: string; assignmentVerified: boolean }) => {
      return apiFetch<{ request: HubDeskRequestRow; warning?: string | null }>(`/api/book-requests/${input.id}/assign-copy`, {
        method: "POST",
        token: token!,
        body: JSON.stringify({ confirm: true, assignmentVerified: input.assignmentVerified }),
      });
    },
    onSuccess: (data) => {
      setAssignTarget(null);
      void qc.invalidateQueries({ queryKey: ["book-requests", "hub"] });
      void qc.invalidateQueries({ queryKey: ["hub", "overview"] });
      void qc.invalidateQueries({ queryKey: ["hub", "books"] });
      toast.success(data.warning ? "Copy assigned (unverified)." : "Copy assigned.");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Assign failed"),
  });

  const verifyAssignmentReq = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<{ request: HubDeskRequestRow }>(`/api/book-requests/${id}/verify-assignment`, {
        method: "POST",
        token: token!,
        body: JSON.stringify({}),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["book-requests", "hub"] });
      toast.success("Assignment verified.");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Verification failed"),
  });

  const releaseAssignmentReq = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<{ request: HubDeskRequestRow }>(`/api/book-requests/${id}/release-assignment`, {
        method: "POST",
        token: token!,
        body: JSON.stringify({}),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["book-requests", "hub"] });
      void qc.invalidateQueries({ queryKey: ["hub", "overview"] });
      void qc.invalidateQueries({ queryKey: ["hub", "books"] });
      toast.success("Assignment released.");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Release failed"),
  });

  const topPad = inShell ? "" : "pt-24";

  const hubName = useCallback(
    (id: string) => hubsQ.data?.hubs.find((h) => h.id === id)?.name ?? `${id.slice(0, 8)}…`,
    [hubsQ.data?.hubs],
  );

  const hubDeskRequestsRaw = deskRequestsQ.data?.requests ?? [];
  const activeReqOrder = ["requested", "routed", "fulfilled", "ready"];
  const hubDeskRequestsSorted = [...hubDeskRequestsRaw].sort((a, b) => {
    const ai = activeReqOrder.indexOf(a.status);
    const bi = activeReqOrder.indexOf(b.status);
    const aRank = ai >= 0 ? ai : 100;
    const bRank = bi >= 0 ? bi : 100;
    if (aRank !== bRank) return aRank - bRank;
    const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tb - ta;
  });

  const showDeskReqHubColumn = requestsHubId === "all";

  const filteredRequests = useMemo(() => {
    let rows = hubDeskRequestsSorted;
    if (statusFilter === "active") {
      rows = rows.filter((r) => (ACTIVE_PIPELINE as readonly string[]).includes(r.status));
    } else if (statusFilter !== "all") {
      rows = rows.filter((r) => r.status === statusFilter);
    }
    if (searchTitle.trim()) {
      rows = rows.filter((r) =>
        bookRequestMatchesSearch(
          r.bookTitle,
          r.notes,
          searchTitle,
          showDeskReqHubColumn ? hubName(r.hubId) : undefined,
        ),
      );
    }
    return rows;
  }, [hubDeskRequestsSorted, statusFilter, searchTitle, showDeskReqHubColumn, hubName]);

  const clearRequestFilters = () => {
    setStatusFilter("active");
    setSearchTitle("");
    if (user && user.hubStaffHubIds.length > 1) {
      setRequestsHubId("all");
    }
  };

  if (loading) {
    return (
      <div className={cn("flex min-h-[50dvh] items-center justify-center", topPad)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user?.hubStaffHubIds.length) {
    return (
      <div className={cn("mx-auto max-w-lg pb-20 text-center", PORTAL_PAGE_GUTTER_X, inShell ? "pt-8" : "pt-28")}>
        <div
          className={cn(
            "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/30",
          )}
        >
          <Shield className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="mt-6 font-serif text-2xl font-light tracking-tight">Book requests restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">Hub staff memberships unlock this queue.</p>
        <Button asChild className="mt-8 rounded-md">
          <Link href={user ? portalPathsForUser(user).borrow : "/library"}>
            {user ? "Back to borrow" : "Browse catalog"}
          </Link>
        </Button>
      </div>
    );
  }

  const selectTriggerClass = "h-10 w-full rounded-md border-border bg-background";
  const inputClass = "h-10 w-full rounded-md border-border bg-background text-sm";

  return (
    <div className={cn(topPad)}>
      <div className="mb-6 border-b border-border pb-5">
        <div className="min-w-0">
          <p
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.35em]",
              PORTAL_KICKER_COLOR,
            )}
          >
            {isSuperAdmin ? "Super admin" : "Hub portal"}
          </p>
          <h1 className="mt-1 font-serif text-lg font-light text-foreground">Requests</h1>
          {isSuperAdmin ? (
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Triage the desk queue across your scoped hubs. Use <span className="font-semibold text-foreground">Scope</span>{" "}
              to filter one location.
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-end sm:gap-3">
          <div className="flex min-w-0 w-full flex-[3] flex-col gap-1.5 sm:min-w-[20rem] lg:min-w-[28rem]">
            <Label htmlFor="hub-req-search" className="text-[10px] font-bold uppercase tracking-wide text-foreground">
              Search title
            </Label>
            <Input
              id="hub-req-search"
              className={inputClass}
              placeholder="Contains…"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
            />
          </div>
          {user.hubStaffHubIds.length > 1 ? (
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Label
                htmlFor="hub-req-scope"
                className="text-[10px] font-bold uppercase tracking-wide text-foreground"
              >
                Scope
              </Label>
              <Select value={requestsHubId} onValueChange={setRequestsHubId}>
                <SelectTrigger id="hub-req-scope" className={selectTriggerClass}>
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
              htmlFor="hub-req-status"
              className="text-[10px] font-bold uppercase tracking-wide text-foreground"
            >
              Status
            </Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger id="hub-req-status" className={selectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active pipeline</SelectItem>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="routed">Finding</SelectItem>
                <SelectItem value="fulfilled">Set aside</SelectItem>
                <SelectItem value="ready">Ready for pickup</SelectItem>
                <SelectItem value="picked">Picked</SelectItem>
                <SelectItem value="expired">Timed out</SelectItem>
                <SelectItem value="cancelled">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full shrink-0 rounded-md sm:min-w-[8.5rem] sm:w-auto"
            onClick={clearRequestFilters}
          >
            Reset filters
          </Button>
        </div>
      </div>

      <section className={cn(outline, "overflow-hidden")} aria-label="Request queue">
        <div className="border-b border-border px-4 py-3">
          <SectionLabel>Active requests</SectionLabel>
          <p className="mt-1 text-xs text-muted-foreground">
            {filteredRequests.length === hubDeskRequestsSorted.length
              ? `${hubDeskRequestsSorted.length} in scope`
              : `${filteredRequests.length} shown · ${hubDeskRequestsSorted.length} in scope`}
          </p>
        </div>
        {deskRequestsQ.isError ? (
          <p className="px-4 py-10 text-sm text-destructive sm:px-4">
            {deskRequestsQ.error instanceof ApiError
              ? deskRequestsQ.error.message
              : "Could not load requests."}
          </p>
        ) : deskRequestsQ.isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <p className="px-4 py-10 text-sm text-muted-foreground">
            {hubDeskRequestsSorted.length === 0
              ? "No requests in this scope yet."
              : "No requests match these filters."}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filteredRequests.map((r) => {
              const pendingPatch =
                patchDeskRequest.isPending && patchDeskRequest.variables?.id === r.id;
              const hint = deskStaffHint(r.status);
              const nextAction = deskNextAction(r);
              const showInventoryCta = r.status === "requested" || r.status === "routed";
              const canAssignFromRow =
                !r.assignedCopyId &&
                (r.status === "requested" || r.status === "routed") &&
                !!r.bookTitle?.trim() &&
                matchAvailableForRequest(r) > 0;
              const showActionColumn =
                r.status === "requested" ||
                canAssignFromRow ||
                r.status === "fulfilled" ||
                r.status === "ready" ||
                showInventoryCta ||
                (isSuperAdmin && !["expired", "cancelled", "picked"].includes(r.status));
              return (
                <li key={r.id} className="px-4 py-4 md:px-5 md:py-5">
                  <div
                    className={cn(
                      "rounded-md border bg-card/50 p-4 sm:p-5",
                      r.assignedCopyId && r.assignmentVerified === false
                        ? "border-primary/35 bg-primary/[0.04]"
                        : "border-border",
                    )}
                  >
                    <div
                      className={cn(
                        "grid gap-4 lg:items-start",
                        showActionColumn ? "lg:grid-cols-[minmax(0,1fr)_16rem]" : "lg:grid-cols-1",
                      )}
                    >
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[15px] font-semibold text-foreground">
                            {r.bookTitle?.trim() || "Book request"}
                          </h3>
                          <DeskRequestStatusBadge status={r.status} />
                          {(ACTIVE_PIPELINE as readonly string[]).includes(r.status) &&
                            r.createdAt &&
                            requestAgeIsPriority(r.createdAt) ? (
                            <span className={cn(uniformBadgeShape, getStatusColorClasses("overdue"))}>
                              Past SLA
                            </span>
                          ) : null}
                        </div>
                        {r.createdAt ? (
                          <p className="text-[11px] text-muted-foreground">
                            Open{" "}
                            <time dateTime={r.createdAt} className="text-foreground/90">
                              {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                            </time>
                          </p>
                        ) : null}
                        {r.notes?.trim() ? (
                          <p className="rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                            {r.notes}
                          </p>
                        ) : null}
                        <div className="grid gap-2 rounded-md border border-border bg-muted/[0.2] px-3 py-2.5 text-[11px] sm:grid-cols-2 lg:grid-cols-4">
                          <div className="space-y-0.5">
                            <p className="text-muted-foreground">Member</p>
                            <p className="font-mono text-foreground/90">{r.requesterPublicId ?? "Student"}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-muted-foreground">Hub</p>
                            <p className="truncate text-foreground/90">{hubName(r.hubId)}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-muted-foreground">Updated</p>
                            <p className="text-foreground/90">{fmtDeskReqDate(r.updatedAt ?? r.createdAt)}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-muted-foreground">Ready at</p>
                            <p className="text-foreground/90">{r.readyAt ? fmtDeskReqDate(r.readyAt) : "—"}</p>
                          </div>
                        </div>
                        <p className="rounded-md border border-border/70 bg-background/70 px-3 py-2 text-[11px] text-muted-foreground">
                          <span className="font-medium text-foreground">Assigned copy: </span>
                          {r.assignedCopyId ? (
                            <>
                              <span className="font-mono text-foreground/90">{r.assignedCopyRefId ?? "Linked copy"}</span>
                              {r.assignmentVerified === false ? (
                                <span className={cn(uniformBadgeShape, getStatusColorClasses("set aside"), "ml-2")}>
                                  Unverified
                                </span>
                              ) : null}
                            </>
                          ) : (
                            <span className="italic">None yet, use Inventory to link availability</span>
                          )}
                        </p>
                        {r.assignedCopyId && r.assignmentVerified === false ? (
                          <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-[11px] text-foreground">
                            Not shelf verified - pickup may fail.
                          </p>
                        ) : null}
                        {(ACTIVE_PIPELINE as readonly string[]).includes(r.status) && r.bookTitle?.trim() ? (
                          <p className="rounded-md border border-border/70 bg-background/70 px-3 py-2 text-[11px] text-muted-foreground">
                            <span className="font-medium text-foreground">Available matches on shelf: </span>
                            {matchBooksQ.isLoading
                              ? "…"
                              : !r.assignedCopyId
                                ? matchAvailableForRequest(r)
                                : "—"}{" "}
                            <span className="text-muted-foreground/80">
                              (unassigned, available copies this hub / title; capped at 500 rows loaded)
                            </span>
                          </p>
                        ) : null}
                        <div className="rounded-md border border-border/70 bg-background px-3 py-2">
                          <DeskRequestProgress status={r.status} />
                        </div>
                        {nextAction ? (
                          <div className="rounded-md border border-primary/25 bg-primary/[0.06] px-3 py-2 text-[12px] leading-snug text-foreground dark:bg-primary/[0.08]">
                            <span className="font-semibold text-primary">Next: </span>
                            {nextAction}
                          </div>
                        ) : null}
                        {hint ? (
                          <p className="text-[12px] leading-relaxed text-muted-foreground">{hint}</p>
                        ) : null}
                      </div>
                      {showActionColumn ? (
                        <div className="flex flex-col items-stretch gap-2 lg:min-w-[14rem] lg:max-w-[14rem]">
                          {r.status === "requested" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-9 rounded-md text-xs font-medium"
                              disabled={pendingPatch}
                              onClick={() => patchDeskRequest.mutate({ id: r.id, status: "routed" })}
                            >
                              Start helping
                            </Button>
                          ) : null}
                          {r.status === "fulfilled" ? (
                            <Button
                              type="button"
                              size="sm"
                              className="h-9 rounded-md text-xs"
                              disabled={pendingPatch}
                              onClick={() => patchDeskRequest.mutate({ id: r.id, status: "ready" })}
                            >
                              Mark ready
                            </Button>
                          ) : null}
                          {r.status === "ready" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-9 rounded-md text-xs"
                              disabled={pendingPatch}
                              onClick={() => {
                                patchDeskRequest.mutate({ id: r.id, status: "picked" });
                              }}
                            >
                              Mark complete
                            </Button>
                          ) : null}
                          {canAssignFromRow ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-9 rounded-md text-xs"
                              onClick={() => setAssignTarget(r)}
                              disabled={assignCopyReq.isPending}
                            >
                              Assign copy
                            </Button>
                          ) : null}
                          {!r.assignedCopyId &&
                            (r.status === "requested" || r.status === "routed") &&
                            !!r.bookTitle?.trim() &&
                            matchAvailableForRequest(r) === 0 ? (
                            <p className="rounded-md border border-border/70 bg-background/70 px-2.5 py-2 text-[10px] text-muted-foreground">
                              No available copies - add to inventory or wait.
                            </p>
                          ) : null}
                          {r.assignedCopyId ? (
                            <>
                              {r.assignmentVerified === false ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-md text-xs"
                                  disabled={verifyAssignmentReq.isPending}
                                  onClick={() => verifyAssignmentReq.mutate(r.id)}
                                >
                                  Verify on shelf
                                </Button>
                              ) : null}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-md text-xs"
                                disabled={releaseAssignmentReq.isPending}
                                onClick={() => releaseAssignmentReq.mutate(r.id)}
                              >
                                Release assignment
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-md text-xs"
                                disabled={releaseAssignmentReq.isPending}
                                onClick={async () => {
                                  try {
                                    await releaseAssignmentReq.mutateAsync(r.id);
                                    await apiFetch(`/api/hub/books/${r.assignedCopyId}/scan`, {
                                      method: "POST",
                                      token: token!,
                                      body: JSON.stringify({ status: "unavailable" }),
                                    });
                                    toast.success("Marked copy unavailable and released assignment.");
                                    void qc.invalidateQueries({ queryKey: ["book-requests", "hub"] });
                                    void qc.invalidateQueries({ queryKey: ["hub", "books"] });
                                  } catch (e) {
                                    toast.error(e instanceof ApiError ? e.message : "Could not mark unavailable");
                                  }
                                }}
                              >
                                Mark copy unavailable
                              </Button>
                            </>
                          ) : null}
                          {showInventoryCta ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 rounded-md text-xs font-medium"
                              asChild
                            >
                              <Link href={deskInventoryHref(deskPaths!.inventory, r.hubId, r.bookTitle)}>Open inventory</Link>
                            </Button>
                          ) : null}
                          {isSuperAdmin && !["expired", "cancelled", "picked"].includes(r.status) ? (
                            <div className="mt-1 rounded-md border border-border bg-muted/[0.2] p-2.5">
                              <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                                Platform admin
                              </p>
                              <div className="mt-2 flex flex-col gap-1.5">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-full justify-start text-xs"
                                  onClick={() => setAdminCloseTarget(r)}
                                >
                                  Close request…
                                </Button>
                                {isSuperAdmin && !r.assignedCopyId && (r.status === "requested" || r.status === "routed") ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 w-full justify-start text-xs"
                                    onClick={() => {
                                      setReassignTarget(r);
                                      setReassignHubId("");
                                      setReassignReason("");
                                    }}
                                  >
                                    Reassign hub…
                                  </Button>
                                ) : null}
                                {r.status === "fulfilled" || r.status === "ready" || r.status === "routed" || r.status === "requested" ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 w-full justify-start text-xs"
                                    onClick={() => {
                                      if (r.status === "fulfilled") setOverrideTo("ready");
                                      else if (r.status === "ready") setOverrideTo("picked");
                                      else if (r.status === "routed") setOverrideTo("requested");
                                      else setOverrideTo("routed");
                                      setOverrideTarget(r);
                                    }}
                                  >
                                    Override status…
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Dialog
        open={!!assignTarget}
        onOpenChange={(open) => {
          if (!open) setAssignTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign copy confirmation</DialogTitle>
            <DialogDescription>Have you physically verified this book on shelf?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAssignTarget(null)}
              disabled={assignCopyReq.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!assignTarget || assignCopyReq.isPending}
              onClick={() => {
                if (!assignTarget) return;
                assignCopyReq.mutate({ id: assignTarget.id, assignmentVerified: false });
              }}
            >
              Assign without verification
            </Button>
            <Button
              type="button"
              disabled={!assignTarget || assignCopyReq.isPending}
              onClick={() => {
                if (!assignTarget) return;
                assignCopyReq.mutate({ id: assignTarget.id, assignmentVerified: true });
              }}
            >
              {assignCopyReq.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Verified on shelf
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!adminCloseTarget}
        onOpenChange={(o) => {
          if (!o) {
            setAdminCloseTarget(null);
            setAdminCloseReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Admin-close this request?</AlertDialogTitle>
            <AlertDialogDescription>
              Action is written to the audit log and the member is notified. Use cancel for withdrawals, or
              expired for SLA-style closure. Optional reason is stored in the audit log only.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            className="min-h-[4rem] text-sm"
            placeholder="Internal note (optional)…"
            value={adminCloseReason}
            onChange={(e) => setAdminCloseReason(e.target.value)}
          />
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>Back</AlertDialogCancel>
            <Button
              type="button"
              variant="secondary"
              disabled={adminCloseReq.isPending}
              onClick={() => {
                if (adminCloseTarget) {
                  void adminCloseReq.mutateAsync({
                    id: adminCloseTarget.id,
                    outcome: "cancelled",
                    reason: adminCloseReason.trim() || undefined,
                  });
                }
              }}
            >
              End as cancelled
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={adminCloseReq.isPending}
              onClick={() => {
                if (adminCloseTarget) {
                  void adminCloseReq.mutateAsync({
                    id: adminCloseTarget.id,
                    outcome: "expired",
                    reason: adminCloseReason.trim() || undefined,
                  });
                }
              }}
            >
              End as expired
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!reassignTarget}
        onOpenChange={(o) => {
          if (!o) {
            setReassignTarget(null);
            setReassignHubOpen(false);
            setReassignHubId("");
            setReassignReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign to another hub</DialogTitle>
            <DialogDescription>
              Only when no shelf copy is linked yet. The request stays with the same member. Inventory at the
              new hub is checked automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Target hub</Label>
              <Popover open={reassignHubOpen} onOpenChange={setReassignHubOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" role="combobox" className="w-full justify-between">
                    <span className="truncate">
                      {reassignHubId
                        ? (hubsQ.data?.hubs.find((h) => h.id === reassignHubId)?.name ?? reassignHubId)
                        : "Search and select hub"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search hub name..." />
                    <CommandList>
                      <CommandEmpty>No hubs found.</CommandEmpty>
                      <CommandGroup>
                        {(hubsQ.data?.hubs ?? [])
                          .filter((h) => h.id !== reassignTarget?.hubId)
                          .map((h) => (
                            <CommandItem
                              key={h.id}
                              value={`${h.name} ${h.id}`}
                              onSelect={() => {
                                setReassignHubId(h.id);
                                setReassignHubOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  reassignHubId === h.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <span className="truncate">{h.name}</span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <Textarea
                className="min-h-[3.5rem] text-sm"
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="E.g. student moved campus…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReassignTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!reassignHubId || !reassignTarget || adminReassignReq.isPending}
              onClick={() => {
                if (reassignTarget && reassignHubId) {
                  void adminReassignReq.mutateAsync({
                    id: reassignTarget.id,
                    hubId: reassignHubId,
                    reason: reassignReason.trim() || undefined,
                  });
                }
              }}
            >
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!overrideTarget}
        onOpenChange={(o) => {
          if (!o) setOverrideTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override request status</DialogTitle>
            <DialogDescription>
              Use carefully for operational correction. Pickup completion still follows the normal desk checkout path.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">Target</Label>
            <Select value={overrideTo} onValueChange={(v) => setOverrideTo(v as typeof overrideTo)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {overrideTarget?.status === "requested" ? <SelectItem value="routed">Routed</SelectItem> : null}
                {overrideTarget?.status === "routed" ? (
                  <SelectItem value="requested">Requested (rewind; releases copy if held)</SelectItem>
                ) : null}
                {overrideTarget?.status === "fulfilled" ? <SelectItem value="ready">Ready for pickup</SelectItem> : null}
                {overrideTarget?.status === "ready" ? (
                  <SelectItem value="picked">Picked (record checkout at desk)</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (overrideTarget) setAdminCloseTarget(overrideTarget);
                setOverrideTarget(null);
              }}
            >
              Use admin close…
            </Button>
            <Button
              type="button"
              disabled={adminOverrideStatus.isPending}
              onClick={() => {
                if (overrideTarget) void adminOverrideStatus.mutateAsync({ id: overrideTarget.id, to: overrideTo });
              }}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}