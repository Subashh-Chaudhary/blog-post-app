# Frontend Client Performance Optimization

This document describes asset optimization strategies, bundle size budgets, lazy loading configurations, and cache-first fetch policies.

---

## 1. Static Asset & Media Optimizations

To ensure rapid page loads and high Lighthouse performance scores, all static assets are routed through Next.js optimization components:

* **Image Optimization (`next/image`)**: Raw images are never loaded directly. We use Next.js's `<Image />` component, which automatically serves webp images resized to fit the user's screen resolution.
* **Font Optimization (`next/font`)**: Google Fonts (like Outfit) are loaded via the `next/font` module. Next.js downloads font files during build and hosts them locally, eliminating external CSS lookups and preventing layout shifts during page loads.
* **SVG Assets**: Icons are loaded as inline React components using `lucide-react`, which supports tree-shaking to keep bundle sizes minimal.

---

## 2. Code Splitting & Component Lazy Loading

To keep initial page loads incredibly fast, we use code splitting and lazy loading to defer rendering heavy components until they are needed:

```
[ Initial Page Render ] ---> Load Core Layout & Article HTML (Fast!)
                                     |
                                     v
                        [ Client Hydration Complete ]
                                     |
                                     v
                        [ Lazy Load Heavy Component ]
                        (e.g., Markdown Rich Text Editor)
```

* **Dynamic Component Imports**: Heavy components that are not needed on initial page load (like complex markdown rich text editors) are loaded dynamically:
  ```typescript
  import dynamic from 'next/dynamic';

  const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
    loading: () => <p>Loading editor...</p>,
    ssr: false, // Prevents loading server-side since this component uses browser-only APIs
  });
  ```
* **Route Prefetching**: Next.js automatically prefetches code for linked routes visible in the user's viewport, making page transitions feel instant when links are clicked.

---

## 3. Apollo Cache Policies & Query Minimization

We optimize GraphQL network traffic by configuring specialized caching policies within Apollo Client:

* **Cache-First Fetch Policies**: Queries default to a `cache-first` fetch policy. If the requested data exists in the local Apollo Cache, it resolves immediately without sending a request to the backend.
* **Targeted Cache Invalidations**: Instead of refetching entire datasets after executing mutations, we update specific cache fields directly in-memory using `cache.modify()`, keeping client and database state in sync with minimal network overhead.
* **Batching Operations**: Small queries executed within the same window are coalesced into a single HTTP request to reduce roundtrips.

---

## 4. JS Bundle Size Control & Audits

We actively monitor and control JavaScript bundle sizes to prevent performance regressions:

* **Tree-Shaking**: Custom components import only the specific functions and subcomponents they need, allowing the build compiler to strip unused code.
* **Limiting Dependencies**: Third-party packages are audited regularly. We favor lightweight dependencies (like Zustand for state and Zod for validation) to keep our bundle footprint minimal.
