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
  uri: "http://localhost:5000/graphql",
});

const authLink = setContext((_, { headers }) => {
  const token = useAuthStore.getState().accessToken;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

let isRefreshing = false;
let pendingRequests: (() => void)[] = [];

const resolvePendingRequests = () => {
  pendingRequests.forEach((callback) => callback());
  pendingRequests = [];
};

const errorLink = onError((errorOptions: any) => {
  const { graphQLErrors, operation, forward } = errorOptions;
  if (graphQLErrors) {
    for (let err of graphQLErrors) {
      if (err.extensions?.code === "UNAUTHENTICATED" || err.message.includes("Unauthorized")) {
        if (!isRefreshing) {
          isRefreshing = true;
          
          return new Observable((observer: any) => {
            let sub: any = null;
            fetch("/api/auth/refresh", { method: "POST" })
              .then((res) => {
                if (!res.ok) throw new Error("Refresh failed");
                return res.json();
              })
              .then((newAuth) => {
                useAuthStore.getState().setAuth(newAuth.accessToken, newAuth.user);
                resolvePendingRequests();
                
                // Retry the request with new headers
                const oldHeaders = operation.getContext().headers;
                operation.setContext({
                  headers: {
                    ...oldHeaders,
                    authorization: `Bearer ${newAuth.accessToken}`,
                  },
                });
                
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
              })
              .finally(() => {
                isRefreshing = false;
              });

            return () => {
              if (sub) sub.unsubscribe();
            };
          }) as any;
        } else {
          return new Observable((observer: any) => {
            let sub: any = null;
            pendingRequests.push(() => {
              const oldHeaders = operation.getContext().headers;
              operation.setContext({
                headers: {
                  ...oldHeaders,
                  authorization: `Bearer ${useAuthStore.getState().accessToken}`,
                },
              });
              sub = forward(operation).subscribe({
                next: observer.next.bind(observer),
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer),
              });
            });
            return () => {
              if (sub) sub.unsubscribe();
            };
          }) as any;
        }
      }
    }
  }
});

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});

export default function ApolloWrapper({ children }: { children: ReactNode }) {
  const { accessToken, setAuth, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // 1. Try to restore from sessionStorage first if it exists and is not expired
      const token = sessionStorage.getItem("accessToken");
      const userStr = sessionStorage.getItem("user");

      if (token && userStr) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const isExpired = payload.exp * 1000 < Date.now();
          if (!isExpired) {
            setAuth(token, JSON.parse(userStr));
            setLoading(false);
            return;
          }
        } catch (e) {
          // Ignore and proceed to refresh
        }
      }

      // 2. If no valid sessionStorage token, fall back to silent refresh cookie
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST" });
        if (res.ok) {
          const newAuth = await res.json();
          setAuth(newAuth.accessToken, newAuth.user);
        } else {
          clearAuth();
        }
      } catch (err) {
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
