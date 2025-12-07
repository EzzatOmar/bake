import { type Plugin } from "@opencode-ai/plugin";
import { fileLog } from "../helper-fns/file-logger";
import * as fs from "node:fs";
import * as path from "node:path";



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

async function checkBeforeWrite(input: {
  tool: string;
  sessionID: string;
  callID: string;
}, output: {
  directory: string;
  content: string;
  filePath: string;
}) {}

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
      if (input.tool === "write") {
        
      } else if (input.tool === "edit") {

      }
    },
    "tool.execute.after": async (input, output) => {
      fileLog("tool.execute.after", JSON.stringify(Object.keys(output.metadata)))
      try {
        if (input.tool === "write") {
          
        } else if (input.tool === "edit") {

        }
      } catch (e) {
        fileLog("tool.execute.after", "error", JSON.stringify(e), JSON.stringify(input), JSON.stringify(output))
        throw e
      }
    }

  }
}

