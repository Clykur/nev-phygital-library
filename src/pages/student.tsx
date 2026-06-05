import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, MapPin, Search, ArrowRight, Sparkles, CheckCircle2, RefreshCw } from "lucide-react";
import studentHub from "@/assets/images/student-hub.png";
import { getStatusColorClasses, uniformBadgeShape } from "@/lib/status-badges";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const INITIAL_BORROWS = [
  { id: 1, title: "Introduction to Algorithms", author: "Thomas H. Cormen", due: "2 days", hub: "Engineering Block A" },
  { id: 2, title: "Principles of Physics", author: "Resnick, Halliday", due: "14 days", hub: "Main Library" }
];

const INITIAL_RECOMMENDED = [
  { id: 3, title: "Clean Code", author: "Robert C. Martin", available: true },
  { id: 4, title: "Design Patterns", author: "Erich Gamma", available: false },
  { id: 5, title: "The Pragmatic Programmer", author: "Andrew Hunt", available: true }
];

const ACTIVITY_LOG = [
  { id: 1, action: "Borrowed", book: "Introduction to Algorithms", date: "2 days ago" },
  { id: 2, action: "Returned", book: "Calculus Vol 1", date: "1 week ago" },
  { id: 3, action: "Saved", book: "Clean Code", date: "2 weeks ago" }
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Student() {
  const [search, setSearch] = useState("");
  const [borrows, setBorrows] = useState(INITIAL_BORROWS);
  const [returnedList, setReturnedList] = useState<typeof INITIAL_BORROWS>([]);

  const handleReturn = (id: number) => {
    const book = borrows.find(b => b.id === id);
    if (book) {
      setBorrows(borrows.filter(b => b.id !== id));
      setReturnedList([book, ...returnedList]);
      toast.success(`"${book.title}" returned successfully.`);
    }
  };

  const handleRenew = (id: number) => {
    const book = borrows.find(b => b.id === id);
    if (book) {
      toast.success(`Renewed "${book.title}" for 14 more days.`);
    }
  };

  const handleReserve = (book: typeof INITIAL_RECOMMENDED[0]) => {
    toast.success(`"${book.title}" reserved! Pick it up within 24 hours.`);
  };

  const handleWaitlist = (book: typeof INITIAL_RECOMMENDED[0]) => {
    toast.success(`You've been added to the waitlist for "${book.title}".`);
  };

  const filteredBorrows = borrows.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()));
  const filteredRecommended = INITIAL_RECOMMENDED.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-[100dvh] bg-background relative pt-24 pb-32">
      {/* Blurred Background Image for depth */}
      <div className="absolute top-0 left-0 w-full h-[50vh] overflow-hidden z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background z-10" />
        <img src={studentHub} alt="" className="w-full h-full object-cover opacity-20 blur-xl mix-blend-overlay" />
      </div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        
        {/* Header Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 border-b border-border/50 pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-medium text-foreground tracking-tight mb-3">My Desk</h1>
            <p className="text-lg text-muted-foreground font-light">Welcome back, Alex. You have <span className="text-accent font-medium">{borrows.length} books</span> due soon.</p>
          </div>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search your desk..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 pl-12 pr-4 rounded-full border border-border/50 bg-card/50 backdrop-blur-md text-sm focus:outline-none focus:ring-1 focus:ring-accent w-full md:w-80 shadow-sm transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Active Borrows */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-medium flex items-center gap-3">
                  <Clock className="w-5 h-5 text-accent" /> Active Borrows
                </h2>
              </div>
              
              {filteredBorrows.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-6">
                  {filteredBorrows.map((book, i) => (
                    <motion.div layout key={book.id} initial="hidden" animate="visible" variants={fadeInUp} transition={{ delay: i * 0.1 }}>
                      <div className="glass-card bg-card/60 p-6 rounded-2xl flex flex-col h-full relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                           <BookOpen className="w-20 h-20" />
                        </div>
                        
                        <div className="flex justify-between items-start mb-6 relative z-10">
                          <div className="w-12 h-14 bg-primary rounded-sm flex items-center justify-center shadow-sm">
                            <BookOpen className="w-5 h-5 text-slate-50" />
                          </div>
                          <span className={cn(uniformBadgeShape, getStatusColorClasses("set aside"))}>
                            Due in {book.due}
                          </span>
                        </div>
                        
                        <h3 className="font-serif font-medium text-xl mb-1 line-clamp-1 relative z-10">{book.title}</h3>
                        <p className="text-sm text-muted-foreground mb-6 relative z-10">{book.author}</p>
                        
                        <div className="mt-auto pt-4 border-t border-border/50 flex flex-col gap-4 relative z-10">
                          <div className="flex items-center text-xs font-medium text-muted-foreground">
                            <MapPin className="w-3 h-3 mr-1.5" /> Return to: {book.hub}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button onClick={() => handleReturn(book.id)} size="sm" variant="outline" className="flex-1 h-9 rounded-full text-xs hover:bg-secondary/10 hover:text-secondary hover:border-secondary/20 transition-colors">Return</Button>
                            <Button onClick={() => handleRenew(book.id)} size="sm" variant="outline" className="flex-1 h-9 rounded-full text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-colors"><RefreshCw className="w-3 h-3 mr-1" /> Renew</Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed rounded-2xl bg-card/30">
                  <p className="text-muted-foreground">No active borrows found.</p>
                </div>
              )}
            </section>

            {/* Returned List (if any) */}
            {returnedList.length > 0 && (
              <section>
                <h2 className="text-xl font-serif font-medium mb-4 text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Recently Returned
                </h2>
                <div className="space-y-3">
                  {returnedList.map((book) => (
                    <motion.div layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} key={`ret-${book.id}`}>
                      <div className="glass-card bg-muted/30 p-4 rounded-xl flex items-center justify-between opacity-70">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-10 bg-slate-200 dark:bg-slate-800 rounded-sm border border-border flex items-center justify-center">
                             <CheckCircle2 className="w-4 h-4 text-secondary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground text-sm line-through">{book.title}</h3>
                            <p className="text-xs text-muted-foreground">Returned at {book.hub}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Recommended */}
            <section>
              <h2 className="text-2xl font-serif font-medium mb-6 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-accent" /> Recommended
              </h2>
              <div className="space-y-4">
                {filteredRecommended.length > 0 ? filteredRecommended.map((book, i) => (
                  <motion.div key={book.id} initial="hidden" animate="visible" variants={fadeInUp} transition={{ delay: 0.2 + (i * 0.1) }}>
                    <div className="glass-card bg-card/60 p-4 rounded-xl flex items-center justify-between hover:bg-card/80 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-12 bg-slate-200 dark:bg-slate-800 rounded-sm border border-border flex items-center justify-center">
                           <BookOpen className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground text-base">{book.title}</h3>
                          <p className="text-sm text-muted-foreground">{book.author}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {book.available ? (
                          <span className={cn(uniformBadgeShape, getStatusColorClasses("available"), "hidden sm:inline-flex")}>Available</span>
                        ) : (
                          <span className={cn(uniformBadgeShape, getStatusColorClasses("checked out"), "hidden sm:inline-flex")}>Checked Out</span>
                        )}
                        <Button 
                          size="sm" 
                          className="rounded-full shadow-sm min-w-[80px]" 
                          variant={book.available ? "default" : "secondary"}
                          onClick={() => book.available ? handleReserve(book) : handleWaitlist(book)}
                        >
                          {book.available ? "Reserve" : "Waitlist"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <p className="text-muted-foreground text-sm">No recommendations match your search.</p>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* ID Card */}
            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
              <div className="rounded-2xl p-6 bg-slate-950 text-slate-50 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <span className="font-serif italic text-accent">PSLN Member</span>
                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">
                       <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-muted-foreground">
                         <path d="M4 19.5V4.5C4 3.67157 4.67157 3 5.5 3H10.5C11.3284 3 12 3.67157 12 4.5V19.5C12 20.3284 11.3284 21 10.5 21H5.5C4.67157 21 4 20.3284 4 19.5Z" stroke="currentColor" strokeWidth="1.5"/>
                         <path d="M12 4.5C12 3.67157 12.6716 3 13.5 3H18.5C19.3284 3 20 3.67157 20 4.5V19.5C20 20.3284 19.3284 21 18.5 21H13.5C12.6716 21 12 20.3284 12 19.5V4.5Z" stroke="currentColor" strokeWidth="1.5"/>
                       </svg>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <p className="text-2xl font-medium tracking-tight mb-1">Alex Sharma</p>
                    <p className="text-muted-foreground text-sm font-mono tracking-widest">ID: 8842-1099</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-border 800 pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Borrowed</p>
                      <p className="text-lg font-medium">12</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Saved</p>
                      <p className="text-lg font-medium text-accent">₹4,500</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Membership Status */}
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} transition={{ delay: 0.1 }}>
              <div className="glass-card bg-card/60 p-6 rounded-2xl flex justify-between items-center border border-accent/20">
                <div>
                  <p className="text-xs text-accent uppercase tracking-wider font-medium mb-1">Active Plan</p>
                  <p className="font-serif font-medium text-lg">Pro ₹199/mo</p>
                </div>
                <Button onClick={() => toast("Redirecting to billing portal...")} variant="outline" size="sm" className="rounded-full shadow-sm">Manage</Button>
              </div>
            </motion.div>

            {/* Nearest Hub widget */}
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} transition={{ delay: 0.2 }}>
              <div className="glass-card bg-card/60 p-6 rounded-2xl">
                <h3 className="font-serif font-medium mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" /> Hub Location
                </h3>
                <div className="bg-muted/50 p-4 rounded-xl border border-border/50 mb-4">
                  <p className="font-medium mb-1">Engineering Block A</p>
                  <p className="text-sm text-muted-foreground">0.2 miles • Open till 8 PM</p>
                </div>
                <Button onClick={() => toast("Opening maps...")} variant="outline" className="w-full rounded-full h-10 shadow-sm group bg-background">
                  Get Directions <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} transition={{ delay: 0.3 }}>
              <div className="glass-card bg-card/60 p-6 rounded-2xl">
                <h3 className="font-serif font-medium mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {ACTIVITY_LOG.map((log) => (
                    <div key={log.id} className="flex gap-3 items-start">
                      <div className="w-2 h-2 rounded-full bg-border mt-1.5 shrink-0" />
                      <div>
                        <p className="text-sm"><span className="font-medium">{log.action}</span> {log.book}</p>
                        <p className="text-xs text-muted-foreground">{log.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
