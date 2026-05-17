# Apollo Client & SSR GraphQL Hydration

This document describes the design, prefetching pipelines, cache-hydration sequences, and mutation operations of the Apollo Client integration.

---

## 1. Apollo Client in the Next.js App Router

Integrating GraphQL within the Next.js App Router requires a hybrid architecture. 
Traditional React applications can wrap their entire component tree in a standard Apollo `<ApolloProvider>`. In Next.js, however, Server Components render on the server and cannot access standard React context providers.

To bridge this gap, we implement an **SSR-Compatible Apollo Integration**:

* **RSC Apollo Client**: Standard Server Components use an isolated, server-only Apollo Client instance to fetch data during rendering.
* **Client Boundary Hydration**: React Client Components consume a specialized wrapper (`ApolloWrapper.tsx`) that hydrates query data prefetched on the server directly into the client-side Apollo cache, preventing redundant network requests.

```
                          [ Server Rendering (RSC) ]
                          Prefetch Post Query (RSC)
                                      |
                                      v
                       Serialize Apollo Cache to HTML
                                      |
                                      v
                         [ Browser Client Loads ]
                       Mount ApolloWrapper Provider
                                      |
                                      v
                      Hydrate State to Client Cache
                                      |
                                      v
                        [ Render Page Instantly ]
```

---

## 2. ApolloWrapper Architecture (`ApolloWrapper.tsx`)

The `ApolloWrapper.tsx` component is configured as a global provider wrap inside the root `layout.tsx` file:

```typescript
"use client";

import { HttpLink } from "@apollo/client";
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from "@apollo/experimental-nextjs-app-support";

function makeClient() {
  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:4000/graphql",
    fetchOptions: { cache: "no-store" }, // Let Next.js handle caching
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: httpLink,
  });
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
```

---

## 3. Query & Mutation Execution

Client components execute queries and mutations using Apollo's react hooks:

### 1. Client Queries (`useQuery`)
Client components fetch data using the standard `useQuery` hook. Because the data was prefetched on the server and hydrated into the client-side cache, this hook resolves instantly without triggering loading layouts:
```typescript
const { data, loading } = useQuery(GET_POSTS_QUERY, {
  variables: { paginationInput: { offset: 0, limit: 10 } },
});
```

### 2. Client Mutations (`useMutation`)
Mutations execute updates on the backend service. We attach authorization headers to the mutation request using context middleware:
```typescript
const [createPost] = useMutation(CREATE_POST_MUTATION, {
  context: {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
});
```

---

## 4. Cache Invalidation & Refetching Rules

To keep the UI in sync after executing mutations, we implement strict cache invalidation and query refetching strategies:

* **Refetch Queries**: For simple mutations, we pass a list of queries to refetch, updating the associated listings immediately:
  ```typescript
  const [deletePost] = useMutation(DELETE_POST_MUTATION, {
    refetchQueries: [{ query: GET_POSTS_QUERY }],
  });
  ```
* **Manual Cache Updates**: For performance-critical interactions (like liking a post), we manually update Apollo's in-memory cache. This allows the UI to update immediately without waiting for a database roundtrip:
  ```typescript
  const [toggleLike] = useMutation(TOGGLE_LIKE_MUTATION, {
    update(cache, { data: { togglePostLike } }) {
      cache.modify({
        id: cache.identify({ __typename: 'Post', id: postId }),
        fields: {
          isLiked() { return togglePostLike.isLiked; },
          likeCount() { return togglePostLike.likeCount; }
        }
      });
    }
  });
  ```
