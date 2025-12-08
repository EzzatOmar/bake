import { TRuleResult } from "../rule-types";
import { isTestFile } from "../../helper-fns/isTestFile";
import { ruleGenNoTsFileInRoot } from "./rule.gen.no-ts-file-in-root";
import { ruleGenNoJsFiles } from "./rule.gen.no-js-files";
import { ruleGenDocumentation } from "./rule.gen.documentation";
import { ruleGenTestDescribeWrapper } from "./rule.gen.test-describe-wrapper";
import { ruleNoApiRoutesInRoutes } from "./rule.gen.no-api-routes-in-routes";

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

    // Test file specific rules
    if (isTestFile({ filePath: output.filePath })) {
        const r1 = await ruleGenTestDescribeWrapper(output);
        if (r1) result.push(r1);
    } else {
        // Content-based checks for non-test files
        const r1 = await ruleNoApiRoutesInRoutes(output);
        if (r1) result.push(r1);
    }

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

    // Test file specific rules
    if (isTestFile({ filePath: output.filePath })) {
        const r1 = await ruleGenTestDescribeWrapper(output);
        if (r1) result.push(r1);
    } else {
        // Content-based checks for non-test files
        const r1 = await ruleNoApiRoutesInRoutes(output);
        if (r1) result.push(r1);
    }

    return result;
  }
