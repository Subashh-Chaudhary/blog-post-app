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
          
          return (fromPromise(
            fetch("/api/auth/refresh", { method: "POST" })
              .then((res) => {
                if (!res.ok) throw new Error("Refresh failed");
                return res.json();
              })
              .then((newAuth) => {
                useAuthStore.getState().setAuth(newAuth.accessToken, newAuth.user);
                resolvePendingRequests();
                return true;
              })
              .catch(() => {
                useAuthStore.getState().clearAuth();
                fetch("/api/auth/cookie", { method: "DELETE" });
                window.location.href = "/login";
                return false;
              })
              .finally(() => {
                isRefreshing = false;
              })
          ) as any).flatMap((success: boolean) => {
            if (success) {
              const oldHeaders = operation.getContext().headers;
              operation.setContext({
                headers: {
                  ...oldHeaders,
                  authorization: `Bearer ${useAuthStore.getState().accessToken}`,
                },
              });
              return forward(operation);
            }
            return forward(operation); // Will likely fail or redirect
          });
        } else {
          return (fromPromise(
            new Promise<void>((resolve) => {
              pendingRequests.push(() => resolve());
            })
          ) as any).flatMap(() => {
            const oldHeaders = operation.getContext().headers;
            operation.setContext({
              headers: {
                ...oldHeaders,
                authorization: `Bearer ${useAuthStore.getState().accessToken}`,
              },
            });
            return forward(operation);
          });
        }
      }
    }
  }
});

// Helper to convert Promise to Observable
function fromPromise<T>(promise: Promise<T>) {
  return new Observable<T>((observer: any) => {
    promise
      .then((value) => {
        observer.next(value);
        observer.complete();
      })
      .catch((err) => observer.error(err));
  });
}

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});

export default function ApolloWrapper({ children }: { children: ReactNode }) {
  const { accessToken, setAuth, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
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
