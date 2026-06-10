import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useStudentShell } from "@/components/layout/StudentAppShell";
import { apiFetch, apiPublicUrl } from "@/lib/api";
import { userFacingErrorMessage } from "@/lib/error-messages";
import {
  ADMIN_HUBS_PATH,
  SUPER_ADMIN_INVENTORY_PATH,
  SUPER_ADMIN_REQUESTS_PATH,
  SUPER_ADMIN_OVERVIEW_PATH,
  hubOverviewPathForUser,
  adminUserPath,
} from "@/lib/app-paths";
import { SuperAdminRoute } from "@/components/super-admin-route";
import { Button } from "@/components/ui/button";
import { getStatusColorClasses, uniformBadgeShape } from "@/lib/status-badges";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { adminPanel } from "@/lib/admin-desk-ui";
import { PORTAL_PAGE_TITLE, PORTAL_STAT_VALUE } from "@/lib/portal-typography";
import { PORTAL_KICKER_COLOR } from "@/lib/student-ui";
import { BOOK_COVER_PLACEHOLDER_URL, bookCoverDisplayUrl } from "@/lib/book-cover-display";
import { hubKindLabel, hubMembershipRoleLabel } from "@/lib/hub-display";

type HubPayload = {
  id: string;
  publicId: string;
  name: string;
  location: string;
  kind: string;
  isActive: boolean;
  capacity: number | null;
};

type Member = { userId: string; name: string; email: string; role: string };

type HubDetailPayload = {
  hub: HubPayload;
  memberCount: number;
  members: Member[];
  metrics: {
    totalBooks: number;
    available: number;
    checkedOut: number;
    reserved: number;
    activeRequests: number;
  };
  inventorySummary: {
    hubOwnedCopies: number;
    peerConsignmentCopies: number;
  };
  requestsSummary: {
    requested: number;
    routed: number;
    fulfilled: number;
    ready: number;
    completed: number;
    expired: number;
  };
  commerceSummary: {
    totalTransactions: number;
    recentActivity7d: number;
  };
  activity: {
    owned: Array<{
      id: string;
      title: string;
      coverImageUrl?: string | null;
      status: string;
      source: string;
      createdAt: string;
      updatedAt: string;
    }>;
    rented: Array<{
      id: string;
      title: string;
      coverImageUrl?: string | null;
      status: string;
      borrowerMasked: string;
      dueAt: string | null;
      updatedAt: string;
    }>;
    sold: Array<{
      id: string;
      title: string;
      coverImageUrl?: string | null;
      price: number;
      source: string;
      soldAt: string | null;
      buyerMasked: string;
    }>;
  };
};

type ConfirmAction = "enable" | "disable" | "delete" | null;

function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="section-kicker">{children}</h2>;
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="section-kicker">{label}</p>
      <p className={cn("mt-1", PORTAL_STAT_VALUE)}>{value}</p>
    </div>
  );
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function CoverCell({ title, url }: { title: string; url?: string | null }) {
  const src = bookCoverDisplayUrl(url ? apiPublicUrl(url) : null);
  return (
    <div className="flex items-center gap-3">
      <div className="h-12 w-9 overflow-hidden rounded border border-border bg-shimmer">
        <img
          src={src}
          alt={title}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const el = e.currentTarget;
            if (el.src !== BOOK_COVER_PLACEHOLDER_URL) el.src = BOOK_COVER_PLACEHOLDER_URL;
          }}
        />
      </div>
      <span className="line-clamp-2 text-sm">{title}</span>
    </div>
  );
}

