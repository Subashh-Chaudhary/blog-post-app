# Client Routing Architecture & Middleware

This document describes the filesystem routing design, folder structures, dynamic route segments, and routing authorization rules of the client application.

---

## 1. Filesystem Routing & App Layouts

The application implements Next.js declarative **App Router** layout system inside the `/app` folder. The folder structure maps directly to public URL paths:

```bash
nextjs-app/app/
├── favicon.ico
├── globals.css             # Main styling, Tailwind CSS v4 variables
├── layout.tsx              # Root HTML wrapper and global ApolloWrapper
├── page.tsx                # Public home dashboard, lists recent posts
├── about/
│   └── page.tsx            # Static about page (zero client-side script overhead)
├── login/
│   └── page.tsx            # Session login form page
├── register/
│   └── page.tsx            # User registration form page
└── posts/
    ├── [id]/
    │   └── page.tsx        # Dynamic post detail page, fetches comment trees
    └── page.tsx            # Paginated posts directory feed
```

### Shared Layouts (`layout.tsx`)
Nested directories can define a `layout.tsx` file to share UI structures (such as navigation bars or headers) across sibling routes. 
* **State Preservation**: Shared layouts remain active during navigation, preventing expensive re-renders of global components and keeping the application feeling fast and responsive.

---

## 2. Parsing Dynamic Routes (`posts/[id]/page.tsx`)

Dynamic route parameters (like a post's ID slug) are resolved on the server using **Dynamic Server Segments**:

```typescript
interface PostDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params; // Resolve the dynamic id parameters asynchronously
  
  // Prefetch post and comments directly on the server
  return (
    <main>
      <PostDetailSection postId={id} />
      <CommentTreeSection postId={id} />
    </main>
  );
}
```

By resolving route parameters on the server, we can query GraphQL data immediately during server rendering, serving a complete, fully populated HTML payload to browser clients.

---

## 3. Router Middleware & Route Protection

To secure routes without introducing layout shifts, we implement an active **Next.js Middleware boundary** (`middleware.ts`) at the application root:

```
[ User Navigates to Route ]
            |
            v
+-------------------------------+
|     Next.js Middleware        |
+-------------------------------+
            |
    Inspected Rules:
    Is route: /posts/create?
    Is Auth Cookie present?
            |
     +------+------+
     |             |
  Passed        Blocked
     |             |
     v             v
[ Show Page ]  [ Redirect /login ]
```

* **Token Coalescing**: When a user logs in, their JWT credentials are saved in an HTTP-only cookie.
* **Server Interception**: The `middleware.ts` script intercepts all navigation requests. If an anonymous user attempts to access a protected route (e.g. `/posts/create` or `/profile`), the middleware blocks the request at the server level, redirecting the user to `/login` before any HTML is rendered or sent to the browser.
