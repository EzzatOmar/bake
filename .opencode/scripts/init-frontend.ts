#!/usr/bin/env bun

/**
 * Visual Backend Frontend Initialization Script
 * 
 * This script sets up a complete frontend structure for the Visual Backend framework.
 * It uses TypeScript AST parsing to safely update server configuration files.
 * 
 * Features:
 * - Installs React dependencies
 * - Creates MPA structure with separate entry points
 * - Sets up shared components and global CSS
 * - Safely updates server routes using AST parsing
 * - Configures Bun fullstack bundling
 * 
 * Usage: bun run init-frontend [options]
 */

import { existsSync, mkdirSync, writeFileSync, renameSync, readFileSync } from 'fs';
import { join } from 'path';

interface InitFrontendOptions {
  force?: boolean;
  skipDeps?: boolean;
}

const DEFAULT_OPTIONS: InitFrontendOptions = {
  force: false,
  skipDeps: false,
};

function isFrontendAlreadyInitialized(srcDir: string, componentsDir: string, pagesDir: string): boolean {
  // Check if all essential frontend files exist
  // Check for pages to ensure full initialization
  const globalCss = join(srcDir, 'global.css');
  const headerComponent = join(componentsDir, 'Header.tsx');
  const navigationComponent = join(componentsDir, 'Navigation.tsx');
  const indexHtml = join(pagesDir, 'index.html');
  const indexTsx = join(pagesDir, 'index.tsx');
  const demoHtml = join(pagesDir, 'demo.html');
  const demoTsx = join(pagesDir, 'demo.tsx');
  const indexServerFile = join(srcDir, 'index.tsx');
  
  return (
    existsSync(srcDir) &&
    existsSync(globalCss) &&
    existsSync(componentsDir) &&
    existsSync(headerComponent) &&
    existsSync(navigationComponent) &&
    existsSync(pagesDir) &&
    existsSync(indexHtml) &&
    existsSync(indexTsx) &&
    existsSync(demoHtml) &&
    existsSync(demoTsx) &&
    existsSync(indexServerFile)
  );
}

async function initFrontend(options: InitFrontendOptions = DEFAULT_OPTIONS) {
  console.log('🚀 Initializing Visual Backend Frontend...\n');

  const projectRoot = process.cwd();
  const srcDir = join(projectRoot, 'src');
  const componentsDir = join(srcDir, 'components');
  const pagesDir = join(srcDir, 'pages');

  try {
    // Check if frontend is already initialized
    if (isFrontendAlreadyInitialized(srcDir, componentsDir, pagesDir) && !options.force) {
      console.log('ℹ️  Frontend is already initialized!');
      console.log('   Use --force to overwrite existing files.');
      console.log('\n📋 Current status:');
      console.log('   ✅ React dependencies installed');
      console.log('   ✅ Frontend directories exist');
      console.log('   ✅ Global CSS exists');
      console.log('   ✅ Shared components exist');
      console.log('   ✅ Homepage and demo page exist');
      console.log('\n💡 To add new pages, use: bun run add-page <page-name>');
      return;
    }

    // 1. Install dependencies
    if (!options.skipDeps) {
      console.log('📦 Installing React dependencies...');
      await installDependencies();
      console.log('✅ Dependencies installed\n');
    } else {
      console.log('⏭️  Skipping dependency installation\n');
    }

    // 2. Ensure src directory exists
    if (!existsSync(srcDir)) {
      console.log('📁 Creating src directory...');
      mkdirSync(srcDir, { recursive: true });
    }

    // 3. Check and rename src/index.ts if it exists
    await handleIndexFile(projectRoot, srcDir);

    // 4. Create directories
    console.log('📁 Creating frontend directories...');
    createDirectories(componentsDir, pagesDir);
    console.log('✅ Directories created\n');

    // 5. Create global CSS
    console.log('🎨 Creating global CSS...');
    createGlobalCSS(srcDir);
    console.log('✅ Global CSS created\n');

    // 6. Create shared components
    console.log('🧩 Creating shared components...');
    createSharedComponents(componentsDir, options.force);
    console.log('✅ Shared components created\n');

    // 7. Create dev.tsx
    console.log('🔧 Creating dev.tsx...');
    createDevTsx(srcDir);
    console.log('✅ dev.tsx created\n');

    // 8. Create empty server file (will be updated by add-page)
    console.log('🔧 Creating server file...');
    createEmptyServerFile(srcDir);
    console.log('✅ Server file created\n');

    // 9. Create homepage using add-page script
    console.log('📄 Creating homepage...');
    await createPageWithScript('index', options.force);
    console.log('✅ Homepage created\n');

    // 10. Create demo page using add-page script
    console.log('📄 Creating demo page...');
    await createPageWithScript('demo', options.force);
    console.log('✅ Demo page created\n');

    // 11. Update package.json scripts
    console.log('📋 Updating package.json scripts...');
    await updatePackageJson(projectRoot);
    console.log('✅ Package.json updated\n');

    console.log('🎉 Frontend initialization complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: bun run dev');
    console.log('   2. Open: http://localhost:3000');
    console.log('   3. Try: http://localhost:3000/demo (demo page)');
    console.log('\n📚 Documentation: .opencode/agent/frontend-builder.md');
    console.log('💡 Add more pages with: bun run add-page <page-name>');

  } catch (error) {
    console.error('❌ Frontend initialization failed:', error);
    process.exit(1);
  }
}

