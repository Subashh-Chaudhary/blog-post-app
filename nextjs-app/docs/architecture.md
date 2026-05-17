# Client App Architecture & Hybrid Rendering

This document describes the Next.js frontend architecture, detailing hybrid rendering models, Server Component design, and client-side hydration patterns.

---

## 1. Hybrid Rendering Strategy (RSC vs. Client Components)

The frontend leverages Next.js **App Router** to implement a hybrid rendering strategy that combines React Server Components (RSC) and Client Components (CC) based on the needs of each view:

```
+-------------------------------------------------------------+
|               Client Browser URL Navigation                 |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                React Server Component (RSC)                 |
|   - Executes on the server                                  |
|   - Runs GraphQL queries directly during rendering          |
|   - Generates and streams raw HTML                         |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                React Client Component (CC)                  |
|   - Hydrates on the browser client                          |
|   - Executes Event Handlers (Click, Input)                  |
|   - Manages interactive states (Zustand, Forms)             |
+-------------------------------------------------------------+
```

### 1. React Server Components (RSC)
By default, all layout and page files in the `/app` directory are evaluated on the server.
* **Benefits**: Consumes GraphQL queries directly on the server, significantly reducing initial page load times. Since Server Component dependencies are not sent to the client, RSCs dramatically decrease JavaScript bundle sizes.
* **Limitations**: RSCs cannot use React hooks like `useState`, `useEffect`, or custom hooks like Zustand selectors, and cannot attach event listeners (e.g., `onClick`).

### 2. React Client Components (CC)
Components marked with the `"use client"` directive hydrate on the client.
* **Benefits**: Enables rich client-side interactivity, form validation, and reactive store synchronization (e.g. Zustand session data).
* **Limitations**: Increases client bundle sizes. Overusing client components at the page root defeats the performance benefits of Next.js server rendering.

---

## 2. Server-Side Data Hydration Sequence

To prevent raw layout shifts and blank loading spinners, we implement a strict **SSR Hydration Sequence** using Apollo Client:

1. **Query Prefetching**: During server rendering of an RSC page, GraphQL queries are executed before returning any HTML.
2. **State Serialization**: The resolved GraphQL data is stored in the Apollo cache on the server, serialized, and appended directly to the page's HTML payload.
3. **Client Hydration**: When the browser loads the page, the client-side Apollo wrapper (`ApolloWrapper.tsx`) hydates this serialized state directly into the local Apollo Cache, making data instantly available to client-side components without additional loading indicators.

---

## 3. Rendering Boundary Guidelines

Use these rules to determine when to keep a component as a Server Component vs. shifting it to a Client Component:

| Capability Requirements | Server Component (RSC) | Client Component (CC) |
| :--- | :--- | :--- |
| **Fetch GraphQL Queries** | Yes (Prefetched via SSR) | Yes (Lazy queries) |
| **Access HTTP Request Headers** | Yes | No |
| **Attach Event Listeners (e.g., `onClick`)** | No | Yes |
| **Use State Hooks (e.g., `useState`, `useReducer`)** | No | Yes |
| **Access Zustand State Stores** | No | Yes |
| **Use Browser-Only APIs (e.g., `window`, `localStorage`)** | No | Yes |
