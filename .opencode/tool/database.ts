import { tool } from "@opencode-ai/plugin"
import { Database } from "bun:sqlite"
import { exists } from "node:fs/promises"
import { resolve, join } from "node:path"

export const createDatabase = tool({
  description: "Create a new database",
  args: {
    name: tool.schema.string().describe("The name of the database. Must be URL-safe and a single word"),
  },
  async execute(args) {
    const result = await Bun.$`bun run .opencode/scripts/create-database.ts ${args.name}`.quiet().throws(false)
    if (result.exitCode !== 0) {
      return `Error: ${result.stderr.toString()}`
    }
    return `Database ${args.name} created.\n<log>${result.stdout.toString()}</log>`

  },
})

export const deleteDatabase = tool({
  description: "Delete a database with all related files",
  args: {
    name: tool.schema.string().describe("The name of the database to delete. Must be URL-safe and a single word"),
  },
  async execute(args) {
    const result = await Bun.$`bun run .opencode/scripts/delete-database.ts ${args.name} --force`.quiet().throws(false)
    if (result.exitCode !== 0) {
      return `Error: ${result.stderr.toString()}`
    }
    return `Database ${args.name} deleted.\n<log>${result.stdout.toString()}</log>`

  },
})

export const executeSql = tool({
  description: "Execute SQL queries on a specific database",
  args: {
    databaseName: tool.schema.string().describe("The name of the database (e.g., 'books' for books.sqlite)"),
    sql: tool.schema.string().describe("The SQL query to execute. Can use parameter binding with :, @, or $ prefixes"),
    params: tool.schema.object({}).optional().describe("Optional parameters for parameter binding. Use object with keys matching parameter names (without prefixes when using strict mode)"),
  },
  async execute(args) {
    try {
      // Validate database name
      const urlSafePattern = /^[a-zA-Z0-9_-]+$/
      if (!urlSafePattern.test(args.databaseName)) {
        return `Error: Database name must be URL-safe and a single word. Got: "${args.databaseName}"`
      }

      // Construct database path
      const projectRoot = resolve(process.cwd(), '.')
      const databaseDir = join(projectRoot, 'database-storage')
      const dbFilePath = join(databaseDir, `${args.databaseName}.sqlite`)

      // Check if database exists
      if (!await exists(dbFilePath)) {
        return `Error: Database "${args.databaseName}" not found. Expected path: ${dbFilePath}`
      }

      // Open database connection
      const db = new Database(dbFilePath, { readonly: false, strict: true, create: false })
      db.run(`PRAGMA foreign_keys = ON`)
      db.run(`PRAGMA journal_mode = WAL`)
      db.run(`PRAGMA busy_timeout = 5000`)
      db.run(`PRAGMA synchronous = NORMAL`)
      db.run(`PRAGMA cache_size = 10000`)
      db.run(`PRAGMA temp_store = MEMORY`)
      db.run(`PRAGMA mmap_size = 268435456`)

      try {
        // Prepare and execute query
        const query = db.query(args.sql)

        let result: any
        if (args.params && Object.keys(args.params).length > 0) {
          // Execute with parameters
          result = query.all(args.params as any)
        } else {
          // Execute without parameters
          result = query.all()
        }

        // Format result for display
        if (Array.isArray(result) && result.length === 0) {
          return `Query executed successfully. No rows returned.`
        } else if (Array.isArray(result)) {
          return `Query executed successfully. Returned ${result.length} row(s):\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``
        } else {
          return `Query executed successfully. Result:\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``
        }
      } finally {
        // Always close the database connection
        db.close()
      }
    } catch (error) {
      return `Error executing SQL: ${error.message}`
    }
  },
})

export const listDatabase = tool({
  description: "List all available databases in the database-storage directory",
  args: {},
  async execute() {
    try {
      const projectRoot = resolve(import.meta.dir, '../..')
      const databaseDir = join(projectRoot, 'database-storage')

      // Check if database-storage directory exists
      if (!await exists(databaseDir)) {
        return "No databases found. database-storage directory does not exist."
      }

      // List directory contents using Bun shell
      const result = await Bun.$`ls -1 ${databaseDir}`.quiet().throws(false).text()

      if (result.trim() === '') {
        return "No databases found in database-storage directory."
      }

      const sqliteFiles = result
        .split('\n')
        .filter(line => line.trim().endsWith('.sqlite'))
        .map(line => line.trim().replace('.sqlite', ''))

      if (sqliteFiles.length === 0) {
        return "No SQLite databases found in database-storage directory."
      }

      return `Available databases:\n${sqliteFiles.map(db => `  - ${db}`).join('\n')}`
    } catch (error) {
      return `Error listing databases: ${error.message}`
    }
  },
})

export const installBetterAuth = tool({
  description: "Install Better Auth authentication system for a specific database",
  args: {
    name: tool.schema.string().describe("The name of the database to install Better Auth on. Must match an existing database name"),
  },
  async execute(args) {
    const result = await Bun.$`bun run .opencode/scripts/install-better-auth.ts ${args.name}`.quiet().throws(false)
    if (result.exitCode !== 0) {
      return `Error: ${result.stderr.toString()}`
    }
    return `Better Auth installed for database ${args.name}.\n<log>${result.stdout.toString()}</log>`
  },
})