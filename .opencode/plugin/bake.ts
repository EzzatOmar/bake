import { PluginInput, type Plugin } from "@opencode-ai/plugin";
import { fileLog } from "../helper-fns/file-logger";
import * as fs from "node:fs";
import * as path from "node:path";
import * as ruleFns from "../rule-fns";

import type { TRuleResult } from "../rule-fns/rule-types";



/**
 * Initialize the required folder structure for the Visual Backend framework
 */
function initializeFolderStructure(directory: string) {
  const requiredFolders = [
    "src/function",
    "src/controller", 
    "src/api",
    "src/component",
    "src/database",
    "src/error",
    "database-storage",
    "one-off-scripts",
    "docs"
  ];

  for (const folder of requiredFolders) {
    const folderPath = path.join(directory, folder);
    
    try {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        fileLog("initializeFolderStructure", `Created folder: ${folderPath}`);
      } else {
        fileLog("initializeFolderStructure", `Folder already exists: ${folderPath}`);
      }
    } catch (error) {
      fileLog("initializeFolderStructure", `Error creating folder ${folderPath}:`, error);
      throw new Error(`Failed to create required folder: ${folder}. Please check permissions.`);
    }
  }
}


async function sendResultToAi(ctx: PluginInput, input: {sessionID: string}, result: TRuleResult[]) {
  const messages = result.map(r => r.message).filter(Boolean).join("\n\n");
  if(messages) {
    ctx.client.session.command
    await ctx.client.session.prompt({path: {id: input.sessionID}, body: {parts: [{
      type: 'text',
      text: messages,
    }], noReply: true }})
  }
  const errors = result.map(r => r.error).filter(Boolean).join("\n\n");
  if(errors) {
    throw new Error(errors);
  }
}

/**
 * How to write an opencode plugin? -> https://opencode.ai/docs/plugins/
 */
export const BakePlugin: Plugin = async (ctx) => {
  fileLog(JSON.stringify(ctx))

  // Initialize folder structure at plugin startup
  try {
    initializeFolderStructure(ctx.directory);
  } catch (error) {
    fileLog("CustomToolsPlugin", "Failed to initialize folder structure:", error);
    // Don't throw here - let the plugin continue even if folder creation fails
  }

  return {
    "tool.execute.before": async (input, output) => {
      fileLog("tool.execute.before", JSON.stringify(input), JSON.stringify(output))
      const result: TRuleResult[] = [];
      const fixedOutput = { directory: ctx.directory, filePath: output.args.filePath, content: output.args.content }

      if (input.tool === "write") {
        result.push(...await ruleFns.checkBeforeWrite(input, fixedOutput));
      } else if (input.tool === "edit") {
        result.push(...await ruleFns.checkBeforeEdit(input, fixedOutput));
      }
      await sendResultToAi(ctx, input, result);

    },
    "tool.execute.after": async (input, output) => {
      fileLog("tool.execute.after", JSON.stringify(Object.keys(output.metadata)))
      try {

        const result: TRuleResult[] = [];
        if (input.tool === "write") {
          const content = await Bun.file(output.metadata.filepath).text();
          const fixedOutput = { directory: ctx.directory, filePath: output.metadata.filepath, content }
          
          result.push(...await ruleFns.checkAfterWrite(input, fixedOutput));
        } else if (input.tool === "edit") {
          const fixedOutput = { directory: ctx.directory, filePath: output.metadata.filediff.file, content: output.metadata.filediff.after }

          result.push(...await ruleFns.checkAfterEdit(input, fixedOutput));
        }
        await sendResultToAi(ctx, input, result);
      } catch (e) {
        fileLog("tool.execute.after", "error", JSON.stringify(e), JSON.stringify(input), JSON.stringify(output))
        throw e
      }
    }

  }
}

