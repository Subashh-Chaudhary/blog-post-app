# Error Handling & Exception Mapping Architecture

This document describes our centralized error handling strategy, detailing exception filters, Apollo error formatting, and structured API error responses.

---

## 1. The GraphQL Error Formatting Standard

GraphQL errors follow a standardized JSON format defined by the GraphQL specification. Unlike REST APIs, which communicate errors using HTTP status codes, GraphQL APIs return error details in an `errors` array within the response payload:

```json
{
  "errors": [
    {
      "message": "Post with ID 65a123def456 not found",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["post"],
      "extensions": {
        "code": "NOT_FOUND",
        "status": 404,
        "timestamp": "2026-05-17T10:50:00.000Z"
      }
    }
  ],
  "data": null
}
```

Every error payload contains:
* **`message`**: A clear, developer-facing description of the error.
* **`path`**: The query or mutation field path where the error occurred.
* **`extensions`**: Custom metadata fields:
  * `code`: A standardized string code (e.g. `UNAUTHORIZED`, `BAD_REQUEST`, `NOT_FOUND`).
  * `status`: The corresponding REST-style HTTP status code (e.g., `404`).
  * `timestamp`: The timestamp when the error occurred.

---

## 2. NestJS Exception Filter & Apollo Integration

We unify error handling by integrating NestJS exception filters with Apollo Server's formatting engine.

```
+-------------------------------------------------------+
|              Exception thrown in pipeline             |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|  GqlExceptionFilter / HttpException filter intercept   |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|  Apollo formatError translates and appends Extensions |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|        Unified JSON Response returned to Client       |
+-------------------------------------------------------+
```

### 1. Apollo Error Formatter (`app.module.ts`)
The `formatError` hook intercepts raw exceptions, extracting underlying metadata and converting them into structured error payloads:
```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  formatError: (error) => {
    const originalError = error.extensions?.originalError as any;
    return {
      message: originalError?.message || error.message,
      path: error.path,
      extensions: {
        code: originalError?.error || error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        status: originalError?.statusCode || 500,
        timestamp: new Date().toISOString(),
      },
    };
  },
})
```

### 2. Custom NestJS GraphQL Exception Filter (`gql-exception.filter.ts`)
To handle edge cases that bypass the GraphQL engine (e.g. database connection drops or custom system exceptions), we configure a global `GqlExceptionFilter`:
```typescript
@Catch()
export class GqlExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    
    // Map standard HTTP exceptions directly to GraphQL-friendly formats
    if (exception instanceof HttpException) {
      return exception;
    }
    
    // Convert unhandled database exceptions to standard 500 Internal Server errors
    return new InternalServerErrorException('An unexpected database error occurred');
  }
}
```

---

## 3. Standard Exception Mappings

The backend maps common application exceptions to standardized error formats:

| Throwing Context | Exception Type | Generated Code | Associated HTTP Status |
| :--- | :--- | :--- | :--- |
| **Validation Pipe** | `BadRequestException` | `BAD_REQUEST` | `400` |
| **Auth Guard** | `UnauthorizedException` | `UNAUTHORIZED` | `401` |
| **Ownership Verification** | `ForbiddenException` | `FORBIDDEN` | `403` |
| **Repository Queries** | `NotFoundException` | `NOT_FOUND` | `404` |
| **Unhandled Exceptions** | `InternalServerErrorException` | `INTERNAL_SERVER_ERROR` | `500` |
