# UI Components, Layouts & Form Architecture

This document describes the design system components, form validation engines, and animation layouts of the client.

---

## 1. Design System Tokens & Atomic Layouts

The application implements a custom **atomic design system** where UI components are grouped into reusable folders in `nextjs-app/components` based on their size and complexity:

```bash
nextjs-app/components/
├── ui/                     # Basic, stateless elements
│   ├── Button.tsx          # Custom themed buttons
│   ├── Card.tsx            # Structural grid cards
│   ├── Input.tsx           # Stylized text input fields
│   └── Toast.tsx           # Overlay system notifications
└── features/               # Complex, domain-specific features
    ├── auth/               # Login & registration layout cards
    ├── comments/           # Threaded comments tree systems
    └── posts/              # Post details, grids, and list feeds
```

---

## 2. Server vs. Client Components Design

To maximize page speed, we keep layout files as Server Components (RSC) and isolate interactivity into targeted Client Components (CC):

```
+-------------------------------------------------------------+
|              PostDetailsPage (Server RSC Layout)            |
+-------------------------------------------------------------+
                              |
            +-----------------+-----------------+
            |                                   |
            v                                   v
+-----------------------+           +-----------------------+
|  PostArticle (RSC)    |           |   LikeButton (Client) |
|  - Renders title      |           |   - Mouse Hover state |
|  - Renders body text  |           |   - Click handlers    |
+-----------------------+           +-----------------------+
```

* **RSC Layout Assembly**: The page layout, metadata, and core articles are rendered as Server Components.
* **Isolating Interactivity**: Dynamic components (like comment forms, search fields, or like buttons) are extracted into isolated client files marked with `"use client"`. This prevents client-side JavaScript from bloating static parts of the page.

---

## 3. Form Validation with React Hook Form & Zod

Forms are built using **React Hook Form** and **Zod** schema resolvers to ensure strict type safety and fast, performant client-side validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define strict validation rules
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

type LoginFields = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFields) => {
    // Process authentication login mutation
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} type="email" />
      {errors.email && <span className="error">{errors.email.message}</span>}
      
      <input {...register('password')} type="password" />
      {errors.password && <span className="error">{errors.password.message}</span>}
    </form>
  );
}
```

---

## 4. Framer Motion Micro-Animations

We use **Framer Motion** to add polished, high-performance transitions and micro-animations to client interactions:

* **Button Hover Transitions**: Buttons respond to user interaction with subtle scale transitions:
  ```typescript
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 400, damping: 17 }}
  >
    Submit Post
  </motion.button>
  ```
* **Page Transition Cascades**: Feeds and list items use list cascades to fade in smoothly as they mount:
  ```typescript
  const listVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.3 }
    })
  };
  ```
