# excel-formula-utilities

This project is a port of the [excel-formula](https://github.com/joshbtn/excelFormulaUtilitiesJS) library to ES6.  
It contains a set of functions that can be used to pretty print Excel formulas and convert them into JavaScript, C# or Python code.

**Key Differences from [excel-formula](https://github.com/joshbtn/excelFormulaUtilitiesJS):**

- Removed external dependencies (Bootstrap, jQuery)
- Removed jQuery methods and replaced them with ES6 equivalents
- Modularized the library with support for tree-shaking
- Does not expose a global (window) variable
- Added `isEu` as an option to the `getTokens`, `formatFormula` and `formatFormulaHTML` methods
- Provides ES, CJS, and UMD module formats

## Install

```bash
npm install excel-formula-utilities
```

## Usage

### Module bundler

```javascript
import { formatFormula } from 'excel-formula-utilities'

const formattedFormula = formatFormula('SUM(A1:A2)')
```

### Browser

```html
<script src="https://unpkg.com/excel-formula-utilities"></script>
<script>
  const formattedFormula = ExcelFormulaUtilities.formatFormula('SUM(A1:A2)')
</script>
```

## Available methods

### formatFormula

Formats an excel formula.

Signature:  
`formatFormula(formula: string, options): string`

- `formula` - The excel formula to format
- `options` - An optional object with the following properties:

| Name                      | Description                                                                                           | Default                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| tmplFunctionStart         | Template for the start of a function, the `{{token}}` will contain the name of the function.          | `'{{autoindent}}{{token}}(\n'`                                                      |
| tmplFunctionStop          | Template for when the end of a function has been reached.                                             | `'\n{{autoindent}}{{token}})'`                                                      |
| tmplOperandError          | Template for errors.                                                                                  | `' {{token}}'`                                                                      |
| tmplOperandRange          | Template for ranges and variable names.                                                               | `'{{autoindent}}{{token}}'`                                                         |
| tmplLogical               | Template for logical operators                                                                        | `'{{token}}{{autolinebreak}}'`                                                      |
| tmplOperandLogical        | Template for logical operators such as `+ - = ...`                                                    | `'{{autoindent}}{{token}}'`                                                         |
| tmplOperandNumber         | Template for numbers.                                                                                 | `'{{autoindent}}{{token}}'`                                                         |
| tmplOperandText           | Template for text/strings.                                                                            | `'{{autoindent}}"{{token}}"'`                                                       |
| tmplArgument              | Template for argument separators such as `,.`                                                         | `'{{token}}\n'`                                                                     |
| tmplOperandOperatorInfix  | -                                                                                                     | `' {{token}}{{autolinebreak}}'`                                                     |
| tmplFunctionStartArray    | Template for the start of an array.                                                                   | `''`                                                                                |
| tmplFunctionStartArrayRow | Template for the start of an array row.                                                               | `'{'`                                                                               |
| tmplFunctionStopArrayRow  | Template for the end of an array row.                                                                 | `'}'`                                                                               |
| tmplFunctionStopArray     | Template for the end of an array.                                                                     | `''`                                                                                |
| tmplSubexpressionStart    | Template for the sub expression start.                                                                | `'{{autoindent}}(\n'`                                                               |
| tmplSubexpressionStop     | Template for the sub expression stop.                                                                 | `'\n)'`                                                                             |
| tmplIndentTab             | Template for the tab char.                                                                            | `'\t'`                                                                              |
| tmplIndentSpace           | Template for space char.                                                                              | `' '`                                                                               |
| autoLineBreak             | When rendering line breaks automatically which types should it break on.                              | `'TOK_TYPE_FUNCTION \| TOK_TYPE_ARGUMENT \| TOK_SUBTYPE_LOGICAL \| TOK_TYPE_OP_IN'` |
| newLine                   | Used for the `{{autolinebreak}}` replacement as well as some string parsing.                          | `'\n'`                                                                              |
| trim                      | Trim the output.                                                                                      | `true`                                                                              |
| customTokenRender         | This is a call back to a custom token function.                                                       | `null`                                                                              |
| prefix                    | Add a prefix to the formula.                                                                          | `''`                                                                                |
| postfix                   | Add a suffix to the formula.                                                                          | `''`                                                                                |
| isEu                      | If `true`then `;` is treated as list separator, if `false` then `;` is treated as array row separator | `false`                                                                             |

**Template Values**

- `{{autoindent}}` - apply auto indent based on current tree level
- `{{token}}` - the named token such as FUNCTION_NAME or "string"
- `{{autolinebreak}}` - apply line break automatically. tests for next element only at this point

**customTokenRender Example**

```javascript
function (tokenString, token, indent, lineBreak) {
  const outStr = token
  const useTemplate = true

  // In the return object "useTemplate" tells formatFormula()
  // weather or not to apply the template to what your return from the "tokenString".
  return { tokenString: outStr, useTemplate }
}
```

### formatFormulaHTML

Formats an excel formula into HTML.

Signature:  
`formatFormulaHTML(formula: string, options): string`

- `formula` - The excel formula to format
- `options` - An optional object with the following properties (inherits defaults from `formatFormula`):

| Name                      | Description                                                                                  | Default                                                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| tmplFunctionStart         | Template for the start of a function, the `{{token}}` will contain the name of the function. | `'{{autoindent}}<span class="function">{{token}}</span><span class="function_start">(</span><br />'`                    |
| tmplFunctionStop          | Template for when the end of a function has been reached.                                    | `'<br />{{autoindent}}{{token}}<span class="function_stop">)</span>'`                                                   |
| tmplOperandError          | Template for errors.                                                                         | `' {{token}}'`                                                                                                          |
| tmplOperandRange          | Template for ranges and variable names.                                                      | `'{{autoindent}}{{token}}'`                                                                                             |
| tmplLogical               | Template for logical operators                                                               | `'{{token}}{{autolinebreak}}'`                                                                                          |
| tmplOperandLogical        | Template for logical operators such as `+ - = ...`                                           | `'{{autoindent}}{{token}}'`                                                                                             |
| tmplOperandNumber         | Template for numbers.                                                                        | `'{{autoindent}}{{token}}'`                                                                                             |
| tmplOperandText           | Template for text/strings.                                                                   | `'{{autoindent}}<span class="quote_mark">"</span><span class="text">{{token}}</span><span class="quote_mark">"</span>'` |
| tmplArgument              | Template for argument separators such as `,.`                                                | `'{{token}}<br />'`                                                                                                     |
| tmplOperandOperatorInfix  | -                                                                                            | `' {{token}}{{autolinebreak}}'`                                                                                         |
| tmplFunctionStartArray    | Template for the start of an array.                                                          | `''`                                                                                                                    |
| tmplFunctionStartArrayRow | Template for the start of an array row.                                                      | `'{'`                                                                                                                   |
| tmplFunctionStopArrayRow  | Template for the end of an array row.                                                        | `'}'`                                                                                                                   |
| tmplFunctionStopArray     | Template for the end of an array.                                                            | `''`                                                                                                                    |
| tmplSubexpressionStart    | Template for the sub expression start.                                                       | `'{{autoindent}}('`                                                                                                     |
| tmplSubexpressionStop     | Template for the sub expression stop.                                                        | `' )'`                                                                                                                  |
| tmplIndentTab             | Template for the tab char.                                                                   | `'<span class="tabbed">&nbsp;&nbsp;&nbsp;&nbsp;</span>'`                                                                |
| tmplIndentSpace           | Template for space char.                                                                     | `'&nbsp;'`                                                                                                              |
| autoLineBreak             | When rendering line breaks automatically which types should it break on.                     | `'TOK_TYPE_FUNCTION \| TOK_TYPE_ARGUMENT \| TOK_SUBTYPE_LOGICAL \| TOK_TYPE_OP_IN '`                                    |
| newLine                   | Used for the `{{autolinebreak}}` replacement as well as some string parsing.                 | `'<br />'`                                                                                                              |
| trim                      | Trim the output.                                                                             | `true`                                                                                                                  |
| customTokenRender         | This is a call back to a custom token function.                                              | Custom function for formatFormulaHTML                                                                                   |
| prefix                    | Add a prefix to the formula.                                                                 | `'='`                                                                                                                   |
| postfix                   | Add a suffix to the formula.                                                                 | `''`                                                                                                                    |

### formula2CSharp

Converts an excel formula into C# code.

Signature:  
`formula2CSharp(formula: string, options): string`

- `formula` - The excel formula to format
- `options` - An optional object with the following properties (inherits defaults from `formatFormula`):

| Name                      | Description                                                                                  | Default                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| tmplFunctionStart         | Template for the start of a function, the `{{token}}` will contain the name of the function. | `'{{token}}('`                                                 |
| tmplFunctionStop          | Template for when the end of a function has been reached.                                    | `'{{token}})'`                                                 |
| tmplOperandError          | Template for errors.                                                                         | `'{{token}}'`                                                  |
| tmplOperandRange          | Template for ranges and variable names.                                                      | `'{{token}}'`                                                  |
| tmplOperandLogical        | Template for logical operators such as `+ - = ...`                                           | `'{{token}}'`                                                  |
| tmplOperandNumber         | Template for numbers.                                                                        | `'{{token}}'`                                                  |
| tmplOperandText           | Template for text/strings.                                                                   | `'"{{token}}"'`                                                |
| tmplArgument              | Template for argument separators such as `,.`                                                | `'{{token}}'`                                                  |
| tmplOperandOperatorInfix  | -                                                                                            | `'{{token}}'`                                                  |
| tmplFunctionStartArray    | Template for the start of an array.                                                          | `''`                                                           |
| tmplFunctionStartArrayRow | Template for the start of an array row.                                                      | `'{'`                                                          |
| tmplFunctionStopArrayRow  | Template for the end of an array row.                                                        | `'}'`                                                          |
| tmplFunctionStopArray     | Template for the end of an array.                                                            | `''`                                                           |
| tmplSubexpressionStart    | Template for the sub expression start.                                                       | `'('`                                                          |
| tmplSubexpressionStop     | Template for the sub expression stop.                                                        | `')'`                                                          |
| tmplIndentTab             | Template for the tab char.                                                                   | `'\t'`                                                         |
| tmplIndentSpace           | Template for space char.                                                                     | `' '`                                                          |
| autoLineBreak             | When rendering line breaks automatically which types should it break on.                     | `'TOK_SUBTYPE_STOP \| TOK_SUBTYPE_START \| TOK_TYPE_ARGUMENT'` |
| trim                      | Trim the output.                                                                             | `true`                                                         |
| customTokenRender         | This is a call back to a custom token function.                                              | Custom function for formula2CSharp                             |

### formula2JavaScript

Signature:
`formula2JavaScript(formula: string, options): string`

- `formula` - The excel formula to format
- `options` - An optional object with the following properties (inherits options from `formula2CSharp`):

### formula2Python

Signature:
`formula2Python(formula: string, options): string`

- `formula` - The excel formula to format
- `options` - An optional object with the following properties (inherits defaults from `formatFormula`):

| Name                      | Description                                                                                  | Default                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| tmplFunctionStart         | Template for the start of a function, the `{{token}}` will contain the name of the function. | `'{{token}}('`                                                 |
| tmplFunctionStop          | Template for when the end of a function has been reached.                                    | `'{{token}})'`                                                 |
| tmplOperandError          | Template for errors.                                                                         | `'{{token}}'`                                                  |
| tmplOperandRange          | Template for ranges and variable names.                                                      | `'{{token}}'`                                                  |
| tmplOperandLogical        | Template for logical operators such as `+ - = ...`                                           | `'{{token}}'`                                                  |
| tmplOperandNumber         | Template for numbers.                                                                        | `'{{token}}'`                                                  |
| tmplOperandText           | Template for text/strings.                                                                   | `'"{{token}}"'`                                                |
| tmplArgument              | Template for argument separators such as `,.`                                                | `'{{token}}'`                                                  |
| tmplOperandOperatorInfix  | -                                                                                            | `'{{token}}'`                                                  |
| tmplFunctionStartArray    | Template for the start of an array.                                                          | `''`                                                           |
| tmplFunctionStartArrayRow | Template for the start of an array row.                                                      | `'{'`                                                          |
| tmplFunctionStopArrayRow  | Template for the end of an array row.                                                        | `'}'`                                                          |
| tmplFunctionStopArray     | Template for the end of an array.                                                            | `''`                                                           |
| tmplSubexpressionStart    | Template for the sub expression start.                                                       | `'('`                                                          |
| tmplSubexpressionStop     | Template for the sub expression stop.                                                        | `')'`                                                          |
| tmplIndentTab             | Template for the tab char.                                                                   | `'\t'`                                                         |
| tmplIndentSpace           | Template for space char.                                                                     | `' '`                                                          |
| autoLineBreak             | When rendering line breaks automatically which types should it break on.                     | `'TOK_SUBTYPE_STOP \| TOK_SUBTYPE_START \| TOK_TYPE_ARGUMENT'` |
| trim                      | Trim the output.                                                                             | `true`                                                         |
| customTokenRender         | This is a call back to a custom token function.                                              | Custom function for formula2CSharp                             |

### getTokens

Tokenizes an excel formula.

Signature:
`getTokens(formula: string isEu: boolean): F_token[]`

- `formula` - The excel formula to format
- `isEu` - If `true`then `;` is treated as list separator, if `false` then `;` is treated as array row separator

Returns an array of tokens, e.g. given the formula `A1+1000` the output would be:

```json
[
  {
    "subtype": "range",
    "type": "operand",
    "value": "A1"
  },
  {
    "subtype": "math",
    "type": "operator-infix",
    "value": "+"
  },
  {
    "subtype": "number",
    "type": "operand",
    "value": "1000"
  }
]
```
