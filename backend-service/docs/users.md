# Users Domain Module Documentation

The `Users` module handles user profile registration, credential storage, password hashing, profile queries, and relationship mappings.

---

## 1. Domain Model & Database Schema

The database persistence schema is managed through Mongoose, applying constraints directly to the MongoDB collections.

### Mongoose Database Document Attributes
* **Collection Name**: `users`
* **Schema Definition**:
  * `_id` (`ObjectId`): MongoDB primary key.
  * `email` (`String`): Must be unique, lowercase, trimmed, and conform to email validation rules.
  * `username` (`String`): Must be unique, trimmed, alphanumeric, minimum length of `3` characters.
  * `name` (`String`): Display name of the user, trimmed.
  * `password` (`String`): Cryptographically hashed credential representation (never exposed to GraphQL).

### GraphQL Type Representation (`User`)
The GraphQL interface exposes select fields to client queries:
```graphql
type User {
  id: ID!
  email: String!
  username: String!
  name: String!
}
```
> [!IMPORTANT]
> The `password` field is strictly omitted from the `@Field()` mappings of the `User` class to prevent the field from ever being queried or returned in the GraphQL schema definition.

---

## 2. Relation Map & Data Ownership

The `User` entity is the primary relational parent of several downstream resources:

```
                  +--------------------------------+
                  |              User              |
                  +--------------------------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
+-----------------------+                   +-----------------------+
|         Posts         |                   |       Comments        |
|  (User is Author)     |                   |  (User is Commenter)  |
+-----------------------+                   +-----------------------+
            |                                           |
            +---------------------+---------------------+
                                  |
                                  v
                    +---------------------------+
                    |        Post Likes         |
                    |    (User is Liker)        |
                    +---------------------------+
```

* **Posts**: A user can publish multiple posts. The `posts` collection links to users via the `authorId` property, forming a one-to-many relationship.
* **Comments**: A user can write comments. The `comments` collection links to users via the `authorId` property.
* **Post Likes**: A user can like posts. The `post_likes` collection tracks these interactions via the compound key `[postId, userId]`.

---

## 3. Validation & Business Constraints

* **Registration Constraints**:
  * Email fields are normalized using a global sanitation pipe, converting values to lowercase and removing leading/trailing spaces prior to duplicate checks.
  * Username queries are checked using insensitive regex patterns to prevent identical duplicate registrations.
* **Security & Authorization Rules**:
  * Users can only edit or modify their own profiles.
  * Mutations like profile updates enforce ownership constraints by checking the decrypted `req.user._id` before applying changes.

---

## 4. Performance & Scalability Considerations

* **Database Indexing**:
  * An active unique index is configured on `{ email: 1 }` to prevent database-level double-insertion anomalies.
  * An active unique index is configured on `{ username: 1 }` to ensure instantaneous O(1) user lookup queries.
* **Read Heavy Caching**:
  * User profile details (names, avatars, profile tags) change infrequently but are resolved frequently (e.g., as the author of every post and comment).
  * This domain is a prime candidate for an in-memory cache (like Redis) placed ahead of MongoDB to reduce database load during heavy traffic spikes.
