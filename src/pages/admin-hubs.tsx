import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useStudentShell } from "@/components/layout/StudentAppShell";
import { apiFetch } from "@/lib/api";
import { userFacingErrorMessage } from "@/lib/error-messages";
import { adminHubPath, portalPathsForUser } from "@/lib/app-paths";
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
import { HUB_KIND_VALUES, hubKindLabel } from "@/lib/hub-display";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import { PORTAL_INLINE_LINK, PORTAL_KICKER_COLOR } from "@/lib/student-ui";
import { Loader2 } from "lucide-react";

type HubRow = {
  id: string;
  publicId?: string;
  name: string;
  location: string;
  kind: string;
  isActive: boolean;
  capacity: number | null;
  memberCount: number;
  bookCount: number;
  activeRequestCount: number;
};

type StatusFilter = "all" | "active" | "inactive";
type KindFilter = "all" | (typeof HUB_KIND_VALUES)[number];

/** One border, flat panel — matches All copies (hub inventory) and Users. */
const outline = "rounded-md border border-border bg-background";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">{children}</h2>
  );
}

function AdminHubsContent() {
  const { token, user } = useAuth();
  const inShell = useStudentShell();
  const isSuperAdmin = user?.baseRole === "super_admin";
  const [rawQuery, setRawQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const query = useDebouncedValue(rawQuery, 300);
  const topPad = inShell ? "" : "pt-24";

  const q = useQuery({
    queryKey: ["admin", "hubs", query],
    queryFn: () =>
      apiFetch<{ hubs: HubRow[]; total: number }>(
        `/api/admin/hubs?${new URLSearchParams({ query, limit: "200", offset: "0" })}`,
        { token: token! },
      ),
    enabled: !!token,
  });

  const rows = q.data?.hubs ?? [];
  const filteredHubs = useMemo(() => {
    let list = rows;
    if (statusFilter === "active") list = list.filter((h) => h.isActive);
    if (statusFilter === "inactive") list = list.filter((h) => !h.isActive);
    if (kindFilter !== "all") list = list.filter((h) => h.kind === kindFilter);
    return list;
  }, [rows, statusFilter, kindFilter]);

  const clearFilters = () => {
    setRawQuery("");
    setStatusFilter("all");
    setKindFilter("all");
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
            <h1 className="mt-1 font-serif text-lg font-light text-foreground">Hubs</h1>
            {isSuperAdmin ? (
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                Sites, capacity, and member counts. Open a row to edit. Use{" "}
                <span className="font-semibold text-foreground">Status</span>,{" "}
                <span className="font-semibold text-foreground">Type</span>, and{" "}
                <span className="font-semibold text-foreground">Search</span> to narrow the list. For physical
                stock, use{" "}
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
              htmlFor="admin-hubs-status"
              className="text-[10px] font-bold uppercase tracking-wide text-foreground"
            >
              Status
            </Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger id="admin-hubs-status" className={selectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-[12rem]">
            <Label
              htmlFor="admin-hubs-type"
              className="text-[10px] font-bold uppercase tracking-wide text-foreground"
            >
              Type
            </Label>
            <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as KindFilter)}>
              <SelectTrigger id="admin-hubs-type" className={selectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {HUB_KIND_VALUES.map((k) => (
                  <SelectItem key={k} value={k}>
                    {hubKindLabel(k)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 flex-1 basis-[14rem]">
            <Label
              htmlFor="admin-hubs-search"
              className="text-[10px] font-bold uppercase tracking-wide text-foreground"
            >
              Search
            </Label>
            <Input
              id="admin-hubs-search"
              className={cn("mt-1.5", inputClass)}
              placeholder="Name, place, or kind…"
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              aria-label="Search hubs"
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

      <section className={cn(outline, "overflow-hidden")} aria-label="All hubs">
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
              <SectionLabel>All hubs</SectionLabel>
              <p className="mt-1 text-xs text-muted-foreground">
                {filteredHubs.length === rows.length
                  ? `${rows.length} in scope${q.data && q.data.total > rows.length ? ` · ${q.data.total} match search` : ""}`
                  : `${filteredHubs.length} shown · ${rows.length} in search scope`}
              </p>
            </div>
            {!rows.length ? (
              <p className="px-4 py-10 text-sm text-muted-foreground sm:px-4">No hubs match this search.</p>
            ) : !filteredHubs.length ? (
              <p className="px-4 py-10 text-sm text-muted-foreground sm:px-4">No hubs match the filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="pl-4 sm:pl-6">Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Kind</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead className="text-right">Books</TableHead>
                      <TableHead className="text-right">Open req.</TableHead>
                      <TableHead>Load</TableHead>
                      <TableHead className="pr-4 sm:pr-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHubs.map((h) => (
                      <TableRow key={h.id} className="cursor-pointer border-border">
                        <TableCell className="pl-4 font-medium sm:pl-6">
                          <Link href={adminHubPath(h.id)} className={PORTAL_INLINE_LINK}>
                            {h.name}
                          </Link>
                          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                            {h.publicId ?? h.id.slice(0, 8)}
                          </p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{h.location}</TableCell>
                        <TableCell>
                          <span className={cn(uniformBadgeShape, getStatusColorClasses("approved"), "font-normal")}>
                            {hubKindLabel(h.kind)}
                          </span>
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">{h.memberCount}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                          {h.bookCount}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                          {h.activeRequestCount}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {h.bookCount <= 0
                            ? "—"
                            : h.activeRequestCount / Math.max(1, h.bookCount) > 0.2
                              ? "High request density"
                              : "Normal"}
                        </TableCell>
                        <TableCell className="pr-4 sm:pr-6">
                          <span className={cn(uniformBadgeShape, getStatusColorClasses(h.isActive ? "available" : "cancelled"))}>
                            {h.isActive ? "Active" : "Off"}
                          </span>
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

export default function AdminHubsPage() {
  return (
    <SuperAdminRoute>
      <AdminHubsContent />
    </SuperAdminRoute>
  );
}
