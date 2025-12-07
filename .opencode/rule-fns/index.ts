import { TRuleResult } from "./rule-types";
import * as general from "./general";
import * as api from "./api";
import * as controller from "./controller";
import * as database from "./database";
import * as fn from "./function";

export type { TRuleResult } from "./rule-types";

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
    
    // Run all rule categories
    const generalResults = await general.checkBeforeWrite(input, output);
    const apiResults = await api.checkBeforeWrite(input, output);
    const controllerResults = await controller.checkBeforeWrite(input, output);
    const databaseResults = await database.checkBeforeWrite(input, output);
    const functionResults = await fn.checkBeforeWrite(input, output);
    
    result.push(...generalResults, ...apiResults, ...controllerResults, ...databaseResults, ...functionResults);
    
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
    
    // Run all rule categories
    const generalResults = await general.checkBeforeEdit(input, output);
    const apiResults = await api.checkBeforeEdit(input, output);
    const controllerResults = await controller.checkBeforeEdit(input, output);
    const databaseResults = await database.checkBeforeEdit(input, output);
    const functionResults = await fn.checkBeforeEdit(input, output);
    
    result.push(...generalResults, ...apiResults, ...controllerResults, ...databaseResults, ...functionResults);
    
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
    
    // Run all rule categories
    const generalResults = await general.checkAfterWrite(input, output);
    const apiResults = await api.checkAfterWrite(input, output);
    const controllerResults = await controller.checkAfterWrite(input, output);
    const databaseResults = await database.checkAfterWrite(input, output);
    const functionResults = await fn.checkAfterWrite(input, output);
    
    result.push(...generalResults, ...apiResults, ...controllerResults, ...databaseResults, ...functionResults);
    
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
    
    // Run all rule categories
    const generalResults = await general.checkAfterEdit(input, output);
    const apiResults = await api.checkAfterEdit(input, output);
    const controllerResults = await controller.checkAfterEdit(input, output);
    const databaseResults = await database.checkAfterEdit(input, output);
    const functionResults = await fn.checkAfterEdit(input, output);
    
    result.push(...generalResults, ...apiResults, ...controllerResults, ...databaseResults, ...functionResults);
    
    return result;
  }