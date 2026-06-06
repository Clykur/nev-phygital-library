import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

export interface RecentBook {
  id: number;
  title: string;
  author: string;
}

export interface ActiveListing {
  id: number;
  title: string;
  price: number;
  status: string;
}

export interface RecentPurchase {
  id: number;
  title: string;
  date: string;
}

export interface DashboardStats {
  totalBought: number;
  totalSold: number;
  creditsEarned: number;
}

export interface StudentDashboardData {
  recentBooks: RecentBook[];
  activeListings: ActiveListing[];
  recentPurchases: RecentPurchase[];
  stats: DashboardStats;
}

/**
 * Hook to fetch student dashboard data.
 */
export function useStudentDashboard() {
  const { token } = useAuth();
  
  return useQuery<StudentDashboardData, Error>({
    queryKey: ['student-dashboard', token],
    queryFn: async () => {
      // Connect to real endpoint
      return await apiFetch<StudentDashboardData>('/api/student/dashboard', { token: token! });
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    enabled: !!token,
  });
}
