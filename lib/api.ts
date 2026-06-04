/**
 * API origin without trailing slash.
 * - Set `VITE_API_URL` when the app must call an absolute origin (production, or explicit local API URL).
 * - When unset, use same-origin relative paths (`/api`, `/uploads`) so the Vite dev server proxy
 *   forwards to the backend and the browser never triggers cross-origin CORS. (`VITE_API_PROXY`
 *   only configures `vite.config.ts` proxy target — do not use it as the client base.)
 */
import { httpErrorMessage, wrapNetworkFailure } from "./error-messages";

function resolveApiBase(): string {
  const explicit = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  return "";
}

const API_BASE = resolveApiBase();

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function joinUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

/** Same origin as `apiFetch` — for authenticated `fetch()` of blobs, etc. */
export function apiUrl(path: string): string {
  return joinUrl(path);
}

/** Resolve API-relative paths (e.g. `/uploads/...`) for `<img src>` using the same base as `apiFetch`. */
export function apiPublicUrl(pathOrUrl: string): string {
  if (
    pathOrUrl.startsWith("http://") ||
    pathOrUrl.startsWith("https://") ||
    pathOrUrl.startsWith("data:")
  ) {
    return pathOrUrl;
  }
  return joinUrl(pathOrUrl);
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (
    rest.body &&
    !(rest.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  let res: Response;
  try {
    res = await fetch(joinUrl(path), { ...rest, headers });
  } catch (e) {
    throw new ApiError(0, wrapNetworkFailure(e));
  }
  if (!res.ok) {
    let serverMsg = res.statusText;
    try {
      const j = (await res.json()) as { error?: string; message?: string };
      if (j.error) serverMsg = j.error;
      else if (j.message) serverMsg = j.message;
    } catch {
      /* non-JSON body */
    }
    throw new ApiError(res.status, httpErrorMessage(res.status, serverMsg));
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}