async function installDependencies() {
  const { execSync } = await import('child_process');
  
  try {
    execSync('bun add react react-dom @types/react @types/react-dom', { stdio: 'inherit' });
    execSync('bun add -D @react-grab/opencode react-grab', { stdio: 'inherit' });
  } catch (error) {
    throw new Error('Failed to install React dependencies');
  }
}

async function handleIndexFile(projectRoot: string, srcDir: string) {
  const indexTs = join(srcDir, 'index.ts');
  const indexTsx = join(srcDir, 'index.tsx');

  if (existsSync(indexTs) && !existsSync(indexTsx)) {
    console.log('🔄 Renaming index.ts to index.tsx...');
    renameSync(indexTs, indexTsx);
    console.log('✅ Renamed index.ts to index.tsx\n');
    
    // Update package.json to reflect the change from index.ts to index.tsx
    await updatePackageJsonForIndexRename(projectRoot);
  } else if (existsSync(indexTsx)) {
    console.log('ℹ️  index.tsx already exists, skipping rename\n');
  }
}

async function createDevTsx(srcDir: string) {
  const devTsx = join(srcDir, 'dev.tsx');
  const devTsxContent = `
import "react-grab";
// @ts-ignore
import { createOpencodeAgentProvider } from "@react-grab/opencode/client";

// Get parent directory (browser-friendly)
const directory = new URL('..', import.meta.url).pathname;

const codingAgents = {
    "zai-coding-plan/glm-4.6": "zai-coding-plan/glm-4.6",
    "anthropic/claude-sonnet-4-5": "anthropic/claude-sonnet-4-5"
}

var attachAgent = async () => {
    if (typeof window === "undefined") return;
    const provider = createOpencodeAgentProvider({
        serverUrl: "http://localhost:6567", // Custom server URL
        getOptions: () => ({
          model: codingAgents["zai-coding-plan/glm-4.6"],
          agent: "build-frontend", // Agent type: "build" or "plan"
          directory: directory, // Project directory
        }),
      });
    // @ts-ignore
    const api = window.__REACT_GRAB__;
    if (api) {
      api.setAgent({ provider, storage: sessionStorage });
      return;
    }
    window.addEventListener(
      "react-grab:init",
      (event) => {
        if (event instanceof CustomEvent) {
          const customEvent = event;
          if (customEvent.detail && typeof customEvent.detail.setAgent === "function") {
            customEvent.detail.setAgent({
              provider,
              storage: sessionStorage
            });
          }
        }
      },
      { once: true }
    );
  };

attachAgent();
  `
  writeFileSync(devTsx, devTsxContent);
  console.log('✅ dev.tsx created\n');
}

function createDirectories(componentsDir: string, pagesDir: string) {
  if (!existsSync(componentsDir)) {
    mkdirSync(componentsDir, { recursive: true });
  }
  if (!existsSync(pagesDir)) {
    mkdirSync(pagesDir, { recursive: true });
  }
}

