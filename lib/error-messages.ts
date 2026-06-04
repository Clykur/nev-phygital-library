/**
 * Maps unknown failures (network, HTTP, thrown Errors) to short, safe copy for toasts and UI.
 */

const NETWORK =
  "We couldn't reach the server. Check your internet connection and try again.";

const SERVER =
  "Something went wrong on our end. Please try again in a moment.";

function looksTechnical(msg: string): boolean {
  const m = msg.trim();
  if (m.length > 280) return true;
  if (/^\s*at\s+/m.test(m)) return true;
  if (/node_modules|\\n\s*at\s|DrizzleQuery|ECONNREFUSED|ENETUNREACH|ENOTFOUND|ECONNRESET/i.test(m))
    return true;
  return false;
}

/**
 * Build a user-safe message from HTTP status and optional server/body text.
 */
export function httpErrorMessage(status: number, rawBody?: string): string {
  const raw = rawBody?.trim() ?? "";
  const bodyUsable = raw && raw.length <= 200 && !looksTechnical(raw);

  if (status === 0) return raw || NETWORK;
  if (status >= 500) return SERVER;
  if (status === 401) {
    return bodyUsable
      ? raw
      : "Your session expired or sign-in didn't work. Please sign in again.";
  }
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404)
    return "We couldn't find what you're looking for.";
  if (status === 409) {
    return bodyUsable
      ? raw
      : "That action isn't available right now. Refresh the page and try again.";
  }
  if (status === 422) {
    return bodyUsable ? raw : "Please check the information you entered and try again.";
  }
  if (status === 429)
    return "Too many requests. Please wait a moment and try again.";
  if (bodyUsable) return raw;
  if (status >= 400)
    return "We couldn't complete that request.";
  return SERVER;
}

export function wrapNetworkFailure(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message;
    if (/abort/i.test(m)) return "The request was cancelled.";
    if (
      /failed to fetch|networkerror|load failed|network request failed/i.test(m)
    ) {
      return NETWORK;
    }
  }
  return NETWORK;
}

function isApiLike(
  err: unknown,
): err is { status: number; message: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as { status: unknown }).status === "number" &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  );
}

/**
 * Use in UI when showing `useQuery` / `useMutation` errors or caught exceptions.
 */
export function userFacingErrorMessage(error: unknown): string {
  if (isApiLike(error)) {
    if (looksTechnical(error.message) && error.status >= 400) {
      return httpErrorMessage(error.status, undefined);
    }
    return error.message;
  }
  if (error instanceof Error) {
    return wrapNetworkFailure(error);
  }
  return "Something went wrong. Please try again.";
}

export { NETWORK, SERVER, looksTechnical };
