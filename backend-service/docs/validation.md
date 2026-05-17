# Global Validation Pipeline & DTO Architecture

This document describes the validation architecture of our GraphQL service, detailing global pipes, input serialization, and decorator-driven validation rules.

---

## 1. Global Validation Pipe Configuration

To ensure consistent validation rules across all endpoints, the application configures a global validation pipe (`ValidationPipe`) during bootstrap inside `main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    // Automatically strip non-decorated properties from incoming payloads
    whitelist: true,
    // Convert plain JSON inputs directly into typed DTO class instances
    transform: true,
    // Throw an error if a client passes an undocumented parameter
    forbidNonWhitelisted: true,
    // Format error arrays into user-friendly validation reports
    exceptionFactory: (errors) => new BadRequestException(errors),
  }),
);
```

### Execution Flow
1. **Request Interception**: The global `ValidationPipe` intercepts incoming GraphQL parameters.
2. **DTO Deserialization**: The pipe converts plain JSON request payloads into typed Data Transfer Object (DTO) class instances.
3. **Constraint Validation**: The pipe parses validation decorators (e.g. `@IsEmail`, `@Length`) defined on the DTO class.
4. **Exception Handling**:
   * **If valid**: Passes the validated DTO directly to the resolver.
   * **If invalid**: Halts execution immediately, throwing a `BadRequestException` containing a structured validation error report.

---

## 2. Decorator-Driven DTO Specifications

All input arguments are defined as classes decorated with both `@InputType` and `class-validator` attributes:

```
[ Incoming API Request Payload ]
               |
               v
+------------------------------+
|    Global ValidationPipe     | 
+------------------------------+
               |
        Validates DTO:
        @IsString()
        @Length(5, 100)
               |
       +-------+-------+
       |               |
     Pass            Fail
       |               |
       v               v
  [ Resolver ]    [ 400 Bad Request ]
```

* **String Constraints**: Enforces string types, limits field lengths (e.g., titles must be between `5` and `100` characters), and trims unnecessary whitespace.
* **Email Formats**: Normalizes email strings, converting values to lowercase and validating formats using `@IsEmail()`.
* **Numeric Boundaries**: Restricts numeric parameters (e.g., limiting pagination records between `1` and `100` using `@Min()` and `@Max()`).

---

## 3. Creating Custom Validation Rules

For complex validation rules that standard decorators do not support (e.g., verifying that a password contains mixed-case characters), we implement custom validation decorators:

```typescript
@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(text: string) {
    return typeof text === 'string' && 
           /[A-Z]/.test(text) && 
           /[a-z]/.test(text) && 
           /[0-9]/.test(text);
  }

  defaultMessage() {
    return 'Password must contain uppercase letters, lowercase letters, and numbers.';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}
```

Using these custom validators ensures consistent, reusable validation rules across our codebase.
