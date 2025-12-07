/**
 * Frontend Initialization Helpers
 *
 * Modular functions for frontend setup operations.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, unlinkSync } from 'fs';
import { join } from 'path';

// ============================================================================
// CHECK FUNCTIONS
// ============================================================================

export function isFrontendInstalled(srcDir: string): boolean {
  const globalCss = join(srcDir, 'global.css');
  const cssModulesTypes = join(srcDir, 'css-modules.d.ts');
  const devTsx = join(srcDir, 'dev.tsx');

  return existsSync(globalCss) && existsSync(cssModulesTypes) && existsSync(devTsx);
}

export function pageExists(pagesDir: string, pageName: string): boolean {
  const htmlFile = join(pagesDir, `${pageName}.html`);
  const tsxFile = join(pagesDir, `${pageName}.tsx`);
  return existsSync(htmlFile) && existsSync(tsxFile);
}

export function componentExists(componentsDir: string, componentName: string): boolean {
  return existsSync(join(componentsDir, `comp.${componentName}.tsx`));
}

// ============================================================================
// INSTALL FUNCTIONS
// ============================================================================

export async function installFrontendDeps(): Promise<void> {
  const { execSync } = await import('child_process');
  execSync('bun add react react-dom @types/react @types/react-dom', { stdio: 'pipe' });
  execSync('bun add @base-ui-components/react', { stdio: 'pipe' });
  execSync('bun add -D @react-grab/opencode react-grab', { stdio: 'pipe' });
}

export async function removeFrontendDeps(): Promise<void> {
  const { execSync } = await import('child_process');
  const deps = [
    'react', 'react-dom', '@types/react', '@types/react-dom',
    '@base-ui-components/react', '@react-grab/opencode', 'react-grab'
  ];
  try {
    execSync(`bun remove ${deps.join(' ')}`, { stdio: 'pipe' });
  } catch {
    // Some deps may not exist
  }
}

// ============================================================================
// CREATE FILE FUNCTIONS
// ============================================================================

export function createCssModulesTypes(srcDir: string): void {
  const path = join(srcDir, 'css-modules.d.ts');
  if (existsSync(path)) return;

  writeFileSync(path, `// CSS Modules
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}
`);
}

export function createGlobalCss(srcDir: string): void {
  const path = join(srcDir, 'global.css');
  if (existsSync(path)) return;

  writeFileSync(path, `/* Global Styles */
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
`);
}

export function createDevTsx(srcDir: string): void {
  const path = join(srcDir, 'dev.tsx');
  if (existsSync(path)) return;

  writeFileSync(path, `import "react-grab";
// @ts-ignore
import { createOpencodeAgentProvider } from "@react-grab/opencode/client";

const directory = new URL('..', import.meta.url).pathname;

const codingAgents = {
  "zai-coding-plan/glm-4.6": "zai-coding-plan/glm-4.6",
  "anthropic/claude-sonnet-4-5": "anthropic/claude-sonnet-4-5"
};

var attachAgent = async () => {
  if (typeof window === "undefined") return;
  const provider = createOpencodeAgentProvider({
    serverUrl: "http://localhost:6567",
    getOptions: () => ({
      model: codingAgents["zai-coding-plan/glm-4.6"],
      agent: "build-frontend",
      directory: directory,
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
      if (event instanceof CustomEvent && event.detail?.setAgent) {
        event.detail.setAgent({ provider, storage: sessionStorage });
      }
    },
    { once: true }
  );
};

attachAgent();
`);
}

// ============================================================================
// COMPONENT FUNCTIONS
// ============================================================================

export function createButtonComponent(componentsDir: string, force = false): void {
  if (!existsSync(componentsDir)) {
    mkdirSync(componentsDir, { recursive: true });
  }

  const tsxPath = join(componentsDir, 'comp.button.tsx');
  const cssPath = join(componentsDir, 'comp.button.module.css');

  if (!existsSync(tsxPath) || force) {
    writeFileSync(tsxPath, `import React from 'react';
import { Button as BaseUIButton } from '@base-ui-components/react/button';
import styles from './comp.button.module.css';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  onClick,
  disabled = false,
  type = 'button'
}) => {
  const className = [styles.button, styles[variant], styles[size]].join(' ');

  return (
    <BaseUIButton
      className={className}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </BaseUIButton>
  );
};
`);
  }

  if (!existsSync(cssPath) || force) {
    writeFileSync(cssPath, `.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Variants */
