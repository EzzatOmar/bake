#!/usr/bin/env bun

/**
 * Visual Backend Frontend Removal Script
 *
 * Usage: bun run drop-frontend [--keep-deps] [--dry-run]
 */

import { join } from 'path';
import {
  isFrontendInstalled,
  removeFrontendDeps,
  removeFile,
  removeDir,
  revertTsConfigCssModules,
} from '../helper-fns/frontend-helpers';

interface Options {
  keepDeps?: boolean;
  dryRun?: boolean;
}

async function dropFrontend(options: Options = {}) {
  const projectRoot = process.cwd();
  const srcDir = join(projectRoot, 'src');
  const componentsDir = join(srcDir, 'component');
  const pagesDir = join(srcDir, 'page');

  if (!isFrontendInstalled(srcDir)) {
    console.log('Frontend not installed.');
    return;
  }

  if (options.dryRun) {
    console.log('[DRY RUN] Would remove:');
    console.log('  - src/component/');
    console.log('  - src/page/');
    console.log('  - src/global.css');
    console.log('  - src/css-modules.d.ts');
    console.log('  - src/dev.tsx');
    if (!options.keepDeps) {
      console.log('  - Frontend dependencies');
    }
    return;
  }

  console.log('Removing frontend...');

  // Remove directories
  removeDir(componentsDir);
  removeDir(pagesDir);

  // Remove files
  removeFile(join(srcDir, 'global.css'));
  removeFile(join(srcDir, 'css-modules.d.ts'));
  removeFile(join(srcDir, 'dev.tsx'));

  // Revert tsconfig
  revertTsConfigCssModules(projectRoot);

  // Remove dependencies
  if (!options.keepDeps) {
    console.log('Removing dependencies...');
    await removeFrontendDeps();
  }

  console.log('Done!');
}

// CLI
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: bun run drop-frontend [options]

Options:
  --keep-deps   Keep frontend dependencies installed
  --dry-run     Show what would be removed without removing
  --help, -h    Show this help
`);
    process.exit(0);
  }

  dropFrontend({
    keepDeps: args.includes('--keep-deps'),
    dryRun: args.includes('--dry-run'),
  }).catch(console.error);
}

export { dropFrontend };
