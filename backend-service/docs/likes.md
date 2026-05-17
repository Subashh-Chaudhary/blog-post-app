# Likes Domain Module Documentation

The `Likes` module manages post-likes tracking, user engagement signals, high-volume toggle operations, and batched state verification.

---

## 1. Domain Model & Database Schema

Likes are stored in a dedicated junction collection in MongoDB, linking users and posts.

### Mongoose Database Document Attributes
* **Collection Name**: `post_likes`
* **Schema Definition**:
  * `_id` (`ObjectId`): MongoDB primary key.
  * `postId` (`ObjectId`): Foreign key reference linking the like to a post.
  * `userId` (`ObjectId`): Foreign key reference linking the like to a user.
  * `createdAt` (`Date`): Auto-populated creation timestamp.

### GraphQL Type Representation (`TogglePostLikeResponse`)
Likes are typically resolved as boolean attributes (`isLiked`) on Parent objects, or managed through dedicated mutation payloads:
```graphql
type TogglePostLikeResponse {
  postId: ID!
  isLiked: Boolean!
  likeCount: Int!
}
```

---

## 2. Relational Boundaries & Design Decisions

Likes create a high-density, many-to-many relationship between `Users` and `Posts`:

```
+--------------+                   +--------------+
|     User     |                   |     Post     |
+--------------+                   +--------------+
       |                                  |
       +-----------------+----------------+
                         |
                         v
              +--------------------+
              |     Post Like      | (Junction Collection)
              +--------------------+
```

* **Junction Collection vs. Nested Array**: 
  We store likes in a dedicated `post_likes` junction collection rather than nesting user IDs inside a `likes` array on the `Post` document.
  * **Scalability**: For posts that receive thousands of likes, nesting array values would quickly exceed MongoDB's maximum 16MB document size limit and cause performance degradation.
  * **Concurrency**: Storing likes as independent documents prevents database lock-ups and write conflicts that occur when multiple users attempt to like a post at the exact same moment.

---

## 3. High-Performance Toggle Logic

Liking and unliking are consolidated into a single **toggle operation**, which is both simple and idempotent:

1. **Transaction Checks**: The mutation requires a valid `GqlAuthGuard`. The resolver extracts the authenticated `user._id` from the context.
2. **Atomic Find-and-Modify**: The repository queries the database for an existing like match on `{ postId, userId }`.
   * **If found**: Delete the record (unlike action).
   * **If not found**: Create a new record containing `{ postId, userId }` (like action).
3. **Optimistic Count Resolutions**: The service retrieves the total post-likes count using Mongoose's `countDocuments` and returns the final count to the client.

---

## 4. Compound Indexing & Constraint Guarantees

Because likes must be unique (a user can only like a post once), we enforce a strict **compound unique index** at the database level:

```javascript
postLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });
```
This compound index provides two major benefits:
1. **Ensures Data Integrity**: Prevents accidental double-likes even under extreme concurrency or network retry conditions.
2. **Optimizes Lookups**: Provides high-performance O(1) searches, serving like status checks directly out of MongoDB's memory-mapped index cache.

---

## 5. DataLoader Check Optimization

When displaying a list of posts, the client needs to know if the current user has liked each post (`isLiked`). Running individual queries for every post in a list would trigger an N+1 query bottleneck.

To solve this, we use the `PostLikeDataLoader`:
* **Single Batch Query**: It aggregates all `postId` keys from a post list query.
* **Efficient Lookup**: Runs a single database scan: `{ userId: currentUserId, postId: { $in: postIds } }`.
* **Instant Resolution**: Returns the correct boolean status for each post in the list, reducing database roundtrips to one.
