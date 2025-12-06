#!/usr/bin/env bun

import { exists, unlink, rm, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';

// Global constant for database storage directory
const DATABASE_STORAGE_DIR = 'database-storage';

// Get database name from command line arguments
const dbName = process.argv[2];
const forceFlag = process.argv.includes('--force') || process.argv.includes('-f');

if (!dbName) {
  console.error('Error: Database name is required');
  console.log('Usage: bun run .opencode/scripts/delete-database.ts <db-name> [--force|-f]');
  process.exit(1);
}

// Validate database name is URL-safe and a single word
const urlSafePattern = /^[a-zA-Z0-9_-]+$/;
if (!urlSafePattern.test(dbName)) {
  console.error('Error: Database name must be URL-safe and a single word');
  console.error('   Only alphanumeric characters, hyphens, and underscores are allowed');
  console.error(`   Got: "${dbName}"`);
  process.exit(1);
}

// Define paths
const projectRoot = resolve(import.meta.dir, '../..');
const databaseDir = join(projectRoot, DATABASE_STORAGE_DIR);
const dbFilePath = join(databaseDir, `${dbName}.sqlite`);
const drizzleConfigPath = join(projectRoot, `drizzle.${dbName}.ts`);
const dbSpecificDir = join(projectRoot, 'src/database', dbName);
const schemaPath = join(dbSpecificDir, `schema.${dbName}.ts`);
const connPath = join(dbSpecificDir, `conn.${dbName}.ts`);
const drizzleOutputDir = join(projectRoot, 'drizzle', dbName);

async function checkFilesExist() {
  const dbExists = await exists(dbFilePath);
  const configExists = await exists(drizzleConfigPath);
  const schemaExists = await exists(schemaPath);
  const connExists = await exists(connPath);
  const dbSpecificDirExists = await exists(dbSpecificDir);
  const drizzleDirExists = await exists(drizzleOutputDir);
  
  return { dbExists, configExists, schemaExists, connExists, dbSpecificDirExists, drizzleDirExists };
}

async function deleteDatabase() {
  const { dbExists, configExists, schemaExists, connExists, dbSpecificDirExists, drizzleDirExists } = await checkFilesExist();
  
  // Check if any database files exist
  if (!dbExists && !configExists && !schemaExists && !connExists && !dbSpecificDirExists && !drizzleDirExists) {
    console.error(`\nError: Database "${dbName}" does not exist!`);
    console.error('No database files found to delete.');
    process.exit(1);
  }

  // Show what will be deleted
  console.log(`\nDatabase "${dbName}" found. The following files will be deleted:`);
  if (dbExists) console.log(`   - Database file: ${dbFilePath}`);
  if (configExists) console.log(`   - Drizzle config: ${drizzleConfigPath}`);
  if (schemaExists) console.log(`   - Schema file: ${schemaPath}`);
  if (connExists) console.log(`   - Connection file: ${connPath}`);
  if (dbSpecificDirExists) console.log(`   - Database directory: ${dbSpecificDir}`);
  if (drizzleDirExists) console.log(`   - Drizzle output directory: ${drizzleOutputDir}`);

  // Safety confirmation (skip with --force flag)
  if (!forceFlag) {
    console.log('\n⚠️  WARNING: This action cannot be undone!');
    console.log('Type the database name to confirm deletion:');
    
    const readline = await import('node:readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise<string>((resolve) => {
      rl.question('> ', resolve);
    });
    
    rl.close();
    
    if (answer !== dbName) {
      console.log('\n❌ Deletion cancelled. Database name did not match.');
      process.exit(0);
    }
  }

  console.log(`\nDeleting database: ${dbName}\n`);

  let deletedCount = 0;
  const errors: string[] = [];

  // Delete database file and all related SQLite files (WAL, SHM, etc.)
  if (dbExists) {
    try {
      // Get all files in the database-storage directory
      const files = await readdir(databaseDir);
      
      // Filter files that match the pattern: <dbName>.sqlite*
      const dbFiles = files.filter(file => file.startsWith(`${dbName}.sqlite`));
      
      // Delete each matching file
      for (const file of dbFiles) {
        const filePath = join(databaseDir, file);
        try {
          await unlink(filePath);
          console.log(`[✓] Deleted database file: ${DATABASE_STORAGE_DIR}/${file}`);
          deletedCount++;
        } catch (error) {
          const errorMsg = `Failed to delete ${file}: ${error}`;
          console.log(`[✗] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }
      
      if (dbFiles.length === 0) {
        console.log(`[!] No database files found matching ${dbName}.sqlite*`);
      }
    } catch (error) {
      const errorMsg = `Failed to read database directory: ${error}`;
      console.log(`[✗] ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  // Delete drizzle config
  if (configExists) {
    try {
      await unlink(drizzleConfigPath);
      console.log(`[✓] Deleted Drizzle config: drizzle.${dbName}.ts`);
      deletedCount++;
    } catch (error) {
      const errorMsg = `Failed to delete drizzle config: ${error}`;
      console.log(`[✗] ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  // Delete database-specific directory (contains schema and connection files)
  if (dbSpecificDirExists) {
    try {
      await rm(dbSpecificDir, { recursive: true, force: true });
      console.log(`[✓] Deleted database directory: src/database/${dbName}/`);
      deletedCount++;
    } catch (error) {
      const errorMsg = `Failed to delete database directory: ${error}`;
      console.log(`[✗] ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  // Delete drizzle output directory
  if (drizzleDirExists) {
    try {
      await rm(drizzleOutputDir, { recursive: true, force: true });
      console.log(`[✓] Deleted Drizzle output directory: drizzle/${dbName}/`);
      deletedCount++;
    } catch (error) {
      const errorMsg = `Failed to delete drizzle output directory: ${error}`;
      console.log(`[✗] ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  // Summary
  console.log('\n==============================================');
  if (errors.length === 0) {
    console.log('Database deletion complete!');
    console.log(`Successfully deleted ${deletedCount} files/directories.`);
  } else {
    console.log('Database deletion completed with errors:');
    console.log(`- Successfully deleted: ${deletedCount} files/directories`);
    console.log(`- Errors encountered: ${errors.length}`);
    console.log('\nErrors:');
    errors.forEach(error => console.log(`  - ${error}`));
  }
  console.log('==============================================\n');

  if (errors.length > 0) {
    process.exit(1);
  }
}

// Run the deletion
deleteDatabase().catch((error) => {
  console.error('\nError deleting database:', error);
  process.exit(1);
});