import { motion } from "framer-motion";
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/wallet-context";
import { format } from "date-fns";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function StudentWalletPage() {
  const {
    balance,
    transactions,
    subscription,
    subscribe,
  } = useWallet();

  const totalEarned = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8 font-sans text-foreground">

      {/* Header */}
      <div className="pb-8 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <WalletIcon className="h-8 w-8 text-primary" />

          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Wallet
          </h1>
        </div>

        <p className="max-w-2xl text-base text-muted-foreground">
          Manage credits, track transactions, and unlock premium membership
          benefits.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* Left */}
        <div className="xl:col-span-7 space-y-6">

          {/* Balance */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <div className="relative overflow-hidden rounded-3xl border bg-card p-8 shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  Available Credits
                </p>

                <h2 className="text-5xl font-bold tracking-tight text-foreground">
                  {balance.toLocaleString()}
                </h2>

                <p className="mt-3 text-sm text-muted-foreground">
                  Available for borrowing, marketplace purchases, and member
                  services.
                </p>
              </div>

              <WalletIcon className="absolute right-8 top-8 h-20 w-20 text-primary/10" />
            </div>
          </motion.div>

          {/* Insights */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border bg-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Total Earned
              </p>

              <p className="mt-2 text-2xl font-semibold text-foreground">
                {totalEarned.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Total Spent
              </p>

              <p className="mt-2 text-2xl font-semibold text-foreground">
                {totalSpent.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Rewards */}
          <div className="rounded-3xl border bg-gradient-to-r from-primary/5 to-accent/5 p-6">
            <div className="flex items-center gap-4">
              <Sparkles className="h-6 w-6 text-primary" />

              <div>
                <h3 className="font-semibold text-foreground">
                  Earn More Credits
                </h3>

                <p className="text-sm text-muted-foreground">
                  Borrow books, write reviews, participate in community events,
                  and earn rewards.
                </p>
              </div>
            </div>
          </div>

          {/* Transactions */}
          <section>
            <h3 className="text-xl font-semibold mb-4 text-foreground">
              Transaction History
            </h3>

            <div className="space-y-4">
              {transactions.length > 0 ? (
                transactions.map((t, i) => (
                  <motion.div
                    key={t.id}
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    transition={{
                      delay: 0.1 + i * 0.05,
                    }}
                    className="
                  group
                  flex
                  items-center
                  justify-between
                  rounded-2xl
                  border
                  bg-card
                  p-5
                  transition-all
                  duration-200
                  hover:shadow-md
                  hover:border-primary/20
                "
                  >
                    <div className="flex items-center gap-4">

                      <div
                        className={`p-3 rounded-full ${t.type === "credit"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-muted text-foreground"
                          }`}
                      >
                        {t.type === "credit" ? (
                          <ArrowDownRight className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <p className="font-medium text-foreground">
                          {t.description}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(t.createdAt),
                            "MMM d, yyyy • h:mm a"
                          )}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`text-lg font-semibold ${t.type === "credit"
                        ? "text-emerald-600"
                        : "text-foreground"
                        }`}
                    >
                      {t.type === "credit" ? "+" : "-"}
                      {t.amount.toLocaleString()}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-10 text-center">
                  <p className="text-muted-foreground">
                    No transactions yet.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right */}
        <div className="xl:col-span-5 space-y-6">

          {/* Membership */}
          <div className="rounded-3xl border bg-card p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Membership Status
            </p>

            <h3 className="text-xl font-semibold text-foreground">
              {subscription === "pro"
                ? "Pro Member"
                : "Free Member"}
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              {subscription === "pro"
                ? "Premium borrowing and delivery benefits are active."
                : "Upgrade to unlock premium benefits and bonus credits."}
            </p>
          </div>

          <section>
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              Subscription Plans
            </h3>

            <div className="space-y-4">

              {/* Free */}
              <div
                className={`
              rounded-3xl
              border
              bg-card
              p-6
              transition-all
              duration-300
              hover:shadow-md
              ${subscription === "free"
                    ? "border-primary ring-2 ring-primary/10"
                    : ""
                  }
            `}
              >
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h4 className="text-xl font-semibold text-foreground">
                      Free Tier
                    </h4>

                    <p className="text-3xl font-bold mt-2 text-foreground">
                      ₹0
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        /month
                      </span>
                    </p>
                  </div>

                  {subscription === "free" && (
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  )}
                </div>

                <ul className="space-y-3 mb-6 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Browse catalog
                  </li>

                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Pay-per-book access
                  </li>
                </ul>

                <Button
                  variant={
                    subscription === "free"
                      ? "secondary"
                      : "outline"
                  }
                  className="w-full h-11 rounded-xl"
                  disabled={subscription === "free"}
                  onClick={() => subscribe("free")}
                >
                  {subscription === "free"
                    ? "Current Plan"
                    : "Downgrade"}
                </Button>
              </div>

              {/* Pro */}
              <div
                className={`
              relative
              overflow-hidden
              rounded-3xl
              border
              bg-card
              p-6
              transition-all
              duration-300
              hover:shadow-lg
              ${subscription === "pro"
                    ? "border-primary ring-2 ring-primary/10"
                    : ""
                  }
            `}
              >
                <div className="absolute top-4 right-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </div>

                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h4 className="text-xl font-semibold text-foreground">
                      Pro Tier
                    </h4>

                    <p className="mt-2 text-4xl font-bold tracking-tight text-foreground">
                      ₹999
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        /month
                      </span>
                    </p>
                  </div>

                  {subscription === "pro" && (
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  )}
                </div>

                <ul className="space-y-3 mb-6 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Unlimited browsing
                  </li>

                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Priority waitlist
                  </li>

                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Zero delivery fees
                  </li>

                  <li className="flex items-start gap-2 font-medium text-primary">
                    <Sparkles className="h-4 w-4 mt-0.5" />
                    +5,000 Credits instantly on signup
                  </li>
                </ul>

                <Button
                  className="w-full h-11 rounded-xl"
                  disabled={subscription === "pro"}
                  onClick={() => subscribe("pro")}
                >
                  {subscription === "pro"
                    ? "Current Plan"
                    : "Upgrade to Pro"}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
