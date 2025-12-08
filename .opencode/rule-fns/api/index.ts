import { TRuleResult } from "../rule-types";
import { isTestFile } from "../../helper-fns/isTestFile";
import { isInApiFolder } from "../../helper-fns/isInWhichFolder";
import { ruleApiFileName } from "./rule.api.file-name";
import { ruleApiImportsElysia } from "./rule.api.imports-elysia";
import { ruleApiDefaultExportIsElysia } from "./rule.api.default-export-is-elysia";
import { ruleApiElysiaHasPrefix } from "./rule.api.elysia-has-prefix";
import { ruleApiImportsController } from "./rule.api.imports-controller";

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

    if (!isInApiFolder({ directory: output.directory, filePath: output.filePath })) {
        return result;
    }
    
    // Skip test files
    if (isTestFile({ filePath: output.filePath })) {
        return result;
    }
    
    // Path-based checks only (no parsing)
    const r1 = await ruleApiFileName(output);
    if (r1) result.push(r1);
    
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
    
    if (!isInApiFolder({ directory: output.directory, filePath: output.filePath })) {
        return result;
    }
    
    // Skip test files
    if (isTestFile({ filePath: output.filePath })) {
        return result;
    }
    
    // Path-based checks only (no parsing)
    const r1 = await ruleApiFileName(output);
    if (r1) result.push(r1);
    
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
    
    if (!isInApiFolder({ directory: output.directory, filePath: output.filePath })) {
        return result;
    }
    
    // Skip test files
    if (isTestFile({ filePath: output.filePath })) {
        return result;
    }
    
    // All checks (path + content)
    const r1 = await ruleApiFileName(output);
    if (r1) result.push(r1);
    
    const r2 = await ruleApiImportsElysia(output);
    if (r2) result.push(r2);
    
    const r3 = await ruleApiDefaultExportIsElysia(output);
    if (r3) result.push(r3);
    
    const r4 = await ruleApiElysiaHasPrefix(output);
    if (r4) result.push(r4);
    
    const r5 = await ruleApiImportsController(output);
    if (r5) result.push(r5);
    
    // Add hint message
    result.push({
        message: "<hint>Add this API route to src/api-router.ts using .use()</hint>"
    });
    
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
    
    if (!isInApiFolder({ directory: output.directory, filePath: output.filePath })) {
        return result;
    }
    
    // Skip test files
    if (isTestFile({ filePath: output.filePath })) {
        return result;
    }
    
    // All checks (path + content)
    const r1 = await ruleApiFileName(output);
    if (r1) result.push(r1);
    
    const r2 = await ruleApiImportsElysia(output);
    if (r2) result.push(r2);
    
    const r3 = await ruleApiDefaultExportIsElysia(output);
    if (r3) result.push(r3);
    
    const r4 = await ruleApiElysiaHasPrefix(output);
    if (r4) result.push(r4);
    
    const r5 = await ruleApiImportsController(output);
    if (r5) result.push(r5);
    
    // Add hint message
    result.push({
        message: "<hint>Add this API route to src/api-router.ts using .use()</hint>"
    });
    
    return result;
  }

export default {
    checkBeforeWrite,
    checkBeforeEdit,
    checkAfterWrite,
    checkAfterEdit
}