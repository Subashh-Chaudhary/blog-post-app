# Frontend Directory Layout & Responsibilities

This document describes the directory structure of the client application, detailing the purpose and boundaries of each folder.

---

## 1. Directory Tree Layout

The `/nextjs-app` folder is organized into self-contained layout, component, and configuration modules:

```bash
nextjs-app/
├── app/                      # Next.js App Router filesystem routing
│   ├── globals.css           # Global CSS variables, Tailwind CSS v4 variables
│   ├── layout.tsx            # Global HTML layout shell, mounts ApolloWrapper
│   ├── page.tsx              # Public home page
│   ├── about/                # Static about route
│   ├── login/                # User login form page
│   ├── register/             # User registration form page
│   └── posts/                # Dynamic and directory post pages
├── components/               # Reusable UI component libraries
│   ├── features/             # Scoped, feature-specific assemblies
│   │   ├── auth/             # Login & registration cards
│   │   ├── comments/         # Discussion threads, nested cards
│   │   └── posts/            # Post feeds, headers, like buttons
│   └── ui/                   # Global, stateless design tokens
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── Toast.tsx
├── lib/                      # Integration libraries
│   ├── apollo/               # Apollo SSR-hydration link setup
│   │   └── ApolloWrapper.tsx
│   ├── graphql/              # GraphQL queries, mutations and type typings
│   │   ├── documents.ts
│   │   └── types.ts
│   └── store/                # Zustand external stores
│       ├── useAuthStore.ts
│       └── useToastStore.ts
└── public/                   # Static assets, web manifests, icons
```

---

## 2. Directory Responsibilities & Boundary Constraints

### 1. App Routing (`/app/`)
* **Core Duty**: Maps URL routes and layouts. Pages serve as entry shells that fetch parameters and pass dynamic states down to layout sections.
* **Constraints**: Keep page files clean of design styles and heavy HTML code. Delegate styling and rendering work to components in the `components` directory.

### 2. Component System (`/components/`)
* **Core Duty**: Houses all visual UI components, styling layouts, form validation containers, and interactive animations.
* **Constraints**: Components must not import files from the `/app` router folder. They communicate strictly using inputs (props) and external stores.

### 3. Integrations Library (`/lib/`)
* **Core Duty**: Configures integrations like Zustand, Apollo Client links, and external libraries.
* **Constraints**: Avoid styling definitions, JSX, or page layouts in `/lib`.

### 4. Public Assets (`/public/`)
* **Core Duty**: Holds static assets (images, logos, fonts, icons, manifest files) served directly to the browser.
