import {
  TOK_SUBTYPE_CONCAT,
  TOK_SUBTYPE_ERROR,
  TOK_SUBTYPE_INTERSECT,
  TOK_SUBTYPE_LOGICAL,
  TOK_SUBTYPE_MATH,
  TOK_SUBTYPE_NUMBER,
  TOK_SUBTYPE_RANGE,
  TOK_SUBTYPE_START,
  TOK_SUBTYPE_STOP,
  TOK_SUBTYPE_TEXT,
  TOK_SUBTYPE_UNION,
  TOK_TYPE_ARGUMENT,
  TOK_TYPE_FUNCTION,
  TOK_TYPE_NOOP,
  TOK_TYPE_OP_IN,
  TOK_TYPE_OP_POST,
  TOK_TYPE_OP_PRE,
  TOK_TYPE_OPERAND,
  TOK_TYPE_SUBEXPR,
  TOK_TYPE_UNKNOWN,
  TOK_TYPE_WHITE_SPACE,
} from './constants'

/**
 * @class
 */
function F_token(value, type, subtype) {
  this.value = value
  this.type = type
  this.subtype = subtype
}

/**
 * @class
 */
function F_tokens() {
  this.items = []

  this.add = function (value, type, subtype) {
    if (!subtype) {
      subtype = ''
    }
    const token = new F_token(value, type, subtype)

    this.addRef(token)

    return token
  }
  this.addRef = function (token) {
    this.items.push(token)
  }

  this.index = -1
  this.reset = function () {
    this.index = -1
  }
  this.BOF = function () {
    return this.index <= 0
  }
  this.EOF = function () {
    return this.index >= this.items.length - 1
  }
  this.moveNext = function () {
    if (this.EOF()) {
      return false
    }
    this.index += 1

    return true
  }
  this.current = function () {
    if (this.index === -1) {
      return null
    }

    return this.items[this.index]
  }
  this.next = function () {
    if (this.EOF()) {
      return null
    }

    return this.items[this.index + 1]
  }
  this.previous = function () {
    if (this.index < 1) {
      return null
    }

    return this.items[this.index - 1]
  }
}

function F_tokenStack() {
  this.items = []

  this.push = function (token) {
    this.items.push(token)
  }
  this.pop = function (name) {
    const token = this.items.pop()

    return new F_token(name || '', token.type, TOK_SUBTYPE_STOP)
  }

  this.token = function () {
    return this.items.length > 0 ? this.items[this.items.length - 1] : null
  }
  this.value = function () {
    return this.token() ? this.token().value.toString() : ''
  }
  this.type = function () {
    return this.token() ? this.token().type.toString() : ''
  }
  this.subtype = function () {
    return this.token() ? this.token().subtype.toString() : ''
  }
}

