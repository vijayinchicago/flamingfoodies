import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import policy from "@/lib/generation/editorial-policy.json";

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "admin") return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : /\.tsx?$/.test(file) ? [file] : [];
  });
}

describe("public template copy", () => {
  it("does not expose lane metaphors or known content-planning jargon", () => {
    const files = [
      ...sourceFiles("app/(public)"), ...sourceFiles("components"),
      "lib/sample-data/index.ts", "lib/brands.ts", "lib/peppers.ts", "lib/festivals.ts",
      "lib/tutorials.ts", "lib/shop.ts", "lib/hot-sauces.ts", "lib/recipe-commerce.ts",
      "lib/recipe-editorial-sections.ts", "lib/editorial-franchises.ts", "lib/newsletter-segments.ts"
    ];
    const patterns = [/(?:^|\s)lanes?(?=[.!?,;:\s]|$)/i, ...policy.planningJargonPatterns.map((pattern) => new RegExp(pattern, "i"))];
    const failures: string[] = [];
    for (const file of files) {
      const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node: ts.Node) => {
        // Inspect actual string/JSX content, not identifiers, comments or field names.
        if (ts.isJsxText(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
          if (patterns.some((pattern) => pattern.test(node.text))) {
            failures.push(`${file}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}: ${node.text.trim().slice(0, 100)}`);
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    expect(failures).toEqual([]);
  });
});
