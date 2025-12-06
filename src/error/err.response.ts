import type { BunRequest } from "bun";
import { tExternal, tInternal } from "./err.mapper";

function getLogForError(error: TErrorEntry) {
    switch (error.internalLogLevel) {
        case "error":
            return console.error
        case "warn":
            return console.warn
        case "info":
            return console.info
        case "debug":
            return console.debug
        default:
            return console.error
    }
}

/**
 * Used in the api layer to translate an controller error to a http json response
 * in the format we want all errors to be returned in
 * Automatically logs the error to the database
 */
export function toErrorResponse({req, error}: {req: BunRequest, error: TErrorEntry} ): Response {
  
  if (error.shouldLogInternally) {
    getLogForError(error)(tInternal(error));
  }

  const lang = req.headers.get('x-lang') as TLang ?? 'en'


  return Response.json({
    type: error.code,
    message: tExternal(error, lang)
  }, { status: error.statusCode })

}