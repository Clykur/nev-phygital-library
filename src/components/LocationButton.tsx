import { useLocationContext } from "@/context/location-context";
import { useAuth } from "@/context/auth-context";
import { MapPin, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export function LocationButton() {
  const { user } = useAuth();
  const { coords, loading, error, requestLocation, clearLocation } = useLocationContext();

  const handleNearbyClick = async () => {
    if (!user) {
      toast.error("Please sign in to search by location.");
      setTimeout(() => {
        window.location.href = "/?segment=students&auth=login#auth-section";
      }, 1200);
      return;
    }
    await requestLocation();
  };

  if (loading) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-elevated text-xs font-semibold text-foreground-muted animate-pulse cursor-not-allowed"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        <span>Locating...</span>
      </button>
    );
  }

  const isNearbyActive = !!user && !!coords;

  if (isNearbyActive) {
    return (
      <div className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-lg pl-3 pr-1 py-1 text-xs font-semibold text-primary transition-all duration-300">
        <MapPin className="h-3.5 w-3.5 text-primary fill-primary/10" />
        <span>
          {coords.latitude.toFixed(3)}, {coords.longitude.toFixed(3)}
        </span>
        <button
          onClick={clearLocation}
          className="p-1 rounded-md hover:bg-primary/20 text-primary transition-colors cursor-pointer"
          aria-label="Clear location"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleNearbyClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-primary/30 bg-card hover:bg-card-hover text-xs font-semibold text-foreground hover:text-primary transition-all duration-300 cursor-pointer shadow-xs"
      title={error || "Find hubs and books near you"}
    >
      <MapPin className="h-3.5 w-3.5 text-foreground-muted hover:text-primary transition-colors" />
      <span>Nearby</span>
    </button>
  );
}

export default LocationButton;
