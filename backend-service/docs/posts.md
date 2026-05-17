# Posts Domain Module Documentation

The `Posts` module manages the creation, modification, deletion, pagination, and relational mapping of blog posts.

---

## 1. Domain Model & Database Schema

The Post schema is defined using Mongoose, establishing strict type mappings and validations.

### Mongoose Database Document Attributes
* **Collection Name**: `posts`
* **Schema Definition**:
  * `_id` (`ObjectId`): MongoDB primary key.
  * `title` (`String`): Required, trimmed, minimum of `5` characters, maximum of `100`.
  * `body` (`String`): Required, minimum of `10` characters.
  * `authorId` (`ObjectId`): Foreign key linking to the `users` collection.
  * `createdAt` (`Date`): Auto-populated creation timestamp.
  * `updatedAt` (`Date`): Auto-populated modification timestamp.

### GraphQL Type Representation (`Post`)
```graphql
type Post {
  id: ID!
  title: String!
  body: String!
  authorId: ID!
  author: User
  isLiked: Boolean!
  likedBy: [User!]!
  createdAt: String!
  updatedAt: String!
}
```

---

## 2. Relation Map & Resolve Boundaries

```
                  +--------------------------------+
                  |              Post              |
                  +--------------------------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
+-----------------------+                   +-----------------------+
|  Author ID Reference  |                   |  Comments Reference   |
|   (Resolves to User)  |                   |  (Loads from Comments)|
+-----------------------+                   +-----------------------+
            |                                           |
            +---------------------+---------------------+
                                  |
                                  v
                    +---------------------------+
                    |        Post Likes         |
                    |   (Tracks user approvals) |
                    +---------------------------+
```

* **Author Field Resolve**: Resolves the full user profile of the post creator. The `author` field resolver uses `UserDataLoader` to batch multiple author lookups into a single database query.
* **isLiked Field Resolve**: Computes whether the currently logged-in user has liked the post. If the request is anonymous, it resolves to `false`. If authenticated, it uses `PostLikeDataLoader` to run a batched lookups scan.
* **likedBy Field Resolve**: Returns a truncated list of users who liked the post (default: latest 20 users), showing engagement indicators.

---

## 3. Pagination Implementation

The Posts endpoint implements offset-based pagination to support endless scroll and paginated grid layouts.

### Pagination Inputs (`PaginationInput`)
* `offset` (`Int`): Number of records to skip (default: `0`).
* `limit` (`Int`): Max number of items to return in the request (default: `10`, maximum safety ceiling: `100`).

### Pagination Return Type (`PaginatedPosts`)
```graphql
type PaginatedPosts {
  items: [Post!]!
  totalCount: Int!
  hasMore: Boolean!
}
```
* `items`: The array of posts retrieved for the current page slice.
* `totalCount`: The total count matching the query, allowing frontend layouts to calculate accurate page controls.
* `hasMore`: A boolean indicator enabling the client to execute prefetching or display "load more" components.

---

## 4. Mutation & Authorization Rules

* **Creation Bounds**:
  * Enforces `GqlAuthGuard`. The current user's authenticated profile is retrieved, and their `_id` is automatically injected into the post's `authorId` property.
* **Modification Bounds (Update / Delete)**:
  * Restricts access to the original post creator. The `PostsService` fetches the post record and verifies that `post.authorId.toString() === currentUser._id.toString()`. 
  * If ownership verification fails, it throws a `ForbiddenException`, preventing unauthorized edits.
* **Cascading Deletions**:
  * Deleting a post triggers cascading cleanup tasks in related collections, deleting all associated comment documents and post-likes records to prevent data leakage.

---

## 5. Performance & Caching Targets

* **MongoDB Database Indexing**:
  * An index is configured on `{ createdAt: -1 }` to guarantee fast, chronological query sorting.
  * An index is configured on `{ authorId: 1 }` to ensure instantaneous lookups for user profile post histories.
* **Text Indexing**:
  * A compound text index on `{ title: 'text', body: 'text' }` supports full-text search capability across post archives.
