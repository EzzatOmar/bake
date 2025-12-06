import { tool } from "@opencode-ai/plugin"

export const initReact = tool({
  description: "Initialize React frontend with complete structure including components, pages, and server configuration",
  args: {
    force: tool.schema.boolean().optional().describe("Force overwrite existing frontend files"),
    skipDeps: tool.schema.boolean().optional().describe("Skip React dependency installation"),
  },
  async execute(args) {
    // Build command arguments
    const commandArgs: string[] = []
    if (args.force) commandArgs.push('--force')
    if (args.skipDeps) commandArgs.push('--skip-deps')
    
    const result = await Bun.$`bun run .opencode/scripts/init-frontend.ts ${commandArgs.join(' ')}`.quiet().throws(false)
    if (result.exitCode !== 0) {
      return `Error: ${result.stderr.toString()}`
    }
    return `React frontend initialized.\n<log>${result.stdout.toString()}</log>`
  },
})

export const createPage = tool({
  description: "Create a new React page with HTML and TSX template files. AI agents will handle server configuration and navigation updates",
  args: {
    name: tool.schema.string().describe("The name of the page to create. Use kebab-case or snake_case (e.g., 'about', 'user-profile', 'settings_page')"),
    force: tool.schema.boolean().optional().describe("Force overwrite existing page files"),
  },
  async execute(args) {
    // Validate page name
    if (!/^[a-zA-Z0-9-_]+$/.test(args.name)) {
      return `Error: Page name must be URL-safe and contain only letters, numbers, hyphens, and underscores. Got: "${args.name}"`
    }
    
    // Build command arguments
    const commandArgs: string[] = [args.name]
    if (args.force) commandArgs.push('--force')
    
    const result = await Bun.$`bun run .opencode/scripts/add-page.ts ${commandArgs.join(' ')}`.quiet().throws(false)
    if (result.exitCode !== 0) {
      return `Error: ${result.stderr.toString()}`
    }
    return `React page "${args.name}" created.\n<log>${result.stdout.toString()}</log>`
  },
})