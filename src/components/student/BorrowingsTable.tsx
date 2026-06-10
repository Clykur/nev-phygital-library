import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { BookCoverImage } from "@/components/ui/book-cover-image";
import {
  STATUS_CHIP_AMBER_SOFT,
  STATUS_CHIP_DESTRUCTIVE_SOFT,
  STATUS_CHIP_EMERALD,
} from "@/lib/status-chip-tones";
import { PORTAL_PANEL_SURFACE } from "@/lib/student-ui";
import { cn } from "@/lib/utils";
import { fmtCredits } from "@/lib/credits";

export type BorrowingState = "active" | "soon" | "overdue" | "completed";

export type BorrowingRow = {
  id: string;
  title: string;
  author?: string | null;
  coverImageUrl?: string | null;
  hub: string;
  borrowedAt?: string | null;
  dueAt?: string | null;
  due: string;
  state: BorrowingState;
  creditsUsed: number;
  ctaLabel?: string;
  onCta?: () => void;
  ctaHref?: string;
  isLease?: boolean;
};

function stateLabel(state: BorrowingState) {
  if (state === "soon") return "Due soon";
  if (state === "overdue") return "Overdue";
  if (state === "completed") return "Completed";
  return "Active";
}

function StatusChip({ state }: { state: BorrowingState }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-sm border px-3 caption-scale font-semibold uppercase tracking-kicker",
        state === "active" && STATUS_CHIP_EMERALD,
        state === "completed" && STATUS_CHIP_EMERALD,
        state === "soon" && STATUS_CHIP_AMBER_SOFT,
        state === "overdue" && STATUS_CHIP_DESTRUCTIVE_SOFT,
      )}
    >
      {stateLabel(state)}
    </span>
  );
}

function fmtDate(iso: string | undefined | null, fallback = "—") {
  if (!iso) return fallback;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return fallback;
  return t.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type SortKey = "recent" | "due" | "title" | "credits";
const PAGE_SIZE = 10;

export function BorrowingsTable({
  title = "All Borrowings",
  rows,
  loading = false,
  emptyMessage = "No borrowings yet.",
}: {
  title?: string;
  rows: BorrowingRow[];
  loading?: boolean;
  emptyMessage?: string;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | BorrowingState>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = rows
      .filter((row) => {
        if (status !== "all" && row.state !== status) return false;
        if (!q) return true;
        return [row.title, row.author ?? "", row.hub].join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sort === "title") return a.title.localeCompare(b.title);
        if (sort === "credits") return b.creditsUsed - a.creditsUsed;
        if (sort === "due") {
          return (new Date(a.dueAt ?? 0).getTime() || 0) - (new Date(b.dueAt ?? 0).getTime() || 0);
        }
        return (
          (new Date(b.borrowedAt ?? 0).getTime() || 0) -
          (new Date(a.borrowedAt ?? 0).getTime() || 0)
        );
      });
    return out;
  }, [rows, search, sort, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <section className={cn(PORTAL_PANEL_SURFACE, "overflow-hidden")}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="h4-scale font-semibold text-foreground">{title}</h3>
          <div className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_150px_150px]">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search borrowings"
              className="h-10"
            />
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as typeof status);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="soon">Due soon</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Newest</SelectItem>
                <SelectItem value="due">Due date</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="credits">Credits</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded bg-shimmer" />
          ))}
        </div>
      ) : pageRows.length === 0 ? (
        <div className="px-6 py-8">
          <p className="body-scale text-foreground-muted">
            {emptyMessage}{" "}
            <Link
              href="/student/borrow"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Browse books
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="px-2 pb-4 pt-2">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[30%] pl-5">Book details</TableHead>
                  <TableHead className="w-[11%]">Borrow date</TableHead>
                  <TableHead className="w-[11%]">Due date</TableHead>
                  <TableHead className="w-[10%]">Credits used</TableHead>
                  <TableHead className="w-[8%]">Hub</TableHead>
                  <TableHead className="w-[13%]">Action</TableHead>
                  <TableHead className="w-[13%] pr-5 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "even:",
                      row.state === "overdue" && "border-l-2 border-l-destructive/80",
                      row.state === "soon" && "border-l-2 border-l-accent/80",
                    )}
                    data-library-row-id={row.id}
                  >
                    <TableCell className="w-[35%] pl-5">
                      <div className="flex items-center gap-2 min-w-0">
                        <BookCoverImage
                          src={row.coverImageUrl ?? null}
                          alt={row.title}
                          className="h-8 w-6 shrink-0 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium text-foreground">
                                {row.title}
                              </span>
                              {row.isLease && (
                                <span className="inline-flex shrink-0 items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                  Long-Term Lease
                                </span>
                              )}
                            </div>

                            {row.author ? (
                              <p className="truncate caption-scale text-foreground-muted">
                                {row.author}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fmtDate(row.borrowedAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.due || fmtDate(row.dueAt)}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {fmtCredits(row.creditsUsed)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.hub || "Hub"}</TableCell>
                    <TableCell>
                      {row.onCta && row.ctaLabel ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-md"
                          onClick={row.onCta}
                        >
                          {row.ctaLabel}
                        </Button>
                      ) : row.ctaHref && row.ctaLabel ? (
                        <Button size="sm" variant="outline" className="rounded-md" asChild>
                          <Link href={row.ctaHref}>{row.ctaLabel}</Link>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <StatusChip state={row.state} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-border px-5 py-3 caption-scale text-foreground-muted">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
