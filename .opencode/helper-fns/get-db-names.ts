import * as fs from "node:fs";
import path from "node:path";
import { fileLog } from "./file-logger";


/**
 * Get all database variable names from conn.*.ts files
 * Pattern: finds variables that end with "Db" (e.g., booksDb, usersDb)
 */
export async function getDatabaseVariableNames(directory: string): Promise<string[]> {
    const dbVariables: string[] = [];
    
    try {
        // Find all conn.*.ts files in src/database directory
        const databaseDir = path.join(directory, "src", "database");
        
        if (!fs.existsSync(databaseDir)) {
            return dbVariables;
        }
        
        // Recursively find all conn.*.ts files
        const findConnFiles = (dir: string): string[] => {
            const files: string[] = [];
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    files.push(...findConnFiles(fullPath));
                } else if (entry.isFile() && entry.name.startsWith("conn.") && entry.name.endsWith(".ts")) {
                    files.push(fullPath);
                }
            }
            
            return files;
        };
        
        const connFiles = findConnFiles(databaseDir);
        
        for (const connFile of connFiles) {
            try {
                const content = fs.readFileSync(connFile, 'utf-8');
                
                // Find export statements with pattern: export const <name>Db = ...
                const exportRegex = /export\s+const\s+(\w+Db)\s*=/g;
                let match;
                
                while ((match = exportRegex.exec(content)) !== null) {
                    dbVariables.push(match[1]);
                }
            } catch (error) {
                fileLog("dbPortalRule", `Error reading ${connFile}: ${error}`);
            }
        }
        
    } catch (error) {
        fileLog("dbPortalRule", `Error scanning database files: ${error}`);
    }
    
    return dbVariables;
}