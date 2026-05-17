# Zustand Client State Management

This document describes the design, store architectures, session sync, and reactive updates of the Zustand client stores.

---

## 1. Why Zustand?

We use **Zustand** as our primary client-side state management solution instead of alternatives like Redux or React Context:

* **Zero Boilerplate**: Zustand stores are created using simple, declarative TypeScript functions, eliminating the excessive boilerplate required by Redux.
* **Granular Render Control**: Components select specific state slices using selectors. If only the `user` state changes, components subscribing only to the `token` state do not re-render.
* **No Provider Nesting**: Zustand operates as an external store. It does not require wrapping the component tree in React Context Providers, keeping layout files clean and preventing unnecessary render passes.

---

## 2. Store Implementations

The application maintains two specialized Zustand stores inside `/lib/store`:

### 1. Authentication Store (`useAuthStore.ts`)
Manages the authenticated user's session state, JWT tokens, and login/logout lifecycles:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  username: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage', // Saves credentials in localStorage automatically
    }
  )
);
```

### 2. Toast UI Notification Store (`useToastStore.ts`)
Manages transient global notifications (e.g. success popups, form validation warnings):

```typescript
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastState {
  toasts: Toast[];
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, type) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    
    // Automatically dismiss the toast after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
```

---

## 3. Session Synchronization & Hydration

Because Zustand's `persist` middleware reads from `localStorage` (which is a browser-only API), initial server renderings can suffer from hydration mismatches (where the server HTML does not match the client state).

To prevent this:
1. **Hydration Hooks**: We use client-side hydration hooks to delay rendering dependent elements until the store has loaded in the browser.
2. **Selective Store Subscriptions**: Components that do not render structural UI elements based on authentication status (e.g., standard layout headers) fetch their states after the component mounts using a standard `useEffect` hook.
