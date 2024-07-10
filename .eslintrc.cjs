/* eslint-env node */
module.exports = {
    ignorePatterns: ["cdk.out/*", "src"],
    extends: [
        'eslint:recommended', 
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/stylistic',
        //Contains recommended + additional recommended rules that require type information.
        //'plugin:@typescript-eslint/recommended-type-checked'
    ],
    rules: {
        "@typescript-eslint/no-empty-interface": "error",
        "@typescript-eslint/no-unused-vars": "error",
        "@typescript-eslint/naming-convention":  [ 
            "error",
            {
                "selector": "variable",
                "types": ["boolean"],
                "format": ["PascalCase"],
                "prefix": ["is", "should", "has", "can", "did", "will", "enable"]
            },
            {
                "selector": "variable",
                "format": ["camelCase", "UPPER_CASE"]
              }
        ]
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    plugins: ['@typescript-eslint'],

    root: true,
  };