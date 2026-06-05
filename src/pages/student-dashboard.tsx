import { motion } from "framer-motion";
import { BookOpen, Clock, Wallet as WalletIcon, TrendingUp, ShoppingBag, Tag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/context/wallet-context";
import { Link } from "wouter";
import { STUDENT_WALLET_PATH, STUDENT_BORROW_PATH, STUDENT_SELL_PATH } from "@/lib/app-paths";
import { useAuth } from "@/context/auth-context";
import { PORTAL_PAGE_CONTAINER } from "@/lib/student-ui";
import { PORTAL_PAGE_LEAD, PORTAL_PAGE_TITLE, PORTAL_SECTION_LABEL, PORTAL_STAT_VALUE } from "@/lib/portal-typography";
import { PORTAL_INLINE_LINK } from "@/lib/student-ui";
import { cn } from "@/lib/utils";

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { balance, subscription } = useWallet();

  const MOCK_RECENT_BOOKS = [
    { id: 1, title: "Introduction to Algorithms", author: "Thomas H. Cormen" },
    { id: 2, title: "Clean Code", author: "Robert C. Martin" },
  ];

  const MOCK_ACTIVE_LISTINGS = [
    { id: 1, title: "Calculus Vol 1", price: 1500, status: "Active" },
  ];

  const MOCK_PURCHASED = [
    { id: 1, title: "The Pragmatic Programmer", date: "2 days ago" },
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
                <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                  <div className="rounded-lg p-2.5">
                    <WalletIcon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="section-kicker">Balance</span>
                </CardHeader>
                <CardContent>
                  <p className={PORTAL_STAT_VALUE}>
                    {balance.toLocaleString()}{" "}
                    <span className="body-scale font-normal text-foreground-muted">Credits</span>
                  </p>
                  <Link
                    href={STUDENT_WALLET_PATH}
                    className={cn("mt-3 inline-block body-scale font-semibold", PORTAL_INLINE_LINK)}
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
                <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                  <div className="rounded-lg p-2.5">
                    <Sparkles className="h-5 w-5 text-accent" />
                  </div>
                  <span className="section-kicker">Plan</span>
                </CardHeader>
                <CardContent>
                  <p className={cn(PORTAL_STAT_VALUE, "capitalize")}>{subscription} Tier</p>
                  <Link
                    href={STUDENT_WALLET_PATH}
                    className={cn("mt-3 inline-block body-scale font-semibold", PORTAL_INLINE_LINK)}
                  >
                    Manage Subscription →
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <section>
              <h2 className="h4-scale mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-foreground-muted" />
                Recently Viewed
              </h2>
              <div className="space-y-3">
                {MOCK_RECENT_BOOKS.map((book) => (
                  <Card key={book.id} interactive className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-10 shrink-0 items-center justify-center">
                        <BookOpen className="h-4 w-4 text-foreground-muted" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate body-scale font-semibold">{book.title}</p>
                        <p className="body-scale text-foreground-muted">{book.author}</p>
                      </div>
                    </div>
                  </Card>
                ))}
                <Button variant="outline" className="mt-2 w-full" asChild>
                  <Link href={STUDENT_BORROW_PATH}>Browse More</Link>
                </Button>
              </div>
            </section>

            <section>
              <h2 className="h4-scale mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5 text-foreground-muted" />
                Active Listings
              </h2>
              <div className="space-y-3">
                {MOCK_ACTIVE_LISTINGS.map((listing) => (
                  <Card key={listing.id} interactive className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate body-scale font-semibold">{listing.title}</p>
                        <p className="body-scale font-semibold text-primary">{listing.price} Credits</p>
                      </div>
                      <span className="caption-scale shrink-0 rounded-md border border-success/30 bg-success/10 px-2 py-1 font-semibold uppercase tracking-kicker text-success">
                        {listing.status}
                      </span>
                    </div>
                  </Card>
                ))}
                <Button variant="outline" className="mt-2 w-full" asChild>
                  <Link href={STUDENT_SELL_PATH}>Manage Listings</Link>
                </Button>
              </div>
            </section>
          </div>
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
                  <p className={PORTAL_STAT_VALUE}>12</p>
                </div>
                <div>
                  <p className={cn(PORTAL_SECTION_LABEL, "mb-1")}>Total Books Sold</p>
                  <p className={cn(PORTAL_STAT_VALUE, "text-success")}>4</p>
                </div>
                <div>
                  <p className={cn(PORTAL_SECTION_LABEL, "mb-1")}>Credits Earned All Time</p>
                  <p className={cn(PORTAL_STAT_VALUE, "text-accent")}>12,500</p>
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
                {MOCK_PURCHASED.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start justify-between gap-4 border-b border-border-subtle pb-3 last:border-0 last:pb-0"
                  >
                    <p className="body-scale font-semibold">{p.title}</p>
                    <p className="caption-scale shrink-0 text-foreground-muted">{p.date}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </aside>
      </div>
    </div>
  );
}
