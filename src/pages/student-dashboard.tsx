import { motion } from "framer-motion";
import { Wallet as WalletIcon, TrendingUp, ShoppingBag, Sparkles, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/context/wallet-context";
import { Link } from "wouter";
import { STUDENT_WALLET_PATH, STUDENT_BORROW_PATH } from "@/lib/app-paths";
import { useAuth } from "@/context/auth-context";
import { PORTAL_PAGE_CONTAINER } from "@/lib/student-ui";
import {
  PORTAL_PAGE_LEAD,
  PORTAL_PAGE_TITLE,
  PORTAL_SECTION_LABEL,
  PORTAL_STAT_VALUE,
} from "@/lib/portal-typography";
import { PORTAL_INLINE_LINK } from "@/lib/student-ui";
import { cn } from "@/lib/utils";
import { useStudentDashboard } from "@/hooks/use-student-dashboard";
import { fmtCreditWithRupeeEquivalent, fmtCredits } from "@/lib/credits";
import { apiFetch, apiPublicUrl } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { BorrowingsTable, type BorrowingRow } from "@/components/student/BorrowingsTable";
import { BookCoverImage } from "@/components/ui/book-cover-image";
import { addedLabel } from "@/pages/library";

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function StudentDashboardPage() {
  const { user, token } = useAuth();
  const { balance, subscription } = useWallet();

  const { data, isLoading } = useStudentDashboard();
  const hubsQ = useQuery({
    queryKey: ["catalog", "hubs", "student-dashboard"],
    enabled: !!token,
    queryFn: () =>
      apiFetch<{ hubs: { id: string; name: string }[] }>("/api/catalog/hubs", { token: token! }),
  });
  const booksQ = useQuery({
    queryKey: ["catalog", "books", "student-dashboard", user?.userId],
    enabled: !!token && !!user,
    queryFn: () =>
      apiFetch<{
        books: Array<{
          id: string;
          title: string;
          author?: string | null;
          coverImageUrl?: string | null;
          hubId: string;
          status: string;
          borrowerUserId: string | null;
          dueAt?: string | null;
          updatedAt?: string | null;
          borrowPrice?: number;
        }>;
      }>("/api/catalog/books", { token: token! }),
  });
  const p2pQ = useQuery({
    queryKey: ["p2p-listings", "student-dashboard", user?.userId],
    enabled: !!token && !!user,
    queryFn: () =>
      apiFetch<{
        listings: Array<{
          id: string;
          bookTitle: string;
          coverImageUrl?: string | null;
          status: string;
          borrowerUserId?: string | null;
          borrowDueAt?: string | null;
          updatedAt?: string | null;
          borrowPrice?: number;
          dropoffHubId?: string | null;
          hubId?: string | null;
        }>;
      }>("/api/p2p/listings", { token: token! }),
  });
  const leasesQ = useQuery({
    queryKey: ["long-term-leases", "my", user?.userId],
    enabled: !!token && !!user,
    queryFn: () =>
      apiFetch<{
        leases: Array<{
          id: string;
          bookId: string;
          bookTitle: string;
          bookAuthor?: string | null;
          coverImageUrl?: string | null;
          hubId: string;
          depositAmount: number;
          status: string;
          requestedAt?: string | null;
          approvedAt?: string | null;
          completedAt?: string | null;
        }>;
      }>("/api/long-term-leases/my", { token: token! }),
  });

  const hubName = (hubId: string | undefined | null) =>
    hubId ? (hubsQ.data?.hubs.find((h) => h.id === hubId)?.name ?? "Hub") : "Hub";

  const fmtDue = (iso: string | undefined | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const dueState = (dueAt: string | null | undefined): BorrowingRow["state"] => {
    if (!dueAt) return "active";
    const due = new Date(dueAt).getTime();
    const now = Date.now();
    if (Number.isNaN(due)) return "active";
    if (due < now) return "overdue";
    if (due - now < 2 * 24 * 60 * 60 * 1000) return "soon";
    return "active";
  };
  const activeBorrowedBookIds = new Set(
    (booksQ.data?.books ?? [])
      .filter(
        (b) =>
          b.borrowerUserId === user?.userId &&
          (b.status === "checked_out" || b.status === "overdue"),
      )
      .map((b) => b.id),
  );
  const activeLeaseBookIds = new Set(
    (leasesQ.data?.leases ?? [])
      .filter((l) => ["approved", "active", "return_pending", "completed"].includes(l.status))
      .map((l) => l.bookId),
  );
  const borrowingRows: BorrowingRow[] = [
    ...((booksQ.data?.books ?? [])
      .filter(
        (b) =>
          b.borrowerUserId === user?.userId &&
          (b.status === "checked_out" || b.status === "overdue"),
      )
      .map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        coverImageUrl: b.coverImageUrl ? apiPublicUrl(b.coverImageUrl) : b.coverImageUrl,
        hub: hubName(b.hubId),
        borrowedAt: b.updatedAt,
        dueAt: b.dueAt,
        due: fmtDue(b.dueAt),
        state: dueState(b.dueAt),
        creditsUsed: b.borrowPrice ?? 0,
        ctaLabel: "Open library",
        ctaHref: "/student/library",
        isLease: activeLeaseBookIds.has(b.id),
      })) satisfies BorrowingRow[]),
    ...((p2pQ.data?.listings ?? [])
      .filter((l) => l.borrowerUserId === user?.userId && l.status === "reserved")
      .map((l) => ({
        id: l.id,
        title: l.bookTitle,
        coverImageUrl: l.coverImageUrl ? apiPublicUrl(l.coverImageUrl) : l.coverImageUrl,
        hub: hubName(l.dropoffHubId ?? l.hubId),
        borrowedAt: l.updatedAt,
        dueAt: l.borrowDueAt,
        due: fmtDue(l.borrowDueAt),
        state: dueState(l.borrowDueAt),
        creditsUsed: l.borrowPrice ?? 0,
        ctaLabel: "Open library",
        ctaHref: "/student/library",
      })) satisfies BorrowingRow[]),
    ...((leasesQ.data?.leases ?? [])
      .filter(
        (l) =>
          ["approved", "active", "return_pending", "completed"].includes(l.status) &&
          !activeBorrowedBookIds.has(l.bookId),
      )
      .map((l) => ({
        id: l.id,
        title: l.bookTitle,
        author: l.bookAuthor,
        coverImageUrl: l.coverImageUrl ? apiPublicUrl(l.coverImageUrl) : l.coverImageUrl,
        hub: hubName(l.hubId),
        borrowedAt: l.approvedAt ?? l.requestedAt,
        dueAt: l.completedAt,
        due: fmtDue(l.completedAt),
        state: l.status === "approved" || l.status === "return_pending" ? "soon" : "active",
        creditsUsed: l.depositAmount,
        ctaLabel: "View lease",
        ctaHref: "/student/requests",
        isLease: true,
      })) satisfies BorrowingRow[]),
  ];
  return (
    <div className={cn(PORTAL_PAGE_CONTAINER, "space-y-8 py-8")}>
      <header className="border-b border-border pb-6">
        <h1 className={PORTAL_PAGE_TITLE}>
          Welcome back, {user?.name?.split(" ")[0] || "Student"}
        </h1>
        <p className={cn(PORTAL_PAGE_LEAD, "mt-2")}>
          Track your book borrowing and selling activity.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div className="space-y-8 md:col-span-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <Card variant="bento" className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="section-kicker">Wallet Balance</span>

                    <div className="rounded-lg p-2">
                      <WalletIcon className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className={PORTAL_STAT_VALUE}>{fmtCredits(balance)}</h3>

                    <p className="mt-1 text-sm text-foreground-muted">
                      Available credits for borrowing books
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <Link
                    href={STUDENT_WALLET_PATH}
                    className={cn("inline-flex items-center font-semibold", PORTAL_INLINE_LINK)}
                  >
                    View Wallet →
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.05 }}
            >
              <Card variant="bento" className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="section-kicker">Subscription Plan</span>

                    <div className="rounded-lg p-2">
                      <Sparkles className="h-5 w-5 text-accent" />
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className={cn(PORTAL_STAT_VALUE, "capitalize")}>
                      {user?.premiumActive ? "Pro Tier" : "Free Tier"}
                    </h3>

                    <p className="mt-1 text-sm text-foreground-muted">
                      {user?.premiumActive
                        ? "Premium Member — Unlimited free borrowing"
                        : "Use wallet credits to borrow books"}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <Link
                    href={STUDENT_WALLET_PATH}
                    className={cn("inline-flex items-center font-semibold", PORTAL_INLINE_LINK)}
                  >
                    Manage Subscription →
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <BorrowingsTable
            title="All Borrowings"
            rows={borrowingRows}
            loading={booksQ.isLoading || p2pQ.isLoading || hubsQ.isLoading || leasesQ.isLoading}
          />
        </div>

        <aside className="space-y-6 md:col-span-4">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Platform Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className={cn(PORTAL_SECTION_LABEL, "mb-1")}>Total Books Bought</p>
                  {isLoading ? (
                    <div className="h-6 w-12 animate-pulse rounded bg-shimmer" />
                  ) : (
                    <p className={PORTAL_STAT_VALUE}>{data?.stats.totalBought}</p>
                  )}
                </div>
                <div>
                  <p className={cn(PORTAL_SECTION_LABEL, "mb-1")}>Total Books Sold</p>
                  {isLoading ? (
                    <div className="h-6 w-12 animate-pulse rounded bg-shimmer" />
                  ) : (
                    <p className={cn(PORTAL_STAT_VALUE, "text-success")}>{data?.stats.totalSold}</p>
                  )}
                </div>
                <div>
                  <p className={cn(PORTAL_SECTION_LABEL, "mb-1")}>Credits Earned All Time</p>
                  {isLoading ? (
                    <div className="h-6 w-20 animate-pulse rounded bg-shimmer" />
                  ) : (
                    <p className={cn(PORTAL_STAT_VALUE, "text-accent")}>
                      {fmtCredits(data?.stats.creditsEarned ?? 0)}
                    </p>
                  )}
                </div>
                <div>
                  <p className={cn(PORTAL_SECTION_LABEL, "mb-1")}>Active Borrowings</p>
                  {isLoading ? (
                    <div className="h-6 w-12 animate-pulse rounded bg-shimmer" />
                  ) : (
                    <p className={PORTAL_STAT_VALUE}>
                      {data?.stats.activeBorrowings ?? borrowingRows.length}
                    </p>
                  )}
                </div>
                <div>
                  <p className={cn(PORTAL_SECTION_LABEL, "mb-1")}>Recently Viewed</p>
                  {isLoading ? (
                    <div className="h-5 w-8 animate-pulse rounded bg-shimmer" />
                  ) : (
                    <p className={PORTAL_STAT_VALUE}>{data?.stats.recentlyViewedCount ?? 0}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.15 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Recent Purchases
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-shimmer" />
                    <div className="h-3 w-1/4 animate-pulse rounded bg-shimmer" />
                  </div>
                ) : data?.recentPurchases && data.recentPurchases.length > 0 ? (
                  data.recentPurchases.slice(0, 3).map((p) => (
                    <Link
                      key={p.id}
                      href={`${STUDENT_BORROW_PATH}?book=${p.bookId}`}
                      className="flex items-start justify-between gap-4 border-b border-border pb-3 transition-opacity hover:opacity-80 last:border-0 last:pb-0"
                    >
                      <BookCoverImage
                        src={p.coverImageUrl ? apiPublicUrl(p.coverImageUrl) : null}
                        alt={p.title}
                        className="h-10 w-8 shrink-0 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate body-scale font-semibold">{p.title}</p>
                        {p.author ? (
                          <p className="truncate caption-scale text-foreground-muted">{p.author}</p>
                        ) : null}
                        <p className="mt-1 caption-scale text-foreground-muted">
                          Purchased for{" "}
                          <span className="font-semibold text-success">{fmtCredits(p.amount)}</span>
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border py-6 text-center">
                    <p className="body-scale text-foreground-muted">No recent purchases.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Recently Viewed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="h-16 animate-pulse rounded bg-shimmer" />
                ) : data?.recentBooks && data.recentBooks.length > 0 ? (
                  data.recentBooks.slice(0, 3).map((book) => (
                    <Link
                      key={book.id}
                      href={STUDENT_BORROW_PATH}
                      className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <BookCoverImage
                        src={book.coverImageUrl ? apiPublicUrl(book.coverImageUrl) : null}
                        alt={book.title}
                        className="h-14 w-10 shrink-0 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate body-scale font-semibold">{book.title}</p>
                        {book.author ? (
                          <p className="truncate caption-scale text-foreground-muted">
                            {book.author}
                          </p>
                        ) : null}
                        <p className="mt-1 caption-scale text-foreground-muted">
                          {fmtCreditWithRupeeEquivalent(book.buyPrice)} · Borrow{" "}
                          {fmtCredits(book.borrowPrice)}
                        </p>
                        <p className="mt-0.5 caption-scale text-foreground-muted">
                          Viewed {addedLabel(book.lastViewedAt)}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border py-6 text-center">
                    <p className="body-scale text-foreground-muted">No recently viewed books.</p>
                  </div>
                )}
                <Button variant="outline" className="mt-2 w-full" asChild>
                  <Link href={STUDENT_BORROW_PATH}>Browse Books</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </aside>
      </div>
    </div>
  );
}
