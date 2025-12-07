import { TRuleResult } from "../rule-types";
import { isTestFile } from "../../helper-fns/isTestFile";
import { ruleGenNoTsFileInRoot } from "./rule.gen.no-ts-file-in-root";
import { ruleGenNoJsFiles } from "./rule.gen.no-js-files";
import { ruleGenDocumentation } from "./rule.gen.documentation";

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
    
    // Path-based checks only (no parsing)
    const r1 = await ruleGenNoTsFileInRoot(output);
    if (r1) result.push(r1);
    
    const r2 = await ruleGenNoJsFiles(output);
    if (r2) result.push(r2);

    const r3 = await ruleGenDocumentation(output);
    if (r3) result.push(r3);
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
    
    // Path-based checks only (no parsing)
    const r1 = await ruleGenNoTsFileInRoot(output);
    if (r1) result.push(r1);
    
    const r2 = await ruleGenNoJsFiles(output);
    if (r2) result.push(r2);

    const r3 = await ruleGenDocumentation(output);
    if (r3) result.push(r3);
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
    
    return result;
  }