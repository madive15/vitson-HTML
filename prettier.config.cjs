module.exports = {
  semi: true,
  singleQuote: true,
  arrowParens: 'always',
  bracketSpacing: false,
  endOfLine: 'auto',
  jsxBracketSameLine: false,
  printWidth: 120,
  proseWrap: 'preserve',
  tabWidth: 2,
  trailingComma: 'none',
  useTabs: false,
  overrides: [
    {
      files: ['*.ejs'],
      options: {
        parser: 'html'
      }
    }
  ]
};
