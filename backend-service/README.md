# NestJS GraphQL Backend Service

A highly structured, modular, and performant headless API gateway engineered with **NestJS (v11)** and **GraphQL (Apollo Server v5)**. This service acts as the orchestration and data validation engine for the blog platform, connecting directly to **MongoDB** using **Mongoose (v9)**.

---

## 1. Architectural Philosophy

The backend application is designed with **domain isolation** and **strict boundary interfaces** to achieve high maintainability and horizontal scalability. By following the **Dependency Injection (DI)** design pattern native to NestJS, each feature domain is self-contained.

```
+-------------------------------------------------------------------+
|                     GraphQL Client Request                        |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|               GraphQL Context / Auth Guard checks                 |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|        Feature Resolvers (GraphQL Field & Mutation Mapping)       |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|       Feature Services (Business Logic & Transactions Layer)      |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|      Feature Repositories (Data Access & Mongoose Abstraction)    |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                       MongoDB Database (MDB)                      |
+-------------------------------------------------------------------+
```

### Core Architecture Layers

1. **Resolvers (`*.resolver.ts`)**: Defines the GraphQL entry points (Queries, Mutations, and Field Resolvers). Resolvers handle incoming parameter maps, invoke DTO-level verification pipes, and extract context metrics such as the current authenticated user.
2. **Services (`*.service.ts`)**: Houses all transactional domain rules and business logic. Services are strictly agnostic to the transport layer (they do not know about GraphQL or HTTP context), making them reusable across different protocol layers.
3. **Repositories (`*.repository.ts`)**: Standardizes the persistence layer. By abstracting the direct Mongoose model operations behind a repository interface, we isolate Mongoose queries, ensure reliable unit testing via mock injection, and allow for effortless caching transitions.
4. **Models & Schemas (`models/*.model.ts`)**: Code-first model declarations. By using the `@nestjs/graphql` decorators alongside `@nestjs/mongoose` schemas on a single class, we enforce unified TypeScript type mapping, Mongoose model definitions, and auto-generated GraphQL schema nodes simultaneously.

---

## 2. Feature Module Architecture

The codebase is organized into **Feature Modules** inside `/src/modules`. Each module encapsulates a cohesive domain boundary:

* **[Auth Module](file:///home/subash/Desktop/ebpearls/blog-post/backend-service/src/modules/auth)**: Manages authentication flows, JWT token issuance, sign-in validation logic, and password hashing using bcrypt.
* **[Users Module](file:///home/subash/Desktop/ebpearls/blog-post/backend-service/src/modules/users)**: Handles user registration, profile queries, password resets, and user lookup helpers.
* **[Posts Module](file:///home/subash/Desktop/ebpearls/blog-post/backend-service/src/modules/posts)**: Coordinates post creations, editing history, pagination logic, search parameters, and likes integration.
* **[Comments Module](file:///home/subash/Desktop/ebpearls/blog-post/backend-service/src/modules/comments)**: Governs comment nesting (parent-child relationships), thread hierarchies, and deletion cascade triggers.

---

## 3. High-Performance Strategies

* **Request-Scoped DataLoaders**: Features class-based dataloaders (`UserDataLoader` and `PostLikeDataLoader`) to completely resolve the GraphQL **N+1 query problem**. These are instantiated per incoming request tick, consolidating database calls into streamlined bulk operations.
* **Compound Database Indexing**: Mongoose models feature explicit unique keys, sparse keys, and compound keys (such as `[postId, userId]` for post likes) to ensure O(1) checks during toggle queries.
* **Strict Validation Pipeline**: A global validation pipeline executes validation before request processing using `class-validator` decorators. Invalid queries are stopped at the gateway layer, returning clear structure-conforming validation reports to the client.

---

## 4. In-Depth Documentation Index

Navigate through detailed system designs for the backend infrastructure:

### ⚙️ Core Subsystem Docs
* **[System Lifecycle & Request Flow](file:///home/subash/Desktop/ebpearls/blog-post/backend-service/docs/architecture.md)** — Architectural pathways, hooks, guards, decorators, and data-flow sequences.
* **[GraphQL Engine & Resolver Patterns](file:///home/subash/Desktop/ebpearls/blog-post/backend-service/docs/graphql.md)** — Code-first structure, DTO setups, field resolvers, and context utilities.
* **[Stateless JWT Authentication](file:///home/subash/Desktop/ebpearls/blog-post/backend-service/docs/authentication.md)** — Security architecture, token parsing, and guards.
* **[N+1 Resolution & DataLoaders](file:///home/subash/Desktop/ebpearls/blog-post/backend-service/docs/dataloader.md)** — Batching keys, request-scoped caches, and loaders relationship.
* **[MongoDB & Mongoose Schema Design](file:///home/subash/Desktop/ebpearls/blog-post/backend-service/docs/database.md)** — Models design system, indexing rules, and transaction parameters.
* **[Global DTO Validation Pipeline](file:///home/subash/Desktop/ebpearls/blog-post/backend-service/docs/validation.md)** — Class-validator rules, pipes, and custom decorators.
* **[Error Formatting & Exception Filters](file:///home/subash/Desktop/ebpearls/blog-post/backend-service/docs/error-handling.md)** — Custom formatters, HTTP to GraphQL errors translation.
* **[Pagination Standards](file:///home/subash/Desktop/ebpearls/blog-post/backend-service/docs/pagination.md)** — Standard DTOs for page lists, cursor structure, and mongoose offsets.

### 📁 Structure & Conventions
* **[Backend Code Conventions](file:///home/subash/Desktop/ebpearls/blog-post/backend-service/docs/conventions.md)** — Code formatting, linting rules, naming guides, and testing protocols.
* **[Backend Directory Layout](file:///home/subash/Desktop/ebpearls/blog-post/backend-service/docs/folder-structure.md)** — Layers layout and architectural file boundaries.

### 🏷️ Domain Modules Docs
* **[Users Domain Module](file:///home/subash/Desktop/ebpearls/blog-post/backend-service/docs/users.md)** — Fields schema, authentication state, validation boundaries.
* **[Posts Domain Module](file:///home/subash/Desktop/ebpearls/blog-post/backend-service/docs/posts.md)** — Relations, pagination mapping, authorizations.
* **[Comments Domain Module](file:///home/subash/Desktop/ebpearls/blog-post/backend-service/docs/comments.md)** — Nested trees logic, Cascade deletions, and relation mapping.
* **[Likes Domain Module](file:///home/subash/Desktop/ebpearls/blog-post/backend-service/docs/likes.md)** — High-volume toggles, compound indices, performance checks.
