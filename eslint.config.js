import { config } from '@kouts/eslint-config'

export default [
  ...config({
    ts: false,
    vue: false,
  }),
  {
    name: 'overrides',
    ignores: ['.husky', '.history', 'coverage'],
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
