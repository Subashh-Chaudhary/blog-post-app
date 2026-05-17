# Backend Directory Layout & Layer Boundaries

This document describes the directory structure of the backend application, outlining module placement and layer boundaries.

---

## 1. Source Tree Layout

The `/src` directory is organized into cohesive modules and shared folders:

```bash
backend-service/src/
├── app.controller.ts         # High-level health check REST endpoints
├── app.module.ts             # Root module orchestrating imports
├── app.service.ts            # Root application services
├── main.ts                   # Gateway bootstrap, middleware, global filters
├── schema.gql                # Code-first auto-compiled schema file
├── common/                   # Shared system utilities
│   ├── dataloaders/          # Request-scoped DataLoader abstractions
│   ├── decorators/           # Global param decorators (e.g. @CurrentUser)
│   ├── dto/                  # Shared global input classes (e.g. PaginationInput)
│   ├── filters/              # Global GqlExceptionFilter mappings
│   ├── guards/               # Security guards (e.g. GqlAuthGuard)
│   ├── interfaces/           # Shared types and interface structures
│   ├── models/               # Shared database schema models
│   └── pipes/                # Global validation pipes
├── config/                   # Global configuration settings
│   └── database.config.ts    # MongoDB connection setup
└── modules/                  # Encapsulated feature domains
    ├── auth/                 # Credential parsing, JWT generation
    ├── comments/             # Discussion threads, nested responses
    ├── posts/                # Post archives, pagination, likes
    └── users/                # User profiles, credential records
```

---

## 2. Directory Responsibilities

### Encapsulated Feature Modules (`/src/modules/`)
Feature directories contain self-contained domain boundaries. Inside each feature module (e.g., `src/modules/posts`), files are organized by layer:
* **`posts.module.ts`**: The dependency injection boundaries defining which resolvers, services, and repositories are imported or exported.
* **`posts.resolver.ts`**: Maps incoming GraphQL queries and mutations, processes parameters, and delegates logic to the service layer.
* **`posts.service.ts`**: Orchestrates transaction boundaries and processes business logic.
* **`posts.repository.ts`**: Abstracts database logic, keeping Mongoose-specific queries isolated from the service layer.
* **`models/post.model.ts`**: Declares database schemas and GraphQL type mappings on a single class.
* **`dto/`**: Data Transfer Objects defining expected mutation input parameters and validation decorators.

---

## 3. Global Architecture Directory (`/src/common/`)

Shared components reside in the `src/common` folder:
* **`dataloaders/`**: Houses request-scoped batching scripts (e.g., `user.dataloader.ts`) to resolve relational fields without triggering N+1 queries.
* **`guards/`**: Contains security and authorization guards (e.g. `gql-auth.guard.ts`) that intercept incoming requests to verify JWT credentials.
* **`decorators/`**: Simplifies parameter parsing with custom decorators, like retrieving the current authenticated user (`@CurrentUser()`).
* **`filters/`**: Intercepts unhandled pipeline exceptions and formats them into standardized JSON error responses.
