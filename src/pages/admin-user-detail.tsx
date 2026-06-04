import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useStudentShell } from "@/components/layout/StudentAppShell";
import { apiFetch, apiPublicUrl } from "@/lib/api";
import { userFacingErrorMessage } from "@/lib/error-messages";
import { adminHubPath, ADMIN_USERS_PATH, hubOverviewPathForUser } from "@/lib/app-paths";
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
import { hubMembershipRoleLabel } from "@/lib/hub-display";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PORTAL_INLINE_LINK, PORTAL_KICKER_COLOR } from "@/lib/student-ui";
import { BOOK_COVER_PLACEHOLDER_URL, bookCoverDisplayUrl } from "@/lib/book-cover-display";

type UserPayload = {
  id: string;
  publicId: string;
  name: string;
  email: string;
  baseRole: string;
  accountStatus: "active" | "held" | "deactivated";
  createdAt: string;
};

type MemRow = { hubId: string; hubName: string; hubKind: string; role: string };

type PurchaseRow = {
  id: string;
  title: string;
  coverImageUrl?: string | null;
  price: number;
  source: "hub" | "p2p";
  hubId: string;
  hubName: string;
  date: string | null;
};

type SaleRow = {
  id: string;
  title: string;
  coverImageUrl?: string | null;
  price: number;
  buyerMasked: string;
  hubId: string;
  hubName: string;
  date: string | null;
};

type BorrowRow = {
  id: string;
  title: string;
  coverImageUrl?: string | null;
  hubId: string;
  hubName: string;
  status: "active" | "returned";
  borrowedAt: string | null;
  returnedAt: string | null;
  dueAt: string | null;
};

type DetailPayload = {
  user: UserPayload;
  memberships: MemRow[];
  activity: {
    purchases: PurchaseRow[];
    sales: SaleRow[];
    borrowing: BorrowRow[];
  };
};

type ConfirmAction = "hold" | "deactivate" | "delete" | null;

const outline = "rounded-md border border-border bg-background";

function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">{children}</h2>;
}

function baseRoleLabel(role: string) {
  if (role === "super_admin") return "Super admin";
  if (role === "hub") return "Hub";
  return "Student";
}

