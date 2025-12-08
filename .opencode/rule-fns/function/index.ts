import { TRuleResult } from "../rule-types";
import { isTestFile } from "../../helper-fns/isTestFile";
import path from "node:path";

// Import all function rules
import { ruleFunctionFileName } from "./rule.fn.file-name";
import { ruleFunctionPathDepth } from "./rule.fn.path-depth";
import { ruleFunctionDefaultExport } from "./rule.fn.default-export";
import { ruleFunctionDefaultExportIsFunction } from "./rule.fn.default-export-is-function";
import { ruleFnReturnType } from "./rule.fn.return-type";
import { ruleFnParameterCount } from "./rule.fn.parameter-count";
import { ruleFxReturnType } from "./rule.fx.return-type";
import { ruleFxParameterCount } from "./rule.fx.parameter-count";
import { ruleFxFirstParameterType } from "./rule.fx.first-parameter-type";
import { ruleTxReturnType } from "./rule.tx.return-type";
import { ruleTxParameterCount } from "./rule.tx.parameter-count";
import { ruleTxFirstParameterType } from "./rule.tx.first-parameter-type";
import { ruleDatabaseConnectionImportsAreTypeOnly } from "./rule.fn.db-imports-type-only";
import { ruleDbPortalType } from "./rule.fn.db-portal-type";
import { ruleTestFileImportsTestingDb } from "./rule.fn.test-imports-testing-db";
import { ruleSingleFunctionExport } from "./rule.fn.single-function-export";
import { isInFunctionFolder } from "../../helper-fns/isInWhichFolder";

// Helper functions to check function type
function isFnFunction(filePath: string): boolean {
    const fileName = path.basename(filePath, ".ts");
    return fileName.startsWith("fn.");
}

function isFxFunction(filePath: string): boolean {
    const fileName = path.basename(filePath, ".ts");
    return fileName.startsWith("fx.");
}

function isTxFunction(filePath: string): boolean {
    const fileName = path.basename(filePath, ".ts");
    return fileName.startsWith("tx.");
}


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
    
    if (!isInFunctionFolder({ directory: output.directory, filePath: output.filePath })) {
        return result;
    }
    
    // Skip test files
    if (isTestFile({ filePath: output.filePath })) {
        return result;
    }

    // Path-based checks only (no parsing)
    const r1 = await ruleFunctionFileName(output);
    if (r1) result.push(r1);
    
    const r2 = await ruleFunctionPathDepth(output);
    if (r2) result.push(r2);
    
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
    
    // Skip test files
    if (isTestFile({ filePath: output.filePath })) {
        return result;
    }
    
    // Only apply to function folder
    if (!isInFunctionFolder({ directory: output.directory, filePath: output.filePath })) {
        return result;
    }
    
    // Path-based checks only (no parsing)
    const r1 = await ruleFunctionFileName(output);
    if (r1) result.push(r1);
    
    const r2 = await ruleFunctionPathDepth(output);
    if (r2) result.push(r2);
    
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
    
    // Skip test files - they have different checks
    if (isTestFile({ filePath: output.filePath })) {
        const rTest = await ruleTestFileImportsTestingDb(output);
        if (rTest) result.push(rTest);
        return result;
    }
    
    // Only apply to function folder
    if (!isInFunctionFolder({ directory: output.directory, filePath: output.filePath })) {
        return result;
    }
    
    // All checks (path + content)
    const r1 = await ruleFunctionFileName(output);
    if (r1) result.push(r1);
    
    const r2 = await ruleFunctionPathDepth(output);
    if (r2) result.push(r2);
    
    const r3 = await ruleFunctionDefaultExport(output);
    if (r3) result.push(r3);
    
    const r4 = await ruleFunctionDefaultExportIsFunction(output);
    if (r4) result.push(r4);
    
    // Check return types and parameters based on function prefix
    if (isFnFunction(output.filePath)) {
        const r5 = await ruleFnReturnType(output);
        if (r5) result.push(r5);
        
        const r6 = await ruleFnParameterCount(output);
        if (r6) result.push(r6);
    }
    
    if (isFxFunction(output.filePath)) {
        const r7 = await ruleFxReturnType(output);
        if (r7) result.push(r7);
        
        const r8 = await ruleFxParameterCount(output);
        if (r8) result.push(r8);
        
        const r9 = await ruleFxFirstParameterType(output);
        if (r9) result.push(r9);
    }
    
    if (isTxFunction(output.filePath)) {
        const r10 = await ruleTxReturnType(output);
        if (r10) result.push(r10);
        
        const r11 = await ruleTxParameterCount(output);
        if (r11) result.push(r11);
        
        const r12 = await ruleTxFirstParameterType(output);
        if (r12) result.push(r12);
    }
    
    // Check db portal type for effectful and transactional functions
    if (isFxFunction(output.filePath) || isTxFunction(output.filePath)) {
        const r13 = await ruleDbPortalType(output);
        if (r13) result.push(r13);
    }
    
    // Check that database connection imports are type-only
    const r14 = await ruleDatabaseConnectionImportsAreTypeOnly(output);
    if (r14) result.push(r14);

    // Check single file, single function principle
    const r15 = await ruleSingleFunctionExport(output);
    if (r15) result.push(r15);

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
    
    // Skip test files - they have different checks
    if (isTestFile({ filePath: output.filePath })) {
        const rTest = await ruleTestFileImportsTestingDb(output);
        if (rTest) result.push(rTest);
        return result;
    }
    
    // Only apply to function folder
    if (!isInFunctionFolder({ directory: output.directory, filePath: output.filePath })) {
        return result;
    }
    
    // All checks (path + content)
    const r1 = await ruleFunctionFileName(output);
    if (r1) result.push(r1);
    
    const r2 = await ruleFunctionPathDepth(output);
    if (r2) result.push(r2);
    
    const r3 = await ruleFunctionDefaultExport(output);
    if (r3) result.push(r3);
    
    const r4 = await ruleFunctionDefaultExportIsFunction(output);
    if (r4) result.push(r4);
    
    // Check return types and parameters based on function prefix
    if (isFnFunction(output.filePath)) {
        const r5 = await ruleFnReturnType(output);
        if (r5) result.push(r5);
        
        const r6 = await ruleFnParameterCount(output);
        if (r6) result.push(r6);
    }
    
    if (isFxFunction(output.filePath)) {
        const r7 = await ruleFxReturnType(output);
        if (r7) result.push(r7);
        
        const r8 = await ruleFxParameterCount(output);
        if (r8) result.push(r8);
        
        const r9 = await ruleFxFirstParameterType(output);
        if (r9) result.push(r9);
    }
    
    if (isTxFunction(output.filePath)) {
        const r10 = await ruleTxReturnType(output);
        if (r10) result.push(r10);
        
        const r11 = await ruleTxParameterCount(output);
        if (r11) result.push(r11);
        
        const r12 = await ruleTxFirstParameterType(output);
        if (r12) result.push(r12);
    }
    
    // Check db portal type for effectful and transactional functions
    if (isFxFunction(output.filePath) || isTxFunction(output.filePath)) {
        const r13 = await ruleDbPortalType(output);
        if (r13) result.push(r13);
    }
    
    // Check that database connection imports are type-only
    const r14 = await ruleDatabaseConnectionImportsAreTypeOnly(output);
    if (r14) result.push(r14);

    // Check single file, single function principle
    const r15 = await ruleSingleFunctionExport(output);
    if (r15) result.push(r15);

    return result;
  }
