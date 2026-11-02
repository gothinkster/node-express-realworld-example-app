import js from '@eslint/js';
import noHardcodedSecret from './eslint-rules/no-hardcoded-secret.js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'node_modules/', '.nx/', 'e2e/', 'tmp/'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      eqeqeq: 'error',
      complexity: ['warn', 10],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
    },
  },

  { files: ['**/*.js'], rules: { '@typescript-eslint/no-require-imports': 'off' } },

  { files: ['src/tests/**/*.ts'], languageOptions: { globals: { ...globals.jest } } },
  {
    plugins: { local: { rules: { 'no-hardcoded-secret': noHardcodedSecret } } },
    rules: { 'local/no-hardcoded-secret': 'error' },
  },
  prettier
);
