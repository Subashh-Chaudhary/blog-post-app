# Comments Domain Module Documentation

The `Comments` module handles threaded discussions, recursive reply trees, nested comment structures, and cascading deletions.

---

## 1. Domain Model & Database Schema

The Comments schema supports multi-nested reply trees by storing a self-referential `parentId` pointer on each comment.

### Mongoose Database Document Attributes
* **Collection Name**: `comments`
* **Schema Definition**:
  * `_id` (`ObjectId`): MongoDB primary key.
  * `postId` (`ObjectId`): Foreign key reference linking the comment to its parent post.
  * `authorId` (`ObjectId`): Foreign key reference linking the comment to its creator.
  * `parentId` (`ObjectId`, Optional): Self-referential pointer. If populated, it indicates the comment is a reply to an existing comment. If null, the comment is a top-level thread start.
  * `body` (`String`): Required, trimmed, minimum of `2` characters, maximum of `1000`.
  * `createdAt` (`Date`): Auto-populated creation timestamp.

### GraphQL Type Representation (`Comment`)
```graphql
type Comment {
  id: ID!
  postId: ID!
  authorId: ID!
  author: User
  parentId: ID
  parent: Comment
  replies: [Comment!]!
  body: String!
  createdAt: String!
}
```

---

## 2. Hierarchical Recursive Structure

To build threaded discussions, the Comments schema implements a self-referential data hierarchy:

```
                  +--------------------------------+
                  |         Post Document          |
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |  Top-Level Comment (parent=Ø)  |
                  +--------------------------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
+-----------------------+                   +-----------------------+
|  Reply A (parent=Top) |                   |  Reply B (parent=Top) |
+-----------------------+                   +-----------------------+
            |
            v
+-----------------------+
| Reply A.1 (parent=A)  |
+-----------------------+
```

* **Flat Storage, Tree Presentation**: Comments are stored flat in MongoDB. They are parsed and constructed into nested reply trees on demand by frontend layout engines or recursive field resolvers.
* **Replies Resolution**: The `replies` field resolver fetches child comments dynamically by querying `{ parentId: comment._id }`.
* **Author Batching**: The `author` field resolver uses `UserDataLoader` to batch creator profile lookups, resolving complex threaded discussion pages with minimal database overhead.

---

## 3. Cascading Deletion Strategy

Tree-like relationships require strict database lifecycle rules to prevent orphaned records:

* **Post-Level Cascade**: When a `Post` document is deleted, the `PostsService` triggers an automatic cascading cleanup, deleting all associated comments matching `{ postId: post._id }`.
* **Parent-Level Cascade**: When a top-level or child comment is deleted:
  * **Option A (Hard Delete)**: Sub-replies are deleted recursively, cleaning up the entire discussion branch.
  * **Option B (Soft Redirection)**: The comment's `body` is updated to a standard template (e.g., *"This comment has been deleted by the author"*), leaving the underlying reply hierarchy intact.

---

## 4. Performance & Query Optimizations

Threaded comment systems generate highly repetitive read queries. We optimize these interactions using targeted indexes:

* **MongoDB Database Indexing**:
  * An index is configured on `{ postId: 1 }` to ensure instantaneous page loads for post-specific comment threads.
  * An index is configured on `{ parentId: 1 }` to optimize child reply lookups.
  * A compound index is configured on `{ postId: 1, createdAt: 1 }` to serve sorted, chronological comment timelines out of the database cache.
* **DataLoader Strategy**:
  * Because multiple comment replies often share the same author, the request-scoped `UserDataLoader` is essential here, reducing author database lookups on long threads by up to 90%.
