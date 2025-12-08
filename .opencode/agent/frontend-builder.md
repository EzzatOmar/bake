---
description: Responsible for creating React pages and components
mode: subagent
---

# Frontend Builder Agent

## Overview

The Frontend Builder agent creates and manages frontend components using a **Multi-Page Application (MPA)** strategy with **separate React entry points** for each page.

## Architecture

### Multi-Page Application (MPA)

- **Each page is a separate React application** with its own entry point
- **Pages are isolated** from each other
- **No shared state** between pages (unless explicitly implemented)
- **Independent bundling** for each page
- **Direct server routing** via Elysia static plugin

### File Structure

```
src/
├── component/           # Shared React components
│   └── comp.*.tsx       # Reusable components
├── page/                # Page-specific files
│   ├── index.html       # Homepage HTML entry point
│   ├── index.tsx        # Homepage React component
│   ├── index.module.css # Homepage styles (optional)
│   ├── dashboard.html   # Dashboard HTML entry point
│   ├── dashboard.tsx    # Dashboard React component
│   └── dashboard.module.css
├── global.css           # Global CSS (reset, typography, colors)
└── index.ts             # Elysia server
```

## Quick Start

Use the script to create new pages:
```bash
bun run .opencode/scripts/add-page.ts <page-name>
# Example: bun run .opencode/scripts/add-page.ts dashboard
```

This creates:
- `src/page/<name>.html` - HTML entry point
- `src/page/<name>.tsx` - React component + initialization
- `src/page/<name>.module.css` - Page-specific styles

## Page Structure

### HTML Entry Point

Each page's HTML file:
- References global CSS (`../global.css`)
- Loads its specific React entry point (`./pagename.tsx`)
- Contains root div for React mounting

```html
<!-- src/page/dashboard.html -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Dashboard</title>
    <link rel="stylesheet" href="../global.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./dashboard.tsx"></script>
  </body>
</html>
```

### React Entry Point

Each page's `.tsx` file is self-contained:

```tsx
// src/page/dashboard.tsx
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import styles from './dashboard.module.css';

const DashboardPage: React.FC = () => {
  const [data, setData] = useState(null);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Dashboard</h1>
      </header>
      <main className={styles.main}>
        {/* Page content */}
      </main>
    </div>
  );
};

// Initialize React app
const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<DashboardPage />);
```

## Shared Components

### Location: `src/component/`

Components are prefixed with `comp.`:

```tsx
// src/component/comp.header.tsx
import React from 'react';
import styles from './comp.header.module.css';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  return (
    <header className={styles.header}>
      {onMenuClick && (
        <button onClick={onMenuClick} className={styles.menuButton}>
          Menu
        </button>
      )}
      <h1 className={styles.title}>{title}</h1>
    </header>
  );
};
```

### Component Guidelines

- **Reusable** across multiple pages
- **Accept props** for customization
- **Use CSS Modules** for styles
- **Self-contained state** with `useState`/`useReducer`
- **Build on Base UI** for unstyled components

## Styling

### CSS Modules

Each component/page has its own `.module.css`:

```css
/* src/page/dashboard.module.css */
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--border-color);
}

.main {
  flex: 1;
  padding: 2rem;
}
```

### Global CSS

Global styles in `src/global.css`:
- CSS reset/normalize
- Typography (fonts, sizes)
- CSS variables (colors, spacing)
- Utility classes

```css
/* src/global.css */
:root {
  --primary-color: #3b82f6;
  --text-color: #1f2937;
  --border-color: #e5e7eb;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  color: var(--text-color);
  line-height: 1.5;
}
```

## Automatic Routing

**Important: Routes are automatically generated from HTML files in `src/page/`.** You do NOT need to manually register routes or edit any routing configuration.

### How It Works

The `htmlRoutes()` macro in `src/lib/html-routes.ts` scans the `src/page/` directory at build time and automatically creates routes based on file names:

**Route Mapping Convention:**
- `index.html` → `/` (homepage)
- `dashboard.html` → `/dashboard`
- `settings/index.html` → `/settings`
- `settings/profile.html` → `/settings/profile`

**Example:** When you create `src/page/dashboard.html`, it automatically becomes available at `/dashboard`. No manual route registration needed!

### Server Integration

The server in `src/index.ts` uses the `htmlRoutes()` macro to automatically discover and serve all HTML pages:

```ts
import { Elysia } from 'elysia';
import { htmlRoutes } from './lib/html-routes';
import apiRouter from './api-router';

const app = new Elysia({
  serve: {
    routes: await htmlRoutes({ dir: './src/page' })
  }
})
  .use(apiRouter)
  .listen(3000);
```

**Key Points:**
- ✅ **Automatic discovery:** Just drop `.html` files in `src/page/`
- ✅ **Convention-based routing:** File names become URL paths
- ✅ **Nested routes:** Use subdirectories for nested paths
- ✅ **Zero configuration:** No route registration code needed
- ✅ **Build-time scanning:** Routes are determined at server startup

The `htmlRoutes()` macro logs each discovered route on server startup:
```
[html-routes] dashboard.html -> /dashboard
[html-routes] settings/profile.html -> /settings/profile
```

## API Integration

Fetch data from API endpoints:

```tsx
import React, { useState, useEffect } from 'react';

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* render data */}</div>;
};
```

## Base UI Components

Use `@base-ui-components/react` for unstyled, accessible components:

```tsx
import { Menu } from '@base-ui-components/react/menu';
import styles from './comp.menu.module.css';

export function NavMenu() {
  return (
    <Menu.Root>
      <Menu.Trigger className={styles.trigger}>Menu</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.positioner}>
          <Menu.Popup className={styles.popup}>
            <Menu.Item className={styles.item}>Dashboard</Menu.Item>
            <Menu.Item className={styles.item}>Settings</Menu.Item>
            <Menu.Item className={styles.item}>Logout</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
```

### Base UI Documentation

- [Quick start](https://base-ui.com/react/overview/quick-start.md)
- [Styling](https://base-ui.com/react/handbook/styling.md)
- [Animation](https://base-ui.com/react/handbook/animation.md)
- [Forms](https://base-ui.com/react/handbook/forms.md)

Components: Accordion, Alert Dialog, Avatar, Button, Checkbox, Dialog, Field, Form, Input, Menu, Popover, Progress, Select, Tabs, Toast, Tooltip, and more.

## Best Practices

### Component Development
- Use TypeScript interfaces for props
- Keep components small and focused
- Use semantic HTML elements
- Add proper accessibility attributes (ARIA)

### Styling
- Use CSS Modules for component styles
- Follow mobile-first responsive design
- Use CSS variables for consistency
- Test on different screen sizes

### Performance
- Lazy load components when possible
- Optimize images and assets
- Minimize bundle size per page
- Use React.memo for expensive components

## File Naming Conventions

- **Pages**: `<name>.html`, `<name>.tsx`, `<name>.module.css`
- **Components**: `comp.<name>.tsx`, `comp.<name>.module.css`
- **Use kebab-case** for file names
- **Use PascalCase** for component names

## Integration with Other Agents

The Frontend Builder works with:
- **API Builder**: For data fetching endpoints
- **Controller Builder**: Business logic powering APIs
- **Database Manager**: Data structure understanding
