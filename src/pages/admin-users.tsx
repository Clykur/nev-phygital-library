import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useStudentShell } from "@/components/layout/StudentAppShell";
import { apiFetch } from "@/lib/api";
import { userFacingErrorMessage } from "@/lib/error-messages";
import { adminUserPath, portalPathsForUser } from "@/lib/app-paths";
import { SuperAdminRoute } from "@/components/super-admin-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uniformBadgeShape } from "@/lib/status-badges";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import { adminPanel, adminSearchInput, adminSelectTrigger } from "@/lib/admin-desk-ui";
import { PORTAL_PAGE_LEAD, PORTAL_PAGE_TITLE } from "@/lib/portal-typography";
import { PORTAL_INLINE_LINK, PORTAL_KICKER_COLOR } from "@/lib/student-ui";
import { Loader2 } from "lucide-react";

type UserRow = {
  id: string;
  publicId?: string;
  name: string;
  email: string;
  baseRole: string;
  accountStatus?: "active" | "held" | "deactivated";
  createdAt: string;
};

type RoleFilter = "all" | "user" | "hub" | "super_admin";
type StatusFilter = "all" | "active" | "held" | "deactivated";

function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="section-kicker">{children}</h2>;
}

function baseRoleLabel(role: string) {
  if (role === "super_admin") return "Admin";
  if (role === "hub") return "Hub";
  return "Student";
}

function AdminUsersContent() {
  const { token, user } = useAuth();
  const inShell = useStudentShell();
  const isSuperAdmin = user?.baseRole === "super_admin";
  const [rawQuery, setRawQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const query = useDebouncedValue(rawQuery, 300);
  const topPad = inShell ? "" : "pt-24";

  const q = useQuery({
    queryKey: ["admin", "users", query],
    queryFn: () =>
      apiFetch<{ users: UserRow[]; total: number }>(
        `/api/admin/users?${new URLSearchParams({ query, limit: "200", offset: "0" })}`,
        { token: token! },
      ),
    enabled: !!token,
  });

  const rows = q.data?.users ?? [];
  const filteredUsers = useMemo(() => {
    let out = rows;
    if (roleFilter !== "all") out = out.filter((u) => u.baseRole === roleFilter);
    if (statusFilter !== "all")
      out = out.filter((u) => (u.accountStatus ?? "active") === statusFilter);
    return out;
  }, [rows, roleFilter, statusFilter]);

  const clearFilters = () => {
    setRawQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className={cn(topPad)}>
      <div className="mb-6 border-b border-border pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 font-sans">
            <p className={cn("section-kicker", PORTAL_KICKER_COLOR)}>
              {isSuperAdmin ? "Super admin" : "Hub portal"}
            </p>
            <h1 className={cn("mt-1", PORTAL_PAGE_TITLE)}>Users</h1>
            {isSuperAdmin ? (
              <p className={cn("mt-2 sm:whitespace-nowrap", PORTAL_PAGE_LEAD)}>
                Filter with <span className="font-semibold text-foreground">Role</span> and{" "}
                <span className="font-semibold text-foreground">Search</span>; open a row for
                profile, roles, and hub memberships; open{" "}
                <Link
                  href={user ? portalPathsForUser(user).inventory : "/library"}
                  className={PORTAL_INLINE_LINK}
                  title="All copies — every physical copy in the platform (same as sidebar)"
                >
                  All copies
                </Link>
                .
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-[12rem]">
            <Label htmlFor="admin-users-role" className="section-kicker">
              Role
            </Label>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
              <SelectTrigger id="admin-users-role" className={adminSelectTrigger}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="user">Student</SelectItem>
                <SelectItem value="hub">Hub</SelectItem>
                <SelectItem value="super_admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-[12rem]">
            <Label htmlFor="admin-users-status" className="section-kicker">
              Status
            </Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger id="admin-users-status" className={adminSelectTrigger}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="held">Suspended</SelectItem>
                <SelectItem value="deactivated">Deactivated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 flex-1 basis-[14rem]">
            <Label htmlFor="admin-users-search" className="section-kicker">
              Search
            </Label>
            <Input
              id="admin-users-search"
              className={adminSearchInput}
              placeholder="Name or email…"
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              aria-label="Search users"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full shrink-0 rounded-md sm:w-auto"
            onClick={clearFilters}
          >
            Reset filters
          </Button>
        </div>
      </div>

      <section className={cn(adminPanel, "overflow-hidden")} aria-label="All users">
        {q.isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-9 w-9 animate-spin text-foreground-muted" />
          </div>
        ) : q.isError ? (
          <p className="px-4 py-10 text-sm text-destructive">{userFacingErrorMessage(q.error)}</p>
        ) : (
          <>
            <div className="border-b border-border px-4 py-3">
              <SectionLabel>All users</SectionLabel>
              <p className="mt-1 caption-scale font-medium text-foreground-muted">
                {filteredUsers.length === rows.length
                  ? `${rows.length} in scope${q.data && q.data.total > rows.length ? ` · ${q.data.total} match search` : ""}`
                  : `${filteredUsers.length} shown · ${rows.length} in search scope`}
              </p>
            </div>
            {!rows.length ? (
              <p className="px-4 py-10 body-scale text-foreground-muted sm:px-4">
                No users match this search.
              </p>
            ) : !filteredUsers.length ? (
              <p className="px-4 py-10 body-scale text-foreground-muted sm:px-4">
                No users match the role filter.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="pl-4 sm:pl-6">Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-4 sm:pr-6">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id} className="cursor-pointer border-border">
                        <TableCell className="pl-4 font-medium sm:pl-6">
                          <Link href={adminUserPath(u.id)} className={PORTAL_INLINE_LINK}>
                            {u.name}
                          </Link>
                          <p className="mt-0.5 caption-scale font-medium text-foreground-muted">
                            {u.publicId ?? u.id.slice(0, 8)}
                          </p>
                        </TableCell>
                        <TableCell className="text-foreground-muted">{u.email}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              uniformBadgeShape,
                              "font-normal",
                              u.baseRole === "super_admin"
                                ? "border border-destructive/20 bg-destructive/10 text-destructive"
                                : u.baseRole === "hub"
                                  ? "border border-accent/20 bg-accent/10 text-accent"
                                  : "border border-primary/20 bg-primary/10 text-primary",
                            )}
                          >
                            {baseRoleLabel(u.baseRole)}
                          </span>
                        </TableCell>
                        <TableCell className="text-foreground-muted">
                          {(u.accountStatus ?? "active") === "held"
                            ? "Suspended"
                            : (u.accountStatus ?? "active").replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="pr-4 text-foreground-muted sm:pr-6">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <SuperAdminRoute>
      <AdminUsersContent />
    </SuperAdminRoute>
  );
}
