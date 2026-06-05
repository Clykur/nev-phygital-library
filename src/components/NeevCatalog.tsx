import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCatalogBooks } from '../lib/hooks';
import { Search, ChevronDown, BookOpen, MapPin, Eye } from 'lucide-react';

interface NeevCatalogProps {
  onLocateOnMap: (shelfId: string) => void;
  onAddReview: (bookId: string, review: { user: string; text: string; rating: number; date: string }) => void;
  addXp: (amount: number) => void;
}

export const NeevCatalog: React.FC<NeevCatalogProps> = ({
  onLocateOnMap,
  addXp,
}) => {
  const { data: backendBooks } = useCatalogBooks();
  
  const books = ((backendBooks as any)?.books || backendBooks || []).map((cat: any, idx: number) => {
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
      reviews: []
    };
  });

  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'hub' | 'peers'>('all');
  const [browsePage, setBrowsePage] = useState(1);
  const CATALOG_PAGE_SIZE = 12;

  const filteredBooks = books.filter((book) => {
    const q = search.trim().toLowerCase();
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
            <p className="caption-scale font-semibold uppercase tracking-[0.22em] text-foreground-muted">
              Student
            </p>
            <h1 className="mt-1 font-sans text-lg font-bold tracking-tight text-foreground text-balance">
              Browse books
            </h1>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="mb-8 border-b border-border/30 pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex min-w-0 flex-1 flex-col">
              <label className="text-sm font-medium text-muted-foreground mb-1">Search</label>
              <div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 transition-[box-shadow] focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15 sm:h-10 sm:px-4">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search title, author, or subject…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-w-0 flex-1 border-none bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-base"
                />
              </div>
            </div>

            <div className="flex w-[100px] shrink-0 flex-col sm:w-[120px]">
              <label className="text-sm font-medium text-muted-foreground mb-1">Source</label>
              <div className="relative">
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as any)}
                  className="h-10 w-full appearance-none rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/15 pr-8"
                >
                  <option value="all">All</option>
                  <option value="hub">Hubs</option>
                  <option value="peers">Peers</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Grid View */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-fr">
          {browseRows.map((book) => {
            const isAvailable = book.physicalCopiesAvailable > 0;
            return (
              <div key={book.id} className="group relative flex flex-col overflow-hidden rounded-xl bg-background border border-border/80 shadow-sm transition-all hover:border-border hover:shadow-sm h-full">
                {/* Image Area */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/30">
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="w-20 h-28 bg-muted/60 rounded flex-shrink-0 relative overflow-hidden flex flex-col justify-between p-2 shadow-sm border border-border/50">
                      <div className="w-1.5 h-full bg-primary absolute left-0 top-0"></div>
                      <span className="caption-scale font-bold text-foreground/90 leading-tight line-clamp-3">
                        {book.title}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="caption-scale font-medium uppercase tracking-wider text-muted-foreground line-clamp-1">
                      From hub
                    </span>
                    <span className="shrink-0 caption-scale font-medium text-muted-foreground/60">
                      #{book.isbn.substring(book.isbn.length - 4)}
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
                      <span className="rounded-sm bg-secondary/10 px-1.5 py-0.5 caption-scale font-semibold text-secondary">
                        Available
                      </span>
                    ) : (
                      <span className="rounded-sm bg-muted px-1.5 py-0.5 caption-scale font-semibold text-muted-foreground">
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
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs font-medium transition-colors hover:bg-muted/80"
                      >
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        Locate
                      </button>
                      <button
                        onClick={() => addXp(40)}
                        className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                          isAvailable 
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                            : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
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

        {/* Pagination */}
        {browseTotalPages > 1 && (
          <nav className="mt-8 flex justify-end">
            <div className="inline-flex w-full sm:w-auto items-center justify-between gap-1 sm:gap-2 border border-border bg-background p-1 sm:px-2 sm:py-1 rounded-xl">
              <button
                disabled={browsePage <= 1}
                onClick={() => setBrowsePage(p => p - 1)}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg disabled:opacity-50 hover:bg-muted"
              >
                Previous
              </button>
              <span className="text-xs text-muted-foreground px-4">
                Page {browsePage} of {browseTotalPages}
              </span>
              <button
                disabled={browsePage >= browseTotalPages}
                onClick={() => setBrowsePage(p => p + 1)}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg disabled:opacity-50 hover:bg-muted"
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
