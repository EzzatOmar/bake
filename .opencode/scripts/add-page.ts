#!/usr/bin/env bun

/**
 * Visual Backend Add Page Script
 * 
 * Creates new page template files (HTML and TSX) and automatically
 * updates the router in src/index.tsx using TypeScript AST.
 * 
 * Usage: bun run add-page <page-name>
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { addPageToRouter } from '../helper-fns/update-router';

interface AddPageOptions {
  force?: boolean;
}

function isFrontendInitialized(projectRoot: string, srcDir: string, pagesDir: string): boolean {
  // Check for essential frontend files and structure (minimum requirements)
  // Don't check for specific pages since they may not exist during init-frontend
  const globalCss = join(srcDir, 'global.css');
  const componentsDir = join(srcDir, 'components');
  const headerComponent = join(componentsDir, 'Header.tsx');
  const navigationComponent = join(componentsDir, 'Navigation.tsx');
  
  return (
    existsSync(srcDir) &&
    existsSync(globalCss) &&
    existsSync(componentsDir) &&
    existsSync(headerComponent) &&
    existsSync(navigationComponent) &&
    existsSync(pagesDir)
  );
}

function pageExists(pagesDir: string, pageName: string): boolean {
  const htmlFile = join(pagesDir, `${pageName}.html`);
  const tsxFile = join(pagesDir, `${pageName}.tsx`);
  return existsSync(htmlFile) && existsSync(tsxFile);
}

async function addPage(pageName: string, options: AddPageOptions = {}) {
  if (!pageName) {
    console.error('❌ Page name is required');
    console.log('Usage: bun run add-page <page-name>');
    process.exit(1);
  }

  // Validate page name
  if (!/^[a-zA-Z0-9-_]+$/.test(pageName)) {
    console.error('❌ Invalid page name. Use only letters, numbers, hyphens, and underscores');
    process.exit(1);
  }

  const projectRoot = process.cwd();
  const srcDir = join(projectRoot, 'src');
  const pagesDir = join(srcDir, 'pages');

  // Check if frontend is initialized
  if (!isFrontendInitialized(projectRoot, srcDir, pagesDir)) {
    console.error('❌ Frontend is not initialized!');
    console.log('\n📋 To fix this, run:');
    console.log('   bun run init-frontend');
    console.log('\n💡 This will set up the complete frontend structure including:');
    console.log('   - React dependencies');
    console.log('   - Shared components');
    console.log('   - Global CSS');
    console.log('   - Homepage and dashboard');
    console.log('   - Server configuration');
    process.exit(1);
  }

  // Check if page already exists
  if (pageExists(pagesDir, pageName) && !options.force) {
    console.log(`ℹ️  Page "${pageName}" already exists!`);
    console.log('\n📁 Existing files:');
    const htmlFile = join(pagesDir, `${pageName}.html`);
    const tsxFile = join(pagesDir, `${pageName}.tsx`);
    if (existsSync(htmlFile)) console.log(`   - ${htmlFile}`);
    if (existsSync(tsxFile)) console.log(`   - ${tsxFile}`);
    console.log('\n💡 Use --force to overwrite existing files');
    console.log('   AI agents will update server configuration and navigation');
    return;
  }

  console.log(`🚀 Adding new page: ${pageName}\n`);

  try {
    // 1. Ensure pages directory exists
    if (!existsSync(pagesDir)) {
      console.log('📁 Creating pages directory...');
      mkdirSync(pagesDir, { recursive: true });
    }

    // 2. Create HTML file
    console.log('📄 Creating HTML file...');
    createHtmlFile(pagesDir, pageName, options.force);

    // 3. Create TSX file
    console.log('⚛️  Creating React component...');
    createTsxFile(pagesDir, pageName, options.force);

    // 4. Update router in src/index.tsx
    console.log('🔧 Updating router configuration...');
    const indexPath = join(srcDir, 'index.tsx');
    if (existsSync(indexPath)) {
      const routeAdded = addPageToRouter(indexPath, pageName);
      if (routeAdded) {
        console.log(`✅ Router updated with /${pageName} route`);
      } else {
        console.log(`ℹ️  Route /${pageName} already exists in router`);
      }
    } else {
      console.log('⚠️  src/index.tsx not found, skipping router update');
    }

    console.log(`\n✅ Page "${pageName}" created successfully!`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Update navigation component if needed`);
    console.log(`   2. Run: bun run dev`);
    console.log(`   3. Open: http://localhost:3000/${pageName}`);
    console.log(`\n📁 Files created:`);
    console.log(`   - src/pages/${pageName}.html`);
    console.log(`   - src/pages/${pageName}.tsx`);
    console.log(`\n📝 Files updated:`);
    console.log(`   - src/index.tsx (router configuration)`);

  } catch (error) {
    console.error(`❌ Failed to add page "${pageName}":`, error);
    process.exit(1);
  }
}

function createHtmlFile(pagesDir: string, pageName: string, force: boolean = false) {
  const htmlFile = join(pagesDir, `${pageName}.html`);
  
  if (existsSync(htmlFile) && !force) {
    console.log(`⚠️  ${pageName}.html already exists, skipping`);
    return;
  }

  const title = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/[-_]/g, ' ');
  
  const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Visual Backend - ${title}</title>
    <link rel="stylesheet" href="../global.css" />
    <script type="module" src="../dev.tsx"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./${pageName}.tsx"></script>
  </body>
</html>
`;

  writeFileSync(htmlFile, htmlContent);
  console.log(`✅ Created ${pageName}.html`);
}

function createTsxFile(pagesDir: string, pageName: string, force: boolean = false) {
  const tsxFile = join(pagesDir, `${pageName}.tsx`);
  
  if (existsSync(tsxFile) && !force) {
    console.log(`⚠️  ${pageName}.tsx already exists, skipping`);
    return;
  }

  const componentName = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/[-_](.)/g, (_, char) => char.toUpperCase());
  
  const tsxContent = `import React from 'react';
import { createRoot } from 'react-dom/client';

const ${componentName}Page: React.FC = () => {
  return (
    <div className="page">
      <main className="main">
        <section className="hero">
          <h2>Welcome to ${componentName}</h2>
          <p>This is your new ${pageName} page!</p>
          <p>AI agents will customize this component.</p>
        </section>
      </main>
    </div>
  );
};

// Initialize React app
const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<${componentName}Page />);
`;

  writeFileSync(tsxFile, tsxContent);
  console.log(`✅ Created ${pageName}.tsx`);
}

// Router updates are handled automatically by TypeScript AST
// Navigation updates can be done manually or by AI agents

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Visual Backend Add Page Script

Creates page template files and updates router automatically.
Requires frontend to be initialized first.

Usage:
  bun run add-page <page-name> [options]

Arguments:
  page-name       Name of the page to create (use kebab-case or snake_case)

Options:
  --force         Force overwrite existing files
  --help, -h      Show this help message

Behavior:
  - If frontend not initialized: Exits with instructions to run init-frontend
  - If page already exists: Shows existing files and exits (unless --force)
  - If page doesn't exist: Creates HTML and TSX template files

Examples:
  bun run add-page about                    # Create new page
  bun run add-page user-profile             # Create new page with hyphen
  bun run add-page settings --force         # Overwrite existing page

Prerequisites:
  - Run 'bun run init-frontend' first to set up frontend structure

Note: 
  - Creates: src/pages/<page-name>.html and .tsx
  - Automatically updates router in src/index.tsx
  - Navigation component can be updated manually or by AI agents
`);
    process.exit(0);
  }

  const pageName = args[0];
  const options: AddPageOptions = {};

  if (args.includes('--force')) {
    options.force = true;
  }

  await addPage(pageName, options);
}

// Run if called directly
if (import.meta.main) {
  main().catch(console.error);
}

export { addPage };