.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.secondary {
  background: white;
  color: #4a5568;
  border: 2px solid #e2e8f0;
}

.secondary:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e0;
}

.danger {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  color: white;
}

.danger:hover:not(:disabled) {
  transform: translateY(-2px);
}

/* Sizes */
.small { padding: 0.5rem 1rem; font-size: 0.875rem; }
.medium { padding: 0.75rem 1.5rem; font-size: 1rem; }
.large { padding: 1rem 2rem; font-size: 1.125rem; }
`);
  }
}

// ============================================================================
// PAGE FUNCTIONS
// ============================================================================

export function createPageHtml(pagesDir: string, pageName: string, force = false): void {
  if (!existsSync(pagesDir)) {
    mkdirSync(pagesDir, { recursive: true });
  }

  const path = join(pagesDir, `${pageName}.html`);
  if (existsSync(path) && !force) return;

  const title = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/[-_]/g, ' ');

  writeFileSync(path, `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link rel="stylesheet" href="../global.css" />
    <script type="module" src="../dev.tsx"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./${pageName}.tsx"></script>
  </body>
</html>
`);
}

export function createPageTsx(pagesDir: string, pageName: string, force = false): void {
  if (!existsSync(pagesDir)) {
    mkdirSync(pagesDir, { recursive: true });
  }

  const path = join(pagesDir, `${pageName}.tsx`);
  if (existsSync(path) && !force) return;

  const componentName = pageName.charAt(0).toUpperCase() +
    pageName.slice(1).replace(/[-_](.)/g, (_, char) => char.toUpperCase());

  writeFileSync(path, `import React from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '../component/comp.button';
import styles from './${pageName}.module.css';

const ${componentName}Page: React.FC = () => {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h2 className={styles.title}>Welcome to ${componentName}</h2>
        <p>This is your ${pageName} page.</p>
        <Button variant="primary" onClick={() => alert('Hello!')}>
          Click Me
        </Button>
      </section>
    </div>
  );
};

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<${componentName}Page />);
`);
}

export function createPageCssModule(pagesDir: string, pageName: string, force = false): void {
  if (!existsSync(pagesDir)) {
    mkdirSync(pagesDir, { recursive: true });
  }

  const path = join(pagesDir, `${pageName}.module.css`);
  if (existsSync(path) && !force) return;

  writeFileSync(path, `.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.hero {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 600px;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.1rem;
  color: #718096;
  margin-bottom: 1.5rem;
}
`);
}

// ============================================================================
// TSCONFIG FUNCTIONS
// ============================================================================

export function updateTsConfigForCssModules(projectRoot: string): void {
  const path = join(projectRoot, 'tsconfig.json');
  if (!existsSync(path)) return;

  const content = readFileSync(path, 'utf-8');
  if (content.includes('css-modules.d.ts')) return;

  const updated = content.replace(
    /(\"types\":\s*\[)([^\]]*)(])/s,
    (_, opening, typesArray, closing) => {
      const types = typesArray.split(',')
        .map((t: string) => t.trim().replace(/"/g, ''))
        .filter((t: string) => t.length > 0);
      types.push('./src/css-modules.d.ts');
      return opening + types.map((t: string) => `"${t}"`).join(', ') + closing;
    }
  );

  writeFileSync(path, updated);
}

export function revertTsConfigCssModules(projectRoot: string): void {
  const path = join(projectRoot, 'tsconfig.json');
  if (!existsSync(path)) return;

  const content = readFileSync(path, 'utf-8');
  if (!content.includes('css-modules.d.ts')) return;

  const updated = content.replace(
    /(\"types\":\s*\[)([^\]]*)(])/s,
    (_, opening, typesArray, closing) => {
      const types = typesArray.split(',')
        .map((t: string) => t.trim().replace(/"/g, ''))
        .filter((t: string) => t.length > 0 && t !== './src/css-modules.d.ts');
      return opening + types.map((t: string) => `"${t}"`).join(', ') + closing;
    }
  );

  writeFileSync(path, updated);
}

// ============================================================================
// CLEANUP FUNCTIONS
// ============================================================================

export function removeFile(path: string): void {
  if (existsSync(path)) {
    unlinkSync(path);
  }
}

export function removeDir(path: string): void {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
}
