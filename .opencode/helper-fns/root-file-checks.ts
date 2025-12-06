import path from "node:path";
import { fileLog } from "./file-logger";

export function checkNoTsFilesInRoot(args: { directory: string, filePath: string }) {
    const relativePath = path.relative(args.directory, args.filePath);
    
    // Check if file is directly in project root (no directory separator)
    const isInRoot = !relativePath.includes("/") && !relativePath.includes("\\");
    
    if (isInRoot && (relativePath.endsWith(".ts") || relativePath.endsWith(".tsx"))) {
        fileLog("rootFileCheck", "ts/tsx file in root", relativePath);
        throw new Error(
            ".ts and .tsx files are not allowed in the project root. " +
            "Please place TypeScript files in the appropriate src/ subdirectory. " +
            "If you need to create one off scripts place them in one-off-scripts/ directory."
        );
    }
    
    return null;
}

export function checkNoJsFiles(args: { directory: string, filePath: string }) {
    const relativePath = path.relative(args.directory, args.filePath);
    
    if (relativePath.endsWith(".js")) {
        fileLog("jsFileCheck", "js file detected", relativePath);
        throw new Error(
            ".js files are not allowed in this project. " +
            "Please use TypeScript (.ts) files instead."
        );
    }
    
    return null;
}
