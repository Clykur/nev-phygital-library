import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { useLocationContext } from "../context/location-context";
import { Loader2, MapPin, School, BookOpen, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { LibraryCatalogBook } from "../pages/library";

type Hub = {
  id: string;
  name: string;
  location?: string;
  kind?: string;
  distanceKm?: number | null;
};

interface LocationDiscoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token?: string | null;
}

export function LocationDiscoveryDialog({
  open,
  onOpenChange,
  token,
}: LocationDiscoveryDialogProps) {
  const { coords, requestLocation, loading: locLoading, error: locError } = useLocationContext();

  const permissionDenied = locError === "Location permission denied";

  // We request location when the dialog opens, if we don't have it yet.
  useEffect(() => {
    if (open && !coords && !locLoading && !locError && !permissionDenied) {
      requestLocation();
    }
  }, [open, coords, locLoading, locError, permissionDenied, requestLocation]);

  const hubsQ = useQuery({
    queryKey: ["catalog", "hubs", "nearby", coords?.latitude, coords?.longitude],
    enabled: open && !!coords,
    queryFn: () => {
      const url = coords
        ? `/api/catalog/hubs?lat=${coords.latitude}&lng=${coords.longitude}`
        : "/api/catalog/hubs";
      return apiFetch<{ hubs: Hub[] }>(url, { token: token || undefined });
    },
  });

  const booksQ = useQuery({
    queryKey: ["catalog", "books", "nearby", coords?.latitude, coords?.longitude],
    enabled: open && !!coords,
    queryFn: () => {
      const url = coords
        ? `/api/catalog/books?lat=${coords.latitude}&lng=${coords.longitude}`
        : "/api/catalog/books";
      return apiFetch<{ books: LibraryCatalogBook[] }>(url, {
        token: token || undefined,
      });
    },
  });

  // Calculate mock distances deterministically based on hub/book IDs to simulate proximity
  const getMockDistance = (id: string) => {
    const charCodeSum = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return ((charCodeSum % 15) + 1.2).toFixed(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 bg-background border-border">
        <DialogHeader className="px-6 py-4 border-b border-border ">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <MapPin className="w-5 h-5 text-primary" />
            Location Discovery
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Find books, libraries, and hubs available near your current location.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {locLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p className="text-sm font-medium">Detecting your location...</p>
              <p className="text-xs mt-1 opacity-70">Please allow access when prompted</p>
            </div>
          )}

          {(permissionDenied || locError) && !locLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-12 h-12 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Location Access Denied</h3>
              <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                {locError ||
                  "We need your location to show nearby hubs and books. Please enable location services in your browser settings to use this feature."}
              </p>
              <button
                onClick={requestLocation}
                className="mt-6 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
              >
                Try Again
              </button>
            </div>
          )}

          {coords && !locLoading && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Hubs Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Nearby Hubs & Libraries
                  </h4>
                  {hubsQ.isLoading && (
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  )}
                </div>

                {hubsQ.isSuccess && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {hubsQ.data.hubs.slice(0, 4).map((hub) => (
                      <div
                        key={hub.id}
                        className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors cursor-pointer group"
                      >
                        <div className="w-10 h-10 flex items-center justify-center shrink-0">
                          <School className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-bold text-foreground truncate">{hub.name}</h5>
                          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                            {hub.kind || "Campus Hub"}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5 caption-scale font-medium text-secondary">
                            <MapPin className="w-3 h-3" />
                            {hub.distanceKm != null
                              ? `${hub.distanceKm.toFixed(1)} km away`
                              : `${getMockDistance(hub.id)} km away`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Books Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-t border-border pt-6">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Available Books Near You
                  </h4>
                  {booksQ.isLoading && (
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  )}
                </div>

                {booksQ.isSuccess && (
                  <div className="space-y-3">
                    {booksQ.data.books.slice(0, 5).map((book) => {
                      const isAvailable = book.status === "available";
                      return (
                        <div
                          key={book.id}
                          className="flex items-center gap-4 p-3 rounded-xl border border-border bg-card hover: transition-colors"
                        >
                          <div className="w-10 h-14 shrink-0 flex items-center justify-center overflow-hidden">
                            {book.coverImageUrl ? (
                              <img
                                src={book.coverImageUrl}
                                alt={book.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <BookOpen className="w-4 h-4 text-foreground-subtle" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-bold text-foreground truncate">
                              {book.title}
                            </h5>
                            <p className="text-xs text-muted-foreground truncate">
                              {(book as any).author}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className={cn(
                                  "caption-scale px-1.5 py-0.5 rounded font-semibold",
                                  isAvailable
                                    ? "border border-success/30 bg-success/10 text-success"
                                    : "border border-border bg-background text-muted-foreground",
                                )}
                              >
                                {isAvailable ? "Available" : "Reserved"}
                              </span>
                              <span className="caption-scale text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5" />{" "}
                                {book.distanceKm != null
                                  ? `${book.distanceKm.toFixed(1)} km`
                                  : `${getMockDistance(book.id)} km`}
                              </span>
                            </div>
                          </div>
                          <button className="px-3 py-1.5 bg-background border border-border shadow-sm rounded-xl text-xs font-medium text-foreground hover:shadow-sm transition-colors whitespace-nowrap">
                            View
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
