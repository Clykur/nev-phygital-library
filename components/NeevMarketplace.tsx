import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/auth-context';
import { Search, ChevronDown, BookOpen, MapPin, Eye, BookMarked } from 'lucide-react';
const CATALOG_PAGE_SIZE = 12;

export const NeevMarketplace: React.FC<any> = ({
  onLocateOnMap,
  addXp,
}) => {
  const { token } = useAuth();
  
  const { data: backendBooksPayload } = useQuery({
    queryKey: ['catalog', 'books'],
    queryFn: () => apiFetch<{ books: any[] }>('/api/catalog/books', { token: token || undefined })
  });
  
  const backendBooks = backendBooksPayload?.books || [];

  const books = backendBooks.map((cat: any, idx: number) => {
    const aisMap = ['A', 'B', 'C', 'D', 'E', 'B'];
    const parsedAisle = aisMap[idx % aisMap.length];
    return {
      id: cat.id,
      title: cat.title,
      author: cat.author || "Peer/Hub Listing",
      year: 2024,
      genre: 'Technology',
      isbn: cat.refId || cat.id,
      rating: 4.8 - (idx * 0.1),
      pages: 400 + (idx * 50),
      physicalCopiesTotal: 1,
      physicalCopiesAvailable: cat.status === 'available' ? 1 : 0,
      digitalAvailable: true,
      shelfLocation: { aisle: parsedAisle as any, shelfId: `${parsedAisle}${idx + 1}`, row: (idx % 4) + 1 },
      summary: "Book available from Hub.",
      keyTakeaways: [],
      source: idx % 3 === 0 ? 'peer' : 'hub' // Mocking peer vs hub
    };
  });

  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'hub' | 'peers'>('all');
  const [browsePage, setBrowsePage] = useState(1);

  const filteredBooks = books.filter((book) => {
    const q = search.trim().toLowerCase();

    // Filter by source
    if (sourceFilter === 'hub' && book.source !== 'hub') return false;
    if (sourceFilter === 'peers' && book.source !== 'peer') return false;

    // Filter by search
    if (!q) return true;
    return (
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      book.isbn.toLowerCase().includes(q)
    );
  });

  const browseTotalPages = Math.max(1, Math.ceil(filteredBooks.length / CATALOG_PAGE_SIZE));
  const browseRows = filteredBooks.slice(
    (browsePage - 1) * CATALOG_PAGE_SIZE,
    browsePage * CATALOG_PAGE_SIZE,
  );

  return (
    <div className="min-h-[100dvh] bg-background pb-8 sm:pb-12 text-foreground animate-in fade-in slide-in-from-bottom-[20px] duration-500">
      <div className="mx-auto w-full">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6 border-b border-border/30 pb-4 flex flex-col items-start justify-between gap-4 sm:gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#64748B]">
              Student
            </p>
            <h1 className="mt-1  text-lg font-bold tracking-tight text-foreground text-balance">
              Find a Book
            </h1>
          </div>
        </div>

        {/* Filters & Search - Styled like marketplace.tsx */}
        <div className="mb-8 border-b border-border/30 pb-6">
          <div className="flex w-full items-end gap-2 min-w-0">
            <div className="flex min-w-0 flex-1 flex-col">
              <label className="text-[10px] text-muted-foreground mb-1">Search</label>
              <div className="mt-1.5 flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-transparent transition-all">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search title, author, or subject…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-w-0 flex-1 border-none bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none sm:text-[15px]"
                />
              </div>
            </div>

            <div className="flex w-[100px] shrink-0 flex-col sm:w-[120px]">
              <label className="text-[10px] text-muted-foreground mb-1">Source</label>
              <div className="relative mt-1.5">
                <select
                  value={sourceFilter}
                  onChange={(e) => {
                    setSourceFilter(e.target.value as any);
                    setBrowsePage(1); // Reset page on filter
                  }}
                  className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all pr-8"
                >
                  <option value="all">All</option>
                  <option value="hub">Hubs</option>
                  <option value="peers">Peers</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex w-auto shrink flex-col">
              <label className="text-[10px] text-muted-foreground mb-1">Request</label>
              <button
                className="mt-1.5 flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium transition-colors hover:bg-slate-100 text-slate-700"
                onClick={() => alert("Book Request Modal triggered")}
              >
                <BookMarked className="h-4 w-4 text-slate-700" />
                <span className="truncate text-[11px] sm:text-sm">Request a book</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grid View */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-fr">
          {browseRows.map((book) => {
            const isAvailable = book.physicalCopiesAvailable > 0;
            return (
              <div key={book.id} className="group relative flex flex-col overflow-hidden rounded-xl bg-background border border-border/80 shadow-sm transition-all hover:border-border hover:shadow-md h-full">
                {/* Image Area */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/30">
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="w-20 h-28 bg-muted/60 rounded flex-shrink-0 relative overflow-hidden flex flex-col justify-between p-2 shadow-sm border border-border/50">
                      <div className="w-1.5 h-full bg-primary absolute left-0 top-0"></div>
                      <span className="text-[9px] font-bold text-foreground/90 leading-tight line-clamp-3">
                        {book.title}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground line-clamp-1">
                      {book.source === 'hub' ? 'From Hub' : 'From Peer'}
                    </span>
                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground/60">
                      #{book.isbn.substring(Math.max(0, book.isbn.length - 4))}
                    </span>
                  </div>

                  <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground sm:text-base">
                    {book.title}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {book.author}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {isAvailable ? (
                      <span className="rounded-sm bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Available
                      </span>
                    ) : (
                      <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Checked Out
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-4 flex gap-2">
                    <button
                      onClick={() => {
                        onLocateOnMap(book.shelfLocation.shelfId);
                        addXp(10);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      Locate
                    </button>
                    <button
                      onClick={() => addXp(40)}
                      className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${isAvailable
                          ? 'bg-slate-900 text-white hover:bg-slate-800'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Hold
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-sm font-semibold text-foreground">No books found</h3>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search criteria.</p>
          </div>
        )}

        {/* Pagination styled like marketplace.tsx */}
        {browseTotalPages > 1 && (
          <nav className="mt-8 flex justify-end">
            <div className="inline-flex w-full sm:w-auto items-center justify-between gap-1 sm:gap-2 rounded-none border border-border bg-background p-1 sm:px-2 sm:py-1">
              <button
                disabled={browsePage <= 1}
                onClick={() => setBrowsePage(p => p - 1)}
                className="px-2 sm:px-3 py-1 text-xs font-medium border border-border rounded-none disabled:opacity-50 hover:bg-muted"
              >
                Previous
              </button>
              <span className="flex-1 sm:flex-none sm:min-w-[8.5rem] text-center text-[10px] sm:text-xs text-muted-foreground tabular-nums">
                Page {browsePage} of {browseTotalPages}
              </span>
              <button
                disabled={browsePage >= browseTotalPages}
                onClick={() => setBrowsePage(p => p + 1)}
                className="px-2 sm:px-3 py-1 text-xs font-medium border border-border rounded-none disabled:opacity-50 hover:bg-muted"
              >
                Next
              </button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};
