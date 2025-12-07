import { TRuleResult } from "../rule-types";
import { isTestFile } from "../../helper-fns/isTestFile";
import { ruleControllerFileName } from "./rule.ctrl.file-name";
import { ruleControllerDefaultExport } from "./rule.ctrl.default-export";
import { ruleControllerDefaultExportIsFunction } from "./rule.ctrl.default-export-is-function";
import { ruleControllerParameterCount } from "./rule.ctrl.parameter-count";
import { ruleControllerFirstParameterIsPortal } from "./rule.ctrl.first-parameter-is-portal";
import { ruleControllerSecondParameterIsArgs } from "./rule.ctrl.second-parameter-is-args";
import { ruleControllerReturnType } from "./rule.ctrl.return-type";
import { rulePortalDoesNotContainFunctions } from "./rule.ctrl.portal-does-not-contain-functions";

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
    const r1 = await ruleControllerFileName(output);
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
    
    // Path-based checks only (no parsing)
    const r1 = await ruleControllerFileName(output);
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
    
    // All checks (path + content)
    const r1 = await ruleControllerFileName(output);
    if (r1) result.push(r1);
    
    const r2 = await ruleControllerDefaultExport(output);
    if (r2) result.push(r2);
    
    const r3 = await ruleControllerDefaultExportIsFunction(output);
    if (r3) result.push(r3);
    
    const r4 = await ruleControllerParameterCount(output);
    if (r4) result.push(r4);
    
    const r5 = await ruleControllerFirstParameterIsPortal(output);
    if (r5) result.push(r5);
    
    const r6 = await ruleControllerSecondParameterIsArgs(output);
    if (r6) result.push(r6);
    
    const r7 = await ruleControllerReturnType(output);
    if (r7) result.push(r7);
    
    const r8 = await rulePortalDoesNotContainFunctions(output);
    if (r8) result.push(r8);
    
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
    
    // All checks (path + content)
    const r1 = await ruleControllerFileName(output);
    if (r1) result.push(r1);
    
    const r2 = await ruleControllerDefaultExport(output);
    if (r2) result.push(r2);
    
    const r3 = await ruleControllerDefaultExportIsFunction(output);
    if (r3) result.push(r3);
    
    const r4 = await ruleControllerParameterCount(output);
    if (r4) result.push(r4);
    
    const r5 = await ruleControllerFirstParameterIsPortal(output);
    if (r5) result.push(r5);
    
    const r6 = await ruleControllerSecondParameterIsArgs(output);
    if (r6) result.push(r6);
    
    const r7 = await ruleControllerReturnType(output);
    if (r7) result.push(r7);
    
    const r8 = await rulePortalDoesNotContainFunctions(output);
    if (r8) result.push(r8);
    
    return result;
  }
