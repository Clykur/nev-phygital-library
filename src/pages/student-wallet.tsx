import { motion } from "framer-motion";
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/context/wallet-context";
import { format } from "date-fns";
import { PORTAL_PAGE_CONTAINER } from "@/lib/student-ui";
import {
  PORTAL_PAGE_LEAD,
  PORTAL_PAGE_TITLE,
  PORTAL_SECTION_LABEL,
  PORTAL_STAT_VALUE,
} from "@/lib/portal-typography";
import { cn } from "@/lib/utils";

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function StudentWalletPage() {
  const { balance, transactions, subscription, subscribe } = useWallet();

  const totalEarned = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className={cn(PORTAL_PAGE_CONTAINER, "space-y-8 py-8")}>
      <header className="border-b border-border pb-6">
        <div className="mb-2 flex items-center gap-3">
          <WalletIcon className="h-7 w-7 text-primary" aria-hidden />
          <h1 className={PORTAL_PAGE_TITLE}>Wallet</h1>
        </div>
        <p className={cn(PORTAL_PAGE_LEAD, "max-w-2xl")}>
          Manage credits, track transactions, and unlock premium membership benefits.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <Card variant="bento" className="relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
              <CardHeader className="relative pb-2">
                <p className={cn(PORTAL_SECTION_LABEL, "text-foreground-muted")}>Available credits</p>
              </CardHeader>
              <CardContent className="relative pt-0">
                <p className={PORTAL_STAT_VALUE}>{balance.toLocaleString()}</p>
                <p className="mt-2 body-scale text-foreground-muted">
                  Available for borrowing, marketplace purchases, and member services.
                </p>
              </CardContent>
              <WalletIcon
                className="pointer-events-none absolute right-6 top-6 h-16 w-16 text-primary/10"
                aria-hidden
              />
            </Card>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <Card variant="default">
              <CardContent className="p-6">
                <p className={PORTAL_SECTION_LABEL}>Total earned</p>
                <p className={cn(PORTAL_STAT_VALUE, "mt-2")}>{totalEarned.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card variant="default">
              <CardContent className="p-6">
                <p className={PORTAL_SECTION_LABEL}>Total spent</p>
                <p className={cn(PORTAL_STAT_VALUE, "mt-2")}>{totalSpent.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <Card variant="default" className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-start gap-4 p-6">
              <Sparkles className="h-6 w-6 shrink-0 text-primary" aria-hidden />
              <div>
                <h3 className="h4-scale font-semibold text-foreground">Earn more credits</h3>
                <p className="mt-1 body-scale text-foreground-muted">
                  Borrow books, write reviews, participate in community events, and earn rewards.
                </p>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-4">
            <h2 className="h4-scale font-semibold text-foreground">Transaction history</h2>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((t, i) => (
                  <motion.div
                    key={t.id}
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.05 + i * 0.03 }}
                  >
                    <Card
                      variant="default"
                      interactive
                      className="flex flex-row items-center justify-between gap-4 p-6"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div
                          className={cn(
                            "rounded-full p-3",
                            t.type === "credit"
                              ? "bg-success/10 text-success"
                              : "bg-muted text-foreground-muted",
                          )}
                        >
                          {t.type === "credit" ? (
                            <ArrowDownRight className="h-5 w-5" aria-hidden />
                          ) : (
                            <ArrowUpRight className="h-5 w-5" aria-hidden />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="body-scale font-medium text-foreground">{t.description}</p>
                          <p className="caption-scale text-foreground-muted">
                            {format(new Date(t.createdAt), "MMM d, yyyy • h:mm a")}
                          </p>
                        </div>
                      </div>
                      <p
                        className={cn(
                          "shrink-0 font-mono h4-scale font-semibold tabular-nums",
                          t.type === "credit" ? "text-success" : "text-foreground",
                        )}
                      >
                        {t.type === "credit" ? "+" : "-"}
                        {t.amount.toLocaleString()}
                      </p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card variant="default" className="border-dashed">
                <CardContent className="p-10 text-center">
                  <p className="body-scale text-foreground-muted">No transactions yet.</p>
                </CardContent>
              </Card>
            )}
          </section>
        </div>

        <aside className="space-y-6 xl:col-span-5">
          <Card variant="elevated">
            <CardHeader>
              <p className={PORTAL_SECTION_LABEL}>Membership status</p>
              <CardTitle>
                {subscription === "pro" ? "Pro member" : "Free member"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="body-scale text-foreground-muted">
                {subscription === "pro"
                  ? "Premium borrowing and delivery benefits are active."
                  : "Upgrade to unlock premium benefits and bonus credits."}
              </p>
            </CardContent>
          </Card>

          <section className="space-y-4">
            <h2 className="h4-scale flex items-center gap-2 font-semibold text-foreground">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden />
              Subscription plans
            </h2>

            <Card
              variant="default"
              className={cn(
                subscription === "free" && "border-primary ring-2 ring-primary/10",
              )}
            >
              <CardContent className="p-6">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="h4-scale font-semibold text-foreground">Free tier</h3>
                    <p className={cn(PORTAL_STAT_VALUE, "mt-2")}>
                      ₹0
                      <span className="ml-1 body-scale font-normal text-foreground-muted">/month</span>
                    </p>
                  </div>
                  {subscription === "free" ? (
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" aria-hidden />
                  ) : null}
                </div>
                <ul className="mb-6 space-y-3 body-scale text-foreground-muted">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
                    Browse catalog
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
                    Pay-per-book access
                  </li>
                </ul>
                <Button
                  variant={subscription === "free" ? "secondary" : "outline"}
                  className="h-11 w-full rounded-xl"
                  disabled={subscription === "free"}
                  onClick={() => subscribe("free")}
                >
                  {subscription === "free" ? "Current plan" : "Downgrade"}
                </Button>
              </CardContent>
            </Card>

            <Card
              variant="bento"
              className={cn(
                "relative overflow-hidden",
                subscription === "pro" && "border-primary ring-2 ring-primary/10",
              )}
            >
              <span className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 caption-scale font-semibold uppercase tracking-kicker text-primary-foreground">
                Most popular
              </span>
              <CardContent className="p-6">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="h4-scale font-semibold text-foreground">Pro tier</h3>
                    <p className={cn(PORTAL_STAT_VALUE, "mt-2")}>
                      ₹999
                      <span className="ml-1 body-scale font-normal text-foreground-muted">/month</span>
                    </p>
                  </div>
                  {subscription === "pro" ? (
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" aria-hidden />
                  ) : null}
                </div>
                <ul className="mb-6 space-y-3 body-scale text-foreground-muted">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
                    Unlimited browsing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
                    Priority waitlist
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
                    Zero delivery fees
                  </li>
                  <li className="flex items-start gap-2 font-medium text-primary">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    +5,000 credits instantly on signup
                  </li>
                </ul>
                <Button
                  className="h-11 w-full rounded-xl"
                  disabled={subscription === "pro"}
                  onClick={() => subscribe("pro")}
                >
                  {subscription === "pro" ? "Current plan" : "Upgrade to Pro"}
                </Button>
              </CardContent>
            </Card>
          </section>
        </aside>
      </div>
    </div>
  );
}
