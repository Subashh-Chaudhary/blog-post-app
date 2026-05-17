"use client";

import { ReactNode, useState, useEffect } from "react";
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

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL,
});

// ─── Token Utilities ────────────────────────────────────────────────────────

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Add 10s buffer so we refresh slightly before actual expiry
    return payload.exp * 1000 < Date.now() + 10_000;
  } catch {
    return true;
  }
}

// A single in-flight refresh promise so concurrent requests don't each
// trigger their own refresh call.
let refreshPromise: Promise<string | null> | null = null;

async function getValidToken(): Promise<string | null> {
  const { accessToken, setAuth, clearAuth } = useAuthStore.getState();

  // 1. Token exists and is still valid — use it as-is
  if (accessToken && !isTokenExpired(accessToken)) {
    return accessToken;
  }

  // 2. Token is expired (or missing) — deduplicate refresh calls
  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Refresh failed");
        const newAuth = await res.json();
        setAuth(newAuth.accessToken, newAuth.user);
        return newAuth.accessToken as string;
      })
      .catch(() => {
        clearAuth();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

// ─── Auth Link (proactive) ────────────────────────────────────────────────────
// setContext supports returning a Promise, so we can do async work here.
const authLink = setContext(async (_, { headers }) => {
  const token = await getValidToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// ─── Error Link (reactive fallback) ──────────────────────────────────────────
// Handles the rare case where the server still rejects (e.g. clock skew).
const errorLink = onError((errorOptions: any) => {
  const { graphQLErrors, operation, forward } = errorOptions;

  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      const isAuthError =
        err.extensions?.code === "UNAUTHENTICATED" ||
        (err.extensions as any)?.http?.status === 401 ||
        err.message.includes("Unauthorized") ||
        err.message.includes("Invalid or expired token");

      if (isAuthError) {
        return new Observable((observer: any) => {
          let sub: any = null;

          fetch("/api/auth/refresh", { method: "POST" })
            .then(async (res) => {
              if (!res.ok) throw new Error("Refresh failed");
              return res.json();
            })
            .then((newAuth) => {
              useAuthStore.getState().setAuth(newAuth.accessToken, newAuth.user);

              operation.setContext(({ headers }: any) => ({
                headers: {
                  ...headers,
                  authorization: `Bearer ${newAuth.accessToken}`,
                },
              }));

              sub = forward(operation).subscribe({
                next: observer.next.bind(observer),
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer),
              });
            })
            .catch((refreshErr) => {
              useAuthStore.getState().clearAuth();
              fetch("/api/auth/cookie", { method: "DELETE" });
              window.location.href = "/login";
              observer.error(refreshErr);
            });

          return () => {
            if (sub) sub.unsubscribe();
          };
        }) as any;
      }
    }
  }
});

// ─── Apollo Client ────────────────────────────────────────────────────────────
const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});

// ─── Provider ────────────────────────────────────────────────────────────────
export default function ApolloWrapper({ children }: { children: ReactNode }) {
  const { accessToken, setAuth, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // 1. Try to restore a non-expired token from sessionStorage
      const storedToken = sessionStorage.getItem("accessToken");
      const storedUser = sessionStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          if (!isTokenExpired(storedToken)) {
            setAuth(storedToken, JSON.parse(storedUser));
            setLoading(false);
            return;
          }
        } catch {
          // fall through to refresh
        }
      }

      // 2. Expired or missing — do a silent refresh via HTTP-only cookie
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST" });
        if (res.ok) {
          const newAuth = await res.json();
          setAuth(newAuth.accessToken, newAuth.user);
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    if (!accessToken) {
      initAuth();
    } else {
      setLoading(false);
    }
  }, [accessToken, setAuth, clearAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-textPrimary">
        <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
