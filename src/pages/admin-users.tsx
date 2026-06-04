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
import { getStatusColorClasses, uniformBadgeShape } from "@/lib/status-badges";
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

/** One border, flat panel — matches All copies (hub inventory). */
const outline = "rounded-md border border-border bg-background";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">{children}</h2>
  );
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
    if (statusFilter !== "all") out = out.filter((u) => (u.accountStatus ?? "active") === statusFilter);
    return out;
  }, [rows, roleFilter, statusFilter]);

  const clearFilters = () => {
    setRawQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  const selectTriggerClass = "h-10 w-full rounded-md border-border bg-background";
  const inputClass = "h-10 w-full rounded-md border-border bg-background text-sm";

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
            <h1 className="mt-1 font-serif text-lg font-light text-foreground">Users</h1>
            {isSuperAdmin ? (
              <p className="mt-2 text-xs leading-snug text-muted-foreground sm:whitespace-nowrap">
                Filter with <span className="font-semibold text-foreground">Role</span> and <span className="font-semibold text-foreground">Search</span>; open a row for profile, roles, and hub memberships; open{" "}
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
            <Label
              htmlFor="admin-users-role"
              className="text-[10px] font-bold uppercase tracking-wide text-foreground"
            >
              Role
            </Label>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
              <SelectTrigger id="admin-users-role" className={selectTriggerClass}>
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
            <Label
              htmlFor="admin-users-status"
              className="text-[10px] font-bold uppercase tracking-wide text-foreground"
            >
              Status
            </Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger id="admin-users-status" className={selectTriggerClass}>
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
            <Label
              htmlFor="admin-users-search"
              className="text-[10px] font-bold uppercase tracking-wide text-foreground"
            >
              Search
            </Label>
            <Input
              id="admin-users-search"
              className={cn("mt-1.5", inputClass)}
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

      <section className={cn(outline, "overflow-hidden")} aria-label="All users">
        {q.isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" />
          </div>
        ) : q.isError ? (
          <p className="px-4 py-10 text-sm text-destructive">
            {userFacingErrorMessage(q.error)}
          </p>
        ) : (
          <>
            <div className="border-b border-border px-4 py-3">
              <SectionLabel>All users</SectionLabel>
              <p className="mt-1 text-xs text-muted-foreground">
                {filteredUsers.length === rows.length
                  ? `${rows.length} in scope${q.data && q.data.total > rows.length ? ` · ${q.data.total} match search` : ""}`
                  : `${filteredUsers.length} shown · ${rows.length} in search scope`}
              </p>
            </div>
            {!rows.length ? (
              <p className="px-4 py-10 text-sm text-muted-foreground sm:px-4">No users match this search.</p>
            ) : !filteredUsers.length ? (
              <p className="px-4 py-10 text-sm text-muted-foreground sm:px-4">No users match the role filter.</p>
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
                          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                            {u.publicId ?? u.id.slice(0, 8)}
                          </p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              uniformBadgeShape,
                              "font-normal",
                              u.baseRole === "super_admin"
                                ? "border border-destructive/20 bg-destructive/10 text-destructive dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                                : u.baseRole === "hub"
                                  ? "border border-accent/20 bg-accent/10 text-accent dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300"
                                  : "border border-primary/20 bg-primary/10 text-primary dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300",
                            )}
                          >
                            {baseRoleLabel(u.baseRole)}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {(u.accountStatus ?? "active") === "held"
                            ? "Suspended"
                            : (u.accountStatus ?? "active").replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="pr-4 text-muted-foreground sm:pr-6">
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
