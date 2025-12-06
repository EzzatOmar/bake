import { test, expect, describe } from "bun:test";
import { assertPortalDoesNotContainFunctions } from "./controller-checks";
import { parseTypeScript } from "./ts-analyzer";

describe("assertPortalDoesNotContainFunctions", () => {
  test("should pass when TPortal contains only variables", () => {
    const content = `
import { Database } from 'bun:sqlite';
import * as users from './schema.user';

export type TPortal = {
  session: { userId: number };
  db: BunSQLiteDatabase<typeof users> & { $client: Database; };
};

export type TArgs = {
  userId: number;
};

export default async function ctrlExample(portal: TPortal, args: TArgs): Promise<TErrTuple<any>> {
  return [{}, null];
}
    `;

    const sourceFile = parseTypeScript(content);
    expect(() =>
      assertPortalDoesNotContainFunctions({
        sourceFile,
        directory: "/test",
        content,
        filePath: "/test/src/controller/test/ctrl.example.ts",
      })
    ).not.toThrow();
  });

  test("should pass when there are no function imports", () => {
    const content = `
export type TPortal = {
  session: { userId: number };
  someData: string;
};

export type TArgs = {
  userId: number;
};

export default async function ctrlExample(portal: TPortal, args: TArgs): Promise<TErrTuple<any>> {
  return [{}, null];
}
    `;

    const sourceFile = parseTypeScript(content);
    expect(() =>
      assertPortalDoesNotContainFunctions({
        sourceFile,
        directory: "/test",
        content,
        filePath: "/test/src/controller/test/ctrl.example.ts",
      })
    ).not.toThrow();
  });

  test("should pass when TPortal is not defined", () => {
    const content = `
import fxGetUserData from '@/src/function/user/fx.get-user-data';

export default async function ctrlExample(portal: any, args: any): Promise<TErrTuple<any>> {
  return [{}, null];
}
    `;

    const sourceFile = parseTypeScript(content);
    expect(() =>
      assertPortalDoesNotContainFunctions({
        sourceFile,
        directory: "/test",
        content,
        filePath: "/test/src/controller/test/ctrl.example.ts",
      })
    ).not.toThrow();
  });

  test("should pass when function import is used directly in controller, not in TPortal", () => {
    const content = `
import fxGetUserData from '@/src/function/user/fx.get-user-data';
import { Database } from 'bun:sqlite';

export type TPortal = {
  session: { userId: number };
  db: Database;
};

export type TArgs = {
  userId: number;
};

export default async function ctrlExample(portal: TPortal, args: TArgs): Promise<TErrTuple<any>> {
  const [data, err] = await fxGetUserData({ db: portal.db }, { userId: args.userId });
  return [{}, null];
}
    `;

    const sourceFile = parseTypeScript(content);
    expect(() =>
      assertPortalDoesNotContainFunctions({
        sourceFile,
        directory: "/test",
        content,
        filePath: "/test/src/controller/test/ctrl.example.ts",
      })
    ).not.toThrow();
  });

  test("should throw when TPortal contains a function import (default import)", () => {
    const content = `
import fxGetUserData from '@/src/function/user/fx.get-user-data';
import { Database } from 'bun:sqlite';

export type TPortal = {
  session: { userId: number };
  db: Database;
  fxGetUserData: typeof fxGetUserData;
};

export type TArgs = {
  userId: number;
};

export default async function ctrlExample(portal: TPortal, args: TArgs): Promise<TErrTuple<any>> {
  return [{}, null];
}
    `;

    const sourceFile = parseTypeScript(content);
    expect(() =>
      assertPortalDoesNotContainFunctions({
        sourceFile,
        directory: "/test",
        content,
        filePath: "/test/src/controller/test/ctrl.example.ts",
      })
    ).toThrow(/TPortal must not contain function imports/);
  });

  test("should throw with helpful error message", () => {
    const content = `
import fxGetUserMagicCards from '@/src/function/magic-cards/fx.get-user-magic-cards';

export type TPortal = {
  session: { userId: number };
  fxGetUserMagicCards: typeof fxGetUserMagicCards;
};

export type TArgs = {
  userId: number;
};

export default async function ctrlExample(portal: TPortal, args: TArgs): Promise<TErrTuple<any>> {
  return [{}, null];
}
    `;

    const sourceFile = parseTypeScript(content);
    expect(() =>
      assertPortalDoesNotContainFunctions({
        sourceFile,
        directory: "/test",
        content,
        filePath: "/test/src/controller/test/ctrl.example.ts",
      })
    ).toThrow(/fxGetUserMagicCards/);
    
    expect(() =>
      assertPortalDoesNotContainFunctions({
        sourceFile,
        directory: "/test",
        content,
        filePath: "/test/src/controller/test/ctrl.example.ts",
      })
    ).toThrow(/import and call functions directly/);
  });

  test("should detect multiple functions in TPortal", () => {
    const content = `
import fxGetUserData from '@/src/function/user/fx.get-user-data';
import fnProcessData from '@/src/function/data/fn.process-data';

export type TPortal = {
  session: { userId: number };
  fxGetUserData: typeof fxGetUserData;
  fnProcessData: typeof fnProcessData;
};

export type TArgs = {
  userId: number;
};

export default async function ctrlExample(portal: TPortal, args: TArgs): Promise<TErrTuple<any>> {
  return [{}, null];
}
    `;

    const sourceFile = parseTypeScript(content);
    expect(() =>
      assertPortalDoesNotContainFunctions({
        sourceFile,
        directory: "/test",
        content,
        filePath: "/test/src/controller/test/ctrl.example.ts",
      })
    ).toThrow(/fxGetUserData.*fnProcessData/);
  });

  test("should detect function even with different import patterns", () => {
    const content = `
import fxGetUserData from '@/src/function/user/fx.get-user-data';

export type TPortal = {
  session: { userId: number };
  db: any;
  fxGetUserData: typeof fxGetUserData;
};

export type TArgs = {
  userId: number;
};

export default async function ctrlExample(portal: TPortal, args: TArgs): Promise<TErrTuple<any>> {
  return [{}, null];
}
    `;

    const sourceFile = parseTypeScript(content);
    expect(() =>
      assertPortalDoesNotContainFunctions({
        sourceFile,
        directory: "/test",
        content,
        filePath: "/test/src/controller/test/ctrl.example.ts",
      })
    ).toThrow(/TPortal must not contain function imports/);
    
    expect(() =>
      assertPortalDoesNotContainFunctions({
        sourceFile,
        directory: "/test",
        content,
        filePath: "/test/src/controller/test/ctrl.example.ts",
      })
    ).toThrow(/fxGetUserData/);
  });

  test("should pass when function is imported but not used in TPortal", () => {
    const content = `
import fxGetUserData from '@/src/function/user/fx.get-user-data';
import fnOtherFunction from '@/src/function/other/fn.other';

export type TPortal = {
  session: { userId: number };
  db: any;
};

export type TArgs = {
  userId: number;
};

export default async function ctrlExample(portal: TPortal, args: TArgs): Promise<TErrTuple<any>> {
  // Functions are called directly, not passed through TPortal
  const [data, err] = await fxGetUserData({ db: portal.db }, args);
  return [{}, null];
}
    `;

    const sourceFile = parseTypeScript(content);
    expect(() =>
      assertPortalDoesNotContainFunctions({
        sourceFile,
        directory: "/test",
        content,
        filePath: "/test/src/controller/test/ctrl.example.ts",
      })
    ).not.toThrow();
  });

  test("should pass when importing types from function files", () => {
    const content = `
import type { TFlattenedMagicCard } from '@/src/function/magic-cards/fx.get-user-magic-cards';

export type TPortal = {
  session: { userId: number };
  db: any;
};

export type TArgs = {
  userId: number;
};

export type TResponse = {
  cards: TFlattenedMagicCard[];
};

export default async function ctrlExample(portal: TPortal, args: TArgs): Promise<TErrTuple<TResponse>> {
  return [{ cards: [] }, null];
}
    `;

    const sourceFile = parseTypeScript(content);
    expect(() =>
      assertPortalDoesNotContainFunctions({
        sourceFile,
        directory: "/test",
        content,
        filePath: "/test/src/controller/test/ctrl.example.ts",
      })
    ).not.toThrow();
  });

  test("should handle named imports from function files", () => {
    const content = `
import { fxGetUserData, fnProcessUser } from '@/src/function/user/fx.get-user-data';

export type TPortal = {
  session: { userId: number };
  fxGetUserData: typeof fxGetUserData;
};

export type TArgs = {
  userId: number;
};

export default async function ctrlExample(portal: TPortal, args: TArgs): Promise<TErrTuple<any>> {
  return [{}, null];
}
    `;

    const sourceFile = parseTypeScript(content);
    expect(() =>
      assertPortalDoesNotContainFunctions({
        sourceFile,
        directory: "/test",
        content,
        filePath: "/test/src/controller/test/ctrl.example.ts",
      })
    ).toThrow(/TPortal must not contain function imports/);
  });
});
