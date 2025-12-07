import { parseTypeScript, findTypeAlias, getTypeLiteralPropertyNames } from "../../helper-fns/ts-analyzer";
import { getDatabaseVariableNames } from "../../helper-fns/get-db-names";
import type { TRuleFn } from "../rule-types";

export const ruleFnDbPortalType: TRuleFn = async ({directory, content, filePath}) => {
    const sourceFile = parseTypeScript(content);
    
    // Find TPortal type definition
    const tPortalType = findTypeAlias(sourceFile, 'TPortal');
    if (!tPortalType) {
        return; // Rule doesn't apply
    }
    
    // Get property names from TPortal
    const portalProperties = getTypeLiteralPropertyNames(tPortalType.type);
    
    // Find db property: db: typeof dbVariableName
    const dbPropertyRegex = /db\s*:\s*typeof\s+(\w+)/;
    const dbMatch = content.match(dbPropertyRegex);
    
    if (!dbMatch) {
        return; // Rule doesn't apply
    }
    
    const dbTypeVariable = dbMatch[1];
    
    // Get all database variable names
    const dbVariables = await getDatabaseVariableNames(directory);
    
    if (dbVariables.length ===0) {
        return; // No database variables found
    }
    
    // Check if db property type is typeof one of database variables
    if (!dbVariables.includes(dbTypeVariable)) {
        const dbVarsList = dbVariables.join(', ');
        return {
            error: `TPortal.db must be typeof one of the database variables: ${dbVarsList}. ` +
            `Found: typeof ${dbTypeVariable}. ` +
            `Available database variables: ${dbVarsList}. ` +
            `You might want to read .opencode/agent/function-builder.md`
        };
    }
}

export const ruleDbPortalType: TRuleFn = async ({directory, content, filePath}) => {
    // Use regex to find TPortal definition and db property type
    const portalRegex = /export\s+type\s+TPortal\s*=\s*{([^}]+)}/s;
    const portalMatch = content.match(portalRegex);
    
    if (!portalMatch) {
        return; // Rule doesn't apply
    }
    
    const portalBody = portalMatch[1];
    
    // Find db property in TPortal
    const dbPropertyRegex = /db\s*:\s*typeof\s+(\w+)/;
    const dbMatch = portalBody.match(dbPropertyRegex);
    
    if (!dbMatch) {
        return; // Rule doesn't apply
    }
    
    const dbTypeVariable = dbMatch[1];
    
    // Get all database variable names
    const dbVariables = await getDatabaseVariableNames(directory);
    
    if (dbVariables.length === 0) {
        return; // No database variables found
    }
    
    // Check if db property type is typeof one of database variables
    if (!dbVariables.includes(dbTypeVariable)) {
        const dbVarsList = dbVariables.join(', ');
        return {
            error: `TPortal.db must be typeof one of the database variables: ${dbVarsList}. ` +
            `Found: typeof ${dbTypeVariable}. ` +
            `Available database variables: ${dbVarsList}. ` +
            `You might want to read .opencode/agent/function-builder.md`
        };
    }
}