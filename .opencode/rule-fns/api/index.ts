import { TRuleResult } from "../rule-types";
import { ruleApiFileName } from "./rule.api.file-name";

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
    const r1 = await ruleApiFileName(output);
    if (r1) result.push(r1);
  }