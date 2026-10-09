import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([".next/**", "out/**", ".hub/**", "public/hub/**", "next-env.d.ts", "test-results/**", "playwright-report/**", "tests/fixtures/.generated/**"]),
  {
    rules: {
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "react/no-danger": "error",
      "no-restricted-syntax": [
        "error",
        { selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']", message: "Never set HTML from strings." },
        { selector: "Property[key.name='dangerouslySetInnerHTML']", message: "Never set HTML from strings." },
        { selector: "AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/]", message: "Never set HTML from strings." },
        { selector: "CallExpression[callee.property.name='insertAdjacentHTML']", message: "Never set HTML from strings." },
      ],
    },
  },
]);
