import type { ErrCode } from "@/src/error/err.enum";

declare global {
  type TLang = "en" | "de" | "fr" | "es" | "it" | "pt" | "ru" | "zh" | "ja" | "ko" | "ar" | "hi" | "bn" | "id" | "ms" | "th" | "vi" | "tr" | "nl" | "pl" | "uk" | "cs" | "hu" | "ro" | "sv" | "da" | "fi" | "no" | "el" | "he" | "fa";

  type TErrorStatus = 400 | 401 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 422 | 423 | 424 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;

  type THandleBarsTemplate = string;

  /**
   * Explaination:
   * 
   * This error object can be mapped for internal and external communcation.
   * The inner layer must return a TErrorEntry and the outer layer decided 
   * use this for e.g. http status, multi lang message or internal logging
   * The messages are handlebars templates and will if present use text replacement before logging
   * It is important to seperate error messages going to users and internal developers.
   * Never expose internal implementation details to the user.
   *
   * code: string; Unique identifier for the error code use dot notation to indicate the module and the function that caused the error. E.g. "FN.ON_START_CHECKS.MISSING_SERVER_FILE"
   * handlebarsParams?: Record<string, string>; Optional parameters to be used in the error message. Text replacement look search for "my error message: {{param1}} {{param2}}"
   * externalMessage?: Partial<Record<TLang, THandleBarsTemplate>> & { "en": THandleBarsTemplate }; The error message to be displayed to the user. Must be written in a way that is easy to understand and does not expose any internal implementation details.
   * internalMessage?: THandleBarsTemplate; The error message to be displayed to the developer. Can contain internal implementation details.
   * shouldLogInternally?: boolean; If true, the error will be logged internally
   * internalMetadata?: Record<string, string>; Optional metadata. Not for handlebars replacement. Think appId, userId
   * internalLogLevel?: "error" | "warn" | "info" | "debug"; The log level to use when logging internally. Defaults to "error"
   * needsInspection?: boolean; Hint for internal developers to inspect the error and take action.
   */
  type TErrorEntry = {
    code: ErrCode;
    statusCode: TErrorStatus;
    handlebarsParams?: Record<string, string>;
    externalMessage?: Partial<Record<TLang, THandleBarsTemplate>> & { "en": THandleBarsTemplate };
    internalMessage?: THandleBarsTemplate;
    shouldLogInternally?: boolean;
    internalMetadata?: Record<string, string>;
    internalLogLevel?: "error" | "warn" | "info" | "debug";
    needsInspection?: boolean;
  }

  /**
   * A fn[] that can be used to rollback an external action.
   * Like deleting a neon project or github repo from a different service.
   * In rare cases the rollback might fail and return it's own rollback function.
   * In success full cases the rollback function returns a loggable string.
   * Database rollbacks are not supported. It is expected to use transactions instead.
   *
   * Note that rollbacks are expected to be executed sequentially in reverse order.
   */
  type TExternalRollback = () => Promise<TErrTriple<string>>;

  type TErrTuple<T> = [T, null] | [null, TErrorEntry];
  /**
   * Every effectful function should return a TErrTriple.
   * No Rollback should be internally executed.
   * The caller is responsible for executing the rollbacks in reverse order.
   */
  type TErrTriple<T> = [T, null, TExternalRollback[]] | [null, TErrorEntry, TExternalRollback[]];
}

// This empty export makes TypeScript happy - confirms it's a module
export {};