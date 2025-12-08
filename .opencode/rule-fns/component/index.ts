import { TRuleResult } from "../rule-types";
import { isTestFile } from "../../helper-fns/isTestFile";
import { ruleComponentFileName } from "./rule.comp.file-name";
import path from "node:path";

function isComponentFolder(args: { directory: string, filePath: string }): boolean {
    const relativePath = path.relative(args.directory, args.filePath);
    if (!relativePath.startsWith("src/component/")) {
        return false;
    }

    return true;
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
    
    // Skip test files
    if (isTestFile({ filePath: output.filePath })) {
        return result;
    }
    
    // Only check component folder
    if (!isComponentFolder(output)) {
        return result;
    }
    
    // Path-based checks only (no parsing)
    const r1 = await ruleComponentFileName(output);
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
    
    // Skip test files
    if (isTestFile({ filePath: output.filePath })) {
        return result;
    }
    
    // Only check component folder
    if (!isComponentFolder(output)) {
        return result;
    }
    
    // Path-based checks only (no parsing)
    const r1 = await ruleComponentFileName(output);
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
    
    // Skip test files
    if (isTestFile({ filePath: output.filePath })) {
        return result;
    }
    
    // Only check component folder
    if (!isComponentFolder(output)) {
        return result;
    }
    
    // Path-based checks only (no parsing)
    const r1 = await ruleComponentFileName(output);
    if (r1) result.push(r1);
    
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
    
    // Skip test files
    if (isTestFile({ filePath: output.filePath })) {
        return result;
    }
    
    // Only check component folder
    if (!isComponentFolder(output)) {
        return result;
    }
    
    // Path-based checks only (no parsing)
    const r1 = await ruleComponentFileName(output);
    if (r1) result.push(r1);
    
    return result;
  }