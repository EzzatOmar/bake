import { Glob } from 'bun';
import { resolve, relative, basename } from 'path';

type HTMLBundle = ReturnType<typeof Bun.file>;

export interface HtmlRoutesOptions {
  /** Directory containing HTML files (default: './src/page') */
  dir?: string;
  /** Glob pattern for HTML files (default: all .html files) */
  pattern?: string;
}

/**
 * Scans a directory for HTML files and creates a routes map for Bun's serve.routes
 *
 * File naming convention:
 * - index.html -> /
 * - board.html -> /board
 * - settings/index.html -> /settings
 * - settings/profile.html -> /settings/profile
 *
 * @example
 * ```ts
 * import { htmlRoutes } from './lib/html-routes';
 *
 * const routes = await htmlRoutes({ dir: './src/page' });
 *
 * const app = new Elysia({
 *   serve: { routes }
 * })
 * ```
 */
export async function htmlRoutes(options: HtmlRoutesOptions = {}): Promise<Record<string, HTMLBundle>> {
  const {
    dir = './src/page',
    pattern = '**/*.html'
  } = options;

  const routes: Record<string, HTMLBundle> = {};
  const glob = new Glob(pattern);
  const absoluteDir = resolve(process.cwd(), dir);

  for await (const file of glob.scan({ cwd: absoluteDir, absolute: true })) {
    // Get relative path from the assets dir
    const relativePath = relative(absoluteDir, file);

    // Convert file path to route path
    let routePath = '/' + relativePath
      .replace(/\.html$/, '')  // Remove .html extension
      .replace(/\\/g, '/');    // Normalize path separators

    // Handle index files
    if (routePath.endsWith('/index')) {
      routePath = routePath.slice(0, -6) || '/';
    }
    if (basename(relativePath) === 'index.html' && routePath === '/index') {
      routePath = '/';
    }

    // Import the HTML file to get the HTMLBundle
    const htmlBundle = await import(file);
    routes[routePath] = htmlBundle.default;

    console.log(`[html-routes] ${relativePath} -> ${routePath}`);
  }

  return routes;
}
