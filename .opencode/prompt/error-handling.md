# Error Handling System

This document describes the Visual Backend framework's error handling system, which provides structured, type-safe error management with internationalization, logging, and rollback capabilities.

## Overview

The error handling system is built around several key concepts:

- **Error Codes**: Unique identifiers using dot notation
- **Error Entries**: Structured error objects with rich metadata
- **Return Types**: `TErrTuple` and `TErrTriple` for effectful functions
- **Internationalization**: Multi-language support for external messages
- **Rollback Support**: Automatic rollback for failed operations

## Error Codes

Error codes are unique identifiers that use dot notation to indicate the module and function that caused the error.

### Format
```
<LAYER>.<MODULE>.<FUNCTION>.<ERROR_TYPE>
```

### Layers
- `TX` - Transactional functions (write operations)
- `FX` - Effectful functions (read operations)  
- `FN` - Pure functions
- `CTRL` - Controller functions
- `API` - API handlers

### Examples
```typescript
// From global.d.ts
TX_BOOKS_INSERT_INVALID_TITLE = "TX.BOOKS.INSERT.INVALID_TITLE"
TX_BOOKS_INSERT_AUTHOR_NOT_FOUND = "TX.BOOKS.INSERT.AUTHOR_NOT_FOUND"
```

**Important**: Every error code must be added to the `ErrCode` enum in `src/global.d.ts` to be used throughout the application.

## Error Entry Structure

The `TErrorEntry` type provides a comprehensive error object:

```typescript
// in global scope
type TErrorEntry = {
  code: ErrCode;                    // Unique error code from enum
  statusCode: TErrorStatus;         // HTTP status code (400-511)
  handlebarsParams?: Record<string, string>;  // Template parameters
  externalMessage?: Partial<Record<TLang, THandleBarsTemplate>> & { "en": THandleBarsTemplate };
  internalMessage?: THandleBarsTemplate;      // Developer-facing message
  shouldLogInternally?: boolean;              // Log internally flag
  internalMetadata?: Record<string, string>;  // Additional context
  internalLogLevel?: "error" | "warn" | "info" | "debug";
  needsInspection?: boolean;                  // Requires developer attention
}
```

### Message Templates

Both `externalMessage` and `internalMessage` support Handlebars template syntax:

```typescript
{
  code: ErrCode.TX_BOOKS_INSERT_INVALID_TITLE,
  externalMessage: {
    en: "Book title '{{title}}' is invalid. Must be between {{min}} and {{max}} characters.",
    de: "Buchtitel '{{title}}' ist ungültig. Muss zwischen {{min}} und {{max}} Zeichen lang sein."
  },
  handlebarsParams: {
    title: "My Book",
    min: "1",
    max: "255"
  }
}
```

## Return Types

### TErrTuple<T>
Used for effectful functions (`fx.` prefix) that perform read operations:

```typescript
import type { ErrCode } from "@/src/error/err.enum.ts"

type TErrTuple<T> = [T, null] | [null, TErrorEntry];

// Usage
function fxGetUser(id: string): TErrTuple<User> {
  if (!user) {
    return [null, {
      code: ErrCode.FX_USER_GET_NOT_FOUND,
      statusCode: 404,
      externalMessage: { en: "User not found" },
      internalMessage: `User with id ${id} not found in database`
    }];
  }
  return [user, null];
}
```

### TErrTriple<T>
Used for transactional functions (`tx.` prefix) that perform write operations:

```typescript
type TErrTriple<T> = [T, null, TExternalRollback[]] | [null, TErrorEntry, TExternalRollback[]];

// Usage
function txInsertBook(book: BookData): TErrTriple<Book> {
  const rollbackFunctions: TExternalRollback[] = [];
  
  try {
    // External service call
    const coverImage = await uploadCoverImage(book.cover);
    rollbackFunctions.push(() => deleteCoverImage(coverImage.id));
    
    // Database insert
    const insertedBook = await db.insert(books).values(book);
    
    return [insertedBook, null, rollbackFunctions];
  } catch (error) {
    return [null, {
      code: ErrCode.TX_BOOKS_INSERT_UNEXPECTED_ERROR,
      statusCode: 500,
      externalMessage: { en: "Failed to insert book" },
      internalMessage: `Database error: ${error.message}`,
      shouldLogInternally: true
    }, rollbackFunctions];
  }
}
```

## Rollback Functions

Rollback functions are used to undo external actions when a transaction fails:

