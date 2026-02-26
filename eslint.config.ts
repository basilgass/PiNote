import eslint from '@eslint/js'
import eslintPluginVue from 'eslint-plugin-vue'
import typescriptEslint from "typescript-eslint"
import globals from 'globals'

export default typescriptEslint.config(
  { ignores: ['*.d.ts', '**/coverage', '**/dist'] },
  {
    extends: [
      eslint.configs.recommended,
      ...typescriptEslint.configs.stylistic,
      ...eslintPluginVue.configs['flat/recommended']
    ],
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        parser: typescriptEslint.parser,
        "allowImportExportEverywhere": true,
      },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error"],
      "semi": [
        "error",
        "never"
      ],
      "no-undef": "off",
      "prefer-const": "off",
      "vue/html-indent": [
        "error",
        "tab"
      ],
      "vue/first-attribute-linebreak": [
        "error",
        {
          "multiline": "below",
          "singleline": "ignore"
        }
      ],
      "vue/html-closing-bracket-newline": [
        "error", {
          "singleline": "never",
          "multiline": "always"
        }
      ],
      "vue/block-order": [
        "error",
        {
          "order": [
            "script",
            "template",
            "style"
          ]
        }
      ],
      "vue/multi-word-component-names": "off",
      "vue/max-attributes-per-line": ["error", {
        "singleline": {
          "max": 1
        },
        "multiline": {
          "max": 1
        }
      }],
    }
  },
)