function accountStatusLabel(status: UserPayload["accountStatus"]) {
  if (status === "active") return "Active";
  if (status === "held") return "Held";
  return "Deactivated";
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function CoverCell({ title, url }: { title: string; url?: string | null }) {
  const src = bookCoverDisplayUrl(url ? apiPublicUrl(url) : null);
  return (
    <div className="flex items-center gap-3">
      <div className="h-12 w-9 overflow-hidden rounded border border-border bg-muted">
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

function AdminUserDetailContent({ userId }: { userId: string }) {
  const { token, user: me } = useAuth();
  const inShell = useStudentShell();
  const isSuperAdmin = me?.baseRole === "super_admin";
  const controlTower = me ? hubOverviewPathForUser(me) : ADMIN_USERS_PATH;
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const topPad = inShell ? "" : "pt-24";

  const q = useQuery({
    queryKey: ["admin", "user", userId, "detail-panel"],
    queryFn: () => apiFetch<DetailPayload>(`/api/admin/users/${userId}`, { token: token! }),
    enabled: !!token && !!userId,
  });

  const holdUser = useMutation({
    mutationFn: () => apiFetch<{ ok: true }>(`/api/admin/users/${userId}/hold`, { method: "POST", token: token! }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "user", userId] });
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User placed on hold.");
    },
    onError: (e) => toast.error(userFacingErrorMessage(e)),
  });

  const deactivateUser = useMutation({
    mutationFn: () =>
      apiFetch<{ ok: true }>(`/api/admin/users/${userId}/deactivate`, { method: "POST", token: token! }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "user", userId] });
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User deactivated.");
    },
    onError: (e) => toast.error(userFacingErrorMessage(e)),
  });

  const deleteUser = useMutation({
    mutationFn: () => apiFetch<{ ok: true }>(`/api/admin/users/${userId}`, { method: "DELETE", token: token! }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User deleted.");
      setLocation(ADMIN_USERS_PATH);
    },
    onError: (e) => toast.error(userFacingErrorMessage(e)),
  });

  const submitConfirm = () => {
    if (confirmAction === "hold") void holdUser.mutateAsync();
    if (confirmAction === "deactivate") void deactivateUser.mutateAsync();
    if (confirmAction === "delete") void deleteUser.mutateAsync();
    setConfirmAction(null);
  };

  const confirmTitle = useMemo(() => {
    if (confirmAction === "hold") return "Hold this user?";
    if (confirmAction === "deactivate") return "Deactivate this user?";
    if (confirmAction === "delete") return "Delete this user permanently?";
    return "";
  }, [confirmAction]);

  const confirmBody = useMemo(() => {
    if (confirmAction === "hold") return "This temporarily restricts login and user actions.";
    if (confirmAction === "deactivate") return "This disables the account and blocks login/actions.";
    if (confirmAction === "delete") return "This permanently removes the user record and related memberships.";
    return "";
  }, [confirmAction]);

  if (q.isLoading) {
    return (
      <div className={cn("flex min-h-[40vh] items-center justify-center", topPad)}>
        <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (q.isError || !q.data) {
    return <p className={cn("px-4 text-sm text-destructive", topPad)}>User not found or could not be loaded.</p>;
  }

  const { user, memberships, activity } = q.data;

  return (
    <div className={cn(topPad)}>
      <div className="mb-6 border-b border-border pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p
              className={cn(
                "text-[10px] font-semibold uppercase tracking-[0.35em]",
                PORTAL_KICKER_COLOR,
              )}
            >
              {isSuperAdmin ? "Super admin" : "Hub portal"}
            </p>
            <h1 className="mt-1 font-serif text-lg font-light text-foreground">{user.name}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Button variant="outline" className="h-10 w-full gap-1.5 rounded-md sm:w-auto" asChild>
              <Link href={ADMIN_USERS_PATH}>
                <ArrowLeft className="h-4 w-4" />
                All users
              </Link>
            </Button>
            <Button variant="outline" className="h-10 w-full rounded-md sm:w-auto" asChild>
              <Link href={controlTower}>Control tower</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <section className={cn(outline, "overflow-hidden")} aria-label="Details">
          <div className="border-b border-border px-4 py-3">
            <SectionLabel>Details</SectionLabel>
          </div>
          <div className="grid gap-3 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Name</p>
              <p className="mt-1">{user.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Email</p>
              <p className="mt-1 break-all">{user.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Student ID</p>
              <p className="mt-1 font-mono text-xs">{user.publicId}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Base role</p>
              <span className={cn(uniformBadgeShape, getStatusColorClasses("approved"), "mt-1 font-normal")}>
                {baseRoleLabel(user.baseRole)}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Account status</p>
              <span
                className={cn(
                  uniformBadgeShape,
                  getStatusColorClasses(user.accountStatus === "active" ? "available" : user.accountStatus === "deactivated" ? "rejected" : "set aside"),
                  "mt-1 font-normal"
                )}
              >
                {accountStatusLabel(user.accountStatus)}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Created</p>
              <p className="mt-1">{fmtDate(user.createdAt)}</p>
            </div>
          </div>
        </section>

        {memberships.length > 0 ? (
          <section className={cn(outline, "overflow-hidden")} aria-label="Memberships">
            <div className="border-b border-border px-4 py-3">
              <SectionLabel>Memberships</SectionLabel>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-4 sm:pl-6">Hub</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="pr-4 sm:pr-6">Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberships.map((m) => (
                    <TableRow key={m.hubId} className="border-border">
                      <TableCell className="pl-4 sm:pl-6">
                        <Link href={adminHubPath(m.hubId)} className={PORTAL_INLINE_LINK}>
                          {m.hubName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.hubKind || "other"}</TableCell>
                      <TableCell className="pr-4 sm:pr-6">
                        <span className={cn(uniformBadgeShape, getStatusColorClasses("approved"), "font-normal")}>
                          {hubMembershipRoleLabel(m.role)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ) : null}

        {activity.purchases.length > 0 ? (
          <section className={cn(outline, "overflow-hidden")} aria-label="Purchases">
            <div className="border-b border-border px-4 py-3">
              <SectionLabel>Purchases</SectionLabel>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-4 sm:pl-6">Title</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Hub</TableHead>
                    <TableHead className="pr-4 sm:pr-6">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activity.purchases.map((r) => (
                    <TableRow key={`${r.source}-${r.id}`} className="border-border">
                      <TableCell className="pl-4 sm:pl-6">
                        <CoverCell title={r.title} url={r.coverImageUrl} />
                      </TableCell>
                      <TableCell>₹{r.price.toLocaleString("en-IN")}</TableCell>
                      <TableCell>{r.source === "hub" ? "Hub" : "P2P"}</TableCell>
                      <TableCell>{r.hubName}</TableCell>
                      <TableCell className="pr-4 sm:pr-6">{fmtDate(r.date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ) : null}

        {activity.sales.length > 0 ? (
          <section className={cn(outline, "overflow-hidden")} aria-label="Sales">
            <div className="border-b border-border px-4 py-3">
              <SectionLabel>Sales</SectionLabel>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-4 sm:pl-6">Title</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Sold to</TableHead>
                    <TableHead>Drop-off hub</TableHead>
                    <TableHead className="pr-4 sm:pr-6">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activity.sales.map((r) => (
                    <TableRow key={r.id} className="border-border">
                      <TableCell className="pl-4 sm:pl-6">
                        <CoverCell title={r.title} url={r.coverImageUrl} />
                      </TableCell>
                      <TableCell>₹{r.price.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="font-mono text-xs">{r.buyerMasked}</TableCell>
                      <TableCell>{r.hubName}</TableCell>
                      <TableCell className="pr-4 sm:pr-6">{fmtDate(r.date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ) : null}

        {activity.borrowing.length > 0 ? (
          <section className={cn(outline, "overflow-hidden")} aria-label="Borrowing">
            <div className="border-b border-border px-4 py-3">
              <SectionLabel>Borrowing</SectionLabel>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-4 sm:pl-6">Title</TableHead>
                    <TableHead>Hub</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Borrowed</TableHead>
                    <TableHead className="pr-4 sm:pr-6">Returned / Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activity.borrowing.map((r) => (
                    <TableRow key={r.id} className="border-border">
                      <TableCell className="pl-4 sm:pl-6">
                        <CoverCell title={r.title} url={r.coverImageUrl} />
                      </TableCell>
                      <TableCell>{r.hubName}</TableCell>
                      <TableCell>
                        <span
                          className={cn(uniformBadgeShape, getStatusColorClasses(r.status === "active" ? "checked out" : "cancelled"), "font-normal")}
                        >
                          {r.status === "active" ? "Active" : "Returned"}
                        </span>
                      </TableCell>
                      <TableCell>{fmtDate(r.borrowedAt)}</TableCell>
                      <TableCell className="pr-4 sm:pr-6">
                        {r.status === "returned" ? fmtDate(r.returnedAt) : `Due ${fmtDate(r.dueAt)}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ) : null}

        <section className={cn(outline, "overflow-hidden")} aria-label="Admin actions">
          <div className="border-b border-border px-4 py-3">
            <SectionLabel>Admin actions</SectionLabel>
            <p className="mt-1 text-xs text-muted-foreground">These actions are destructive and audit-logged.</p>
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            <Button
              type="button"
              variant="secondary"
              className="rounded-md"
              disabled={user.accountStatus !== "active" || holdUser.isPending}
              onClick={() => setConfirmAction("hold")}
            >
              Hold user
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="rounded-md"
              disabled={user.accountStatus === "deactivated" || deactivateUser.isPending}
              onClick={() => setConfirmAction("deactivate")}
            >
              Deactivate user
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-md"
              disabled={deleteUser.isPending}
              onClick={() => setConfirmAction("delete")}
            >
              Delete user
            </Button>
          </div>
        </section>
      </div>

      <AlertDialog open={confirmAction != null} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type RouteParams = { params: { userId: string } };

export default function AdminUserDetailPage({ params }: RouteParams) {
  return (
    <SuperAdminRoute>
      <AdminUserDetailContent userId={params.userId} />
    </SuperAdminRoute>
  );
}