function createGlobalCSS(srcDir: string) {
  const globalCssPath = join(srcDir, 'global.css');
  
  if (existsSync(globalCssPath)) {
    console.log('ℹ️  global.css already exists, skipping');
    return;
  }

  const globalCss = `/* Global Styles for Visual Backend */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f8fafc;
}

.app {
  min-height: 100vh;
}

.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
}

/* Navigation */
.navigation {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 0;
}

.nav-list {
  list-style: none;
  display: flex;
  justify-content: center;
  margin: 0;
  padding: 0;
}

.nav-item {
  margin: 0;
}

.nav-link {
  display: block;
  padding: 1rem 2rem;
  text-decoration: none;
  color: #4a5568;
  font-weight: 500;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
}

.nav-link:hover {
  color: #667eea;
  background-color: #f7fafc;
  border-bottom-color: #667eea;
}

/* Main Content */
.main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Homepage Styles */
.hero {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 3rem;
}

.hero h2 {
  font-size: 3rem;
  font-weight: 800;
  color: #2d3748;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.25rem;
  color: #718096;
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.cta-button {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.1rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.features {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.features h3 {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 2rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.feature-card {
  background: #f8fafc;
  padding: 2rem;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.feature-card h4 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: #718096;
  line-height: 1.6;
}

/* Dashboard Styles */
body {
  background-color: #f1f5f9;
}

.dashboard-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dashboard-content h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1rem;
}

.dashboard-content > p {
  font-size: 1.1rem;
  color: #64748b;
  margin-bottom: 2rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.dashboard-card {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.dashboard-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.dashboard-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-weight: 500;
  color: #64748b;
}

.stat-value {
  font-weight: 700;
  color: #0ea5e9;
  font-size: 1.1rem;
}

.action-button {
  display: block;
  width: 100%;
  background: #0ea5e9;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  margin: 0.5rem 0;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-button:hover {
  background: #0284c7;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-title {
    font-size: 2rem;
  }
  
  .hero {
    padding: 2rem 1rem;
  }
  
  .hero h2 {
    font-size: 2rem;
  }
  
  .hero p {
    font-size: 1rem;
  }
  
  .nav-link {
    padding: 0.75rem 1rem;
  }
  
  .features {
    padding: 2rem 1rem;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .dashboard-content {
    padding: 1.5rem;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
`;

  writeFileSync(globalCssPath, globalCss);
}

function createSharedComponents(componentsDir: string, force: boolean = false) {
  // Check if components already exist
  const headerFile = join(componentsDir, 'Header.tsx');
  const navigationFile = join(componentsDir, 'Navigation.tsx');
  const layoutFile = join(componentsDir, 'Layout.tsx');
  
  const componentsExist = existsSync(headerFile) && existsSync(navigationFile) && existsSync(layoutFile);
  
  if (componentsExist && !force) {
    console.log('ℹ️  Shared components already exist, skipping');
    return;
  }

  // Header component
  if (!existsSync(headerFile) || force) {
    const headerComponent = `import React from 'react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>
    </header>
  );
};
`;
    writeFileSync(headerFile, headerComponent);
    console.log('✅ Created Header.tsx');
  } else {
    console.log('ℹ️  Header.tsx already exists, skipping');
  }

  // Navigation component
  if (!existsSync(navigationFile) || force) {
    const navigationComponent = `import React from 'react';

export const Navigation: React.FC = () => {
  return (
    <nav className="navigation">
      <ul className="nav-list">
        <li className="nav-item">
          <a href="/" className="nav-link">Home</a>
        </li>
        <li className="nav-item">
          <a href="/dashboard" className="nav-link">Dashboard</a>
        </li>
      </ul>
    </nav>
  );
};
`;
    writeFileSync(navigationFile, navigationComponent);
    console.log('✅ Created Navigation.tsx');
  } else {
    console.log('ℹ️  Navigation.tsx already exists, skipping');
  }

  // Layout component
  if (!existsSync(layoutFile) || force) {
    const layoutComponent = `import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <div className="layout-container">
        {children}
      </div>
    </div>
  );
};
`;
    writeFileSync(layoutFile, layoutComponent);
    console.log('✅ Created Layout.tsx');
  } else {
    console.log('ℹ️  Layout.tsx already exists, skipping');
  }
}

