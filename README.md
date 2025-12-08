# BAKE - BUN Agent Kit Engine

**Opencode framework for bunjs with enforced architectural patterns**

BAKE generates production-ready fullstack TypeScript applications following the Functional Core, Imperative Shell pattern. It creates APIs, CLIs, and React frontends with strict layering that ensures testability and maintainability from day one.

## Quick Start

```bash
bun run install
bun run dev:human

// after init database
bunx drizzle-kit studio --config=drizzle.meetup.ts
```

## Architecture in 5 Layers

```
index.tsx  →  API/CLI/PAGES  →  CTRL  →  FUNC  →  DB/SERVICE
  entry         I/O shell      orchestration  logic   persistence
```

**The Rules:**
- Layers only call downward, never up
- Core (CTRL + FUNC) stays pure, no I/O
- Shell (API/CLI/DB) handles side effects
- Plan top-down, implement bottom-up


That's it. BAKE handles the rest.

## What You Get

- 🤖 **AI-Driven** - Generates complete features, not just files
- 🏗️ **Structured** - Every file follows strict layering rules
- 🧪 **Testable** - Pure business logic, zero mocks needed
- 🔄 **Multi-Interface** - Same logic for HTTP, CLI, and React
- ⚡ **BUN-Native** - Built for speed

## Generated Structure

```
src/
├── index.tsx       # Entry point
├── api/            # HTTP endpoints
├── cli/            # Commands
├── pages/          # React pages
├── controller/     # Orchestration (pure)
├── function/       # Business logic (pure)
└── database/       # Persistence
```

## 🛠️ Agent Tools

Agent tools are specialized functions that AI agents can use to perform specific tasks in your BAKE project. These tools are automatically available to AI agents when working on your project.

### Database Tools (`database.ts`)

#### **createDatabase**
Creates a new database with proper folder structure and configuration files.

**Usage by AI agent:**
```typescript
await createDatabase({ name: "books" })
```

**What it does:**
- Creates `src/database/<dbname>/` folder
- Generates `conn.<dbname>.ts` (database connection)
- Generates `schema.custom.<dbname>.ts` (custom schemas)
- Sets up Drizzle configuration
- Creates database storage directory

**Parameters:**
- `name` (string): Database name, must be URL-safe and single word

---

#### **deleteDatabase**
Deletes a database and all related files completely.

**Usage by AI agent:**
```typescript
await deleteDatabase({ name: "books" })
```

**What it does:**
- Removes database folder from `src/database/<dbname>/`
- Deletes database file from `database-storage/`
- Cleans up all related configuration files

**Parameters:**
- `name` (string): Database name to delete

---

#### **executeSql**
Executes SQL queries on a specific database with parameter binding support.

**Usage by AI agent:**
```typescript
await executeSql({ 
  databaseName: "books", 
  sql: "SELECT * FROM books WHERE author = :author", 
  params: { author: "John Doe" } 
})
```

**What it does:**
- Opens database connection with optimized settings
- Executes SQL queries safely with parameter binding
- Returns formatted results
- Automatically handles connection cleanup

**Parameters:**
- `databaseName` (string): Target database name
- `sql` (string): SQL query to execute
- `params` (object, optional): Parameter binding values

**Features:**
- Supports `:`, `@`, and `$` parameter prefixes
- Optimized SQLite configuration (WAL mode, foreign keys, etc.)
- Automatic connection management
- Error handling and reporting

---

#### **listDatabase**
Lists all available databases in the project.

**Usage by AI agent:**
```typescript
await listDatabase()
```

**What it does:**
- Scans `database-storage/` directory
- Lists all SQLite databases
- Returns formatted list of available databases

**Returns:** Formatted list of database names

---

#### **installBetterAuth**
Installs Better Auth authentication system for a specific database.

**Usage by AI agent:**
```typescript
await installBetterAuth({ name: "users" })
```

**What it does:**
- Sets up Better Auth tables and schemas
- Configures authentication for the specified database
- Generates necessary auth-related files

**Parameters:**
- `name` (string): Database name to install auth on

---

### React Tools (`react.ts`)

#### **initReact**
Initializes a complete React frontend structure with components, pages, and server configuration.

**Usage by AI agent:**
```typescript
await initReact({ force: false, skipDeps: false })
```

