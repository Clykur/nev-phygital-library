import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = '/api';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('neev_token');
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('neev_token');
      localStorage.removeItem('neev_logged_in');
    }
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP Error ${res.status}`);
  }
  return res.json();
}

export async function loginUser(email: string, password?: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: password || "google_account_trusted" })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Login failed");
  }
  
  const data = await res.json();
  localStorage.setItem('neev_token', data.token);
  return data;
}

export async function googleAuthLogin(token: string) {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Google Auth failed");
  }

  const data = await res.json();
  localStorage.setItem('neev_token', data.token);
  return data;
}

export async function signUpUser(name: string, email: string, isPremium: boolean, hubLocationId: string, password?: string, role?: string) {
  const accountType = role === 'college_ambassador' ? 'hub' : 'student';
  const payload: any = { name, email, password: password || "password123", accountType };
  if (accountType === 'hub') {
    payload.hubName = name;
    payload.hubLocation = hubLocationId;
    payload.hubKind = 'college';
  }

  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Registration failed");
  }

  const data = await res.json();
  localStorage.setItem('neev_token', data.token);
  return data;
}

// React Query Hooks
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const token = localStorage.getItem('neev_token');
      if (!token) return null;
      const data = await fetchWithAuth('/auth/me');
      return data.user;
    },
    retry: false
  });
};

export const useCatalogBooks = () => {
  return useQuery({
    queryKey: ['catalogBooks'],
    queryFn: async () => {
      const data = await fetchWithAuth('/catalog/books');
      return data.books || [];
    }
  });
};

export const useP2pListings = () => {
  return useQuery({
    queryKey: ['p2pListings'],
    queryFn: async () => {
      const data = await fetchWithAuth('/p2p/listings');
      return data.listings || [];
    }
  });
};

export const useActivityTimeline = () => {
  return useQuery({
    queryKey: ['activityTimeline'],
    queryFn: async () => {
      const data = await fetchWithAuth('/activity/timeline');
      return data.activity || [];
    }
  });
};

export const useCheckoutBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookId: string) => {
      return await fetchWithAuth(`/books/${bookId}/checkout`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogBooks'] });
    }
  });
};

export const useReturnBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookId, condition }: { bookId: string, condition: string }) => {
      return await fetchWithAuth(`/books/${bookId}/return`, {
        method: 'POST',
        body: JSON.stringify({ note: `Returned in condition: ${condition}` })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogBooks'] });
    }
  });
};
