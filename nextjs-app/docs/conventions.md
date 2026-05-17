# Frontend Coding Standards & Conventions

This document defines the coding styles, TypeScript standards, and component conventions for the frontend client.

---

## 1. File & Component Naming Conventions

Consistent naming rules ensure a clean, professional codebase that is easy to navigate:

| Component Type | Folder Location | File Naming Style | Class / Export Naming | Example |
| :--- | :--- | :--- | :--- | :--- |
| **Global UI** | `components/ui/` | `[Name].tsx` | `PascalCase` | `Button.tsx` |
| **Feature Component**| `components/features/`| `[Name].tsx` | `PascalCase` | `CommentCard.tsx` |
| **Custom Hook** | `hooks/` | `use[Name].ts` | `camelCase` | `useAuth.ts` |
| **Zustand Store** | `lib/store/` | `use[Name]Store.ts` | `camelCase` | `useAuthStore.ts` |
| **Page Segment** | `app/[route]/` | `page.tsx` | `PascalCase` (Default Export) | `PostDetailPage` |

* **Component Files**: Use PascalCase for all component filenames (e.g., `CommentCard.tsx`).
* **Utility Files**: Use kebab-case for pure utility modules and non-component files (e.g., `date-formatter.ts`).

---

## 2. TypeScript Strictness & Type Guidelines

To ensure type-safety and catch bugs during compilation, the client enforces strict TypeScript compiler options:

* **No Implicit Any**: Every variable, function parameter, and return value must be explicitly typed. Using the `any` keyword is strictly prohibited.
* **Typing GraphQL Documents**: GraphQL query and mutation payloads use TypeScript typings generated directly from our backend GraphQL schema:
  ```typescript
  import { useQuery } from '@apollo/client';
  import { GetPostsData, GetPostsVariables } from '@/lib/graphql/types';
  
  const { data } = useQuery<GetPostsData, GetPostsVariables>(GET_POSTS_QUERY);
  ```
* **Strict Null Checks**: Always handle nullable properties returned by the GraphQL API (e.g., handling missing user bio fields or optional author profiles) using conditional checks or safe optional chaining (`?.`).

---

## 3. Custom React Hook Design Patterns

We use custom hooks to isolate component logic and keep render files clean and readable:

* **Single Responsibility**: Custom hooks should focus on a single, specific task (e.g., managing a post-like status check, or handling query parameters).
* **Pure Logic Isolation**: Keep UI component files clean by moving side effects, local state updates, and Apollo mutation calls into custom hooks:
  ```typescript
  export function useToggleLike(postId: string) {
    const [toggleLikeMutation] = useMutation(TOGGLE_LIKE);
    const { user } = useAuthStore();

    const handleToggle = async () => {
      if (!user) return;
      await toggleLikeMutation({ variables: { postId } });
    };

    return { handleToggle };
  }
  ```
* **Returning Objects**: Custom hooks should return typed objects instead of arrays. This allows components to easily destructure only the specific fields they need, making hooks easier to extend in the future.
