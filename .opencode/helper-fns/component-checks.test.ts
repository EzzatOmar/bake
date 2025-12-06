import { describe, test, expect } from "bun:test";
import { assertComponentFileName } from "./component-checks";

describe("Component Checks", () => {
  describe("assertComponentFileName", () => {
    test("should pass with valid comp.*.tsx files", () => {
      expect(() => {
        assertComponentFileName({
          directory: "/test",
          filePath: "/test/src/component/comp.header.tsx"
        });
      }).not.toThrow();
    });

    test("should pass with non-.tsx files", () => {
      expect(() => {
        assertComponentFileName({
          directory: "/test",
          filePath: "/test/src/component/api.ts"
        });
      }).not.toThrow();

      expect(() => {
        assertComponentFileName({
          directory: "/test",
          filePath: "/test/src/component/config.json"
        });
      }).not.toThrow();

      expect(() => {
        assertComponentFileName({
          directory: "/test",
          filePath: "/test/src/component/styles.css"
        });
      }).not.toThrow();
    });

    test("should fail with .tsx files without comp. prefix", () => {
      expect(() => {
        assertComponentFileName({
          directory: "/test",
          filePath: "/test/src/component/Header.tsx"
        });
      }).toThrow("Component files ending with .tsx must start with 'comp.'");

      expect(() => {
        assertComponentFileName({
          directory: "/test",
          filePath: "/test/src/component/navigation.tsx"
        });
      }).toThrow("Component files ending with .tsx must start with 'comp.'");

      expect(() => {
        assertComponentFileName({
          directory: "/test",
          filePath: "/test/src/component/Layout.tsx"
        });
      }).toThrow("Component files ending with .tsx must start with 'comp.'");
    });

    test("should provide helpful error message", () => {
      expect(() => {
        assertComponentFileName({
          directory: "/test",
          filePath: "/test/src/component/Header.tsx"
        });
      }).toThrow(/Component files ending with \.tsx must start with 'comp\.'/);
    });

    test("should handle various valid comp.*.tsx patterns", () => {
      const validNames = [
        "comp.header.tsx",
        "comp.navigation.tsx", 
        "comp.layout.tsx",
        "comp.button.tsx",
        "comp.modal.tsx",
        "comp.card.tsx",
        "comp.form.tsx",
        "comp.table.tsx"
      ];

      validNames.forEach(fileName => {
        expect(() => {
          assertComponentFileName({
            directory: "/test",
            filePath: `/test/src/component/${fileName}`
          });
        }).not.toThrow();
      });
    });

    test("should handle various invalid .tsx patterns", () => {
      const invalidNames = [
        "Header.tsx",
        "Navigation.tsx",
        "Layout.tsx", 
        "Button.tsx",
        "Modal.tsx",
        "Card.tsx",
        "Form.tsx",
        "Table.tsx",
        "header.tsx",
        "navigation.tsx",
        "layout.tsx"
      ];

      invalidNames.forEach(fileName => {
        expect(() => {
          assertComponentFileName({
            directory: "/test",
            filePath: `/test/src/component/${fileName}`
          });
        }).toThrow("Component files ending with .tsx must start with 'comp.'");
      });
    });
  });
});