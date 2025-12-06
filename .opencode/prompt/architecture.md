# Visual Backend Architecture

## ⚠️ CRITICAL: Plan Top-Down, Implement Bottom-Up

This is the most important principle. **Never violate it.**

### The Layers (Top to Bottom)
```
┌─────────────────────────┐
│     index.tsx           │  ← MAIN ENTRY POINT (routing hub)
├─────────────────────────┤
│   API / CLI / PAGES     │  ← IMPERATIVE SHELL (I/O, side effects)
├─────────────────────────┤
│        CTRL             │  ← FUNCTIONAL CORE (pure orchestration)
├─────────────────────────┤
│        FUNC             │  ← FUNCTIONAL CORE (pure business logic)
├─────────────────────────┤
│    DB / SERVICE         │  ← IMPERATIVE SHELL (I/O, side effects)
└─────────────────────────┘
```

### Functional Core, Imperative Shell

Based on the [Functional Core, Imperative Shell pattern](https://kennethlange.com/functional-core-imperative-shell/):

**IMPERATIVE SHELL** (handles messy I/O, side effects):
- **API**: Receives HTTP requests, parses, returns responses
- **CLI**: Receives command-line input, parses, returns output
- **PAGES**: Client-side React entry points, handles browser I/O
- **DB/SERVICE**: Reads/writes data, calls external APIs, handles persistence

**FUNCTIONAL CORE** (pure, testable, no side effects):
- **CTRL**: Orchestrates flow, validates, decides what to do
- **FUNC**: Pure business logic, transformations, calculations

**ENTRY POINT**:
- **index.tsx**: Main routing hub that directs to API/CLI/PAGES

**Strict Calling Rules**:
```
api → ctrl, func, db, service
cli → ctrl, func, db, service
ctrl → func, db, service
func → db, service
db → func
service → func
pages → func, comp
comp → func
```

**The Rule**: Only call layers below you in the hierarchy. Never call up.

**Why this matters:**
- Core is easy to test (no mocks needed for I/O)
- Core is portable (swap API for CLI, swap DB for different service)
- Shell is thin (just glue code, minimal logic)

### What This Means for Planning & Implementation

**PLAN TOP-DOWN:**
1. Start at index.tsx - what are the application's entry points?
2. What API/CLI/PAGES interfaces are needed?
3. What controller logic orchestrates this?
4. What functions do the actual work?
5. What data/services are needed?

**IMPLEMENT BOTTOM-UP:**
1. First: DB schemas, service connections (shell)
2. Then: Functions that use that data (core)
3. Then: Controllers that orchestrate functions (core)
4. Then: API/CLI/PAGES that expose controllers (shell)
5. Last: index.tsx routing configuration

**Why?** Each layer depends on layer below. Build foundation first. No layer should wait for dependency that doesn't exist yet.

## Folder Structure

```
src/
├── index.tsx      # Server-side application entry point
├── pages/         # Client-side React pages
│   ├── index.html     # HTML entry point for main page
│   ├── index.tsx      # React root component for main page
│   ├── <page>.html    # HTML entry point for additional pages
│   ├── <page>.tsx     # React root component for additional pages
│   └── ...            # Other client-side pages
├── component/     # Reusable React Components
│   ├── comp.*.tsx     # Reusable UI components (prefix is required)
│   └── ...            # Other React components
├── cli/           # CLI Command Entry Points
│   ├── cli.<command>.ts   # CLI command implementations
│   └── ...            # Other CLI commands
├── api/           # API/CLI Layer - IMPERATIVE SHELL
│   ├── api.*.ts   # API endpoints, route definitions
│   └── ...        # Request/response handling, middleware
├── controller/    # CTRL Layer - FUNCTIONAL CORE
│   ├── ctrl.*.ts  # Controllers, request orchestration
│   └── ...        # Response formatting, error handling
├── function/      # FUNC Layer - FUNCTIONAL CORE
│   ├── <module>/  # Submodule folders for organization
│   │   ├── fn.*.ts    # Pure business logic
│   │   ├── fx.*.ts    # Data processing functions
│   │   ├── tx.*.ts    # Transaction functions
│   │   └── ...        # Module-specific utilities
│   └── ...        # Other function modules
├── database/      # DB/SERVICE Layer - IMPERATIVE SHELL
│   ├── <dbname>/  # Database-specific folders
│   │   ├── conn.<dbname>.ts     # Database connection
│   │   └── schema.custom.<dbname>.ts  # Custom schemas
│   └── ...        # Other databases
├── error/         # Error Handling Layer
│   ├── err.enum.ts     # Error code enumerations
│   ├── err.mapper.ts   # Error code to message mapping
│   └── err.response.ts # HTTP response formatting for errors
└── global.d.ts    # Global type definitions
```

## Layer Responsibilities

### 1. API Layer (`src/api/`) — IMPERATIVE SHELL
**Purpose**: Thin HTTP interface to the outside world
**Responsibilities**:
- Parse incoming HTTP requests
- Validate input format
- Call appropriate controllers
- Format HTTP responses
- Handle HTTP-specific concerns

**Examples**: REST endpoints, GraphQL resolvers, authentication middleware, request validation
**Nature**: Side effects, I/O - thin glue to expose core

### 2. CTRL Layer (`src/controller/`) — FUNCTIONAL CORE
**Purpose**: Orchestrate business logic
**Responsibilities**:
- Coordinate function calls
- Validate business rules
- Handle error scenarios
- Make decisions based on function results
- Format data for API layer

**Examples**: Request handlers, orchestration logic, response formatting, error handling
**Nature**: Pure orchestration - calls functions, returns decisions

### 3. FUNC Layer (`src/function/`) — FUNCTIONAL CORE
**Purpose**: Pure business logic and data processing
**Responsibilities**:
- Business calculations
- Data transformations
- Validation logic
- Utility functions
- Pure algorithms

**File Types**:
- `fn.*.ts` - Standard functions
- `fx.*.ts` - Functions that return `TErrTuple`
- `tx.*.ts` - Transaction functions that return `TErrTriple`

**Organization**:
- Functions are organized in submodule folders under `src/function/<module>/`
- Each module contains related functions for a specific domain or feature
- This allows better organization and separation of concerns

**Nature**: Pure functions, no I/O - easy to test

### 4. DB/SERVICE Layer (`src/database/`) — IMPERATIVE SHELL
**Purpose**: Data persistence and external service integration
**Responsibilities**:
- Database schemas and migrations
- Data access operations
- External API calls
- Service connections
- Data seeding

**Organization**:
- Each database has its own folder under `src/database/<dbname>/`
- `conn.<dbname>.ts` - Database connection and configuration
- `schema.custom.<dbname>.ts` - Custom database schemas and types
- This allows multiple databases and better separation of data concerns

**Examples**: User tables, relationship definitions, database setup, connection configuration
**Nature**: Side effects, I/O - keep logic minimal

### 5. Error Layer (`src/error/`) — SHARED INFRASTRUCTURE
**Purpose**: Centralized error handling and response formatting
**Responsibilities**:
- Define error code enumerations
- Map error codes to human-readable messages
- Format HTTP error responses
- Provide consistent error handling across all layers

**Files**:
- `err.enum.ts` - Error code enumerations and types
- `err.mapper.ts` - Functions to map error codes to messages
- `err.response.ts` - HTTP response formatting for errors

**Usage**: Used by all layers to ensure consistent error handling and response formatting

### 6. Pages Layer (`src/pages/`) — CLIENT-SIDE REACT
**Purpose**: Client-side React application entry points
**Responsibilities**:
- Define HTML entry points for client-side rendering
- Host React root components for each page
- Handle client-side routing and navigation
- Manage client-side state and UI interactions

**File Pattern**:
- Each page has its own `<page>.html` and `<page>.tsx` pair
- `<page>.html` - HTML entry point that loads the React bundle
- `<page>.tsx` - React root component that mounts to the HTML

**Architecture**: 
- Each HTML file is a separate entry point for client-side rendered React code
- Allows for multiple independent React applications within the same project
- Supports micro-frontend architecture where different pages can be developed and deployed independently

**Examples**:
- `index.html` + `index.tsx` - Main application page
- `admin.html` + `admin.tsx` - Admin dashboard page
- `dashboard.html` + `dashboard.tsx` - User dashboard page

### 7. Components Layer (`src/component/`) — REUSABLE UI
**Purpose**: Reusable React components for client-side interfaces
**Responsibilities**:
- Create reusable UI components
- Implement consistent design patterns
- Handle component state and interactions
- Provide building blocks for pages

**File Naming Convention**:
- **Prefix is required**: All component files must start with `comp.`
- `comp.button.tsx` - Button component
- `comp.input.tsx` - Input field component
- `comp.modal.tsx` - Modal dialog component
- `comp.card.tsx` - Card display component

**Why Prefix Matters**:
- **Clear Identification**: Immediately distinguishes components from other files
- **Namespace Prevention**: Avoids naming conflicts with other layers
- **Tooling Support**: Enables automated tooling and linting for components
- **Framework Consistency**: Follows the Visual Backend convention of prefixed files

**Usage**:
- Imported by pages (`src/pages/*.tsx`) and other components
- Should be stateless or have minimal, isolated state
- Focus on presentation and UI interactions
- Business logic should be handled in the function layer

### 8. CLI Layer (`src/cli/`) — COMMAND LINE INTERFACE
**Purpose**: Command-line tool entry points and implementations
**Responsibilities**:
- Define CLI command entry points
- Handle command-line argument parsing
- Execute command-specific logic
- Provide command-line interface to backend functionality

**File Naming Convention**:
- **Prefix is required**: All CLI files must start with `cli.`
- `cli.migrate.ts` - Database migration command
- `cli.seed.ts` - Database seeding command
- `cli.deploy.ts` - Deployment command
- `cli.user.ts` - User management command

**Architecture**:
- Each `cli.<command>.ts` file is an entry point for a specific CLI command
- Commands can call the same controllers and functions as API endpoints
- Follows the same layering principles: CLI → CTRL → FUNC → DB
- Enables programmatic access to backend functionality

**Examples**:
```bash
bun run cli.migrate.ts    # Run database migrations
bun run cli.seed.ts       # Seed database with initial data
bun run cli.deploy.ts     # Deploy application
bun run cli.user.ts       # User management operations
```

## Implementation Order

**Always implement in this order - no exceptions:**

1. **Database Layer** (`src/database/<dbname>/`)
   - Create database folder structure
   - Define `conn.<dbname>.ts` for connections
   - Define `schema.custom.<dbname>.ts` for schemas
   - Set up connections and seed data

2. **Function Layer** (`src/function/<module>/`)
   - Create module folders for organization
   - Implement business logic in appropriate modules
   - Create utility functions within modules
   - Build data processing helpers

3. **Controller Layer** (`src/controller/`)
   - Orchestrate function calls
   - Handle business validation
   - Format responses

4. **API Layer** (`src/api/`)
   - Define endpoints
   - Handle request/response
   - Add middleware

## Key Principles

- **Entry Point Routes**: index.tsx directs to API/CLI/PAGES based on context
- **Strict Calling Rules**: Only call layers below you, never up
- **Shell calls Core**: API/CLI/PAGES/DB can call CTRL/FUNC, but never the reverse
- **Core stays pure**: FUNC and CTRL have no I/O, no database calls, no HTTP logic
- **Shell stays thin**: Most logic belongs in FUNC/CTRL, not interface layers
- **Dependencies flow down**: Each layer only depends on layers below it
- **Testability**: Core layers are easy to unit test, Shell layers need integration tests
- **Component isolation**: Components can only call func, maintaining UI purity

## Data Flow

### Main Entry Point Flow
```
Application Start
    ↓
[index.tsx] - Route to appropriate interface
    ↓
├── → API Layer (HTTP requests)
├── → CLI Layer (Command-line)
└── → PAGES Layer (Browser)
```

### Server-Side API Flow
```
HTTP Request
    ↓
[API Layer] - Parse request, validate format
    ↓
[CTRL Layer] - Orchestrate, validate business rules
    ↓
[FUNC Layer] - Execute business logic, transform data
    ↓
[DB Layer] - Persist/retrieve data
    ↓
[FUNC Layer] - Process results
    ↓
[CTRL Layer] - Make decisions, format response
    ↓
[API Layer] - Format and send response
    ↓
HTTP Response
```

### CLI Flow
```
CLI Command
    ↓
[CLI Layer] - Parse arguments, validate command
    ↓
[CTRL Layer] - Orchestrate, validate business rules
    ↓
[FUNC Layer] - Execute business logic, transform data
    ↓
[DB Layer] - Persist/retrieve data
    ↓
[FUNC Layer] - Process results
    ↓
[CTRL Layer] - Make decisions, format output
    ↓
[CLI Layer] - Format and display result
    ↓
CLI Output
```

### Client-Side Flow
```
Browser Request → [HTML Entry Point] → [Page Component] → [Component Tree] → API Calls → Server Response → React Update
                      ↓                        ↓                    ↓                    ↓              ↓
                 src/pages/<page>.html   src/pages/<page>.tsx   src/component/comp.*.tsx   Server Layers   UI Re-render
```

### Layer Calling Rules (Strict)
```
api → ctrl, func, db, service
cli → ctrl, func, db, service
ctrl → func, db, service
func → db, service
db → func
service → func
pages → func, comp
comp → func
```

**Key Rules:**
- **Never call up**: Layers can only call layers below them
- **No cross-calls**: API cannot call CLI, CLI cannot call Pages, etc.
- **Func is universal**: All layers can call func for business logic
- **Components are isolated**: Components can only call func, not other layers

### Error Handling (src/error/):
├── Used by all server layers for consistent error codes
├── Maps errors to appropriate HTTP responses
├── Client-side React components consume error responses
└── Ensures unified error messaging across the application

This architecture ensures:
- **Testability**: Core logic is isolated and easily testable
- **Maintainability**: Clear separation of concerns
- **Scalability**: Layers can be optimized independently
- **Portability**: Core logic can be reused across different interfaces