import { type Plugin } from "@opencode-ai/plugin";
import { checkFnAfterEdit, checkFnAfterWrite, checkFnBeforeEdit, checkFnBeforeWrite } from "../helper-fns/function-checks";
import { checkNoTsFilesInRoot, checkNoJsFiles } from "../helper-fns/root-file-checks";
import { checkApiAfterEdit, checkApiAfterWrite, checkApiBeforeEdit, checkApiBeforeWrite } from "../helper-fns/api-checks";
import { checkCtrlAfterEdit, checkCtrlAfterWrite, checkCtrlBeforeEdit, checkCtrlBeforeWrite } from "../helper-fns/controller-checks";
import { checkDbAfterEdit, checkDbAfterWrite, checkDbBeforeEdit, checkDbBeforeWrite } from "../helper-fns/database-checks";
import { checkDocumentationBeforeWrite } from "../helper-fns/documentation-checks";
import { fileLog } from "../helper-fns/file-logger";


export type TCheckResult = {
  message?: string; // message to send to ai
} | undefined;

/**
 * How to write an opencode plugin? -> https://opencode.ai/docs/plugins/
 * 
 * Available Events:
 * 
 * Command Events:
 * - command.executed
 * 
 * File Events:
 * - file.edited
 * - file.watcher.updated
 * 
 * Installation Events:
 * - installation.updated
 * 
 * LSP Events:
 * - lsp.client.diagnostics
 * - lsp.updated
 * 
 * Message Events:
 * - message.part.removed
 * - message.part.updated
 * - message.removed
 * - message.updated
 * 
 * Permission Events:
 * - permission.replied
 * - permission.updated
 * 
 * Server Events:
 * - server.connected
 * 
 * Session Events:
 * - session.created
 * - session.compacted
 * - session.deleted
 * - session.diff
 * - session.error
 * - session.idle
 * - session.status
 * - session.updated
 * 
 * Todo Events:
 * - todo.updated
 * 
 * Tool Events:
 * - tool.execute.after
 * - tool.execute.before
 * 
 * TUI Events:
 * - tui.prompt.append
 * - tui.command.execute
 * - tui.toast.show
 */


export const CustomToolsPlugin: Plugin = async (ctx) => {
  fileLog(JSON.stringify(ctx))



  return {
    "tool.execute.before": async (input, output) => {
      fileLog("tool.execute.before", JSON.stringify(input), JSON.stringify(output))
      if (input.tool === "write") {
        checkNoTsFilesInRoot({ directory: ctx.directory, filePath: output.args.filePath })
        checkNoJsFiles({ directory: ctx.directory, filePath: output.args.filePath })
        checkDocumentationBeforeWrite({ directory: ctx.directory, filePath: output.args.filePath })
        await checkFnBeforeWrite({ directory: ctx.directory, filePath: output.args.filePath, content: output.args.content })
        await checkApiBeforeWrite({ directory: ctx.directory, filePath: output.args.filePath, content: output.args.content })
        await checkCtrlBeforeWrite({ directory: ctx.directory, filePath: output.args.filePath, content: output.args.content })
        await checkDbBeforeWrite({ directory: ctx.directory, filePath: output.args.filePath, content: output.args.content })
      } else if (input.tool === "edit") {
        checkNoTsFilesInRoot({ directory: ctx.directory, filePath: output.args.filePath })
        checkNoJsFiles({ directory: ctx.directory, filePath: output.args.filePath })
        await checkFnBeforeEdit({ directory: ctx.directory, filePath: output.args.filePath, content: output.args.oldString })
        await checkApiBeforeEdit({ directory: ctx.directory, filePath: output.args.filePath, content: output.args.oldString })
        await checkCtrlBeforeEdit({ directory: ctx.directory, filePath: output.args.filePath, content: output.args.oldString })
        await checkDbBeforeEdit({ directory: ctx.directory, filePath: output.args.filePath, content: output.args.oldString })
      }
    },
    "tool.execute.after": async (input, output) => {
      fileLog("tool.execute.after", JSON.stringify(Object.keys(output.metadata)))
      try {
        if (input.tool === "write") {
          // NOTE: in after write filePath is lowercase -__-
          const content = await Bun.file(output.metadata.filepath).text();
          await checkFnAfterWrite({ directory: ctx.directory, filePath: output.metadata.filepath, content })
          const apiCheckResult = await checkApiAfterWrite({ directory: ctx.directory, filePath: output.metadata.filepath, content })
          await checkCtrlAfterWrite({ directory: ctx.directory, filePath: output.metadata.filepath, content })
          await checkDbAfterWrite({ directory: ctx.directory, filePath: output.metadata.filepath, content })

          const message = apiCheckResult?.message;
          if(message) {
            await ctx.client.session.prompt({path: {id: input.sessionID}, body: {parts: [{
              type: 'text',
              text: message,
            }], noReply: true }})
          }

        } else if (input.tool === "edit") {
          // NOTE: in after edit filePath in metadata.filediff.file
          await checkFnAfterEdit({ directory: ctx.directory, filePath: output.metadata.filediff.file, content: output.metadata.filediff.after })
          const apiCheckResult = await checkApiAfterEdit({ directory: ctx.directory, filePath: output.metadata.filediff.file, content: output.metadata.filediff.after })
          await checkCtrlAfterEdit({ directory: ctx.directory, filePath: output.metadata.filediff.file, content: output.metadata.filediff.after })
          await checkDbAfterEdit({ directory: ctx.directory, filePath: output.metadata.filediff.file, content: output.metadata.filediff.after })

          const message = apiCheckResult?.message;
          if(message) {
            await ctx.client.session.prompt({path: {id: input.sessionID}, body: {parts: [{
              type: 'text',
              text: message,
            }], noReply: true }})
          }
        }
      } catch (e) {
        fileLog("tool.execute.after", "error", JSON.stringify(e), JSON.stringify(input), JSON.stringify(output))
        throw e
      }
    }

  }
}

