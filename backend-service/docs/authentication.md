# Stateless JWT Authentication Subsystem

This document details the security design, token structure, context injection, and guard-driven authorization mechanics of the backend service.

---

## 1. Cryptographic Security Design

The application implements a **stateless, token-based authentication** strategy using JSON Web Tokens (JWT) and high-entropy hashing protocols:

```
[ Client User Login ]
        |
        v
+-------------------------------+
|    Verify Credentials in DB   |
+-------------------------------+
        |
        v
+-------------------------------+
|  Sign JWT with HS256 Secret   |
+-------------------------------+
        |
        v
+-------------------------------+
| Send JWT to Client in Response|
+-------------------------------+

                    - - - - - - - - - - - - - - - - - 

[ Authenticated GraphQL Request ]
        |
        v
+-------------------------------+
|  Extract Bearer token header  |
+-------------------------------+
        |
        v
+-------------------------------+
|   Verify Signature with Secret|
+-------------------------------+
        |
        v
+-------------------------------+
| Inject Decoded User to Context|
+-------------------------------+
```

* **Password Hashing**: User passwords are encrypted prior to database storage using the standard **bcrypt** hashing algorithm with a salt round factor of `10`. This ensures resistant security against rainbow-table and brute-force attacks.
* **Token Standard**: Upon successful login or registration, the backend issues an asymmetric or symmetric-signed JSON Web Token containing the user's basic identification claims.
* **Signature Protocol**: Tokens are signed using the standard **HS256 (HMAC with SHA-256)** algorithm, leveraging a high-entropy secret stored as an environment variable (`JWT_SECRET`).

---

## 2. Authentication Context Lifecycle

GraphQL API calls are routed through a single `/graphql` HTTP endpoint. The standard HTTP context is parsed and transformed into a GraphQL context during request execution:

1. **Header Inspection**: The incoming GraphQL request is intercepted by the GraphQL module bootstrap. If an `Authorization: Bearer <token>` header is identified, the token string is extracted.
2. **GraphQL Context Bind**: During context creation in `app.module.ts`, the Express `req` and `res` objects are exposed, allowing subsequent guards and decorators to interact with header values directly:
   ```typescript
   GraphQLModule.forRoot<ApolloDriverConfig>({
     driver: ApolloDriver,
     context: ({ req }) => ({ req }),
     // ...
   })
   ```
3. **Decoded Claims Hydration**: When an authentication guard intercepts a request, it validates the token's cryptographic signature. If valid, the payload claims are decoded, and the user object is fetched from the database and bound directly to `req.user`.

---

## 3. Mandatory vs. Optional Authorization Guards

The authentication system implements two distinct guards to support different types of API endpoints:

### 1. Mandatory Guard (`GqlAuthGuard`)
Enforces strict authentication requirements. If the authorization token is missing, expired, or cryptographically invalid, the guard terminates the request, throwing an `UnauthorizedException`.
* **Typical Use Case**: Creating a post, deleting a comment, editing a profile.
* **Implementation Pattern**:
  ```typescript
  @Mutation(() => Post)
  @UseGuards(GqlAuthGuard)
  async createPost(...)
  ```

### 2. Optional Guard (`OptionalGqlAuthGuard`)
Attempts to authenticate the user if a valid token is provided, but does not block the request if the token is missing or invalid.
If a token is present, the decoded user is appended to `req.user`. If no token is provided, the request proceeds, leaving `req.user` undefined.
* **Typical Use Case**: Viewing a public post listing. If authenticated, we check which posts the user has liked; if anonymous, we show the list with all `isLiked` properties default-resolved to `false`.
* **Implementation Pattern**:
  ```typescript
  @Query(() => PaginatedPosts)
  @UseGuards(OptionalGqlAuthGuard)
  async getPosts(...)
  ```

---

## 4. Resolving Authenticated Context Data

To simplify resolver logic and eliminate repetitive context extraction boilerplate, we use the custom `@CurrentUser()` decorator to retrieve the authenticated user:

```typescript
@Mutation(() => Post)
@UseGuards(GqlAuthGuard)
async createPost(
  @Args('createPostInput') createPostInput: CreatePostInput,
  @CurrentUser() currentUser: User, // Automatically injected from req.user
): Promise<Post> {
  return this.postsService.createPost(createPostInput, currentUser);
}
```
This decorator provides clean separation between transport concerns (parsing req context) and application code, allowing resolvers to handle typed domain models natively.
