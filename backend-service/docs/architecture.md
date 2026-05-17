# Backend System Architecture & Lifecycle

This document describes the high-level request lifecycle, domain separation, layer boundaries, and scalability considerations of the NestJS GraphQL backend service.

---

## 1. Global Request-Response Lifecycle

Every incoming GraphQL query or mutation traverses a highly structured, sequential intercept pipeline within the NestJS framework. This pipeline ensures strict security, clean input formats, isolated business context, and structured output formatting.

```
Incoming Request (HTTP POST)
      |
      v
+-----------------------------+
|    Express Engine parser    | --> Parses raw body to JSON
+-----------------------------+
      |
      v
+-----------------------------+
|  GraphQL Context Execution  | --> Extracts Auth Header to Context
+-----------------------------+
      |
      v
+-----------------------------+
|    GqlAuthGuard Validation  | --> Decodes JWT, authenticates session
+-----------------------------+
      |
      v
+-----------------------------+
|    Global Pipes / DTO       | --> Validates fields (class-validator)
+-----------------------------+
      |
      v
+-----------------------------+
|      Domain Resolver        | --> Dispatches query & invokes Dataloader
+-----------------------------+
      |
      v
+-----------------------------+
|       Domain Service        | --> Executes rules, coordinates writes
+-----------------------------+
      |
      v
+-----------------------------+
|     Domain Repository       | --> Queries MongoDB (via Mongoose model)
+-----------------------------+
      |
      v
[ MongoDB Persistent Storage ]
```

### Detailed Lifecycle Phases

1. **HTTP Parsing**: The application parses the raw incoming HTTP request body. GraphQL requests arrive as POST payloads directed at the `/graphql` route.
2. **GraphQL Context Preparation**: The GraphQL module intercepts the request, creating a unique context object for the duration of the request's execution. During this phase, headers are inspected, and any `Authorization: Bearer <token>` token is identified.
3. **Authentication Guards (GqlAuthGuard / OptionalGqlAuthGuard)**:
   * Decodes and validates the JWT signature using the configuration secret.
   * If valid, resolves the authenticated `User` database object, binding it directly to the GraphQL request context.
   * If invalid and the guard is mandatory (`GqlAuthGuard`), halts execution immediately, throwing an `UnauthorizedException`.
4. **Validation Pipes**: Resolvers map inputs to strictly typed Data Transfer Objects (DTOs). The global `ValidationPipe` intercepts these inputs, running `class-validator` rules. If validation fails, execution halts and returns a structured validation error payload.
5. **Resolver Invocation**: The GraphQL engine dispatches execution to the corresponding `@Resolver` class and target query/mutation handler. Field resolvers invoke request-scoped DataLoaders to batch nested lookups (e.g., getting post authors).
6. **Service Execution**: Resolvers call the appropriate `@Injectable` service layer. Services contain core transactional rules, authorization validations (e.g., confirming if a user owns the post they want to delete), and orchestrate domain mutations.
7. **Repository Abstraction**: Services call repositories to interact with MongoDB. Repositories abstract the underlying Mongoose models and manage all database queries, indexing rules, and transaction parameters.
8. **Error Filters / Response Formatting**: Any exception thrown along this pipeline is intercepted by our custom `GqlExceptionFilter`, translated into clean GraphQL error messages, and returned to the client as a standardized JSON response.

---

## 2. Layer Boundaries & Separation of Concerns

To ensure maintainability and testability at scale, our codebase maintains absolute separation between layers:

| Layer | Primary Duty | Allowed Dependencies | Prohibited Behaviors |
| :--- | :--- | :--- | :--- |
| **Resolver** | Map network protocols, define GraphQL entry nodes, extract context user objects. | Services, DataLoaders, Repositories (read-only for nested resolves). | Direct database mutations, containing core business formulas, database schemas manipulation. |
| **Service** | Process domain business logic, orchestrate entity updates, validate object ownership. | Repositories, other high-level services (via DI). | Direct manipulation of HTTP/GraphQL headers, raw database queries bypassing repositories. |
| **Repository** | Abstract data store drivers, run complex mongoose aggregate queries, manage indexes. | Mongoose Models. | Network calls, business validation logic, authentication state checks. |
| **Model / DTO** | Enforce input constraints, define TypeScript compile shapes, map code-first graphql schemas. | None. | Business logic execution, importing services or repositories. |

---

## 3. Microservice Readiness & Future Scaling

The NestJS backend is architected from day one to be easily split into independent microservices:

* **Loose Domain Coupling**: Features (Users, Posts, Comments, Likes) communicate strictly through well-defined service classes. There are zero tight circular database references.
* **Module Encapsulation**: Each folder in `/src/modules` is entirely self-sufficient. If the `posts` module experiences high write traffic, it can be extracted into an independent microservice container with minimal effort.
* **Protocol Agnosticism**: Because our Service layer is decoupled from GraphQL, we can easily add new transport adapters (such as gRPC for internal service communications, or RabbitMQ for handling asynchronous post-like events) with zero modifications to the underlying business logic.
