import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./api";
import { useAuth } from "../context/auth-context";

export function useCatalogBooks(query?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["catalog", query],
    queryFn: () => {
      const q = query ? `?q=${encodeURIComponent(query)}` : "";
      return apiFetch<{ books: any[] }>(`/api/catalog/books${q}`, { token });
    },
    enabled: !!token, // Wait for auth token
  });
}

export function useActivityTimeline() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["activity-timeline"],
    queryFn: () => apiFetch<{ events: any[] }>("/api/activity/timeline", { token }),
    enabled: !!token,
  });
}

export function useHubMetrics() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["hub-metrics"],
    queryFn: () => apiFetch<any>("/api/hub/dashboard-metrics", { token }),
    enabled: !!token,
  });
}

export function useHubQueue() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["hub-queue"],
    queryFn: () => apiFetch<any>("/api/hub/queue", { token }),
    enabled: !!token,
  });
}

export function useMyBookRequests() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["my-book-requests"],
    queryFn: () => apiFetch<{ requests: any[] }>("/api/book-requests/mine", { token }),
    enabled: !!token,
  });
}
