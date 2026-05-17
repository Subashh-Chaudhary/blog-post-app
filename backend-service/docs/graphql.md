# GraphQL Subsystem & Resolver Architecture

This document details the code-first GraphQL engine configuration, resolver layers, input handling, and validation patterns on the NestJS backend service.

---

## 1. Code-First Schema Philosophy

The API uses a **code-first schema development** strategy using `@nestjs/graphql` decorators. 
Instead of maintaining separate `.graphql` schema files and manually mapping TypeScript typings, the GraphQL schema is automatically derived directly from our TypeScript source files:

* **Single Source of Truth**: The GraphQL schema (`schema.gql`) is auto-generated during application startup. If a field's type or nullability changes in a Mongoose model class (e.g., `Post`), the GraphQL schema immediately updates to reflect this change.
* **Declarative Documentation**: Fields are documented natively using code decorators (e.g., `@Field(() => String, { description: 'The body text' })`), which populate developer-facing descriptions in tools like GraphQL Playground or Apollo Sandbox.
* **Strict Type Safety**: Modifying an input or model immediately triggers typescript compilation checks across all resolvers and services, preventing runtime schema mismatches.

---

## 2. Resolver Architecture & Design Patterns

Resolvers act as the controller layer of our GraphQL API. We categorize resolver actions into three specific types:

```
                  +--------------------------------+
                  |         GraphQL Query          |
                  +--------------------------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
+-----------------------+                   +-----------------------+
|  Resolver Entry Node  |                   |   Field Resolve Node  |
|  (e.g., Query/Mutate) |                   |  (e.g. author, likes) |
+-----------------------+                   +-----------------------+
            |                                           |
            v                                           v
+-----------------------+                   +-----------------------+
| Invoke Service Method |                   |   Invoke DataLoader   |
| (Queries/Updates DB)  |                   |  (Batches DB lookups) |
+-----------------------+                   +-----------------------+
```

### 1. Root Queries (`@Query`)
Root queries are entry points for fetching data. Resolvers map query arguments to DTO classes and hand execution directly over to service layer methods.
```typescript
@Query(() => Post, { name: 'post' })
@UseGuards(OptionalGqlAuthGuard)
async getPostById(@Args('id', { type: () => ID }) id: string): Promise<Post> {
  return this.postsService.getPostById(id);
}
```

### 2. Root Mutations (`@Mutation`)
Root mutations manage state updates and writes. Mutations typically require strict authentication guards, execute DTO validation, and extract the current user to pass to services.
```typescript
@Mutation(() => Post)
@UseGuards(GqlAuthGuard)
async createPost(
  @Args('createPostInput') createPostInput: CreatePostInput,
  @CurrentUser() currentUser: User,
): Promise<Post> {
  return this.postsService.createPost(createPostInput, currentUser);
}
```

### 3. Field Resolvers (`@ResolveField`)
Field resolvers are invoked for dynamic, computed, or relational fields on an object (e.g., resolving a post's `author` or the current user's `isLiked` status). Field resolvers leverage request-scoped DataLoaders to batch database queries and completely avoid N+1 query bottlenecks.
```typescript
@ResolveField(() => User, { nullable: true })
async author(@Parent() post: Post): Promise<User | null> {
  if (!post.authorId) return null;
  return this.userDataLoader.load(post.authorId);
}
```

---

## 3. Input Validation Flow

GraphQL mutations enforce comprehensive, runtime input validation using structured Data Transfer Objects (DTOs) and NestJS validation pipes:

1. **Decorator-Driven DTOs**: Inputs are defined as classes decorated with both `@InputType` and `class-validator` attributes:
   ```typescript
   @InputType()
   export class CreatePostInput {
     @Field(() => String)
     @IsString()
     @Length(5, 100)
     title: string;

     @Field(() => String)
     @IsString()
     @MinLength(10)
     body: string;
   }
   ```
2. **Global Pipeline Interception**: The framework's global `ValidationPipe` intercepts these inputs during the GraphQL request lifecycle.
3. **Automated Error Response**: If any field fails validation (e.g. a title containing only 3 characters), the pipe throws a `BadRequestException`. The exception filter catches this and formats it into a standard GraphQL error response, returning clear validation metrics back to the client.

---

## 4. Execution Context & Custom Decorators

GraphQL uses a unique execution context model because it multiplexes multiple queries and fields into a single HTTP request. Standard NestJS decorators like `@Req()` or `@Res()` do not work in GraphQL resolvers because they expect standard Express request/response arrays.

We leverage GraphQL-specific context mapping to expose underlying request parameters:

* **GraphQL Context Conversion**: Guards and decorators convert the standard execution context into a GraphQL-friendly context using `GqlExecutionContext.create(context).getContext()`.
* **The `@CurrentUser` Decorator**: A custom decorator that extracts the authenticated user object directly from the request context, eliminating boilerplate code within resolvers:
  ```typescript
  export const CurrentUser = createParamDecorator(
    (data: unknown, context: ExecutionContext) => {
      const ctx = GqlExecutionContext.create(context);
      return ctx.getContext().req.user;
    },
  );
  ```