export function getTokens(formula, isEu = false) {
  let tokens = new F_tokens()
  const tokenStack = new F_tokenStack()
  let offset = 0
  const currentChar = function () {
    return formula.substr(offset, 1)
  }
  const doubleChar = function () {
    return formula.substr(offset, 2)
  }
  const nextChar = function () {
    return formula.substr(offset + 1, 1)
  }
  const EOF = function () {
    return offset >= formula.length
  }
  let token = ''
  let inString = false
  let inPath = false
  let inRange = false
  let inError = false
  const regexSN = /^[1-9]{1}(\.[0-9]+)?E{1}$/

  while (formula.length > 0) {
    if (formula.substr(0, 1) === ' ') {
      formula = formula.substr(1)
    } else {
      if (formula.substr(0, 1) === '=') {
        formula = formula.substr(1)
      }
      break
    }
  }

  while (!EOF()) {
    // State-dependent character evaluation (order is important)
    // Double-quoted strings
    // Embeds are doubled
    // End marks token
    if (inString) {
      if (currentChar() === '"') {
        if (nextChar() === '"') {
          token += '"'
          offset += 1
        } else {
          inString = false
          tokens.add(token, TOK_TYPE_OPERAND, TOK_SUBTYPE_TEXT)
          token = ''
        }
      } else {
        token += currentChar()
      }
      offset += 1
      continue
    }

    // Single-quoted strings (links)
    // Embeds are double
    // End does not mark a token
    if (inPath) {
      if (currentChar() === "'") {
        if (nextChar() === "'") {
          token += "'"
          offset += 1
        } else {
          inPath = false
          token += "'"
        }
      } else {
        token += currentChar()
      }

      offset += 1
      continue
    }

    // Bracketed strings (range offset or linked workbook name)
    // No embeds (changed to "()" by Excel)
    // End does not mark a token
    if (inRange) {
      if (currentChar() === ']') {
        inRange = false
      }
      token += currentChar()
      offset += 1
      continue
    }

    // Error values
    // End marks a token, determined from absolute list of values
    if (inError) {
      token += currentChar()
      offset += 1
      if (',#NULL!,#DIV/0!,#VALUE!,#REF!,#NAME?,#NUM!,#N/A,'.indexOf(',' + token + ',') !== -1) {
        inError = false
        tokens.add(token, TOK_TYPE_OPERAND, TOK_SUBTYPE_ERROR)
        token = ''
      }
      continue
    }

    // Scientific notation check
    if ('+-'.indexOf(currentChar()) !== -1) {
      if (token.length > 1) {
        if (token.match(regexSN)) {
          token += currentChar()
          offset += 1
          continue
        }
      }
    }

    // Independent character evaluation (order not important)
    // Establish state-dependent character evaluations
    if (currentChar() === '"') {
      if (token.length > 0) {
        // Not expected
        tokens.add(token, TOK_TYPE_UNKNOWN)
        token = ''
      }
      inString = true
      offset += 1
      continue
    }

    if (currentChar() === "'") {
      if (token.length > 0) {
        // Not expected
        tokens.add(token, TOK_TYPE_UNKNOWN)
        token = ''
      }
      token = "'"
      inPath = true
      offset += 1
      continue
    }

    if (currentChar() === '[') {
      inRange = true
      token += currentChar()
      offset += 1
      continue
    }

    if (currentChar() === '#') {
      if (token.length > 0) {
        // Not expected
        tokens.add(token, TOK_TYPE_UNKNOWN)
        token = ''
      }
      inError = true
      token += currentChar()
      offset += 1
      continue
    }

    // Mark start and end of arrays and array rows
    if (currentChar() === '{') {
      if (token.length > 0) {
        // Not expected
        tokens.add(token, TOK_TYPE_UNKNOWN)
        token = ''
      }
      tokenStack.push(tokens.add('ARRAY', TOK_TYPE_FUNCTION, TOK_SUBTYPE_START))
      tokenStack.push(tokens.add('ARRAYROW', TOK_TYPE_FUNCTION, TOK_SUBTYPE_START))
      offset += 1
      continue
    }

    if (currentChar() === ';') {
      if (isEu) {
        // If is EU then handle ; as list separators
        if (token.length > 0) {
          tokens.add(token, TOK_TYPE_OPERAND)
          token = ''
        }
        if (tokenStack.type() !== TOK_TYPE_FUNCTION) {
          tokens.add(currentChar(), TOK_TYPE_OP_IN, TOK_SUBTYPE_UNION)
        } else {
          tokens.add(currentChar(), TOK_TYPE_ARGUMENT)
        }
        offset += 1
        continue
      } else {
        // Else if not Eu handle ; as array row separator
        if (token.length > 0) {
          tokens.add(token, TOK_TYPE_OPERAND)
          token = ''
        }
        tokens.addRef(tokenStack.pop())
        tokens.add(',', TOK_TYPE_ARGUMENT)
        tokenStack.push(tokens.add('ARRAYROW', TOK_TYPE_FUNCTION, TOK_SUBTYPE_START))
        offset += 1
        continue
      }
    }

    if (currentChar() === '}') {
      if (token.length > 0) {
        tokens.add(token, TOK_TYPE_OPERAND)
        token = ''
      }
      tokens.addRef(tokenStack.pop('ARRAYROWSTOP'))
      tokens.addRef(tokenStack.pop('ARRAYSTOP'))
      offset += 1
      continue
    }

    // Trim white-space
    if (currentChar() === ' ') {
      if (token.length > 0) {
        tokens.add(token, TOK_TYPE_OPERAND)
        token = ''
      }
      tokens.add('', TOK_TYPE_WHITE_SPACE)
      offset += 1
      while (currentChar() === ' ' && !EOF()) {
        offset += 1
      }
      continue
    }

    // Multi-character comparators
    if (',>=,<=,<>,'.indexOf(',' + doubleChar() + ',') !== -1) {
      if (token.length > 0) {
        tokens.add(token, TOK_TYPE_OPERAND)
        token = ''
      }
      tokens.add(doubleChar(), TOK_TYPE_OP_IN, TOK_SUBTYPE_LOGICAL)
      offset += 2
      continue
    }

    // Standard infix operators
    if ('+-*/^&=><'.indexOf(currentChar()) !== -1) {
      if (token.length > 0) {
        tokens.add(token, TOK_TYPE_OPERAND)
        token = ''
      }
      tokens.add(currentChar(), TOK_TYPE_OP_IN)
      offset += 1
      continue
    }

    // Standard postfix operators
    if ('%'.indexOf(currentChar()) !== -1) {
      if (token.length > 0) {
        tokens.add(token, TOK_TYPE_OPERAND)
        token = ''
      }
      tokens.add(currentChar(), TOK_TYPE_OP_POST)
      offset += 1
      continue
    }

    // Start subexpression or function
    if (currentChar() === '(') {
      if (token.length > 0) {
        tokenStack.push(tokens.add(token, TOK_TYPE_FUNCTION, TOK_SUBTYPE_START))
        token = ''
      } else {
        tokenStack.push(tokens.add('', TOK_TYPE_SUBEXPR, TOK_SUBTYPE_START))
      }
      offset += 1
      continue
    }

    // Function, subexpression, array parameters
    if (currentChar() === ',' && !isEu) {
      if (token.length > 0) {
        tokens.add(token, TOK_TYPE_OPERAND)
        token = ''
      }
      if (tokenStack.type() !== TOK_TYPE_FUNCTION) {
        tokens.add(currentChar(), TOK_TYPE_OP_IN, TOK_SUBTYPE_UNION)
      } else {
        tokens.add(currentChar(), TOK_TYPE_ARGUMENT)
      }
      offset += 1
      continue
    }

    // Stop subexpression
    if (currentChar() === ')') {
      if (token.length > 0) {
        tokens.add(token, TOK_TYPE_OPERAND)
        token = ''
      }
      tokens.addRef(tokenStack.pop())
      offset += 1
      continue
    }

    // Token accumulation
    token += currentChar()
    offset += 1
  }

  // Dump remaining accumulation
  if (token.length > 0 || inString || inPath || inRange || inError) {
    if (inString || inPath || inRange || inError) {
      if (inString) {
        token = '"' + token
      } else if (inPath) {
        token = "'" + token
      } else if (inRange) {
        token = '[' + token
      } else if (inError) {
        token = '#' + token
      }

      tokens.add(token, TOK_TYPE_UNKNOWN)
    } else {
      tokens.add(token, TOK_TYPE_OPERAND)
    }
  }

  // Move all tokens to a new collection, excluding all unnecessary white-space tokens
  const tokens2 = new F_tokens()

  while (tokens.moveNext()) {
    token = tokens.current()

    if (token.type.toString() === TOK_TYPE_WHITE_SPACE) {
      let doAddToken = tokens.BOF() || tokens.EOF()

      // if ((tokens.BOF()) || (tokens.EOF())) {}
      doAddToken =
        doAddToken &&
        ((tokens.previous().type.toString() === TOK_TYPE_FUNCTION &&
          tokens.previous().subtype.toString() === TOK_SUBTYPE_STOP) ||
          (tokens.previous().type.toString() === TOK_TYPE_SUBEXPR &&
            tokens.previous().subtype.toString() === TOK_SUBTYPE_STOP) ||
          tokens.previous().type.toString() === TOK_TYPE_OPERAND)
      //else if (!(
      //       ((tokens.previous().type === TOK_TYPE_FUNCTION) && (tokens.previous().subtype == TOK_SUBTYPE_STOP))
      //    || ((tokens.previous().type == TOK_TYPE_SUBEXPR) && (tokens.previous().subtype == TOK_SUBTYPE_STOP))
      //    || (tokens.previous().type == TOK_TYPE_OPERAND)))
      //  {}
      doAddToken =
        doAddToken &&
        ((tokens.next().type.toString() === TOK_TYPE_FUNCTION && tokens.next().subtype.toString() === TOK_SUBTYPE_START) ||
          (tokens.next().type.toString() === TOK_TYPE_SUBEXPR && tokens.next().subtype.toString() === TOK_SUBTYPE_START) ||
          tokens.next().type.toString() === TOK_TYPE_OPERAND)
      //else if (!(
      //	((tokens.next().type == TOK_TYPE_FUNCTION) && (tokens.next().subtype == TOK_SUBTYPE_START))
      //	|| ((tokens.next().type == TOK_TYPE_SUBEXPR) && (tokens.next().subtype == TOK_SUBTYPE_START))
      //	|| (tokens.next().type == TOK_TYPE_OPERAND)))
      //	{}
      //else { tokens2.add(token.value, TOK_TYPE_OP_IN, TOK_SUBTYPE_INTERSECT)};
      if (doAddToken) {
        tokens2.add(token.value.toString(), TOK_TYPE_OP_IN, TOK_SUBTYPE_INTERSECT)
      }
      continue
    }

    tokens2.addRef(token)
  }

  // Switch infix "-" operator to prefix when appropriate, switch infix "+" operator to noop when appropriate, identify operand
  // and infix-operator subtypes, pull "@" from in front of function names
  while (tokens2.moveNext()) {
    token = tokens2.current()

    if (token.type.toString() === TOK_TYPE_OP_IN && token.value.toString() === '-') {
      if (tokens2.BOF()) {
        token.type = TOK_TYPE_OP_PRE.toString()
      } else if (
        (tokens2.previous().type.toString() === TOK_TYPE_FUNCTION &&
          tokens2.previous().subtype.toString() === TOK_SUBTYPE_STOP) ||
        (tokens2.previous().type.toString() === TOK_TYPE_SUBEXPR &&
          tokens2.previous().subtype.toString() === TOK_SUBTYPE_STOP) ||
        tokens2.previous().type.toString() === TOK_TYPE_OP_POST ||
        tokens2.previous().type.toString() === TOK_TYPE_OPERAND
      ) {
        token.subtype = TOK_SUBTYPE_MATH.toString()
      } else {
        token.type = TOK_TYPE_OP_PRE.toString()
      }
      continue
    }

    if (token.type.toString() === TOK_TYPE_OP_IN && token.value.toString() === '+') {
      if (tokens2.BOF()) {
        token.type = TOK_TYPE_NOOP.toString()
      } else if (
        (tokens2.previous().type.toString() === TOK_TYPE_FUNCTION &&
          tokens2.previous().subtype.toString() === TOK_SUBTYPE_STOP) ||
        (tokens2.previous().type.toString() === TOK_TYPE_SUBEXPR &&
          tokens2.previous().subtype.toString() === TOK_SUBTYPE_STOP) ||
        tokens2.previous().type.toString() === TOK_TYPE_OP_POST ||
        tokens2.previous().type.toString() === TOK_TYPE_OPERAND
      ) {
        token.subtype = TOK_SUBTYPE_MATH.toString()
      } else {
        token.type = TOK_TYPE_NOOP.toString()
      }
      continue
    }

    if (token.type.toString() === TOK_TYPE_OP_IN && token.subtype.length === 0) {
      if ('<>='.indexOf(token.value.substr(0, 1)) !== -1) {
        token.subtype = TOK_SUBTYPE_LOGICAL.toString()
      } else if (token.value.toString() === '&') {
        token.subtype = TOK_SUBTYPE_CONCAT.toString()
      } else {
        token.subtype = TOK_SUBTYPE_MATH.toString()
      }
      continue
    }

    if (token.type.toString() === TOK_TYPE_OPERAND && token.subtype.length === 0) {
      if (isNaN(parseFloat(token.value))) {
        if (token.value.toString() === 'TRUE' || token.value.toString() === 'FALSE') {
          token.subtype = TOK_SUBTYPE_LOGICAL.toString()
        } else {
          token.subtype = TOK_SUBTYPE_RANGE.toString()
        }
      } else {
        token.subtype = TOK_SUBTYPE_NUMBER.toString()
      }

      continue
    }

    if (token.type.toString() === TOK_TYPE_FUNCTION) {
      if (token.value.substr(0, 1) === '@') {
        token.value = token.value.substr(1).toString()
      }
      continue
    }
  }

  tokens2.reset()

  // Move all tokens to a new collection, excluding all no-ops
  tokens = new F_tokens()

  while (tokens2.moveNext()) {
    if (tokens2.current().type.toString() !== TOK_TYPE_NOOP) {
      tokens.addRef(tokens2.current())
    }
  }

  tokens.reset()

  return tokens
}
