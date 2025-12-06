import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { addPageToRouter, getExistingRoutes } from './update-router';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), 'test-temp-router');
const TEST_INDEX_PATH = join(TEST_DIR, 'index.tsx');

beforeEach(() => {
  // Create test directory
  if (!existsSync(TEST_DIR)) {
    mkdirSync(TEST_DIR, { recursive: true });
  }
});

afterEach(() => {
  // Clean up test directory
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

describe('update-router', () => {
  describe('addPageToRouter', () => {
    test('should add new route to empty router', () => {
      const initialContent = `try {
  const server = Bun.serve({
    routes: {
      // Wildcard route for all routes that start with "/api/" and aren't otherwise matched
      "/api/*": () => Response.json({ message: "Not found" }, { status: 404 }),
      "/*": () => new Response("NOT FOUND", { status: 404 })
    },
    port: 3000,
  });

  console.log(\`Server running on http://localhost:\${server.port}\`);
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
`;
      writeFileSync(TEST_INDEX_PATH, initialContent);

      const result = addPageToRouter(TEST_INDEX_PATH, 'about');
      expect(result).toBe(true);

      // Verify the file was updated
      const updatedContent = readFileSync(TEST_INDEX_PATH, 'utf-8');
      expect(updatedContent).toContain(`import about from './pages/about.html';`);
      expect(updatedContent).toContain(`"/about": about,`);
      expect(updatedContent).toContain(`console.log(\`about: http://localhost:\${server.port}/about\`);`);
    });

    test('should add route before wildcard routes', () => {
      const initialContent = `import homepage from './pages/index.html';

try {
  const server = Bun.serve({
    routes: {
      "/": homepage,
      // Wildcard route for all routes that start with "/api/" and aren't otherwise matched
      "/api/*": () => Response.json({ message: "Not found" }, { status: 404 }),
      "/*": () => new Response("NOT FOUND", { status: 404 })
    },
    port: 3000,
  });

  console.log(\`Server running on http://localhost:\${server.port}\`);
  console.log(\`Homepage: http://localhost:\${server.port}/\`);
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
`;
      writeFileSync(TEST_INDEX_PATH, initialContent);

      const result = addPageToRouter(TEST_INDEX_PATH, 'dashboard');
      expect(result).toBe(true);

      const updatedContent = readFileSync(TEST_INDEX_PATH, 'utf-8');
      
      // Check import is added
      expect(updatedContent).toContain(`import dashboard from './pages/dashboard.html';`);
      
      // Check route is added before wildcards
      const routeIndex = updatedContent.indexOf('"/dashboard": dashboard,');
      const wildcardIndex = updatedContent.indexOf('"/api/*":');
      expect(routeIndex).toBeLessThan(wildcardIndex);
      
      // Check console.log is added
      expect(updatedContent).toContain(`console.log(\`dashboard: http://localhost:\${server.port}/dashboard\`);`);
    });

    test('should return false if route already exists', () => {
      const initialContent = `import homepage from './pages/index.html';
import dashboard from './pages/dashboard.html';

try {
  const server = Bun.serve({
    routes: {
      "/": homepage,
      "/dashboard": dashboard,
      "/api/*": () => Response.json({ message: "Not found" }, { status: 404 }),
      "/*": () => new Response("NOT FOUND", { status: 404 })
    },
    port: 3000,
  });

  console.log(\`Server running on http://localhost:\${server.port}\`);
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
`;
      writeFileSync(TEST_INDEX_PATH, initialContent);

      const result = addPageToRouter(TEST_INDEX_PATH, 'dashboard');
      expect(result).toBe(false);
    });

    test('should handle page names with hyphens', () => {
      const initialContent = `import homepage from './pages/index.html';

try {
  const server = Bun.serve({
    routes: {
      "/": homepage,
      "/api/*": () => Response.json({ message: "Not found" }, { status: 404 }),
      "/*": () => new Response("NOT FOUND", { status: 404 })
    },
    port: 3000,
  });

  console.log(\`Server running on http://localhost:\${server.port}\`);
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
`;
      writeFileSync(TEST_INDEX_PATH, initialContent);

      const result = addPageToRouter(TEST_INDEX_PATH, 'user-profile');
      expect(result).toBe(true);

      const updatedContent = readFileSync(TEST_INDEX_PATH, 'utf-8');
      
      // Import name should have no hyphens
      expect(updatedContent).toContain(`import userprofile from './pages/user-profile.html';`);
      // Route path should have hyphens
      expect(updatedContent).toContain(`"/user-profile": userprofile,`);
      // Console log should have hyphens
      expect(updatedContent).toContain(`user-profile: http://localhost:`);
    });

    test('should handle index page specially', () => {
      const initialContent = `try {
  const server = Bun.serve({
    routes: {
      "/api/*": () => Response.json({ message: "Not found" }, { status: 404 }),
      "/*": () => new Response("NOT FOUND", { status: 404 })
    },
    port: 3000,
  });

  console.log(\`Server running on http://localhost:\${server.port}\`);
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
`;
      writeFileSync(TEST_INDEX_PATH, initialContent);

      const result = addPageToRouter(TEST_INDEX_PATH, 'index');
      expect(result).toBe(true);

      const updatedContent = readFileSync(TEST_INDEX_PATH, 'utf-8');
      
      // Should map to "/" route, not "/index"
      expect(updatedContent).toContain(`"/": index,`);
      expect(updatedContent).not.toContain(`"/index":`);
      
      // Should not add console.log for index page
      expect(updatedContent).not.toContain(`index: http://localhost:`);
    });
  });

  describe('getExistingRoutes', () => {
    test('should return all routes except wildcards', () => {
      const content = `import homepage from './pages/index.html';
import dashboard from './pages/dashboard.html';
import demo from './pages/demo.html';

try {
  const server = Bun.serve({
    routes: {
      "/": homepage,
      "/dashboard": dashboard,
      "/demo": demo,
      // Wildcard route for all routes that start with "/api/" and aren't otherwise matched
      "/api/*": () => Response.json({ message: "Not found" }, { status: 404 }),
      "/*": () => new Response("NOT FOUND", { status: 404 })
    },
    port: 3000,
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
`;
      writeFileSync(TEST_INDEX_PATH, content);

      const routes = getExistingRoutes(TEST_INDEX_PATH);
      
      expect(routes).toContain('/');
      expect(routes).toContain('/dashboard');
      expect(routes).toContain('/demo');
      
      // Wildcards should not be included
      expect(routes).not.toContain('/api/*');
      expect(routes).not.toContain('/*');
    });

    test('should return empty array if no routes exist', () => {
      const content = `try {
  const server = Bun.serve({
    routes: {
      "/api/*": () => Response.json({ message: "Not found" }, { status: 404 }),
      "/*": () => new Response("NOT FOUND", { status: 404 })
    },
    port: 3000,
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
`;
      writeFileSync(TEST_INDEX_PATH, content);

      const routes = getExistingRoutes(TEST_INDEX_PATH);
      
      // Should only contain wildcards, which are filtered out
      expect(routes.filter(r => !r.includes('*'))).toHaveLength(0);
    });
  });
});
