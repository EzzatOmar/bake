import path from "node:path";
import type { TRuleFn } from "../rule-types";

export const ruleApiFileName: TRuleFn = async ({filePath}) => {
    const fileName = path.basename(filePath, ".ts");

    if (!fileName.startsWith("api.")) {
        return {
            error: "API file names must start with 'api.'",
        }
    }

}