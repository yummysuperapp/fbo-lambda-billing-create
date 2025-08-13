import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * ESLint Configuration for FBO Lambda Template
 * 
 * LANGUAGE STANDARDS:
 * - All code (variables, functions, classes, comments) MUST be in English
 * - Documentation files (README.md, docs/*.md) should be in Spanish
 * - Code examples in documentation MUST be in English
 * 
 * For complete documentation see: https://www.notion.so/yummy/financial-backoffice
 */
export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // TypeScript specific rules (only syntax-based, no type checking)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      
      // General ESLint rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
    },
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      '*.js',
      '*.mjs',
      'eslint.config.js',
    ],
  },
];