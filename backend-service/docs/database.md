# Database Layer & Mongoose Schema Design

This document details the MongoDB data persistence layer, model indexing strategies, schema constraints, and transactional lifecycle rules.

---

## 1. Schema Definitions & Collection Mapping

We map Mongoose schema models to dedicated, indexed collections in MongoDB:

| Collection Name | Associated Model | Document Blueprint & Constraints |
| :--- | :--- | :--- |
| **`users`** | `User` | Unique indexes on lowercase, trimmed `email` and alphanumeric `username` fields. |
| **`posts`** | `Post` | Maps a one-to-many relationship to users via the indexed `authorId` foreign key. Supports search indexing. |
| **`comments`** | `Comment` | Contains parent-child hierarchies using self-referential `parentId` pointers and an indexed `postId` key. |
| **`post_likes`** | `PostLike` | Junction collection enforcing a compound unique index on `{ postId: 1, userId: 1 }`. |

---

## 2. Advanced Database Indexing Strategy

Indexing is critical for maintaining high performance as our database grows. We configure specialized indexes directly in Mongoose to optimize query sorting and search operations:

```
                            [ MongoDB Index Types ]
                                       |
        +------------------------------+------------------------------+
        |                              |                              |
        v                              v                              v
+---------------+              +---------------+              +---------------+
|  Single-Key   |              |   Compound    |              |   Full-Text   |
| (e.g. email)  |              | (postId, uid) |              | (title, body) |
+---------------+              +---------------+              +---------------+
```

### 1. Unique Single-Key Indexes
Enforces database-level validation to prevent duplicate records.
* `{ email: 1 }` (unique)
* `{ username: 1 }` (unique)

### 2. Relational Lookup Foreign Key Indexes
Optimizes join-like database operations.
* `{ authorId: 1 }` inside `posts`
* `{ postId: 1 }` and `{ parentId: 1 }` inside `comments`

### 3. Compound Indexes
Optimizes multi-field sorting and junction lookups.
* `{ postId: 1, userId: 1 }` (unique) in `post_likes`: Guarantees a user can only like a post once and speeds up check queries.
* `{ postId: 1, createdAt: -1 }` in `comments`: Speeds up retrieval of chronologically sorted comments under a post.

### 4. Text Indexes
Supports flexible search capabilities.
* `{ title: "text", body: "text" }` in `posts`: Enables full-text search across titles and body copy using standard MongoDB search terms.

---

## 3. Schema Hooks & Cascade Deletions

MongoDB does not support native foreign key constraints or automatic cascade deletions. We handle these lifecycle cascades in our service layer or using Mongoose schema hooks to prevent orphaned data:

* **Post Deletion Cascades**:
  When a user deletes a post, the `PostsService` orchestrates cascading cleanups to remove related resources:
  * Deletes all child comment documents: `{ postId: post._id }`.
  * Deletes all associated likes records: `{ postId: post._id }`.
* **Mongoose Schema Lifecycle Middleware**:
  We use Mongoose pre/post hooks (e.g., `schema.pre('save', ...)` or `schema.pre('deleteOne', ...)`) to handle operations like password hashing and automated field updates.
  ```typescript
  userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
  });
  ```

---

## 4. Database Transaction Policies

When executing operations that modify multiple collections (e.g., deleting a post and all its comments), we leverage MongoDB transactions to ensure database consistency:

* **Acid Transactions**: Multi-collection writes run within a managed database session (`session.startTransaction()`). This guarantees that if any part of the operation fails, all writes are rolled back, preventing orphaned records.
* **Replica Set Requirement**: MongoDB transactions require a replica set or sharded cluster configuration (configured automatically in our `docker-compose.yml` environment).
