#!/usr/bin/env bun

/**
 * Visual Backend Add Page Script
 *
 * Usage: bun run add-page <page-name> [--force]
 */

import { join } from 'path';
import {
  isFrontendInstalled,
  pageExists,
  createPageHtml,
  createPageTsx,
  createPageCssModule,
} from '../helper-fns/frontend-helpers';

interface Options {
  force?: boolean;
}

async function addPage(pageName: string, options: Options = {}) {
  if (!pageName) {
    console.error('Page name required. Usage: bun run add-page <page-name>');
    process.exit(1);
  }

  if (!/^[a-zA-Z0-9-_]+$/.test(pageName)) {
    console.error('Invalid page name. Use only letters, numbers, hyphens, underscores.');
    process.exit(1);
  }

  const projectRoot = process.cwd();
  const srcDir = join(projectRoot, 'src');
  const pagesDir = join(srcDir, 'page');

  // Check frontend is initialized
  if (!isFrontendInstalled(srcDir)) {
    console.error('Frontend not initialized. Run: bun run init-frontend');
    process.exit(1);
  }

  // Check if page exists
  if (pageExists(pagesDir, pageName) && !options.force) {
    console.log(`Page "${pageName}" already exists. Use --force to overwrite.`);
    return;
  }

  // Create page files
  console.log(`Creating page: ${pageName}`);
  createPageCssModule(pagesDir, pageName, options.force);
  createPageHtml(pagesDir, pageName, options.force);
  createPageTsx(pagesDir, pageName, options.force);

  console.log(`Done! Visit: http://localhost:3000/${pageName}`);
}

// CLI
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
Usage: bun run add-page <page-name> [options]

Options:
  --force       Force overwrite existing page
  --help, -h    Show this help

Examples:
  bun run add-page about
  bun run add-page user-profile --force
`);
    process.exit(0);
  }

  const pageName = args.find(a => !a.startsWith('--'));
  addPage(pageName || '', {
    force: args.includes('--force'),
  }).catch(console.error);
}

export { addPage };
