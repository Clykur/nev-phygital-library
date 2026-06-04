import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useStudentShell } from "@/components/layout/StudentAppShell";
import { apiFetch } from "@/lib/api";
import { userFacingErrorMessage } from "@/lib/error-messages";
import { SUPER_ADMIN_OVERVIEW_PATH } from "@/lib/app-paths";
import { SuperAdminRoute } from "@/components/super-admin-route";
import { Button } from "@/components/ui/button";
import { getStatusColorClasses, uniformBadgeShape } from "@/lib/status-badges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PORTAL_KICKER_COLOR } from "@/lib/student-ui";
import { ArrowLeft, Loader2 } from "lucide-react";

type Severity = "critical" | "warning" | "info";
type IssueAction =
  | { kind: "assign_copy"; requestId: string }
  | { kind: "release_copy"; bookId: string; requestId?: string }
  | { kind: "reassign_hub"; requestId: string }
  | { kind: "close_request"; requestId: string; outcome: "expired" | "cancelled" };

type IssueItem = {
  id: string;
  severity: Severity;
  description: string;
  relatedEntity: { type: "request" | "book" | "hub"; id: string; label: string };
  hubId: string | null;
  startedAt: string;
  action: IssueAction;
};

type SystemHealth = {
  issues: IssueItem[];
  stuckRequestThresholdHours: number;
  fulfilledReadyThresholdHours: number;
  reservedIdleThresholdHours: number;
  expirySoonThresholdHours: number;
};

type DeliveryRow = {
  id: string;
  type: string;
  status: "pending" | "failed" | "sent";
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  payload: Record<string, unknown>;
  hubId?: string | null;
};

type Hub = { id: string; name: string };

const outline = "rounded-md border border-border bg-background";

function severityClass(s: Severity) {
  if (s === "critical") return "border-destructive/50 bg-destructive/5";
  if (s === "warning") return "border-accent/35 bg-accent/5";
  return "border-border bg-muted/30";
}

function severityBadgeClass(s: Severity) {
  if (s === "critical") return "border-destructive/50 text-destructive";
  if (s === "warning") return "border-accent/45 text-foreground dark:bg-accent/10";
  return "text-muted-foreground";
}

