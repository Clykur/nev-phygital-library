import { motion } from "framer-motion";
import { BookOpen, Clock, Wallet as WalletIcon, TrendingUp, ShoppingBag, Tag, Sparkles, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/wallet-context";
import { Link } from "wouter";
import { STUDENT_WALLET_PATH, STUDENT_BORROW_PATH, STUDENT_SELL_PATH } from "@/lib/app-paths";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

import { Loader2 } from "lucide-react";
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function StudentDashboardPage() {
  const { user, token } = useAuth();
  const { balance, subscription, transactions } = useWallet();

  const { data: hubsData, isLoading: hubsLoading } = useQuery({
    queryKey: ["hubs"],
    queryFn: () => apiFetch<{ hubs: any[] }>("/api/catalog/hubs", { token: token! }),
    enabled: !!token,
  });

  const hubs = hubsData?.hubs || [];



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
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8 font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-base text-muted-foreground">
            Track your book borrowing and selling activity.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Quick Stats & Activity */}
        <div className="md:col-span-8 space-y-8">

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2">
                    <WalletIcon className="h-6 w-6 text-foreground" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Balance</span>
                </div>
                <div>
                  <p className="text-4xl font-bold text-foreground">{balance.toLocaleString()} <span className="text-base font-normal text-muted-foreground">Credits</span></p>
                  <Link href={STUDENT_WALLET_PATH} className="text-primary text-sm font-semibold hover:underline mt-2 inline-block">
                    View Wallet &rarr;
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
              <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2">
                    <Sparkles className="h-6 w-6 text-foreground" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan</span>
                </div>
                <div>
                  <p className="text-4xl font-bold text-foreground capitalize">{subscription} Tier</p>
                  <Link href={STUDENT_WALLET_PATH} className="text-primary text-sm font-semibold hover:underline mt-2 inline-block">
                    Manage Subscription &rarr;
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Book Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
                <Clock className="w-5 h-5 text-foreground" /> Recently Viewed
              </h2>
              <div className="space-y-3">
                {MOCK_RECENT_BOOKS.map(book => (
                  <div key={book.id} className="p-4 rounded-xl border border-border bg-card/50 flex gap-4 items-center">
                    <div className="w-10 h-12 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold line-clamp-1 text-foreground">{book.title}</p>
                      <p className="text-xs font-medium text-muted-foreground">{book.author}</p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-2" asChild>
                  <Link href={STUDENT_BORROW_PATH}>Browse More</Link>
                </Button>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
                <Tag className="w-5 h-5 text-foreground" /> Active Listings
              </h2>
              <div className="space-y-3">
                {MOCK_ACTIVE_LISTINGS.map(listing => (
                  <div key={listing.id} className="p-4 rounded-xl border border-border bg-card/50 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold line-clamp-1 text-foreground">{listing.title}</p>
                      <p className="text-sm font-semibold text-primary">{listing.price} Credits</p>
                    </div>
                    <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs font-semibold rounded uppercase tracking-wider">
                      {listing.status}
                    </span>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-2" asChild>
                  <Link href={STUDENT_SELL_PATH}>Manage Listings</Link>
                </Button>
              </div>
            </section>
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="md:col-span-4 space-y-6">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
            <div className="p-5 rounded-2xl bg-card border border-border">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-foreground">
                <TrendingUp className="w-4 h-4 text-foreground" /> Platform Stats
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Books Bought</p>
                  <p className="text-2xl font-semibold text-foreground">12</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Books Sold</p>
                  <p className="text-2xl font-semibold text-secondary">4</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Credits Earned All Time</p>
                  <p className="text-2xl font-semibold text-accent">12,500</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <div className="p-5 rounded-2xl bg-card border border-border">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-foreground">
                <ShoppingBag className="w-4 h-4 text-foreground" /> Recent Purchases
              </h3>
              <div className="space-y-3">
                {MOCK_PURCHASED.map(p => (
                  <div key={p.id} className="flex justify-between items-start border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <p className="text-sm font-semibold text-foreground">{p.title}</p>
                    <p className="text-xs font-medium text-muted-foreground shrink-0 ml-4">{p.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
