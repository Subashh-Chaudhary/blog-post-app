# Request-Scoped DataLoaders & N+1 Resolution

This document explains our caching and batching strategy using **DataLoaders** to resolve the GraphQL N+1 query problem.

---

## 1. Demystifying the N+1 Query Problem

In REST APIs, fetching a list of posts alongside their authors is typically handled with a single, SQL-style JOIN query:
```sql
SELECT * FROM posts JOIN users ON posts.authorId = users.id;
```
GraphQL, however, operates differently. It resolves fields independently using a tree-like traversal system. If a query requests a list of posts and their associated authors, the execution engine follows this sequence:

1. **Step 1**: Run **1** root query to fetch a list of posts (e.g., returns `10` posts).
2. **Step 2**: For *each* post, invoke the `author` field resolver:
   ```typescript
   @ResolveField(() => User)
   async author(@Parent() post: Post) {
     return this.usersService.findById(post.authorId); // Triggered 10 times!
   }
   ```
This triggers **N** individual database calls to the `users` collection, resulting in **1 + N queries** (1 query to fetch posts, and 10 queries to fetch authors). As lists grow, this behavior can quickly saturate database connections and cause severe API lag.

---

## 2. The DataLoader Batching & Caching Strategy

DataLoaders solve this bottleneck by introducing two simple but powerful concepts: **Batching** and **Caching**.

```
[ Field Resolver Call 1 ] ---> load(id1) --+
[ Field Resolver Call 2 ] ---> load(id2) --+---> [ DataLoader Collector ]
[ Field Resolver Call 3 ] ---> load(id1) --+             |
                                                        | Wait for execution tick
                                                        v
                                         [ Batched DB Call: { $in: [id1, id2] } ]
```

* **Batching (Coalescing)**: Instead of executing database calls immediately, the DataLoader waits for a single execution tick (using node's `process.nextTick`). It collects all requested keys, deduplicates them, and passes them to a single batch loading function that runs a bulk database query (e.g., using Mongoose's `{ $in: [...] }`).
* **Caching**: The DataLoader caches query results in memory. If multiple posts or comments in a list share the same author, the loader resolves duplicate keys directly from its cache, eliminating redundant database queries.

---

## 3. NestJS Request-Scoped Lifecycle

To ensure isolation and security, our DataLoaders are configured as **Request-Scoped Provider Beans** in NestJS:

```typescript
@Injectable({ scope: Scope.REQUEST })
export class UserDataLoader { ... }
```
Using request scope (`Scope.REQUEST`) is a critical security pattern:
* **Per-Request Caches**: A new DataLoader instance is created for every incoming GraphQL request. This isolates in-memory caches, ensuring users never see data cached from another user's session.
* **Automatic Garbage Collection**: Once a request finishes and the response is sent, the DataLoader instance is garbage-collected, preventing memory leaks.

---

## 4. Loader Implementations in Action

DataLoaders require their batch loading function to return results that match the exact sequence and length of the requested keys array.

### 1. UserDataLoader
Consolidates user profile lookups across posts, comments, and likes.
```typescript
this.loader = new DataLoader<string, User | null>(
  async (ids: readonly string[]) => {
    // 1. Fetch all matching users in a single query
    const users = await this.usersRepository.findByIds([...ids]);

    // 2. Map results for O(1) lookups
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // 3. Return results in the exact order of requested IDs
    return ids.map((id) => userMap.get(id) ?? null);
  }
);
```

### 2. PostLikeDataLoader
Batches like-status checks for lists of posts:
```typescript
this.loader = new DataLoader<string, boolean>(
  async (keys: readonly string[]) => {
    // keys array contains serialized compound keys: "userId:postId"
    // 1. Parse keys and run a single bulk query
    const likes = await this.postLikesRepository.findMatches(parsedKeys);

    // 2. Map matches
    const matchesMap = new Map(likes.map(l => [`${l.userId}:${l.postId}`, true]));

    // 3. Return boolean status in the correct order
    return keys.map(k => matchesMap.get(k) ?? false);
  }
);
```

---

## 5. DataLoader Best Practices & Common Mistakes

* **Always Maintain Key Ordering**: If your batch loader returns results out of order, GraphQL will map data to the wrong objects. Always use a `Map` to align results with the requested keys array.
* **Limit Batch Sizes**: Configure `maxBatchSize` (e.g., `100`) to prevent oversized database queries that can cause MongoDB lockups.
* **Keep Database Queries Simple**: Avoid complex joins and projections in batch loaders. Simple, index-driven queries perform best.
