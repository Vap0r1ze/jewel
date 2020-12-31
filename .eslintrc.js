module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: '@typescript-eslint/parser',
  extends: [
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    project: './tsconfig.json',
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/semi': [2, 'never'],
    'arrow-parens': ['error', 'as-needed'],
    'class-methods-use-this': 'off',
    'no-await-in-loop': 'off',
    'no-bitwise': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-continue': 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-sparse-arrays': 'off',
    'prefer-destructuring': ['error', {
      'VariableDeclarator': {
        'array': true,
        'object': true,
      },
      'AssignmentExpression': {
        'array': false,
        'object': false,
      }
    }, {
      'enforceForRenamedProperties': false,
    }],
    'semi': [2, 'never'],
  },
}