```typescript
type TExternalRollback = () => Promise<TErrTriple<string>>;

// Example rollback function
const deleteUploadedFile = (fileId: string): TExternalRollback => 
  async () => {
    try {
      await fileService.delete(fileId);
      return [`Deleted file ${fileId}`, null, []];
    } catch (error) {
      return [null, {
        code: ErrCode.TX_BOOKS_INSERT_ROLLBACK_FAILED,
        statusCode: 500,
        externalMessage: { en: "Cleanup failed" },
        internalMessage: `Failed to delete file ${fileId}: ${error.message}`,
        shouldLogInternally: true,
        needsInspection: true
      }, []];
    }
  };
```

## Error Handling Patterns

### 1. Function Return Pattern

```typescript
// Always return TErrTuple or TErrTriple
export default function fxGetBook(id: string): TErrTuple<Book> {
  // Implementation
  if (error) {
    return [null, errorEntry];
  }
  return [result, null];
}
```

### 2. Error Propagation Pattern

```typescript
function txCreateBookWithCover(bookData: BookData, coverFile: File): TErrTriple<Book> {
  const rollbacks: TExternalRollback[] = [];
  
  try {
    // Upload cover
    const [cover, uploadError] = await uploadCover(coverFile);
    if (uploadError) return [null, uploadError, rollbacks];
    rollbacks.push(() => deleteCover(cover.id));
    
    // Insert book
    const [book, insertError, insertRollbacks] = await txInsertBook({
      ...bookData,
      coverId: cover.id
    });
    if (insertError) return [null, insertError, [...rollbacks, ...insertRollbacks]];
    
    return [book, null, [...rollbacks, ...insertRollbacks]];
  } catch (error) {
    return [null, {
      code: ErrCode.TX_BOOKS_CREATE_UNEXPECTED_ERROR,
      statusCode: 500,
      externalMessage: { en: "Failed to create book" },
      internalMessage: `Unexpected error: ${error.message}`,
      shouldLogInternally: true
    }, rollbacks];
  }
}
```

### 3. Controller Error Mapping

Controllers should map internal errors to appropriate HTTP responses:

```typescript
export default function ctrlCreateBook(req: Request): TErrTuple<Book> {
  const [book, error] = await txCreateBook(req.body);
  
  if (error) {
    // Log if needed
    if (error.shouldLogInternally) {
      logger.log(error.internalLogLevel || "error", error.internalMessage, error.internalMetadata);
    }
    
    // Return mapped error for API layer
    return [null, error];
  }
  
  return [book, null];
}
```

## Best Practices

### 1. Error Code Creation
- Always add new error codes to `src/global.d.ts`
- Use descriptive names following the dot notation pattern
- Include module and function names for better traceability

### 2. Message Writing
- **External messages**: User-friendly, no implementation details
- **Internal messages**: Detailed, include context for debugging
- Always provide English message for external messages
- Use Handlebars parameters for dynamic content

### 3. Rollback Design
- Keep rollbacks simple and focused
- Return TErrTriple from rollback functions
- Execute rollbacks in reverse order
- Handle rollback failures appropriately

### 4. Logging Strategy
- Set `shouldLogInternally: true` for important errors
- Use appropriate log levels (error, warn, info, debug)
- Include relevant metadata in `internalMetadata`
- Use `needsInspection: true` for errors requiring developer attention

### 5. Status Code Selection
- 400: Bad Request (validation errors)
- 401: Unauthorized (authentication)
- 403: Forbidden (authorization)
- 404: Not Found (resource missing)
- 409: Conflict (duplicate resources)
- 500: Internal Server Error (unexpected failures)

## Example: Complete Error Handling Flow

```typescript
// 1. Define error codes in global.d.ts
enum ErrCode {
  TX_BOOKS_INSERT_INVALID_TITLE = "TX.BOOKS.INSERT.INVALID_TITLE",
  // ... other codes
}

// 2. Create transactional function with proper error handling
export default function txInsertBook(bookData: BookData): TErrTriple<Book> {
  const rollbacks: TExternalRollback[] = [];
  
  // Validate input
  if (!bookData.title || bookData.title.length < 1) {
    return [null, {
      code: ErrCode.TX_BOOKS_INSERT_INVALID_TITLE,
      statusCode: 400,
      externalMessage: { 
        en: "Book title is required and must not be empty" 
      },
      internalMessage: "Validation failed: title is empty or missing",
      shouldLogInternally: true,
      internalLogLevel: "warn"
    }, rollbacks];
  }
  
  // Implementation...
  return [insertedBook, null, rollbacks];
}

// 3. Controller handles the error
export default function ctrlCreateBook(req: Request): TErrTuple<Book> {
  const [book, error] = await txInsertBook(req.body);
  
  if (error) {
    // Error will be mapped to HTTP response by API layer
    return [null, error];
  }
  
  return [book, null];
}
```

This error handling system ensures consistent, type-safe error management across the entire Visual Backend framework.