// Old functions removed - pages are now created via add-page script
// which automatically handles router updates via TypeScript AST

function createEmptyServerFile(srcDir: string) {
  const serverFile = join(srcDir, 'index.tsx');
  
  if (existsSync(serverFile)) {
    console.log('ℹ️  Server file already exists, skipping');
    return;
  }

  // Create minimal server file - routes will be added by add-page script
  const serverContent = `try {
  const server = Bun.serve({
    routes: {
      // Routes will be added here automatically
      // Wildcard route for all routes that start with "/api/" and aren't otherwise matched
      "/api/*": () => Response.json({ message: "Not found" }, { status: 404 }),
      "/*": () => new Response("NOT FOUND", { status: 404 })
    },

    port: 3000,
    development: process.env.NODE_ENV !== "production" && {
      // Enable browser hot reloading in development
      hmr: true,

      // Echo console logs from the browser to the server
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

  writeFileSync(serverFile, serverContent);
}

async function createPageWithScript(pageName: string, force: boolean = false) {
  const { execSync } = await import('child_process');
  
  try {
    const forceFlag = force ? '--force' : '';
    execSync(`bun run .opencode/scripts/add-page.ts ${pageName} ${forceFlag}`, { stdio: 'inherit' });
  } catch (error) {
    console.log(`⚠️  ${pageName} page creation failed, but continuing...`);
    // Don't fail the entire init if page creation fails
  }
}

async function updatePackageJsonForIndexRename(projectRoot: string) {
  const packageJsonPath = join(projectRoot, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    console.log('⚠️  package.json not found, skipping update');
    return;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  
  // Update main entry point from index.ts to index.tsx
  if (packageJson.module === 'src/index.ts') {
    packageJson.module = 'src/index.tsx';
  }
  
  // Update scripts that reference index.ts to use index.tsx instead
  if (packageJson.scripts) {
    // Use regex to replace all src/index.ts with src/index.tsx in scripts
    Object.keys(packageJson.scripts).forEach(scriptName => {
      const scriptValue = packageJson.scripts[scriptName];
      if (typeof scriptValue === 'string') {
        packageJson.scripts[scriptName] = scriptValue.replace(/src\/index\.ts/g, 'src/index.tsx');
      }
    });
  }

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json to use index.tsx');
}

async function updatePackageJson(_projectRoot: string) {
  const packageJsonPath = join(_projectRoot, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    console.log('⚠️  package.json not found, skipping update');
    return;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  
  // Ensure scripts exist
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  // Update or add scripts
  packageJson.scripts.dev = "bun --hot run src/index.tsx";
  packageJson.scripts.start = "bun run src/index.tsx";
  packageJson.scripts.build = "bun build --target=bun --production --outdir=dist ./src/index.tsx";
  packageJson.scripts.typecheck = "bunx tsc --noEmit --project tsconfig.json";

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options: InitFrontendOptions = {};

  if (args.includes('--force')) {
    options.force = true;
  }
  if (args.includes('--skip-deps')) {
    options.skipDeps = true;
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Visual Backend Frontend Initialization Script

Sets up complete frontend structure with React, TypeScript, and Bun fullstack bundling.
Automatically detects existing frontend and skips creation unless --force is used.

Usage:
  bun run init-frontend [options]

Options:
  --force         Force overwrite existing frontend files
  --skip-deps     Skip dependency installation
  --help, -h      Show this help message

Behavior:
  - If frontend already exists: Shows status and exits (unless --force)
  - If frontend doesn't exist: Creates complete frontend structure
  - Use --force to recreate/overwrite existing frontend

Examples:
  bun run init-frontend                    # Initialize if not exists
  bun run init-frontend --skip-deps       # Skip dependencies
  bun run init-frontend --force            # Force recreate frontend
`);
    process.exit(0);
  }

  await initFrontend(options);
}

// Run if called directly
if (import.meta.main) {
  main().catch(console.error);
}

export { initFrontend };