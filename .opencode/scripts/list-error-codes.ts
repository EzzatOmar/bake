#!/usr/bin/env bun

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

interface ErrorUsage {
  errorCode: string;
  usedIn: string[];
  isUsed: boolean;
}

/**
 * Parses the error enum file to extract all error codes using regex
 */
function parseErrorCodes(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf-8');
  const errorCodes: string[] = [];
  
  // Find all enum members using regex
  // Match pattern: ENUM_MEMBER_NAME,
  const enumMemberRegex = /^\s*([A-Z_][A-Z0-9_]*)\s*,?\s*$/gm;
  let match: RegExpExecArray | null;
  
  // First find the ErrCode enum block
  const enumBlockMatch = content.match(/export\s+enum\s+ErrCode\s*\{([\s\S]*?)\}/);
  
  if (enumBlockMatch) {
    const enumContent = enumBlockMatch[1];
    while ((match = enumMemberRegex.exec(enumContent)) !== null) {
      errorCodes.push(match[1]);
    }
  }
  
  return errorCodes;
}

/**
 * Recursively gets all TypeScript files in a directory
 */
function getAllTsFiles(dir: string, ignoreDirs: string[] = ['error']): string[] {
  const files: string[] = [];
  
  try {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip ignored directories
        if (ignoreDirs.includes(item)) continue;
        // Skip test files directory
        if (item.includes('test')) continue;
        files.push(...getAllTsFiles(fullPath, ignoreDirs));
      } else if (item.endsWith('.ts') && !item.endsWith('.test.ts')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error);
  }
  
  return files;
}

/**
 * Searches for usage of error codes in TypeScript files
 */
function findErrorUsage(errorCodes: string[], searchDir: string): ErrorUsage[] {
  const files = getAllTsFiles(searchDir);
  
  const usage: ErrorUsage[] = errorCodes.map(code => ({
    errorCode: code,
    usedIn: [],
    isUsed: false,
  }));

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      
      for (const errorUsage of usage) {
        // Check if error code is used in this file
        // Look for ErrCode.ERROR_CODE or just ERROR_CODE
        const patterns = [
          `ErrCode.${errorUsage.errorCode}`,
          errorUsage.errorCode
        ];
        
        if (patterns.some(pattern => content.includes(pattern))) {
          errorUsage.usedIn.push(file);
          errorUsage.isUsed = true;
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read file ${file}:`, error);
    }
  }

  return usage;
}

/**
 * Main function to run the error code analysis
 */
function main() {
  const projectRoot = process.cwd();
  const errorEnumPath = join(projectRoot, 'src/error/err.enum.ts');
  const searchDir = join(projectRoot, 'src');

  console.log('🔍 Analyzing error codes...\n');

  try {
    // Parse error codes from enum
    const errorCodes = parseErrorCodes(errorEnumPath);
    console.log(`Found ${errorCodes.length} error codes in err.enum.ts\n`);

    // Find usage of each error code
    const usage = findErrorUsage(errorCodes, searchDir);

    // Display results
    console.log('📊 Error Code Usage Report:\n');
    console.log('='.repeat(80));

    let usedCount = 0;
    let unusedCount = 0;

    for (const errorUsage of usage) {
      if (errorUsage.isUsed) {
        usedCount++;
        console.log(`✅ ${errorUsage.errorCode}`);
        for (const file of errorUsage.usedIn) {
          const relativePath = relative(projectRoot, file);
          console.log(`   📁 ${relativePath}`);
        }
        console.log('');
      } else {
        unusedCount++;
        console.log(`❌ ${errorUsage.errorCode}`);
        console.log(`   ⚠️  NOT USED - Consider removing this error code from src/error/err.enum.ts`);
        console.log('');
      }
    }

    console.log('='.repeat(80));
    console.log(`📈 Summary: ${usedCount} used, ${unusedCount} unused out of ${errorCodes.length} total error codes\n`);

    if (unusedCount > 0) {
      console.log('💡 Recommendation: Remove unused error codes to keep the enum clean and maintainable.');
    }

  } catch (error) {
    console.error('❌ Error analyzing error codes:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.main) {
  main();
}