function AdminHubDetailContent({ hubId }: { hubId: string }) {
  const { token, user: me } = useAuth();
  const inShell = useStudentShell();
  const isSuperAdmin = me?.baseRole === "super_admin";
  const controlTower = me ? hubOverviewPathForUser(me) : ADMIN_HUBS_PATH;
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const topPad = inShell ? "" : "pt-24";

  const q = useQuery({
    queryKey: ["admin", "hub", hubId, "summary-panel"],
    queryFn: () => apiFetch<HubDetailPayload>(`/api/admin/hubs/${hubId}`, { token: token! }),
    enabled: !!token && !!hubId,
  });

  const enableHub = useMutation({
    mutationFn: () =>
      apiFetch<{ ok: true }>(`/api/admin/hubs/${hubId}/enable`, { method: "POST", token: token! }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "hub", hubId] });
      void qc.invalidateQueries({ queryKey: ["admin", "hubs"] });
      toast.success("Hub enabled.");
    },
    onError: (e) => toast.error(userFacingErrorMessage(e)),
  });

  const disableHub = useMutation({
    mutationFn: () =>
      apiFetch<{ ok: true }>(`/api/admin/hubs/${hubId}/disable`, { method: "POST", token: token! }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "hub", hubId] });
      void qc.invalidateQueries({ queryKey: ["admin", "hubs"] });
      toast.success("Hub disabled.");
    },
    onError: (e) => toast.error(userFacingErrorMessage(e)),
  });

  const deleteHub = useMutation({
    mutationFn: () =>
      apiFetch<{ ok: true }>(`/api/admin/hubs/${hubId}`, {
        method: "DELETE",
        token: token!,
        body: JSON.stringify({ confirmName: deleteConfirmName }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "hubs"] });
      toast.success("Hub deleted.");
      setLocation(ADMIN_HUBS_PATH);
    },
    onError: (e) => toast.error(userFacingErrorMessage(e)),
  });

  const submitConfirm = () => {
    if (confirmAction === "enable") void enableHub.mutateAsync();
    if (confirmAction === "disable") void disableHub.mutateAsync();
    if (confirmAction === "delete") void deleteHub.mutateAsync();
    setConfirmAction(null);
  };

  if (q.isLoading) {
    return (
      <div className={cn("flex min-h-[40vh] items-center justify-center", topPad)}>
        <Loader2 className="h-9 w-9 animate-spin text-foreground-muted" />
      </div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <p className={cn("px-4 text-sm text-destructive", topPad)}>
        Hub not found or could not be loaded.
      </p>
    );
  }

  const {
    hub,
    memberCount,
    members,
    metrics,
    inventorySummary,
    requestsSummary,
    commerceSummary,
    activity,
  } = q.data;
  const inventoryHref = `${SUPER_ADMIN_INVENTORY_PATH}?hubId=${encodeURIComponent(hub.id)}`;
  const requestsHref = `${SUPER_ADMIN_REQUESTS_PATH}?hubId=${encodeURIComponent(hub.id)}`;

  return (
    <div className={cn(topPad)}>
      <div className="mb-6 border-b border-border pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className={cn("section-kicker", PORTAL_KICKER_COLOR)}>
              {isSuperAdmin ? "Super admin" : "Hub portal"}
            </p>
            <h1 className={cn("mt-1", PORTAL_PAGE_TITLE)}>{hub.name}</h1>
            <p className="mt-1 body-scale font-normal text-foreground-muted">
              {memberCount} staff member{memberCount === 1 ? "" : "s"} · Hub ID {hub.publicId}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Button variant="outline" className="h-10 w-full gap-1.5 rounded-md sm:w-auto" asChild>
              <Link href={ADMIN_HUBS_PATH}>
                <ArrowLeft className="h-4 w-4" />
                All hubs
              </Link>
            </Button>
            <Button variant="outline" className="h-10 w-full rounded-md sm:w-auto" asChild>
              <Link href={controlTower}>Control tower</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <section className={cn(adminPanel, "overflow-hidden")} aria-label="Hub details">
          <div className="border-b border-border px-4 py-3">
            <SectionLabel>Hub details</SectionLabel>
          </div>
          <div className="grid gap-3 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="section-kicker">Hub name</p>
              <p className="mt-1">{hub.name}</p>
            </div>
            <div>
              <p className="section-kicker">Hub ID</p>
              <p className="mt-1 body-scale font-normal">{hub.publicId}</p>
            </div>
            <div>
              <p className="section-kicker">Kind</p>
              <span
                className={cn(
                  uniformBadgeShape,
                  getStatusColorClasses("approved"),
                  "mt-1 font-medium",
                )}
              >
                {hubKindLabel(hub.kind)}
              </span>
            </div>
            <div>
              <p className="section-kicker">Location</p>
              <p className="mt-1">{hub.location || "—"}</p>
            </div>
            <div>
              <p className="section-kicker">Status</p>
              <span
                className={cn(
                  uniformBadgeShape,
                  getStatusColorClasses(hub.isActive ? "available" : "cancelled"),
                  "mt-1 font-medium",
                )}
              >
                {hub.isActive ? "Active" : "Disabled"}
              </span>
            </div>
            {hub.capacity != null ? (
              <div>
                <p className="section-kicker">Capacity</p>
                <p className="mt-1">{hub.capacity}</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className={cn(adminPanel, "overflow-hidden")} aria-label="Metrics">
          <div className="border-b border-border px-4 py-3">
            <SectionLabel>Metrics</SectionLabel>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard label="Total books" value={metrics.totalBooks} />
            <MetricCard label="Available" value={metrics.available} />
            <MetricCard label="Checked out" value={metrics.checkedOut} />
            <MetricCard label="Reserved" value={metrics.reserved} />
            <MetricCard label="Active requests" value={metrics.activeRequests} />
          </div>
        </section>

        <section className={cn(adminPanel, "overflow-hidden")} aria-label="Inventory summary">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <SectionLabel>Inventory summary</SectionLabel>
            <Button variant="outline" className="h-9 rounded-md" asChild>
              <Link href={inventoryHref}>Open inventory</Link>
            </Button>
          </div>
          <div className="p-4">
            <div className="grid w-full gap-3 sm:grid-cols-2">
              <MetricCard label="Hub-owned copies" value={inventorySummary.hubOwnedCopies} />
              <MetricCard
                label="Peer consignment copies"
                value={inventorySummary.peerConsignmentCopies}
              />
            </div>
          </div>
        </section>

        {activity.owned.length > 0 ? (
          <section className={cn(adminPanel, "overflow-hidden")} aria-label="Owned books">
            <div className="border-b border-border px-4 py-3">
              <SectionLabel>Owned books</SectionLabel>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-4 sm:pl-6">Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="pr-4 sm:pr-6">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activity.owned.map((r) => (
                    <TableRow key={r.id} className="border-border">
                      <TableCell className="pl-4 sm:pl-6">
                        <CoverCell title={r.title} url={r.coverImageUrl} />
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            uniformBadgeShape,
                            getStatusColorClasses(
                              r.status.toLowerCase() === "available"
                                ? "available"
                                : r.status.toLowerCase() === "checked_out"
                                  ? "checked out"
                                  : "set aside",
                            ),
                            "font-normal",
                          )}
                        >
                          {r.status.replace(/_/g, " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground-muted">
                        {r.source === "hub_inventory" ? "Hub owned" : r.source}
                      </TableCell>
                      <TableCell className="pr-4 sm:pr-6">{fmtDate(r.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ) : null}

        {activity.rented.length > 0 ? (
          <section className={cn(adminPanel, "overflow-hidden")} aria-label="Books given on rent">
            <div className="border-b border-border px-4 py-3">
              <SectionLabel>Books given on rent</SectionLabel>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-4 sm:pl-6">Title</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-4 sm:pr-6">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activity.rented.map((r) => (
                    <TableRow key={r.id} className="border-border">
                      <TableCell className="pl-4 sm:pl-6">
                        <CoverCell title={r.title} url={r.coverImageUrl} />
                      </TableCell>
                      <TableCell className="body-scale font-normal">{r.borrowerMasked}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            uniformBadgeShape,
                            getStatusColorClasses(
                              r.status.toLowerCase() === "active" ||
                                r.status.toLowerCase() === "checked_out"
                                ? "checked out"
                                : r.status.toLowerCase() === "overdue"
                                  ? "overdue"
                                  : "available",
                            ),
                            "font-medium",
                          )}
                        >
                          {r.status.replace(/_/g, " ")}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4 sm:pr-6">{fmtDate(r.dueAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ) : null}

        {activity.sold.length > 0 ? (
          <section className={cn(adminPanel, "overflow-hidden")} aria-label="Sold books">
            <div className="border-b border-border px-4 py-3">
              <SectionLabel>Sold books</SectionLabel>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-4 sm:pl-6">Title</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead className="pr-4 sm:pr-6">Sold at</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activity.sold.map((r) => (
                    <TableRow key={r.id} className="border-border">
                      <TableCell className="pl-4 sm:pl-6">
                        <CoverCell title={r.title} url={r.coverImageUrl} />
                      </TableCell>
                      <TableCell>₹{r.price.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-foreground-muted">
                        {r.source === "hub_inventory" ? "Hub owned" : "Peer consignment"}
                      </TableCell>
                      <TableCell className="body-scale font-normal">{r.buyerMasked}</TableCell>
                      <TableCell className="pr-4 sm:pr-6">{fmtDate(r.soldAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ) : null}

        <section className={cn(adminPanel, "overflow-hidden")} aria-label="Requests summary">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <SectionLabel>Requests summary</SectionLabel>
            <Button variant="outline" className="h-9 rounded-md" asChild>
              <Link href={requestsHref}>Open requests</Link>
            </Button>
          </div>
          <div className="p-4">
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard label="Requested" value={requestsSummary.requested} />
              <MetricCard label="Routed" value={requestsSummary.routed} />
              <MetricCard label="Fulfilled" value={requestsSummary.fulfilled} />
              <MetricCard label="Ready" value={requestsSummary.ready} />
              <MetricCard label="Completed" value={requestsSummary.completed} />
              <MetricCard label="Expired" value={requestsSummary.expired} />
            </div>
          </div>
        </section>

        <section className={cn(adminPanel, "overflow-hidden")} aria-label="Commerce summary">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <SectionLabel>Commerce summary</SectionLabel>
            <Button variant="outline" className="h-9 rounded-md" asChild>
              <Link href={`${SUPER_ADMIN_OVERVIEW_PATH}#wallet`}>Open commerce</Link>
            </Button>
          </div>
          <div className="p-4">
            <div className="grid w-full gap-3 sm:grid-cols-2">
              <MetricCard label="Total transactions" value={commerceSummary.totalTransactions} />
              <MetricCard label="Recent activity (7d)" value={commerceSummary.recentActivity7d} />
            </div>
          </div>
        </section>

        <section className={cn(adminPanel, "overflow-hidden")} aria-label="Admin actions">
          <div className="border-b border-border px-4 py-3">
            <SectionLabel>Admin actions</SectionLabel>
          </div>
          <div className="space-y-3 p-4">
            <p className="body-scale font-normal text-foreground-muted">
              Actions here are operational controls only. Inventory, requests, and commerce remain
              source-specific pages.
            </p>
            <div className="flex flex-wrap gap-2">
              {hub.isActive ? (
                <Button
                  variant="outline"
                  className="h-10 rounded-md"
                  onClick={() => setConfirmAction("disable")}
                  disabled={disableHub.isPending || enableHub.isPending || deleteHub.isPending}
                >
                  Disable hub
                </Button>
              ) : (
                <Button
                  className="h-10 rounded-md"
                  onClick={() => setConfirmAction("enable")}
                  disabled={disableHub.isPending || enableHub.isPending || deleteHub.isPending}
                >
                  Enable hub
                </Button>
              )}
              <Button
                variant="destructive"
                className="h-10 rounded-md"
                onClick={() => setConfirmAction("delete")}
                disabled={disableHub.isPending || enableHub.isPending || deleteHub.isPending}
              >
                Delete hub
              </Button>
            </div>
          </div>
        </section>
      </div>

      <AlertDialog
        open={confirmAction != null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
            setDeleteConfirmName("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="h4-scale font-semibold text-foreground">
              {confirmAction === "enable"
                ? "Enable this hub?"
                : confirmAction === "disable"
                  ? "Disable this hub?"
                  : "Delete this hub permanently?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="body-scale text-foreground-muted">
              {confirmAction === "enable" && "The hub will return to active operations."}
              {confirmAction === "disable" &&
                "The hub will be marked disabled and deprioritized in operations."}
              {confirmAction === "delete" &&
                `This removes the hub and dependent records. Type "${hub.name}" to confirm.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirmAction === "delete" ? (
            <div className="space-y-1.5">
              <Input
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={hub.name}
                className="h-10 rounded-md"
              />
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitConfirm}
              disabled={confirmAction === "delete" && deleteConfirmName.trim() !== hub.name}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type RouteParams = { params: { hubId: string } };

export default function AdminHubDetailPage({ params }: RouteParams) {
  return (
    <SuperAdminRoute>
      <AdminHubDetailContent hubId={params.hubId} />
    </SuperAdminRoute>
  );
}
