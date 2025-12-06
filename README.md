# BAKE - BUN Agent Kit Engine

**Opencode framework for bunjs with enforced architectural patterns**

BAKE generates production-ready fullstack TypeScript applications following the Functional Core, Imperative Shell pattern. It creates APIs, CLIs, and React frontends with strict layering that ensures testability and maintainability from day one.

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

## Quick Start

```bash
bun run dev
```

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
