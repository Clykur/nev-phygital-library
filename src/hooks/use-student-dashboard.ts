import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

export interface RecentBook {
  id: string;
  source: "hub" | "p2p";
  bookId?: string | null;
  listingId?: string | null;
  title: string;
  author?: string | null;
  coverImageUrl?: string | null;
  buyPrice: number;
  borrowPrice: number;
  hubName?: string | null;
  lastViewedAt: string;
}

export interface RecentPurchase {
  amount: number;
  author: string;
  coverImageUrl: string;
  bookId: string;
  id: number;
  title: string;
  date: string;
}

export interface DashboardStats {
  totalBought: number;
  totalSold: number;
  creditsEarned: number;
  activeBorrowings: number;
  totalBorrowed: number;
  recentlyViewedCount: number;
}

export interface StudentDashboardData {
  recentBooks: RecentBook[];
  recentPurchases: RecentPurchase[];
  stats: DashboardStats;
}

/**
 * Hook to fetch student dashboard data.
 */
export function useStudentDashboard() {
  const { token } = useAuth();

  return useQuery<StudentDashboardData, Error>({
    queryKey: ["student-dashboard", token],
    queryFn: async () => {
      // Connect to real endpoint
      return await apiFetch<StudentDashboardData>("/api/student/dashboard", { token: token! });
    },
    staleTime: 30 * 1000,
    enabled: !!token,
  });
}
