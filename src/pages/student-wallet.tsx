import { motion } from "framer-motion";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/wallet-context";
import { format } from "date-fns";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function StudentWalletPage() {
  const { balance, transactions, subscription, subscribe } = useWallet();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-border/50 pb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-3">
          <WalletIcon className="h-8 w-8 text-primary" /> Wallet
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage your credits, view transactions, and upgrade your subscription.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Balance & Transactions */}
        <div className="md:col-span-7 space-y-8">
          
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/20 to-background border border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <WalletIcon className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">Available Credits</p>
                <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-foreground mb-6">
                  {balance.toLocaleString()}
                </h2>
                <div className="flex gap-4">
                  <Button className="rounded-full px-8">Buy Credits</Button>
                  <Button variant="outline" className="rounded-full px-8 bg-background/50 backdrop-blur">Redeem</Button>
                </div>
              </div>
            </div>
          </motion.div>

          <section>
            <h3 className="text-xl font-bold mb-4">Transaction History</h3>
            <div className="space-y-4">
              {transactions.length > 0 ? transactions.map((t, i) => (
                <motion.div 
                  key={t.id} 
                  variants={fadeInUp} 
                  initial="hidden" 
                  animate="visible" 
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${t.type === 'credit' ? 'bg-emerald-500/10 text-secondary' : 'bg-rose-500/10 text-destructive'}`}>
                      {t.type === 'credit' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(t.createdAt), 'MMM d, yyyy • h:mm a')}</p>
                    </div>
                  </div>
                  <div className={`font-bold text-lg ${t.type === 'credit' ? 'text-secondary' : 'text-foreground'}`}>
                    {t.type === 'credit' ? '+' : '-'}{t.amount.toLocaleString()}
                  </div>
                </motion.div>
              )) : (
                <div className="p-8 text-center border border-dashed rounded-xl bg-muted/30">
                  <p className="text-muted-foreground">No transactions yet.</p>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Right Column: Subscriptions */}
        <div className="md:col-span-5 space-y-6">
          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" /> Subscription Plans
            </h3>
            
            <div className="space-y-4">
              {/* Free Plan */}
              <div className={`p-6 rounded-2xl border-2 transition-all ${subscription === 'free' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg">Free Tier</h4>
                    <p className="text-2xl font-extrabold mt-1">₹0 <span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  </div>
                  {subscription === 'free' && <CheckCircle2 className="w-6 h-6 text-primary" />}
                </div>
                <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-secondary" /> Browse catalog</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-secondary" /> Pay-per-book</li>
                </ul>
                <Button 
                  variant={subscription === 'free' ? "secondary" : "outline"} 
                  className="w-full rounded-full" 
                  disabled={subscription === 'free'}
                  onClick={() => subscribe('free')}
                >
                  {subscription === 'free' ? 'Current Plan' : 'Downgrade to Free'}
                </Button>
              </div>

              {/* Pro Plan */}
              <div className={`p-6 rounded-2xl border-2 transition-all relative overflow-hidden ${subscription === 'pro' ? 'border-accent bg-amber-500/5' : 'border-border bg-card'}`}>
                <div className="absolute top-0 right-0 bg-accent text-accent/90 text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                  Recommended
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg flex items-center gap-2">Pro Tier</h4>
                    <p className="text-2xl font-extrabold mt-1">₹999 <span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  </div>
                  {subscription === 'pro' && <CheckCircle2 className="w-6 h-6 text-accent" />}
                </div>
                <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-secondary" /> Unlimited browsing</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-secondary" /> Priority waitlist</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-secondary" /> Zero delivery fees</li>
                  <li className="flex items-start gap-2 text-accent font-medium">
                    <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                    +5,000 Credits instantly on signup
                  </li>
                </ul>
                <Button 
                  className={`w-full rounded-full ${subscription === 'pro' ? 'bg-amber-500/20 text-accent hover:bg-amber-500/30' : 'bg-accent text-accent/90 hover:bg-accent'}`}
                  disabled={subscription === 'pro'}
                  onClick={() => subscribe('pro')}
                >
                  {subscription === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
