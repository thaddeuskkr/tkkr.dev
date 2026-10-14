import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import stylistic from "@stylistic/eslint-plugin";

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    stylistic.configs.customize({
        indent: 4,
        quotes: "double",
        semi: true,
        arrowParens: true,
        braceStyle: "1tbs",
        commaDangle: "always-multiline",
        quoteProps: "as-needed",
        jsx: true,
    }),
    {
        rules: {
            "@stylistic/jsx-closing-bracket-location": [
                "error",
                { nonEmpty: "after-props", selfClosing: "tag-aligned" },
            ],
            "@stylistic/jsx-one-expression-per-line": "off",
            "@stylistic/jsx-quotes": ["error", "prefer-double"],
            "@stylistic/operator-linebreak": ["error", "after"],
            "@stylistic/linebreak-style": ["error", "unix"],
            "padding-line-between-statements": ["error",
                { blankLine: "always", prev: "block-like", next: "*" },
            ],
        },
    },
    globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
