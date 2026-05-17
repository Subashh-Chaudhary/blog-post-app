# API Pagination Standards & Data Mapping

This document describes the pagination architecture, standard input DTOs, limit safety ceilings, and repository-level offset patterns of the backend.

---

## 1. Unified Pagination Design System

To ensure consistent API responses when querying large collections (e.g. lists of posts or comments), the backend implements a standardized pagination design system. 

```
                                [ Query Execution ]
                                         |
                       +-----------------+-----------------+
                       |                                   |
                       v                                   v
             [ Skip / Limit Query ]               [ countDocuments Query ]
                       |                                   |
                       +-----------------+-----------------+
                                         |
                                         v
                         +-------------------------------+
                         |     Paginated Output DTO      |
                         |   (items, totalCount, hasMore)|
                         +-------------------------------+
```

All paginated endpoints accept a unified `PaginationInput` parameters object:
```graphql
input PaginationInput {
  offset: Int = 0
  limit: Int = 10
}
```

Every paginated query returns a standardized output wrapper (e.g. `PaginatedPosts`):
```graphql
type PaginatedPosts {
  items: [Post!]!
  totalCount: Int!
  hasMore: Boolean!
}
```
* **`items`**: The array of retrieved records for the current page slice.
* **`totalCount`**: The total number of items matching the query filter, allowing frontend components to calculate dynamic page layouts.
* **`hasMore`**: A simple boolean flag (`offset + limit < totalCount`) that helps client applications manage infinite-scroll list triggers.

---

## 2. Implementing Safety Ceilings & Repository Logic

To prevent performance issues from extremely large database requests, the global validation pipeline enforces a strict maximum safety limit:

```typescript
@InputType()
export class PaginationInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0)
  offset: number = 0;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(1)
  @Max(100) // Strictly prevents client-side requests from exceeding 100 records
  limit: number = 10;
}
```

### Mongoose Query Execution Pattern
The service and repository layers execute skip and limit parameters in parallel with a total count query to minimize database latency:

```typescript
async getPosts(input: PaginationInput): Promise<PaginatedPosts> {
  const { offset, limit } = input;

  // Run database query and total count in parallel
  const [items, totalCount] = await Promise.all([
    this.postModel
      .find()
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec(),
    this.postModel.countDocuments().exec(),
  ]);

  const hasMore = offset + limit < totalCount;

  return {
    items,
    totalCount,
    hasMore,
  };
}
```

---

## 3. Offset-Based vs. Cursor-Based Pagination

We evaluate and use different pagination patterns based on our performance and user experience requirements:

| Aspect | Offset-Based Pagination | Cursor-Based Pagination |
| :--- | :--- | :--- |
| **Mechanics** | Uses `skip(N)` and `limit(L)` queries. | Uses `find({ _id: { $lt: cursor } })` and `limit(L)` queries. |
| **Typical Use Case** | Admin dashboard tables, pages where jumping to a specific page is required. | Endless scroll feeds (e.g. blog post timelines, social media feeds). |
| **Pros** | Easy to implement, supports jumping to arbitrary pages (e.g., jump to page 5). | Consistent query performance, prevents item duplication issues when new items are added. |
| **Cons** | Performance drops on very deep pages because MongoDB must scan and skip all previous documents. | Does not support jumping to arbitrary pages, more complex implementation. |
