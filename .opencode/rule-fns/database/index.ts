import { TRuleResult } from "../rule-types";
import { isTestFile } from "../../helper-fns/isTestFile";
import { ruleDatabaseFileName } from "./rule.database.file-name";
import { ruleDatabaseFileNameMatchesDirectory } from "./rule.database.file-name-matches-directory";
import { ruleDatabasePathDepth } from "./rule.database.path-depth";
import { ruleNotBetterAuthSchema } from "./rule.database.not-better-auth-schema";
import { isInDatabaseFolder } from "../../helper-fns/isInWhichFolder";

export async function checkBeforeWrite(input: {
    tool: string;
    sessionID: string;
    callID: string;
  }, output: {
    directory: string;
    content: string;
    filePath: string;
  }) {
    const result: TRuleResult[] = [];
    
    if (!isInDatabaseFolder({ directory: output.directory, filePath: output.filePath })) {
        return result;
    }
    
    // Skip test files
    if (isTestFile({ filePath: output.filePath })) {
        return result;
    }
    
    // Apply database rules
    const r1 = await ruleNotBetterAuthSchema(output);
    if (r1) result.push(r1);
    
    const r2 = await ruleDatabaseFileName(output);
    if (r2) result.push(r2);
    
    const r3 = await ruleDatabaseFileNameMatchesDirectory(output);
    if (r3) result.push(r3);
    
    const r4 = await ruleDatabasePathDepth(output);
    if (r4) result.push(r4);
    
    return result;
  }

export async function checkBeforeEdit(input: {
    tool: string;
    sessionID: string;
    callID: string;
  }, output: {
    directory: string;
    content: string;
    filePath: string;
  }) {
    const result: TRuleResult[] = [];
    
    if (!isInDatabaseFolder({ directory: output.directory, filePath: output.filePath })) {
        return result;
    }
    
    // Skip test files
    if (isTestFile({ filePath: output.filePath })) {
        return result;
    }
    
    // Apply database rules
    const r1 = await ruleNotBetterAuthSchema(output);
    if (r1) result.push(r1);
    
    const r2 = await ruleDatabaseFileName(output);
    if (r2) result.push(r2);
    
    const r3 = await ruleDatabaseFileNameMatchesDirectory(output);
    if (r3) result.push(r3);
    
    const r4 = await ruleDatabasePathDepth(output);
    if (r4) result.push(r4);
    
    return result;
  }

export async function checkAfterWrite(input: {
    tool: string;
    sessionID: string;
    callID: string;
  }, output: {
    directory: string;
    content: string;
    filePath: string;
  }) {
    const result: TRuleResult[] = [];
    
    if (!isInDatabaseFolder({ directory: output.directory, filePath: output.filePath })) {
        return result;
    }
    
    // Skip test files
    if (isTestFile({ filePath: output.filePath })) {
        return result;
    }
    
    // For database files, we only need path-based checks
    const r2 = await ruleDatabaseFileName(output);
    if (r2) result.push(r2);
    
    const r3 = await ruleDatabaseFileNameMatchesDirectory(output);
    if (r3) result.push(r3);
    
    const r4 = await ruleDatabasePathDepth(output);
    if (r4) result.push(r4);
    
    return result;
  }

export async function checkAfterEdit(input: {
    tool: string;
    sessionID: string;
    callID: string;
  }, output: {
    directory: string;
    content: string;
    filePath: string;
  }) {
    const result: TRuleResult[] = [];
    
    if (!isInDatabaseFolder({ directory: output.directory, filePath: output.filePath })) {
        return result;
    }
    
    // Skip test files
    if (isTestFile({ filePath: output.filePath })) {
        return result;
    }
    
    // For database files, we only need path-based checks
    const r2 = await ruleDatabaseFileName(output);
    if (r2) result.push(r2);
    
    const r3 = await ruleDatabaseFileNameMatchesDirectory(output);
    if (r3) result.push(r3);
    
    const r4 = await ruleDatabasePathDepth(output);
    if (r4) result.push(r4);
    
    return result;
  }