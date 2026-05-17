# Backend Code Style & Architectural Conventions

This document defines the architectural standards, code style rules, naming conventions, and testing protocols for the backend codebase.

---

## 1. File & Class Naming Conventions

Strict file and class naming patterns ensure the codebase remains readable and easy to search:

| Component Type | File Naming Pattern | Class Naming Pattern | Code Example |
| :--- | :--- | :--- | :--- |
| **Module** | `*.module.ts` | `[Domain]Module` | `PostsModule` |
| **Resolver** | `*.resolver.ts` | `[Domain]Resolver` | `PostsResolver` |
| **Service** | `*.service.ts` | `[Domain]Service` | `PostsService` |
| **Repository** | `*.repository.ts` | `[Domain]Repository` | `PostsRepository` |
| **Database Model** | `*.model.ts` | `[Domain]` | `Post` |
| **Input / DTO** | `*.input.ts` | `[Action][Domain]Input` | `CreatePostInput` |

* **Filename Casing**: Use kebab-case for all source filenames (e.g., `user-profile.resolver.ts`).
* **Class Casing**: Use PascalCase for all class declarations (e.g., `UserProfileResolver`).
* **Method Casing**: Use camelCase for all method names (e.g., `getPostById`).

---

## 2. Layer Integration & Dependency Flow

To maintain clear separation of concerns, code dependencies must flow in a single direction. Circular dependencies are strictly forbidden:

```
[ Resolver Layer ]
        | (Injects Services and DataLoaders)
        v
[ Service Layer ]
        | (Injects Repositories)
        v
[ Repository Layer ]
        | (Injects Mongoose Models)
        v
[ Database Layer ]
```

### Key Integration Rules
* **Resolvers Are Controllers**: Resolvers should focus strictly on handling network requests. They parse arguments, extract context users, and pass execution to services. Business logic must not reside in resolvers.
* **Services Are Agnostic**: Services manage business rules and validate operations (e.g., verifying post ownership). Services should remain agnostic to transport concerns like GraphQL or HTTP.
* **Repositories Isolate Database Logic**: Repositories abstract all MongoDB queries and Mongoose model interactions. Other layers must not execute raw database queries.

---

## 3. Standardized Testing Protocols

We write tests for every layer of the application to ensure long-term stability and catch regressions early:

### 1. Isolated Unit Tests (`*.spec.ts`)
Unit tests focus on testing business logic inside services by mocking external dependencies.
* **Mock Injection**: Use `@nestjs/testing` and Jest's mock utilities to mock database repositories, ensuring unit tests run quickly and do not touch the database.
* **Coverage Targets**: Aim for high test coverage on core service methods.

### 2. End-to-End (E2E) Integration Tests (`test/*-e2e.spec.ts`)
E2E tests verify the entire request pipeline by spinning up a testing server and executing real GraphQL queries against a test database.
* **Isolated Database**: E2E tests run against a dedicated, isolated test database instance.
* **Pipeline Testing**: Tests target the GraphQL endpoint directly over HTTP to verify that guards, pipes, resolvers, and database operations execute correctly together.