function fmtAge(iso: string) {
  const ms = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function eventTypeLabel(type: string): string {
  if (type === "book_request_routed") return "Request created";
  if (type === "book_request_fulfilled" || type === "book_request_ready") return "Request fulfilled";
  if (type === "p2p_hub_acquired_copy") return "Book acquired";
  if (type === "p2p_dropoff_approved") return "Drop-off approved";
  if (type === "hub_purchase_confirmation" || type === "p2p_purchase_confirmation") return "Purchase completed";
  return type;
}

function deliveryStatusLabel(status: DeliveryRow["status"]) {
  if (status === "sent") return "delivered";
  return status;
}

function SuperAdminOperationsContent() {
  const { token } = useAuth();
  const inShell = useStudentShell();
  const qc = useQueryClient();
  const [severity, setSeverity] = useState<"all" | Severity>("all");
  const [hubId, setHubId] = useState<string>("all");
  const [reassignIssue, setReassignIssue] = useState<IssueItem | null>(null);
  const [targetHubId, setTargetHubId] = useState<string>("");
  const [assignIssue, setAssignIssue] = useState<IssueItem | null>(null);

  const hubsQ = useQuery({
    queryKey: ["catalog", "hubs", "superadmin-ops"],
    queryFn: () => apiFetch<{ hubs: Hub[] }>("/api/catalog/hubs", { token: token! }),
    enabled: !!token,
  });

  const healthQ = useQuery({
    queryKey: ["admin", "system-health", hubId],
    queryFn: () =>
      apiFetch<SystemHealth>(`/api/admin/system-health${hubId === "all" ? "" : `?hubId=${encodeURIComponent(hubId)}`}`, {
        token: token!,
      }),
    enabled: !!token,
  });

  const notifQ = useQuery({
    queryKey: ["admin", "notification-deliveries", "ops", hubId],
    queryFn: () =>
      apiFetch<{ deliveries: DeliveryRow[] }>(
        `/api/admin/notification-deliveries?opsOnly=true&limit=50${hubId === "all" ? "" : `&hubId=${encodeURIComponent(hubId)}`}`,
        {
          token: token!,
        },
      ),
    enabled: !!token,
  });

  const retryM = useMutation({
    mutationFn: (id: string) =>
      apiFetch("/api/admin/notification-deliveries/" + id + "/retry", {
        method: "POST",
        token: token!,
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "notification-deliveries"] });
      toast.success("Retry queued.");
    },
    onError: (e) => toast.error(userFacingErrorMessage(e)),
  });

  const assignAnyM = useMutation({
    mutationFn: (input: { requestId: string; assignmentVerified: boolean }) =>
      apiFetch(`/api/admin/book-requests/${input.requestId}/assign-any-copy`, {
        method: "POST",
        token: token!,
        body: JSON.stringify({ confirm: true, assignmentVerified: input.assignmentVerified }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "system-health"] });
      toast.success("Assigned matching copy.");
      setAssignIssue(null);
    },
    onError: (e) => toast.error(userFacingErrorMessage(e)),
  });

  const releaseM = useMutation({
    mutationFn: (bookId: string) =>
      apiFetch(`/api/admin/books/${bookId}/force-release-reserved`, {
        method: "POST",
        token: token!,
        body: JSON.stringify({ confirm: true }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "system-health"] });
      toast.success("Reserved copy released.");
    },
    onError: (e) => toast.error(userFacingErrorMessage(e)),
  });

  const closeM = useMutation({
    mutationFn: (input: { requestId: string; outcome: "expired" | "cancelled" }) =>
      apiFetch(`/api/admin/book-requests/${input.requestId}/close`, {
        method: "POST",
        token: token!,
        body: JSON.stringify({ confirm: true, outcome: input.outcome }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "system-health"] });
      toast.success("Request closed.");
    },
    onError: (e) => toast.error(userFacingErrorMessage(e)),
  });

  const reassignM = useMutation({
    mutationFn: (input: { requestId: string; hubId: string }) =>
      apiFetch(`/api/admin/book-requests/${input.requestId}/reassign-hub`, {
        method: "POST",
        token: token!,
        body: JSON.stringify({ confirm: true, hubId: input.hubId }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "system-health"] });
      toast.success("Request reassigned.");
      setReassignIssue(null);
      setTargetHubId("");
    },
    onError: (e) => toast.error(userFacingErrorMessage(e)),
  });

  const issues = useMemo(() => {
    const src = healthQ.data?.issues ?? [];
    return src.filter((i) => (severity === "all" ? true : i.severity === severity));
  }, [healthQ.data?.issues, severity]);
  const sortedIssues = useMemo(() => {
    const rank: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };
    return [...issues].sort((a, b) => {
      if (rank[a.severity] !== rank[b.severity]) return rank[a.severity] - rank[b.severity];
      return a.startedAt.localeCompare(b.startedAt);
    });
  }, [issues]);
  const notifications = notifQ.data?.deliveries ?? [];

  const runIssueAction = (issue: IssueItem) => {
    const a = issue.action;
    if (a.kind === "assign_copy") {
      setAssignIssue(issue);
      return;
    }
    if (a.kind === "release_copy") {
      releaseM.mutate(a.bookId);
      return;
    }
    if (a.kind === "close_request") {
      closeM.mutate({ requestId: a.requestId, outcome: a.outcome });
      return;
    }
    setReassignIssue(issue);
    setTargetHubId("");
  };

  const actionLabel = (a: IssueAction) => {
    if (a.kind === "assign_copy") return "Assign copy";
    if (a.kind === "release_copy") return "Release copy";
    if (a.kind === "reassign_hub") return "Reassign hub";
    return "Close request";
  };

  return (
    <div className={cn(inShell ? "" : "pt-24")}>
      <div className="mb-6 border-b border-border pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          <div className="min-w-0">
            <p className={cn("text-[10px] font-semibold uppercase tracking-[0.35em]", PORTAL_KICKER_COLOR)}>
              Super admin
            </p>
            <h1 className="mt-1 font-serif text-lg font-light text-foreground">System health & notifications</h1>
            <p className="mt-2 max-w-2xl text-xs text-muted-foreground">
              Action-first ops panel. Triage issues quickly and retry failed notification deliveries.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[28rem]">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-foreground">Severity</p>
              <Select value={severity} onValueChange={(v) => setSeverity(v as "all" | Severity)}>
                <SelectTrigger className="h-10 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-foreground">Hub (optional)</p>
              <Select value={hubId} onValueChange={setHubId}>
                <SelectTrigger className="h-10 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All hubs</SelectItem>
                  {(hubsQ.data?.hubs ?? []).map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <section className={cn(outline, "overflow-hidden")} aria-label="Issues">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Issues</h2>
          </div>
          {healthQ.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : healthQ.isError ? (
            <p className="p-4 text-sm text-destructive">
              {userFacingErrorMessage(healthQ.error)}
            </p>
          ) : sortedIssues.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No actionable issues in scope.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-4 sm:pl-6">Severity</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Open</TableHead>
                    <TableHead className="pr-4 sm:pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedIssues.map((i) => (
                    <TableRow key={i.id} className={cn("border-border", severityClass(i.severity))}>
                      <TableCell className="pl-4 sm:pl-6">
                        <span
                          className={cn(
                            uniformBadgeShape,
                            getStatusColorClasses(i.severity === "critical" ? "rejected" : i.severity === "warning" ? "set aside" : "approved"),
                          )}
                        >
                          {i.severity}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-[16rem] text-sm">{i.description}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {i.relatedEntity.type}: {i.relatedEntity.label}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtAge(i.startedAt)} ago</TableCell>
                      <TableCell className="pr-4 sm:pr-6">
                        <Button
                          size="sm"
                          variant={i.severity === "critical" ? "default" : "outline"}
                          className="h-8 rounded-md"
                          onClick={() => runIssueAction(i)}
                          disabled={assignAnyM.isPending || releaseM.isPending || closeM.isPending || reassignM.isPending}
                        >
                          {actionLabel(i.action)}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <section className={cn(outline, "overflow-hidden")} aria-label="Notifications">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Notifications</h2>
          </div>
          {notifQ.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifQ.isError ? (
            <p className="p-4 text-sm text-destructive">
              {userFacingErrorMessage(notifQ.error)}
            </p>
          ) : notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No recent events in scope.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-4 sm:pl-6">Event type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-4 sm:pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((d) => (
                    <TableRow key={d.id} className="border-border">
                      <TableCell className="pl-4 text-sm font-medium sm:pl-6">{eventTypeLabel(d.type)}</TableCell>
                      <TableCell className="max-w-[28rem] truncate text-xs text-muted-foreground" title={String(d.payload["body"] ?? "")}>
                        {String(d.payload["body"] ?? "System event")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(d.updatedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            uniformBadgeShape,
                            getStatusColorClasses(d.status === "failed" ? "rejected" : "available"),
                          )}
                        >
                          {deliveryStatusLabel(d.status)}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4 sm:pr-6">
                        {d.status === "failed" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-md"
                            disabled={retryM.isPending}
                            onClick={() => retryM.mutate(d.id)}
                          >
                            Retry
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>

      <Dialog open={!!reassignIssue} onOpenChange={(open) => !open && setReassignIssue(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign request to another hub</DialogTitle>
            <DialogDescription>Choose the destination hub and apply immediately.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={targetHubId} onValueChange={setTargetHubId}>
              <SelectTrigger className="h-10 rounded-md">
                <SelectValue placeholder="Select destination hub" />
              </SelectTrigger>
              <SelectContent>
                {(hubsQ.data?.hubs ?? [])
                  .filter((h) => h.id !== reassignIssue?.hubId)
                  .map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="h-9 rounded-md" onClick={() => setReassignIssue(null)}>
                Cancel
              </Button>
              <Button
                className="h-9 rounded-md"
                disabled={!reassignIssue || !targetHubId || reassignM.isPending}
                onClick={() =>
                  reassignIssue &&
                  reassignIssue.action.kind === "reassign_hub" &&
                  reassignM.mutate({ requestId: reassignIssue.action.requestId, hubId: targetHubId })
                }
              >
                Reassign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assignIssue} onOpenChange={(open) => !open && setAssignIssue(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign copy confirmation</DialogTitle>
            <DialogDescription>Have you physically verified this book on shelf?</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button
              type="button"
              className="h-9 rounded-md"
              disabled={!assignIssue || assignAnyM.isPending}
              onClick={() => {
                const requestId = assignIssue?.action.kind === "assign_copy" ? assignIssue.action.requestId : null;
                if (!requestId) return;
                assignAnyM.mutate({ requestId, assignmentVerified: true });
              }}
            >
              Verified on shelf
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-md"
              disabled={!assignIssue || assignAnyM.isPending}
              onClick={() => {
                const requestId = assignIssue?.action.kind === "assign_copy" ? assignIssue.action.requestId : null;
                if (!requestId) return;
                assignAnyM.mutate({ requestId, assignmentVerified: false });
              }}
            >
              Assign without verification
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SuperAdminOperationsPage() {
  return (
    <SuperAdminRoute>
      <SuperAdminOperationsContent />
    </SuperAdminRoute>
  );
}
