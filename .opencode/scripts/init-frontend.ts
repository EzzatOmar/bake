#!/usr/bin/env bun

/**
 * Visual Backend Frontend Initialization Script
 *
 * Usage: bun run init-frontend [--force] [--skip-deps]
 */

import { join } from 'path';
import {
  isFrontendInstalled,
  installFrontendDeps,
  createCssModulesTypes,
  createGlobalCss,
  createDevTsx,
  createButtonComponent,
  createPageHtml,
  createPageTsx,
  createPageCssModule,
  updateTsConfigForCssModules,
} from '../helper-fns/frontend-helpers';

interface Options {
  force?: boolean;
  skipDeps?: boolean;
}

async function initFrontend(options: Options = {}) {
  const projectRoot = process.cwd();
  const srcDir = join(projectRoot, 'src');
  const componentsDir = join(srcDir, 'component');
  const pagesDir = join(srcDir, 'page');

  // 1. Check if already installed
  if (isFrontendInstalled(srcDir) && !options.force) {
    console.log('Frontend already initialized. Use --force to reinstall.');
    return;
  }

  // 2. Install packages
  if (!options.skipDeps) {
    console.log('Installing dependencies...');
    await installFrontendDeps();
  }

  // 3. Add css-modules.d.ts, global.css, dev.tsx
  console.log('Creating frontend files...');
  createCssModulesTypes(srcDir);
  createGlobalCss(srcDir);
  createDevTsx(srcDir);

  // 4. Update tsconfig
  updateTsConfigForCssModules(projectRoot);

  // 5. Add page (index)
  //    a) creates css module for page
  //    b) creates if not exists, example comp.button.tsx
  //    c) creates example page using that button
  console.log('Creating index page...');
  createButtonComponent(componentsDir, options.force);
  createPageCssModule(pagesDir, 'index', options.force);
  createPageHtml(pagesDir, 'index', options.force);
  createPageTsx(pagesDir, 'index', options.force);

  console.log('Done! Run: bun run dev');
}

// CLI
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: bun run init-frontend [options]

Options:
  --force       Force overwrite existing files
  --skip-deps   Skip dependency installation
  --help, -h    Show this help
`);
    process.exit(0);
  }

  initFrontend({
    force: args.includes('--force'),
    skipDeps: args.includes('--skip-deps'),
  }).catch(console.error);
}

export { initFrontend };
