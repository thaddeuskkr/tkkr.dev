import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
});

const config = [
    ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
    {
        ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
    },
];

export default config;
