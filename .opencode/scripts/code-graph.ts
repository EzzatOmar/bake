#!/usr/bin/env bun

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { extractMethodControllerMap } from '../helper-fns/api-ctrl-lookup';

interface ApiEndpoint {
  path: string;
  method: string;
  file: string;
  controller: string | null;
}

/**
 * Recursively find all files matching a pattern
 */
async function findFiles(dir: string, pattern: RegExp, results: string[] = []): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await findFiles(fullPath, pattern, results);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    // Ignore errors (e.g., permission denied)
  }
  
  return results;
}

/**
 * Extract API endpoints from index.tsx
 */
async function extractUsedEndpoints(indexPath: string): Promise<string[]> {
  try {
    const content = await readFile(indexPath, 'utf-8');
    const endpoints: string[] = [];
    
    // Match routes like "/api/something" or '/api/something'
    const routePattern = /["']\/api\/[^"']+["']/g;
    const matches = content.match(routePattern);
    
    if (matches) {
      endpoints.push(...matches.map(m => m.replace(/["']/g, '')));
    }
    
    // Also check for imported API handlers
    // Look for imports from src/api/**
    const importPattern = /import\s+.*\s+from\s+['"][^'"]*\/api\/[^'"]+['"]/g;
    const importMatches = content.match(importPattern);
    
    if (importMatches) {
      // Extract the paths from the imports by checking the API files themselves
      for (const importMatch of importMatches) {
        const pathMatch = importMatch.match(/from\s+['"](.*)['"]/);
        if (pathMatch) {
          const importPath = pathMatch[1];
          // This indicates an API file is being used
          console.log(`  Found API import: ${importPath}`);
        }
      }
    }
    
    return [...new Set(endpoints)]; // Remove duplicates
  } catch (error) {
    return [];
  }
}

/**
 * Analyze an API file to extract methods and controllers
 */
async function analyzeApiFile(filePath: string): Promise<ApiEndpoint[]> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const endpoints: ApiEndpoint[] = [];
    
    // Extract the route path from the file (assuming it's defined in the type or export)
    const pathMatch = content.match(/BunRequest<['"]([^'"]+)['"]/);
    const routePath = pathMatch ? pathMatch[1] : null;
    
    if (!routePath) {
      return endpoints;
    }
    
    // Use AST parsing to extract which controller is used by each method
    const methodControllerMap = extractMethodControllerMap(content);
    
    // Find HTTP methods (GET, POST, PUT, PATCH, DELETE, etc.)
    const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    
    for (const method of httpMethods) {
      // Check if method is implemented in the Partial<Record<...>>
      const methodPattern = new RegExp(`${method}\\s*:\\s*`, 'i');
      if (methodPattern.test(content)) {
        // Get the specific controller(s) for this method
        const controllersForMethod = methodControllerMap[method];
        const controller = controllersForMethod && controllersForMethod.length > 0
          ? controllersForMethod.join(', ')
          : null;
        
        endpoints.push({
          path: routePath,
          method: method,
          file: filePath,
          controller: controller
        });
      }
    }
    
    return endpoints;
  } catch (error) {
    return [];
  }
}

/**
 * Main function to generate the API graph
 */
async function generateApiGraph(projectRoot: string): Promise<void> {
  console.log('🔍 Analyzing API usage...\n');
  
  // 1. Find index.tsx
  const indexPath = join(projectRoot, 'src', 'index.tsx');
  
  // 2. Extract used endpoints from index.tsx (for reference)
  const usedEndpoints = await extractUsedEndpoints(indexPath);
  
  if (usedEndpoints.length > 0) {
    console.log(`📍 Found ${usedEndpoints.length} endpoint(s) referenced in src/index.tsx:\n`);
    usedEndpoints.forEach(endpoint => console.log(`   ${endpoint}`));
    console.log();
  }
  
  // 3. Find all API files
  const apiDir = join(projectRoot, 'src', 'api');
  const apiFiles = await findFiles(apiDir, /^api\..*\.ts$/);
  
  // Filter out test files
  const nonTestApiFiles = apiFiles.filter(file => !file.includes('.test.'));
  
  if (nonTestApiFiles.length === 0) {
    console.log('❌ No API files found in src/api/\n');
    console.log('💡 API files should be named: api.<name>.ts');
    console.log('   Example: src/api/users/api.get-users.ts\n');
    return;
  }
  
  console.log(`📁 Found ${nonTestApiFiles.length} API file(s)\n`);
  
  // 4. Analyze each API file
  const allEndpoints: ApiEndpoint[] = [];
  
  for (const apiFile of nonTestApiFiles) {
    const endpoints = await analyzeApiFile(apiFile);
    allEndpoints.push(...endpoints);
  }
  
  if (allEndpoints.length === 0) {
    console.log('❌ No endpoints could be extracted from API files\n');
    console.log('💡 Make sure your API files have the correct format:\n');
    console.log('   - Type annotation: BunRequest<\'/api/your-path\'>');
    console.log('   - HTTP methods defined: GET, POST, etc.\n');
    return;
  }
  
  // 5. Generate ASCII graph
  console.log('📊 API Endpoint Graph:\n');
  console.log('━'.repeat(60));
  
  // Group by path
  const groupedByPath = allEndpoints.reduce((acc, endpoint) => {
    if (!acc[endpoint.path]) {
      acc[endpoint.path] = [];
    }
    acc[endpoint.path].push(endpoint);
    return acc;
  }, {} as Record<string, ApiEndpoint[]>);
  
  // Sort paths alphabetically
  const sortedPaths = Object.keys(groupedByPath).sort();
  
  for (const path of sortedPaths) {
    const endpoints = groupedByPath[path];
    
    // Sort methods by common order
    const methodOrder = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    endpoints.sort((a, b) => methodOrder.indexOf(a.method) - methodOrder.indexOf(b.method));
    
    for (const endpoint of endpoints) {
      // Check if this endpoint is referenced in index.tsx
      const isUsed = usedEndpoints.some(used => 
        used === endpoint.path || used.startsWith(endpoint.path.replace(/\/:[^/]+/g, '/'))
      );
      const marker = isUsed ? '✓' : ' ';
      
      // Format controller info
      const ctrlInfo = endpoint.controller
        ? ` → ${endpoint.controller}`
        : '';
      
      console.log(`${marker} ${endpoint.method.padEnd(7)} ${endpoint.path}${ctrlInfo}`);
    }
  }
  
  console.log('━'.repeat(60));
  console.log();
  console.log('Legend:');
  console.log('  ✓ = Referenced in src/index.tsx');
  console.log('    = Not yet registered in routes\n');
}

// Run the script
const projectRoot = process.cwd();
generateApiGraph(projectRoot).catch(console.error);