**What it does:**
- Creates `src/pages/` folder with HTML/TSX pairs
- Creates `src/component/` folder structure
- Sets up React build configuration
- Configures server-side routing
- Installs React dependencies (unless skipped)

**Parameters:**
- `force` (boolean, optional): Force overwrite existing files
- `skipDeps` (boolean, optional): Skip React dependency installation

---

#### **createPage**
Creates a new React page with HTML entry point and TSX component.

**Usage by AI agent:**
```typescript
await createPage({ name: "user-profile", force: false })
```

**What it does:**
- Creates `<page>.html` entry point
- Creates `<page>.tsx` React component
- Updates server routing configuration
- Adds page to navigation structure

**Parameters:**
- `name` (string): Page name (kebab-case or snake_case)
- `force` (boolean, optional): Force overwrite existing files

**Features:**
- Automatic server configuration updates
- Navigation integration
- TypeScript support included

---

## 📋 Available Commands

Commands are custom slash commands that you can use in the OpenCode TUI to trigger specific actions. Type `/` followed by the command name.

### **code-graph**
Analyzes and displays the API usage graph showing the relationship between endpoints, controllers, and functions.

**Usage:**
```
/code-graph
```

**What it does:**
- Scans `src/index.tsx` for API endpoint references
- Shows HTTP methods implemented for each endpoint
- Maps controllers to business logic
- Displays the complete call hierarchy

**Output:** Visual graph of your application's API structure

---

### **list-error-codes**
Lists all available error codes defined in the error handling system.

**Usage:**
```
/list-error-codes
```

**What it does:**
- Shows all error codes from `src/global.d.ts`
- Displays status codes and messages
- Shows error code hierarchy and patterns

**Output:** Comprehensive list of error codes with descriptions

---

## 🚀 Package Scripts

The following scripts are exposed in `package.json` for easy command-line access:

### Database Management
```bash
bun run db:create <name>     # Create new database
bun run db:delete <name>     # Delete database
bun run db:list              # List all databases
bun run db:install-auth <name> # Install Better Auth
```

### Code Generation
```bash
bun run add:api <name>       # Add new API endpoint
bun run add:ctrl <name>      # Add new controller
bun run add:fn <name>        # Add new pure function
bun run add:fx <name>        # Add new effectful function
bun run add:tx <name>        # Add new transaction function
```

### Frontend Management
```bash
bun run frontend:init        # Initialize React frontend
bun run frontend:drop        # Remove React frontend
bun run page:add <name>      # Add new React page
```

### Development Tools
```bash
bun run code:graph           # Show API usage graph
bun run errors:list          # List all error codes
```

---

## 🎯 Drizzle Studio Integration

After creating a database, you can start Drizzle Studio for visual database management:

```bash
# Replace <dbname> with your database name
bunx drizzle-kit studio --config=drizzle.<dbname>.ts
```

**Features:**
- Web-based database interface
- Visual record editing and creation
- Schema visualization
- SQL query execution
- Real-time database inspection

---

## 🏗️ Development Workflow Example

```bash
# 1. Create a database
bun run db:create books

# 2. Start Drizzle Studio to manage data
bunx drizzle-kit studio --config=drizzle.books.ts

# 3. Generate API layer
bun run add:api books

# 4. Generate controller
bun run add:ctrl books

# 5. Generate business logic
bun run add:tx books

# 6. Initialize frontend
bun run frontend:init

# 7. Add frontend page
bun run page:add books

# 8. Analyze your application structure
bun run code:graph
```

---

## 🤖 AI Agent Integration

These tools are designed to be used by AI agents automatically. When you ask an AI agent to:

- "Create a database for user management" → Uses `createDatabase` tool
- "Add a React page for user profiles" → Uses `createPage` tool  
- "Show me the API structure" → Triggers `/code-graph` command
- "Install authentication on the users database" → Uses `installBetterAuth` tool

The AI agents will automatically select the appropriate tool and parameters based on your request, ensuring that all generated code follows the BAKE framework conventions.

---

## 📚 Additional Resources

- [BAKE Architecture Guide](./architecture.md)
- [Error Handling System](./error-handling.md)
- [Bun Routing Documentation](./llm.bun.routing.md)
- [Testing with Bun](./how-to-write-tests.md)
