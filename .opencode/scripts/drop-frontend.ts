#!/usr/bin/env bun

/**
 * Visual Backend Frontend Removal Script
 * 
 * This script removes all frontend-related files and folders created by init-frontend.ts
 * and reverses the server configuration back to a pure backend setup.
 * 
 * Features:
 * - Removes all frontend directories and files
 * - Renames src/index.tsx back to src/index.ts
 * - Reverts tsconfig.json changes
 * - Removes frontend dependencies from package.json
 * - Cleans up package.json scripts
 * 
 * Usage: bun run drop-frontend [options]
 */

import { existsSync, unlinkSync, rmSync, renameSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface DropFrontendOptions {
  keepDeps?: boolean;
  dryRun?: boolean;
}

const DEFAULT_OPTIONS: DropFrontendOptions = {
  keepDeps: false,
  dryRun: false,
};

function log(message: string, dryRun = false) {
  if (dryRun) {
    console.log(`[DRY RUN] ${message}`);
  } else {
    console.log(message);
  }
}

function removeFileOrDir(path: string, options: DropFrontendOptions) {
  if (!existsSync(path)) {
    return;
  }

  if (options.dryRun) {
    const isDir = existsSync(path) && !path.includes('.');
    log(`Would remove ${isDir ? 'directory' : 'file'}: ${path}`, true);
    return;
  }

  try {
    const stats = existsSync(path) ? require('fs').statSync(path) : null;
    if (stats?.isDirectory()) {
      rmSync(path, { recursive: true, force: true });
      log(`🗑️  Removed directory: ${path}`);
    } else {
      unlinkSync(path);
      log(`🗑️  Removed file: ${path}`);
    }
  } catch (error) {
    log(`⚠️  Failed to remove ${path}: ${error}`);
  }
}

async function dropFrontend(options: DropFrontendOptions = DEFAULT_OPTIONS) {
  console.log('🧹 Dropping Visual Backend Frontend...\n');

  const projectRoot = process.cwd();
  const srcDir = join(projectRoot, 'src');
  const componentsDir = join(srcDir, 'components');
  const pagesDir = join(srcDir, 'pages');

  try {
    // 1. Remove frontend directories
    log('📁 Removing frontend directories...');
    removeFileOrDir(componentsDir, options);
    removeFileOrDir(pagesDir, options);
    log('');

    // 2. Remove frontend-specific files from src/
    log('📄 Removing frontend files...');
    removeFileOrDir(join(srcDir, 'global.css'), options);
    removeFileOrDir(join(srcDir, 'css-modules.d.ts'), options);
    removeFileOrDir(join(srcDir, 'dev.tsx'), options);
    log('');

    // 3. Handle index.tsx -> index.ts reversal
    await handleIndexFileReversal(projectRoot, srcDir, options);
    log('');

    // 4. Create basic backend index.ts if it doesn't exist
    await createBasicBackendIndex(srcDir, options);
    log('');

    // 5. Remove frontend dependencies
    if (!options.keepDeps) {
      log('📦 Removing frontend dependencies...');
      await removeFrontendDependencies(projectRoot, options);
      log('');
    } else {
      log('⏭️  Skipping dependency removal\n');
    }

    // 6. Revert package.json scripts
    log('📋 Reverting package.json scripts...');
    await revertPackageJsonScripts(projectRoot, options);
    log('');

    // 7. Revert tsconfig.json changes
    log('⚙️  Reverting tsconfig.json...');
    await revertTsConfig(projectRoot, options);
    log('');

    if (options.dryRun) {
      console.log('🔍 DRY RUN COMPLETE - No files were actually modified');
      console.log('\nTo execute removal, run without --dry-run flag');
    } else {
      console.log('🎉 Frontend removal complete!');
      console.log('\n📋 Project is now backend-only');
      console.log('   - Frontend directories and files removed');
      console.log('   - Server file reverted to backend-only');
      console.log('   - Package.json cleaned up');
      console.log('   - TypeScript configuration reverted');
      console.log('\n⚠️  IMPORTANT: Manual cleanup required:');
      console.log('   - Check src/index.ts and remove any page routes from the router');
      console.log('   - Remove any remaining frontend-related imports or references');
      console.log('   - Ensure the server only contains API routes and backend logic');
    }

  } catch (error) {
    console.error('❌ Frontend removal failed:', error);
    process.exit(1);
  }
}

async function handleIndexFileReversal(projectRoot: string, srcDir: string, options: DropFrontendOptions) {
  const indexTsx = join(srcDir, 'index.tsx');
  const indexTs = join(srcDir, 'index.ts');

  if (existsSync(indexTsx) && !existsSync(indexTs)) {
    if (options.dryRun) {
      log(`Would rename: ${indexTsx} -> ${indexTs}`, true);
      return;
    }

    log('🔄 Renaming index.tsx to index.ts...');
    renameSync(indexTsx, indexTs);
    log('✅ Renamed index.tsx to index.ts');
    
    // Update package.json to reflect the change back to index.ts
    await updatePackageJsonForIndexRevert(projectRoot);
  } else if (existsSync(indexTs)) {
    log('ℹ️  index.ts already exists, skipping rename');
  } else if (existsSync(indexTsx)) {
    log('ℹ️  index.tsx exists but index.ts also exists, keeping both');
  }
}

async function createBasicBackendIndex(srcDir: string, options: DropFrontendOptions) {
  const indexTs = join(srcDir, 'index.ts');
  
  if (existsSync(indexTs)) {
    log('ℹ️  index.ts already exists, skipping backend index creation');
    return;
  }

  if (options.dryRun) {
    log(`Would create basic backend index.ts at: ${indexTs}`, true);
    return;
  }

  log('📝 Creating basic backend index.ts...');
  const backendIndexContent = `try {
  const server = Bun.serve({
    routes: {
      // API routes will be added here
      "/api/*": () => Response.json({ message: "Not found" }, { status: 404 }),
      "/*": () => new Response("NOT FOUND", { status: 404 })
    },

    port: 3000,
    development: process.env.NODE_ENV !== "production" && {
      // Enable browser hot reloading in development
      hmr: true,

      // Echo console logs from browser to server
      console: true,
    },
    idleTimeout: 10, // 10 seconds
  });

  console.log(\`Server running on http://localhost:\${server.port}\`);
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
`;

  writeFileSync(indexTs, backendIndexContent);
  log('✅ Created basic backend index.ts');
}

async function removeFrontendDependencies(projectRoot: string, options: DropFrontendOptions) {
  const packageJsonPath = join(projectRoot, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    log('⚠️  package.json not found, skipping dependency removal');
    return;
  }

  if (options.dryRun) {
    log(`Would remove frontend dependencies from: ${packageJsonPath}`, true);
    return;
  }

  const { execSync } = await import('child_process');
  
  const frontendDeps = [
    'react',
    'react-dom', 
    '@types/react',
    '@types/react-dom',
    '@react-grab/opencode',
    'react-grab'
  ];

  try {
    // Remove all frontend dependencies (Bun doesn't separate dev/regular deps with -D flag)
    if (frontendDeps.length > 0) {
      execSync(`bun remove ${frontendDeps.join(' ')}`, { stdio: 'inherit' });
    }

    log('✅ Frontend dependencies removed');
  } catch (error) {
    log(`⚠️  Some dependencies may not have been installed: ${error}`);
  }
}

async function updatePackageJsonForIndexRevert(projectRoot: string) {
  const packageJsonPath = join(projectRoot, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    log('⚠️  package.json not found, skipping update');
    return;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  
  // Update main entry point from index.tsx back to index.ts
  if (packageJson.module === 'src/index.tsx') {
    packageJson.module = 'src/index.ts';
  }
  
  // Update scripts that reference index.tsx to use index.ts instead
  if (packageJson.scripts) {
    Object.keys(packageJson.scripts).forEach(scriptName => {
      const scriptValue = packageJson.scripts[scriptName];
      if (typeof scriptValue === 'string') {
        packageJson.scripts[scriptName] = scriptValue.replace(/src\/index\.tsx/g, 'src/index.ts');
      }
    });
  }

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  log('✅ Updated package.json to use index.ts');
}

async function revertPackageJsonScripts(projectRoot: string, options: DropFrontendOptions) {
  const packageJsonPath = join(projectRoot, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    log('⚠️  package.json not found, skipping script revert');
    return;
  }

  if (options.dryRun) {
    log(`Would revert package.json scripts in: ${packageJsonPath}`, true);
    return;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  // Use regex to replace all src/index.tsx with src/index.ts in scripts
  Object.keys(packageJson.scripts).forEach(scriptName => {
    const scriptValue = packageJson.scripts[scriptName];
    if (typeof scriptValue === 'string') {
      packageJson.scripts[scriptName] = scriptValue.replace(/src\/index\.tsx/g, 'src/index.ts');
    }
  });

  // Remove frontend-specific scripts if they exist
  delete packageJson.scripts['init-frontend'];
  delete packageJson.scripts['drop-frontend'];
  delete packageJson.scripts['add-page'];

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  log('✅ Reverted package.json scripts to backend-only');
}

async function revertTsConfig(projectRoot: string, options: DropFrontendOptions) {
  const tsConfigPath = join(projectRoot, 'tsconfig.json');
  
  if (!existsSync(tsConfigPath)) {
    log('⚠️  tsconfig.json not found, skipping revert');
    return;
  }

  if (options.dryRun) {
    log(`Would revert tsconfig.json changes in: ${tsConfigPath}`, true);
    return;
  }

  const tsConfigContent = readFileSync(tsConfigPath, 'utf-8');
  
  // Remove css-modules.d.ts from types array
  if (tsConfigContent.includes('css-modules.d.ts')) {
    const updatedTsConfigContent = tsConfigContent.replace(
      /("types":\s*\[)([^\]]*)(\])/s,
      (match, opening, typesArray, closing) => {
        const types = typesArray.split(',').map((t: string) => t.trim().replace(/"/g, '')).filter((t: string) => t.length > 0);
        const filteredTypes = types.filter((t: string) => t !== './src/css-modules.d.ts');
        return opening + filteredTypes.map((t: string) => `"${t}"`).join(', ') + closing;
      }
    );

    writeFileSync(tsConfigPath, updatedTsConfigContent);
    log('✅ Removed CSS modules types from tsconfig.json');
  } else {
    log('ℹ️  CSS modules types not found in tsconfig.json');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options: DropFrontendOptions = {};

  if (args.includes('--keep-deps')) {
    options.keepDeps = true;
  }
  if (args.includes('--dry-run')) {
    options.dryRun = true;
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Visual Backend Frontend Removal Script

Removes all frontend-related files and reverts the project to backend-only.
This is the opposite of the init-frontend script.

Usage:
  bun run drop-frontend [options]

Options:
  --keep-deps     Keep frontend dependencies installed
  --dry-run       Show what would be removed without actually removing
  --help, -h      Show this help message

 Behavior:
   - Removes src/components/ directory
   - Removes src/pages/ directory  
   - Removes src/global.css
   - Removes src/css-modules.d.ts
   - Removes src/dev.tsx
   - Renames src/index.tsx back to src/index.ts
   - Removes all frontend dependencies: react, react-dom, @types/react, @types/react-dom, @react-grab/opencode, react-grab (unless --keep-deps)
   - Reverts package.json scripts to backend-only
   - Removes CSS modules from tsconfig.json

Examples:
  bun run drop-frontend                    # Remove everything
  bun run drop-frontend --keep-deps       # Remove files but keep deps
  bun run drop-frontend --dry-run         # Preview what would be removed
`);
    process.exit(0);
  }

  await dropFrontend(options);
}

// Run if called directly
if (import.meta.main) {
  main().catch(console.error);
}

export { dropFrontend };