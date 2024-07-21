import globals from 'globals';
import pluginJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
    { files: ['**/*.js'], languageOptions: { sourceType: 'module' } },
    { languageOptions: { globals: { ...globals.browser, ...globals.node, ...globals.jquery } } },
    pluginJs.configs.recommended,
    eslintConfigPrettier
];
