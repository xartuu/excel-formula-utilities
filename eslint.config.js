import { config } from '@kouts/eslint-config'

export default [
  ...config({
    ts: false,
    vue: true,
  }),
  {
    // Ignores has to be its own object - https://github.com/eslint/eslint/issues/17400
    name: 'project-ignores',
    ignores: ['.husky', '.history', 'coverage', 'docs'],
  },
  {
    name: 'project-overrides',
    rules: {
      'no-unused-vars': 'warn',
      'valid-typeof': 'warn',
      'no-fallthrough': 'warn',
      'no-var': 'warn',
      'one-var': 'warn',
      camelcase: 'off',
      'prefer-regex-literals': 'warn',
      'no-throw-literal': 'warn',
      'no-unused-expressions': 'warn',
      'no-sequences': 'warn',
      'no-constant-binary-expression': 'warn',
    },
  },
]
