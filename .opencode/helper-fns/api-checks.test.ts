import { describe, it, expect, beforeEach } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import * as apiChecks from "./api-checks";
import { parseTypeScript } from "./ts-analyzer";

describe("API Checks", () => {
    const testDir = "/tmp/api-checks-test";
    const srcDir = path.join(testDir, "src");
    const apiDir = path.join(srcDir, "api");

    beforeEach(() => {
        // Clean up and recreate test directory structure
        rmSync(testDir, { recursive: true, force: true });
        mkdirSync(apiDir, { recursive: true });
    });

    describe("assertApiFileName", () => {
        it("should pass for valid API file name", () => {
            expect(() => {
                apiChecks.assertApiFileName({
                    directory: testDir,
                    filePath: path.join(apiDir, "api.users.ts")
                });
            }).not.toThrow();
        });

        it("should throw error for files without api. prefix", () => {
            expect(() => {
                apiChecks.assertApiFileName({
                    directory: testDir,
                    filePath: path.join(apiDir, "users.ts")
                });
            }).toThrow("API file names must start with 'api.'");
        });

        it("should throw error for files with wrong prefix", () => {
            expect(() => {
                apiChecks.assertApiFileName({
                    directory: testDir,
                    filePath: path.join(apiDir, "ctrl.users.ts")
                });
            }).toThrow("API file names must start with 'api.'");
        });
    });

    describe("assertApiDefaultExport", () => {
        it("should pass for files with default export", () => {
            const content = "export default const apiUsers = {};";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiDefaultExport({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });

        it("should throw error for files without default export", () => {
            const content = "export const apiUsers = {};";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiDefaultExport({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).toThrow("API files must have a default export");
        });

        it("should throw error for files with only named exports", () => {
            const content = "export const x = 1; export const y = 2;";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiDefaultExport({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).toThrow("API files must have a default export");
        });
    });

    describe("assertApiDefaultExportIsVariable", () => {
        it("should pass for variable default export", () => {
            const content = "export default const apiUsers = {};";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiDefaultExportIsVariable({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });

        it("should pass for variable default export with 'export default' syntax", () => {
            const content = "const apiUsers = {}; export default apiUsers;";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiDefaultExportIsVariable({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });

        it("should throw error for function default export", () => {
            const content = "export default function apiUsers() {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiDefaultExportIsVariable({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).toThrow("API files must default export a variable declaration");
        });

        it("should throw error for object literal default export", () => {
            const content = "export default {};";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiDefaultExportIsVariable({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).toThrow("API files must default export a variable declaration");
        });

        it("should throw error for class default export", () => {
            const content = "export default class ApiUsers {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiDefaultExportIsVariable({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).toThrow("API files must default export a variable declaration");
        });
    });

    describe("assertApiVariableName", () => {
        it("should pass for variable name starting with 'api'", () => {
            const content = "export default const apiUsers = {};";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiVariableName({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });

        it("should pass for variable name starting with 'api' using 'export default' syntax", () => {
            const content = "const apiUsers = {}; export default apiUsers;";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiVariableName({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });

        it("should throw error for variable name not starting with 'api'", () => {
            const content = "export default const users = {};";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiVariableName({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).toThrow("API variables must start with 'api' prefix");
        });

        it("should throw error for variable name starting with 'Api' (capital)", () => {
            const content = "export default const ApiUsers = {};";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiVariableName({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).toThrow("API variables must start with 'api' prefix");
        });

        it("should throw error for variable name with 'api' in middle", () => {
            const content = "export default const userApiData = {};";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiVariableName({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).toThrow("API variables must start with 'api' prefix");
        });
    });

    describe("assertApiVariableType", () => {
        it("should pass for correct API handler type", () => {
            const content = `import type { BunRequest, Serve, Server } from 'bun';
export default const apiUsers: Partial<Record<Serve.HTTPMethod, Serve.Handler<BunRequest<'/api/users'>, Server<undefined>, Response>>> = {};`;
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiVariableType({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });

        it("should pass for correct API handler type with different endpoint", () => {
            const content = `import type { BunRequest, Serve, Server } from 'bun';
export default const apiData: Partial<Record<Serve.HTTPMethod, Serve.Handler<BunRequest<'/api/v1/data'>, Server<undefined>, Response>>> = {};`;
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiVariableType({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.data.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });

        it("should throw error for missing type annotation", () => {
            const content = "export default const apiUsers = {};";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiVariableType({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).toThrow("API variables must have explicit type annotation");
        });

        it("should throw error for wrong type annotation", () => {
            const content = "export default const apiUsers: Record<string, any> = {};";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiVariableType({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).toThrow("API variables must have the correct type");
        });

        it("should throw error for incorrect type structure", () => {
            const content = "export default const apiUsers: Partial<Record<string, Function>> = {};";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiVariableType({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).toThrow("API variables must have the correct type");
        });

        it("should throw error for generic object type", () => {
            const content = "export default const apiUsers: any = {};";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiVariableType({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).toThrow("API variables must have the correct type");
        });

        it("should throw error for simplified handler type", () => {
            const content = `import type { BunRequest, Serve, Server } from 'bun';
export default const apiUsers: Partial<Record<Serve.HTTPMethod, (req: BunRequest) => Response>> = {};`;
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiVariableType({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).toThrow("API variables must have the correct type");
        });
    });

    describe("assertApiImportsController", () => {
        it("should pass when API imports a controller file", () => {
            const content = `import ctrlGetUsers from '../../controller/users/ctrl.get-users';
import type { BunRequest, Serve, Server } from 'bun';
export default const apiUsers: Partial<Record<Serve.HTTPMethod, Serve.Handler<BunRequest<'/api/users'>, Server<undefined>, Response>>> = {};`;
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiImportsController({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });

        it("should pass when API imports multiple controller files", () => {
            const content = `import ctrlGetUsers from '../../controller/users/ctrl.get-users';
import ctrlCreateUser from '../../controller/users/ctrl.create-user';
import type { BunRequest, Serve, Server } from 'bun';
export default const apiUsers: Partial<Record<Serve.HTTPMethod, Serve.Handler<BunRequest<'/api/users'>, Server<undefined>, Response>>> = {};`;
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiImportsController({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });

        it("should pass when API imports controller with different path format", () => {
            const content = `import ctrlGetData from '../controller/data/ctrl.get-data';
import type { BunRequest, Serve, Server } from 'bun';
export default const apiData: Partial<Record<Serve.HTTPMethod, Serve.Handler<BunRequest<'/api/data'>, Server<undefined>, Response>>> = {};`;
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiImportsController({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.data.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });

        it("should throw error when API does not import any controller", () => {
            const content = `import { z } from 'zod';
import { magicCardsDb } from '../../database/magic-cards/conn.magic-cards';
import type { BunRequest, Serve, Server } from 'bun';
export default const apiUsers: Partial<Record<Serve.HTTPMethod, Serve.Handler<BunRequest<'/api/users'>, Server<undefined>, Response>>> = {};`;
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiImportsController({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).toThrow("API files must import at least one controller file");
        });

        it("should throw error when API only imports functions, not controllers", () => {
            const content = `import fxGetUser from '../../function/users/fx.get-user';
import fnValidateUser from '../../function/users/fn.validate-user';
import type { BunRequest, Serve, Server } from 'bun';
export default const apiUsers: Partial<Record<Serve.HTTPMethod, Serve.Handler<BunRequest<'/api/users'>, Server<undefined>, Response>>> = {};`;
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiImportsController({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).toThrow("API files must import at least one controller file");
        });

        it("should throw error when API only imports database connections", () => {
            const content = `import { db } from '../../database/conn';
import { users } from '../../database/schema';
import type { BunRequest, Serve, Server } from 'bun';
export default const apiUsers: Partial<Record<Serve.HTTPMethod, Serve.Handler<BunRequest<'/api/users'>, Server<undefined>, Response>>> = {};`;
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiImportsController({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).toThrow("API files must import at least one controller file");
        });

        it("should throw error when API only imports types", () => {
            const content = `import type { BunRequest, Serve, Server } from 'bun';
import type { User } from '../../types/user';
export default const apiUsers: Partial<Record<Serve.HTTPMethod, Serve.Handler<BunRequest<'/api/users'>, Server<undefined>, Response>>> = {};`;
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiImportsController({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).toThrow("API files must import at least one controller file");
        });

        it("should throw error when API has no imports at all", () => {
            const content = `export default const apiUsers = {};`;
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiImportsController({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).toThrow("API files must import at least one controller file");
        });

        it("should pass when controller import is mixed with other imports", () => {
            const content = `import { z } from 'zod';
import type { BunRequest, Serve, Server } from 'bun';
import ctrlGetUsers from '../../controller/users/ctrl.get-users';
import { db } from '../../database/conn';
export default const apiUsers: Partial<Record<Serve.HTTPMethod, Serve.Handler<BunRequest<'/api/users'>, Server<undefined>, Response>>> = {};`;
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                apiChecks.assertApiImportsController({
                    directory: testDir,
                    content,
                    filePath: path.join(apiDir, "api.users.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });
    });
});