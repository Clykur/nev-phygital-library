import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { toast } from "sonner";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

interface LocationContextType {
  coords: Coordinates | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => Promise<Coordinates | null>;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY = "neev_user_coords";

export function LocationProvider({ children }: { children: ReactNode }) {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.latitude === "number" && typeof parsed.longitude === "number") {
          setCoords(parsed);
        }
      }
    } catch (err) {
      console.error("Failed to parse cached coordinates", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestLocation = useCallback(async (): Promise<Coordinates | null> => {
    if (!navigator.geolocation) {
      const errMsg = "Geolocation is not supported by your browser";
      setError(errMsg);
      toast.error(errMsg);
      return null;
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCoords(newCoords);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newCoords));
          setLoading(false);
          toast.success("Location updated successfully");
          resolve(newCoords);
        },
        (err) => {
          let errMsg = "Could not get your location";
          if (err.code === err.PERMISSION_DENIED) {
            errMsg = "Location permission denied";
          }
          setError(errMsg);
          setLoading(false);
          toast.error(errMsg);
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: true },
      );
    });
  }, []);

  const clearLocation = useCallback(() => {
    setCoords(null);
    localStorage.removeItem(STORAGE_KEY);
    setError(null);
    toast.success("Location cleared");
  }, []);

  return (
    <LocationContext.Provider
      value={{
        coords,
        loading,
        error,
        requestLocation,
        clearLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocationContext must be used within a LocationProvider");
  }
  return context;
}
