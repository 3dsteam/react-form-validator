import pluginJs from "@eslint/js";
import tsEslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import prettierEslint from "eslint-config-prettier";
import globals from "globals";

export default [
  pluginJs.configs.recommended,
  ...tsEslint.configs.recommended,
  prettierEslint,
  {
    files: ["**/*.{ts,jsx}"],
    plugins: {pluginReact},
    languageOptions: {
      globals: {...globals.browser},
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    }
  }
];
