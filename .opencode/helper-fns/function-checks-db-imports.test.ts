import { describe, test, expect } from "bun:test";
import { parseTypeScript, getDatabaseConnectionImports } from "./ts-analyzer";
import { assertDatabaseConnectionImportsAreTypeOnly } from "./function-checks";

describe("Database Connection Import Checks", () => {
  describe("getDatabaseConnectionImports", () => {
    test("should find database connection imports", () => {
      const code = `
        import { kanbanDb } from '../../database/kanban/conn.kanban.ts';
        import { board } from '../../database/kanban/schema.custom.kanban.ts';
        import { ErrCode } from '../../error/err.enum.ts';
      `;
      
      const sourceFile = parseTypeScript(code);
      const dbImports = getDatabaseConnectionImports(sourceFile);
      
      expect(dbImports).toHaveLength(1);
      expect(dbImports[0].modulePath).toBe('../../database/kanban/conn.kanban.ts');
      expect(dbImports[0].isTypeOnly).toBe(false);
      expect(dbImports[0].importedNames).toEqual(['kanbanDb']);
    });

    test("should find type-only database connection imports", () => {
      const code = `
        import type { kanbanDb } from '../../database/kanban/conn.kanban.ts';
        import { board } from '../../database/kanban/schema.custom.kanban.ts';
      `;
      
      const sourceFile = parseTypeScript(code);
      const dbImports = getDatabaseConnectionImports(sourceFile);
      
      expect(dbImports).toHaveLength(1);
      expect(dbImports[0].modulePath).toBe('../../database/kanban/conn.kanban.ts');
      expect(dbImports[0].isTypeOnly).toBe(true);
      expect(dbImports[0].importedNames).toEqual(['kanbanDb']);
    });

    test("should find mixed type-only imports", () => {
      const code = `
        import { kanbanDb, type helperFn } from '../../database/kanban/conn.kanban.ts';
      `;
      
      const sourceFile = parseTypeScript(code);
      const dbImports = getDatabaseConnectionImports(sourceFile);
      
      expect(dbImports).toHaveLength(1);
      expect(dbImports[0].modulePath).toBe('../../database/kanban/conn.kanban.ts');
      expect(dbImports[0].isTypeOnly).toBe(true);
      expect(dbImports[0].importedNames).toEqual(['kanbanDb', 'helperFn']);
    });

    test("should ignore non-database imports", () => {
      const code = `
        import { someOther } from './other-file.ts';
        import { board } from '../../database/kanban/schema.custom.kanban.ts';
        import { config } from '../config.ts';
      `;
      
      const sourceFile = parseTypeScript(code);
      const dbImports = getDatabaseConnectionImports(sourceFile);
      
      expect(dbImports).toHaveLength(0);
    });
  });

  describe("assertDatabaseConnectionImportsAreTypeOnly", () => {
    test("should pass with type-only imports", () => {
      const code = `
        import type { kanbanDb } from '../../database/kanban/conn.kanban.ts';
        import { board } from '../../database/kanban/schema.custom.kanban.ts';
        
        export type TPortal = {
          db: typeof kanbanDb;
        };
        
        export default function fxTestFunction(portal: TPortal): TErrTuple<string> {
          return ["success", null];
        }
      `;
      
      const sourceFile = parseTypeScript(code);
      
      expect(() => {
        assertDatabaseConnectionImportsAreTypeOnly({
          sourceFile,
          directory: "/test",
          content: code,
          filePath: "/test/src/function/test/fx.test.ts"
        });
      }).not.toThrow();
    });

    test("should fail with non-type-only imports", () => {
      const code = `
        import { kanbanDb } from '../../database/kanban/conn.kanban.ts';
        import { board } from '../../database/kanban/schema.custom.kanban.ts';
        
        export type TPortal = {
          db: typeof kanbanDb;
        };
        
        export default function fxTestFunction(portal: TPortal): TErrTuple<string> {
          return ["success", null];
        }
      `;
      
      const sourceFile = parseTypeScript(code);
      
      expect(() => {
        assertDatabaseConnectionImportsAreTypeOnly({
          sourceFile,
          directory: "/test",
          content: code,
          filePath: "/test/src/function/test/fx.test.ts"
        });
      }).toThrow("Database connection imports must be type-only");
    });

    test("should pass when no database imports exist", () => {
      const code = `
        import { someOther } from './other-file.ts';
        import { config } from '../config.ts';
        
        export default function fnTestFunction(): TErrTuple<string> {
          return ["success", null];
        }
      `;
      
      const sourceFile = parseTypeScript(code);
      
      expect(() => {
        assertDatabaseConnectionImportsAreTypeOnly({
          sourceFile,
          directory: "/test",
          content: code,
          filePath: "/test/src/function/test/fn.test.ts"
        });
      }).not.toThrow();
    });
  });
});