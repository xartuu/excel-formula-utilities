"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const constants = require("./constants.js");
function F_token(value, type, subtype) {
  this.value = value;
  this.type = type;
  this.subtype = subtype;
}
function F_tokens() {
  this.items = [];
  this.add = function(value, type, subtype) {
    if (!subtype) {
      subtype = "";
    }
    const token = new F_token(value, type, subtype);
    this.addRef(token);
    return token;
  };
  this.addRef = function(token) {
    this.items.push(token);
  };
  this.index = -1;
  this.reset = function() {
    this.index = -1;
  };
  this.BOF = function() {
    return this.index <= 0;
  };
  this.EOF = function() {
    return this.index >= this.items.length - 1;
  };
  this.moveNext = function() {
    if (this.EOF()) {
      return false;
    }
    this.index += 1;
    return true;
  };
  this.current = function() {
    if (this.index === -1) {
      return null;
    }
    return this.items[this.index];
  };
  this.next = function() {
    if (this.EOF()) {
      return null;
    }
    return this.items[this.index + 1];
  };
  this.previous = function() {
    if (this.index < 1) {
      return null;
    }
    return this.items[this.index - 1];
  };
}
function F_tokenStack() {
  this.items = [];
  this.push = function(token) {
    this.items.push(token);
  };
  this.pop = function(name) {
    const token = this.items.pop();
    return new F_token(name || "", token.type, constants.TOK_SUBTYPE_STOP);
  };
  this.token = function() {
    return this.items.length > 0 ? this.items[this.items.length - 1] : null;
  };
  this.value = function() {
    return this.token() ? this.token().value.toString() : "";
  };
  this.type = function() {
    return this.token() ? this.token().type.toString() : "";
  };
  this.subtype = function() {
    return this.token() ? this.token().subtype.toString() : "";
  };
}
function getTokens(formula, isEu = false) {
  let tokens = new F_tokens();
  const tokenStack = new F_tokenStack();
  let offset = 0;
  const currentChar = function() {
    return formula.substr(offset, 1);
  };
  const doubleChar = function() {
    return formula.substr(offset, 2);
  };
  const nextChar = function() {
    return formula.substr(offset + 1, 1);
  };
  const EOF = function() {
    return offset >= formula.length;
  };
  let token = "";
  let inString = false;
  let inPath = false;
  let inRange = false;
  let inError = false;
  const regexSN = /^[1-9]{1}(\.[0-9]+)?E{1}$/;
  while (formula.length > 0) {
    if (formula.substr(0, 1) === " ") {
      formula = formula.substr(1);
    } else {
      if (formula.substr(0, 1) === "=") {
        formula = formula.substr(1);
      }
      break;
    }
  }
  while (!EOF()) {
    if (inString) {
      if (currentChar() === '"') {
        if (nextChar() === '"') {
          token += '"';
          offset += 1;
        } else {
          inString = false;
          tokens.add(token, constants.TOK_TYPE_OPERAND, constants.TOK_SUBTYPE_TEXT);
          token = "";
        }
      } else {
        token += currentChar();
      }
      offset += 1;
      continue;
    }
    if (inPath) {
      if (currentChar() === "'") {
        if (nextChar() === "'") {
          token += "'";
          offset += 1;
        } else {
          inPath = false;
          token += "'";
        }
      } else {
        token += currentChar();
      }
      offset += 1;
      continue;
    }
    if (inRange) {
      if (currentChar() === "]") {
        inRange = false;
      }
      token += currentChar();
      offset += 1;
      continue;
    }
    if (inError) {
      token += currentChar();
      offset += 1;
      if (",#NULL!,#DIV/0!,#VALUE!,#REF!,#NAME?,#NUM!,#N/A,".indexOf("," + token + ",") !== -1) {
        inError = false;
        tokens.add(token, constants.TOK_TYPE_OPERAND, constants.TOK_SUBTYPE_ERROR);
        token = "";
      }
      continue;
    }
    if ("+-".indexOf(currentChar()) !== -1) {
      if (token.length > 1) {
        if (token.match(regexSN)) {
          token += currentChar();
          offset += 1;
          continue;
        }
      }
    }
    if (currentChar() === '"') {
      if (token.length > 0) {
        tokens.add(token, constants.TOK_TYPE_UNKNOWN);
        token = "";
      }
      inString = true;
      offset += 1;
      continue;
    }
    if (currentChar() === "'") {
      if (token.length > 0) {
        tokens.add(token, constants.TOK_TYPE_UNKNOWN);
        token = "";
      }
      token = "'";
      inPath = true;
      offset += 1;
      continue;
    }
    if (currentChar() === "[") {
      inRange = true;
      token += currentChar();
      offset += 1;
      continue;
    }
    if (currentChar() === "#") {
      if (token.length > 0) {
        tokens.add(token, constants.TOK_TYPE_UNKNOWN);
        token = "";
      }
      inError = true;
      token += currentChar();
      offset += 1;
      continue;
    }
    if (currentChar() === "{") {
      if (token.length > 0) {
        tokens.add(token, constants.TOK_TYPE_UNKNOWN);
        token = "";
      }
      tokenStack.push(tokens.add("ARRAY", constants.TOK_TYPE_FUNCTION, constants.TOK_SUBTYPE_START));
      tokenStack.push(tokens.add("ARRAYROW", constants.TOK_TYPE_FUNCTION, constants.TOK_SUBTYPE_START));
      offset += 1;
      continue;
    }
    if (currentChar() === ";") {
      if (isEu) {
        if (token.length > 0) {
          tokens.add(token, constants.TOK_TYPE_OPERAND);
          token = "";
        }
        if (tokenStack.type() !== constants.TOK_TYPE_FUNCTION) {
          tokens.add(currentChar(), constants.TOK_TYPE_OP_IN, constants.TOK_SUBTYPE_UNION);
        } else {
          tokens.add(currentChar(), constants.TOK_TYPE_ARGUMENT);
        }
        offset += 1;
        continue;
      } else {
        if (token.length > 0) {
          tokens.add(token, constants.TOK_TYPE_OPERAND);
          token = "";
        }
        tokens.addRef(tokenStack.pop());
        tokens.add(",", constants.TOK_TYPE_ARGUMENT);
        tokenStack.push(tokens.add("ARRAYROW", constants.TOK_TYPE_FUNCTION, constants.TOK_SUBTYPE_START));
        offset += 1;
        continue;
      }
    }
    if (currentChar() === "}") {
      if (token.length > 0) {
        tokens.add(token, constants.TOK_TYPE_OPERAND);
        token = "";
      }
      tokens.addRef(tokenStack.pop("ARRAYROWSTOP"));
      tokens.addRef(tokenStack.pop("ARRAYSTOP"));
      offset += 1;
      continue;
    }
    if (currentChar() === " ") {
      if (token.length > 0) {
        tokens.add(token, constants.TOK_TYPE_OPERAND);
        token = "";
      }
      tokens.add("", constants.TOK_TYPE_WHITE_SPACE);
      offset += 1;
      while (currentChar() === " " && !EOF()) {
        offset += 1;
      }
      continue;
    }
    if (",>=,<=,<>,".indexOf("," + doubleChar() + ",") !== -1) {
      if (token.length > 0) {
        tokens.add(token, constants.TOK_TYPE_OPERAND);
        token = "";
      }
      tokens.add(doubleChar(), constants.TOK_TYPE_OP_IN, constants.TOK_SUBTYPE_LOGICAL);
      offset += 2;
      continue;
    }
    if ("+-*/^&=><".indexOf(currentChar()) !== -1) {
      if (token.length > 0) {
        tokens.add(token, constants.TOK_TYPE_OPERAND);
        token = "";
      }
      tokens.add(currentChar(), constants.TOK_TYPE_OP_IN);
      offset += 1;
      continue;
    }
    if ("%".indexOf(currentChar()) !== -1) {
      if (token.length > 0) {
        tokens.add(token, constants.TOK_TYPE_OPERAND);
        token = "";
      }
      tokens.add(currentChar(), constants.TOK_TYPE_OP_POST);
      offset += 1;
      continue;
    }
    if (currentChar() === "(") {
      if (token.length > 0) {
        tokenStack.push(tokens.add(token, constants.TOK_TYPE_FUNCTION, constants.TOK_SUBTYPE_START));
        token = "";
      } else {
        tokenStack.push(tokens.add("", constants.TOK_TYPE_SUBEXPR, constants.TOK_SUBTYPE_START));
      }
      offset += 1;
      continue;
    }
    if (currentChar() === "," && !isEu) {
      if (token.length > 0) {
        tokens.add(token, constants.TOK_TYPE_OPERAND);
        token = "";
      }
      if (tokenStack.type() !== constants.TOK_TYPE_FUNCTION) {
        tokens.add(currentChar(), constants.TOK_TYPE_OP_IN, constants.TOK_SUBTYPE_UNION);
      } else {
        tokens.add(currentChar(), constants.TOK_TYPE_ARGUMENT);
      }
      offset += 1;
      continue;
    }
    if (currentChar() === ")") {
      if (token.length > 0) {
        tokens.add(token, constants.TOK_TYPE_OPERAND);
        token = "";
      }
      tokens.addRef(tokenStack.pop());
      offset += 1;
      continue;
    }
    token += currentChar();
    offset += 1;
  }
  if (token.length > 0 || inString || inPath || inRange || inError) {
    if (inString || inPath || inRange || inError) {
      if (inString) {
        token = '"' + token;
      } else if (inPath) {
        token = "'" + token;
      } else if (inRange) {
        token = "[" + token;
      } else if (inError) {
        token = "#" + token;
      }
      tokens.add(token, constants.TOK_TYPE_UNKNOWN);
    } else {
      tokens.add(token, constants.TOK_TYPE_OPERAND);
    }
  }
  const tokens2 = new F_tokens();
  while (tokens.moveNext()) {
    token = tokens.current();
    if (token.type.toString() === constants.TOK_TYPE_WHITE_SPACE) {
      let doAddToken = tokens.BOF() || tokens.EOF();
      doAddToken = doAddToken && (tokens.previous().type.toString() === constants.TOK_TYPE_FUNCTION && tokens.previous().subtype.toString() === constants.TOK_SUBTYPE_STOP || tokens.previous().type.toString() === constants.TOK_TYPE_SUBEXPR && tokens.previous().subtype.toString() === constants.TOK_SUBTYPE_STOP || tokens.previous().type.toString() === constants.TOK_TYPE_OPERAND);
      doAddToken = doAddToken && (tokens.next().type.toString() === constants.TOK_TYPE_FUNCTION && tokens.next().subtype.toString() === constants.TOK_SUBTYPE_START || tokens.next().type.toString() === constants.TOK_TYPE_SUBEXPR && tokens.next().subtype.toString() === constants.TOK_SUBTYPE_START || tokens.next().type.toString() === constants.TOK_TYPE_OPERAND);
      if (doAddToken) {
        tokens2.add(token.value.toString(), constants.TOK_TYPE_OP_IN, constants.TOK_SUBTYPE_INTERSECT);
      }
      continue;
    }
    tokens2.addRef(token);
  }
  while (tokens2.moveNext()) {
    token = tokens2.current();
    if (token.type.toString() === constants.TOK_TYPE_OP_IN && token.value.toString() === "-") {
      if (tokens2.BOF()) {
        token.type = constants.TOK_TYPE_OP_PRE.toString();
      } else if (tokens2.previous().type.toString() === constants.TOK_TYPE_FUNCTION && tokens2.previous().subtype.toString() === constants.TOK_SUBTYPE_STOP || tokens2.previous().type.toString() === constants.TOK_TYPE_SUBEXPR && tokens2.previous().subtype.toString() === constants.TOK_SUBTYPE_STOP || tokens2.previous().type.toString() === constants.TOK_TYPE_OP_POST || tokens2.previous().type.toString() === constants.TOK_TYPE_OPERAND) {
        token.subtype = constants.TOK_SUBTYPE_MATH.toString();
      } else {
        token.type = constants.TOK_TYPE_OP_PRE.toString();
      }
      continue;
    }
    if (token.type.toString() === constants.TOK_TYPE_OP_IN && token.value.toString() === "+") {
      if (tokens2.BOF()) {
        token.type = constants.TOK_TYPE_NOOP.toString();
      } else if (tokens2.previous().type.toString() === constants.TOK_TYPE_FUNCTION && tokens2.previous().subtype.toString() === constants.TOK_SUBTYPE_STOP || tokens2.previous().type.toString() === constants.TOK_TYPE_SUBEXPR && tokens2.previous().subtype.toString() === constants.TOK_SUBTYPE_STOP || tokens2.previous().type.toString() === constants.TOK_TYPE_OP_POST || tokens2.previous().type.toString() === constants.TOK_TYPE_OPERAND) {
        token.subtype = constants.TOK_SUBTYPE_MATH.toString();
      } else {
        token.type = constants.TOK_TYPE_NOOP.toString();
      }
      continue;
    }
    if (token.type.toString() === constants.TOK_TYPE_OP_IN && token.subtype.length === 0) {
      if ("<>=".indexOf(token.value.substr(0, 1)) !== -1) {
        token.subtype = constants.TOK_SUBTYPE_LOGICAL.toString();
      } else if (token.value.toString() === "&") {
        token.subtype = constants.TOK_SUBTYPE_CONCAT.toString();
      } else {
        token.subtype = constants.TOK_SUBTYPE_MATH.toString();
      }
      continue;
    }
    if (token.type.toString() === constants.TOK_TYPE_OPERAND && token.subtype.length === 0) {
      if (isNaN(parseFloat(token.value))) {
        if (token.value.toString() === "TRUE" || token.value.toString() === "FALSE") {
          token.subtype = constants.TOK_SUBTYPE_LOGICAL.toString();
        } else {
          token.subtype = constants.TOK_SUBTYPE_RANGE.toString();
        }
      } else {
        token.subtype = constants.TOK_SUBTYPE_NUMBER.toString();
      }
      continue;
    }
    if (token.type.toString() === constants.TOK_TYPE_FUNCTION) {
      if (token.value.substr(0, 1) === "@") {
        token.value = token.value.substr(1).toString();
      }
      continue;
    }
  }
  tokens2.reset();
  tokens = new F_tokens();
  while (tokens2.moveNext()) {
    if (tokens2.current().type.toString() !== constants.TOK_TYPE_NOOP) {
      tokens.addRef(tokens2.current());
    }
  }
  tokens.reset();
  return tokens;
}
exports.getTokens = getTokens;
