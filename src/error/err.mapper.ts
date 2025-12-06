import Handlebars from "handlebars";

// fall back to external if internal is not set
export function tInternal(err: TErrorEntry): string {
    if (!err.internalMessage) return `${err.code}: ${err.statusCode}. External message: ${tExternal(err, "en")}`;
    return Handlebars.compile(err.internalMessage)(err.handlebarsParams);
}

export function tExternal(err: TErrorEntry, lang: TLang): string {
    if (!err.externalMessage) return `Unknown error`
    const template = err.externalMessage[lang] ?? err.externalMessage.en
    return Handlebars.compile(template)(err.handlebarsParams);
}