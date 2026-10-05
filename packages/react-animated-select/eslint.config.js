import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import {defineConfig, globalIgnores} from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: {jsx: true},
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', {varsIgnorePattern: '^[A-Z_]'}],
    },
  },
  // the core never imports a plugin (src/README.md, Plugins)
  {
    files: ['src/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': ['error', {patterns: [{group: ['./chip*', './useChipLayout*', './paging*'], message: 'The core never imports a plugin: plugins enter through `plugins` and `config.ext`.'}]}],
    },
  },
  {
    files: ['src/index.js', 'src/chip.jsx', 'src/useChipLayout.js', 'src/chipGeometry.js', 'src/chipMotion.js', 'src/paging.jsx'],
    rules: {'no-restricted-imports': 'off'},
  },
  // a plugin module exports its plugin object
  {
    files: ['src/chip.jsx', 'src/paging.jsx'],
    rules: {'react-refresh/only-export-components': ['error', {allowExportNames: ['chips', 'paging']}]},
  },
])
