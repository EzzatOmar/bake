

export function isTestFile(args: { filePath: string }): boolean {
    return args.filePath.endsWith(".test.ts");
}
