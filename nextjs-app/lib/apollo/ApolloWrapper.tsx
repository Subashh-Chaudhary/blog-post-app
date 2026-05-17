"use client";

import { ReactNode, useRef, useEffect } from "react";
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  Observable,
} from "@apollo/client/core";
import { ApolloProvider } from "@apollo/client/react";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { useAuthStore } from "../store/useAuthStore";

// ─── Constants ───────────────────────────────────────────────────────────────

// Operation names that should NEVER be intercepted by the errorLink.
// Login/register failures must propagate directly to the caller so the UI
// can show the proper toast message.
const SKIP_AUTH_REFRESH_OPS = new Set(["Login", "Register", "Refresh"]);
const AUTH_PAGES = ["/login", "/register"];

// ─── HTTP Link ────────────────────────────────────────────────────────────────

const httpLink = createHttpLink({
  // NEXT_PUBLIC_ URL is baked into the client bundle at build time.
  // This is always the browser-facing URL (localhost:5000 or public domain).
  uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL,
});

// ─── Token Utilities ─────────────────────────────────────────────────────────

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // 10s clock-skew buffer
    return payload.exp * 1000 < Date.now() + 10_000;
  } catch {
    return true;
  }
}

// ─── Single In-Flight Refresh Lock ───────────────────────────────────────────
// Both authLink and errorLink share this promise so concurrent requests never
// trigger more than one /api/auth/refresh call at a time.
// If authLink already triggered a refresh, errorLink reuses the same promise.

let refreshPromise: Promise<string | null> | null = null;
let isRefreshing = false;

function performRefresh(): Promise<string | null> {
  if (!refreshPromise && !isRefreshing) {
    isRefreshing = true;
    refreshPromise = fetch("/api/auth/refresh", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);
        const newAuth = await res.json();
        useAuthStore.getState().setAuth(newAuth.accessToken, newAuth.user);
        return newAuth.accessToken as string;
      })
      .catch(() => {
        useAuthStore.getState().clearAuth();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
        isRefreshing = false;
      });
  }
  return refreshPromise ?? Promise.resolve(null);
}

// ─── Auth Link (proactive) ───────────────────────────────────────────────────
// Attaches the current access token to every request.
// If the token is expired, proactively refreshes it BEFORE sending.
// Uses the shared refreshPromise lock so concurrent requests during a refresh
// all wait for the same single network call, not N separate ones.

const authLink = setContext(async (_, { headers }) => {
  const { accessToken } = useAuthStore.getState();

  let token: string | null = null;

  if (accessToken && !isTokenExpired(accessToken)) {
    // Token is present and still valid — use it as-is.
    token = accessToken;
  } else if (accessToken && isTokenExpired(accessToken)) {
    // Token is present but expired — silently refresh before sending.
    // If this is the first request to notice, performRefresh() starts the call.
    // Subsequent concurrent requests reuse the same promise via the lock.
    token = await performRefresh();
  }
  // No accessToken at all means user is not logged in — send without header.
  // The backend will return "Authorization header is missing" for protected
  // mutations, which the errorLink will catch and trigger a refresh attempt.

  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

// ─── Error Link (reactive fallback) ──────────────────────────────────────────
// Handles auth errors from the backend by silently refreshing and retrying
// the original operation — exactly once.
//
// Catches all backend auth error messages:
//   - "Authorization header is missing"  (no header sent at all)
//   - "Invalid token format"             (malformed header)
//   - "Invalid or expired token"         (bad signature / expired)
//   - UNAUTHENTICATED extension code     (Apollo standard)
//   - HTTP 401 status in extension
//   - "Unauthorized"                     (general NestJS 401)
//
// Auth mutations (login, register) are skipped so their errors bubble up
// to the caller and the UI can display the correct toast message.

const errorLink = onError((options: any) => {
  const { graphQLErrors, operation, forward } = options;
  // Skip refresh for auth operations — their errors belong to the caller.
  if (SKIP_AUTH_REFRESH_OPS.has(operation.operationName)) return;

  const hasAuthError = graphQLErrors?.some(
    (err: any) =>
      err.extensions?.code === "UNAUTHENTICATED" ||
      (err.extensions as any)?.http?.status === 401 ||
      err.message.includes("Unauthorized") ||
      err.message.includes("Invalid or expired token") ||
      err.message.includes("Authorization header is missing") ||
      err.message.includes("Invalid token format")
  );

  if (!hasAuthError) return;

  return new Observable((observer) => {
    // Reuse the shared lock: if authLink already started a refresh for this
    // same request cycle, we get back the same promise, not a second fetch.
    performRefresh().then((token) => {
      if (!token) {
        // Refresh failed — session is dead. Redirect to login.
        if (typeof window !== "undefined" && !AUTH_PAGES.some(p => window.location.pathname.startsWith(p))) {
          window.location.href = "/login";
        }
        observer.error(new Error("Session expired. Please log in again."));
        return;
      }

      // Retry the original operation with the fresh token.
      operation.setContext(({ headers }: Record<string, any>) => ({
        headers: {
          ...headers,
          authorization: `Bearer ${token}`,
        },
      }));

      const sub = forward(operation).subscribe({
        next: observer.next.bind(observer),
        error: observer.error.bind(observer),
        complete: observer.complete.bind(observer),
      });

      return () => sub?.unsubscribe();
    });
  }) as any;
});

// ─── Apollo Client ────────────────────────────────────────────────────────────
// Singleton — created once for the lifetime of the app.

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { errorPolicy: "all" },
    query: { errorPolicy: "all" },
    mutate: { errorPolicy: "none" }, // mutations throw so callers can catch
  },
});

// ─── Provider ────────────────────────────────────────────────────────────────

export default function ApolloWrapper({ children }: { children: ReactNode }) {
  const { setAuth, clearAuth } = useAuthStore();
  // Track whether we've already run the init check.
  // useRef instead of state so changing it never causes a re-render.
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Guard: run exactly once per mount, regardless of auth state changes.
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initAuth = async () => {
      if (typeof window !== "undefined" &&
          AUTH_PAGES.some(p => window.location.pathname.startsWith(p))) return;

      const { accessToken } = useAuthStore.getState();

      // 1. Already have a valid in-memory token — nothing to do.
      if (accessToken && !isTokenExpired(accessToken)) return;

      // 2. Try to restore from sessionStorage (fast path — no network call).
      const storedToken = sessionStorage.getItem("accessToken");
      const storedUser = sessionStorage.getItem("user");
      if (storedToken && storedUser) {
        try {
          if (!isTokenExpired(storedToken)) {
            setAuth(storedToken, JSON.parse(storedUser));
            return;
          }
        } catch {
          // Corrupt data — fall through to refresh.
          sessionStorage.removeItem("accessToken");
          sessionStorage.removeItem("user");
        }
      }

      // 3. Silent refresh via HTTP-only cookie.
      // Uses the shared lock so even React 18 StrictMode double-mount only
      // fires one network request.
      await performRefresh();
      // performRefresh already calls setAuth or clearAuth internally.
    };

    initAuth();
  }, []); // ← empty deps: runs once on mount, never re-runs

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
