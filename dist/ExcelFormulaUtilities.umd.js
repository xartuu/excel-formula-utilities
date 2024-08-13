(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.ExcelFormulaUtilities = {}));
})(this, function(exports2) {
  "use strict";
  const types = {};
  const TOK_TYPE_NOOP = types.TOK_TYPE_NOOP = "noop";
  const TOK_TYPE_OPERAND = types.TOK_TYPE_OPERAND = "operand";
  const TOK_TYPE_FUNCTION = types.TOK_TYPE_FUNCTION = "function";
  const TOK_TYPE_SUBEXPR = types.TOK_TYPE_SUBEXPR = "subexpression";
  const TOK_TYPE_ARGUMENT = types.TOK_TYPE_ARGUMENT = "argument";
  const TOK_TYPE_OP_PRE = types.TOK_TYPE_OP_PRE = "operator-prefix";
  const TOK_TYPE_OP_IN = types.TOK_TYPE_OP_IN = "operator-infix";
  const TOK_TYPE_OP_POST = types.TOK_TYPE_OP_POST = "operator-postfix";
  const TOK_TYPE_WHITE_SPACE = types.TOK_TYPE_WHITE_SPACE = "white-space";
  const TOK_TYPE_UNKNOWN = types.TOK_TYPE_UNKNOWN = "unknown";
  const TOK_SUBTYPE_START = types.TOK_SUBTYPE_START = "start";
  const TOK_SUBTYPE_STOP = types.TOK_SUBTYPE_STOP = "stop";
  const TOK_SUBTYPE_TEXT = types.TOK_SUBTYPE_TEXT = "text";
  const TOK_SUBTYPE_NUMBER = types.TOK_SUBTYPE_NUMBER = "number";
  const TOK_SUBTYPE_LOGICAL = types.TOK_SUBTYPE_LOGICAL = "logical";
  const TOK_SUBTYPE_ERROR = types.TOK_SUBTYPE_ERROR = "error";
  const TOK_SUBTYPE_RANGE = types.TOK_SUBTYPE_RANGE = "range";
  const TOK_SUBTYPE_MATH = types.TOK_SUBTYPE_MATH = "math";
  const TOK_SUBTYPE_CONCAT = types.TOK_SUBTYPE_CONCAT = "concatenate";
  const TOK_SUBTYPE_INTERSECT = types.TOK_SUBTYPE_INTERSECT = "intersect";
  const TOK_SUBTYPE_UNION = types.TOK_SUBTYPE_UNION = "union";
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
      return new F_token(name || "", token.type, TOK_SUBTYPE_STOP);
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
  function getTokens$1(formula, isEu = false) {
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
            tokens.add(token, TOK_TYPE_OPERAND, TOK_SUBTYPE_TEXT);
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
          tokens.add(token, TOK_TYPE_OPERAND, TOK_SUBTYPE_ERROR);
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
          tokens.add(token, TOK_TYPE_UNKNOWN);
          token = "";
        }
        inString = true;
        offset += 1;
        continue;
      }
      if (currentChar() === "'") {
        if (token.length > 0) {
          tokens.add(token, TOK_TYPE_UNKNOWN);
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
          tokens.add(token, TOK_TYPE_UNKNOWN);
          token = "";
        }
        inError = true;
        token += currentChar();
        offset += 1;
        continue;
      }
      if (currentChar() === "{") {
        if (token.length > 0) {
          tokens.add(token, TOK_TYPE_UNKNOWN);
          token = "";
        }
        tokenStack.push(tokens.add("ARRAY", TOK_TYPE_FUNCTION, TOK_SUBTYPE_START));
        tokenStack.push(tokens.add("ARRAYROW", TOK_TYPE_FUNCTION, TOK_SUBTYPE_START));
        offset += 1;
        continue;
      }
      if (currentChar() === ";") {
        if (isEu) {
          if (token.length > 0) {
            tokens.add(token, TOK_TYPE_OPERAND);
            token = "";
          }
          if (tokenStack.type() !== TOK_TYPE_FUNCTION) {
            tokens.add(currentChar(), TOK_TYPE_OP_IN, TOK_SUBTYPE_UNION);
          } else {
            tokens.add(currentChar(), TOK_TYPE_ARGUMENT);
          }
          offset += 1;
          continue;
        } else {
          if (token.length > 0) {
            tokens.add(token, TOK_TYPE_OPERAND);
            token = "";
          }
          tokens.addRef(tokenStack.pop());
          tokens.add(",", TOK_TYPE_ARGUMENT);
          tokenStack.push(tokens.add("ARRAYROW", TOK_TYPE_FUNCTION, TOK_SUBTYPE_START));
          offset += 1;
          continue;
        }
      }
      if (currentChar() === "}") {
        if (token.length > 0) {
          tokens.add(token, TOK_TYPE_OPERAND);
          token = "";
        }
        tokens.addRef(tokenStack.pop("ARRAYROWSTOP"));
        tokens.addRef(tokenStack.pop("ARRAYSTOP"));
        offset += 1;
        continue;
      }
      if (currentChar() === " ") {
        if (token.length > 0) {
          tokens.add(token, TOK_TYPE_OPERAND);
          token = "";
        }
        tokens.add("", TOK_TYPE_WHITE_SPACE);
        offset += 1;
        while (currentChar() === " " && !EOF()) {
          offset += 1;
        }
        continue;
      }
      if (",>=,<=,<>,".indexOf("," + doubleChar() + ",") !== -1) {
        if (token.length > 0) {
          tokens.add(token, TOK_TYPE_OPERAND);
          token = "";
        }
        tokens.add(doubleChar(), TOK_TYPE_OP_IN, TOK_SUBTYPE_LOGICAL);
        offset += 2;
        continue;
      }
      if ("+-*/^&=><".indexOf(currentChar()) !== -1) {
        if (token.length > 0) {
          tokens.add(token, TOK_TYPE_OPERAND);
          token = "";
        }
        tokens.add(currentChar(), TOK_TYPE_OP_IN);
        offset += 1;
        continue;
      }
      if ("%".indexOf(currentChar()) !== -1) {
        if (token.length > 0) {
          tokens.add(token, TOK_TYPE_OPERAND);
          token = "";
        }
        tokens.add(currentChar(), TOK_TYPE_OP_POST);
        offset += 1;
        continue;
      }
      if (currentChar() === "(") {
        if (token.length > 0) {
          tokenStack.push(tokens.add(token, TOK_TYPE_FUNCTION, TOK_SUBTYPE_START));
          token = "";
        } else {
          tokenStack.push(tokens.add("", TOK_TYPE_SUBEXPR, TOK_SUBTYPE_START));
        }
        offset += 1;
        continue;
      }
      if (currentChar() === "," && !isEu) {
        if (token.length > 0) {
          tokens.add(token, TOK_TYPE_OPERAND);
          token = "";
        }
        if (tokenStack.type() !== TOK_TYPE_FUNCTION) {
          tokens.add(currentChar(), TOK_TYPE_OP_IN, TOK_SUBTYPE_UNION);
        } else {
          tokens.add(currentChar(), TOK_TYPE_ARGUMENT);
        }
        offset += 1;
        continue;
      }
      if (currentChar() === ")") {
        if (token.length > 0) {
          tokens.add(token, TOK_TYPE_OPERAND);
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
        tokens.add(token, TOK_TYPE_UNKNOWN);
      } else {
        tokens.add(token, TOK_TYPE_OPERAND);
      }
    }
    const tokens2 = new F_tokens();
    while (tokens.moveNext()) {
      token = tokens.current();
      if (token.type.toString() === TOK_TYPE_WHITE_SPACE) {
        let doAddToken = tokens.BOF() || tokens.EOF();
        doAddToken = doAddToken && (tokens.previous().type.toString() === TOK_TYPE_FUNCTION && tokens.previous().subtype.toString() === TOK_SUBTYPE_STOP || tokens.previous().type.toString() === TOK_TYPE_SUBEXPR && tokens.previous().subtype.toString() === TOK_SUBTYPE_STOP || tokens.previous().type.toString() === TOK_TYPE_OPERAND);
        doAddToken = doAddToken && (tokens.next().type.toString() === TOK_TYPE_FUNCTION && tokens.next().subtype.toString() === TOK_SUBTYPE_START || tokens.next().type.toString() === TOK_TYPE_SUBEXPR && tokens.next().subtype.toString() === TOK_SUBTYPE_START || tokens.next().type.toString() === TOK_TYPE_OPERAND);
        if (doAddToken) {
          tokens2.add(token.value.toString(), TOK_TYPE_OP_IN, TOK_SUBTYPE_INTERSECT);
        }
        continue;
      }
      tokens2.addRef(token);
    }
    while (tokens2.moveNext()) {
      token = tokens2.current();
      if (token.type.toString() === TOK_TYPE_OP_IN && token.value.toString() === "-") {
        if (tokens2.BOF()) {
          token.type = TOK_TYPE_OP_PRE.toString();
        } else if (tokens2.previous().type.toString() === TOK_TYPE_FUNCTION && tokens2.previous().subtype.toString() === TOK_SUBTYPE_STOP || tokens2.previous().type.toString() === TOK_TYPE_SUBEXPR && tokens2.previous().subtype.toString() === TOK_SUBTYPE_STOP || tokens2.previous().type.toString() === TOK_TYPE_OP_POST || tokens2.previous().type.toString() === TOK_TYPE_OPERAND) {
          token.subtype = TOK_SUBTYPE_MATH.toString();
        } else {
          token.type = TOK_TYPE_OP_PRE.toString();
        }
        continue;
      }
      if (token.type.toString() === TOK_TYPE_OP_IN && token.value.toString() === "+") {
        if (tokens2.BOF()) {
          token.type = TOK_TYPE_NOOP.toString();
        } else if (tokens2.previous().type.toString() === TOK_TYPE_FUNCTION && tokens2.previous().subtype.toString() === TOK_SUBTYPE_STOP || tokens2.previous().type.toString() === TOK_TYPE_SUBEXPR && tokens2.previous().subtype.toString() === TOK_SUBTYPE_STOP || tokens2.previous().type.toString() === TOK_TYPE_OP_POST || tokens2.previous().type.toString() === TOK_TYPE_OPERAND) {
          token.subtype = TOK_SUBTYPE_MATH.toString();
        } else {
          token.type = TOK_TYPE_NOOP.toString();
        }
        continue;
      }
      if (token.type.toString() === TOK_TYPE_OP_IN && token.subtype.length === 0) {
        if ("<>=".indexOf(token.value.substr(0, 1)) !== -1) {
          token.subtype = TOK_SUBTYPE_LOGICAL.toString();
        } else if (token.value.toString() === "&") {
          token.subtype = TOK_SUBTYPE_CONCAT.toString();
        } else {
          token.subtype = TOK_SUBTYPE_MATH.toString();
        }
        continue;
      }
      if (token.type.toString() === TOK_TYPE_OPERAND && token.subtype.length === 0) {
        if (isNaN(parseFloat(token.value))) {
          if (token.value.toString() === "TRUE" || token.value.toString() === "FALSE") {
            token.subtype = TOK_SUBTYPE_LOGICAL.toString();
          } else {
            token.subtype = TOK_SUBTYPE_RANGE.toString();
          }
        } else {
          token.subtype = TOK_SUBTYPE_NUMBER.toString();
        }
        continue;
      }
      if (token.type.toString() === TOK_TYPE_FUNCTION) {
        if (token.value.substr(0, 1) === "@") {
          token.value = token.value.substr(1).toString();
        }
        continue;
      }
    }
    tokens2.reset();
    tokens = new F_tokens();
    while (tokens2.moveNext()) {
      if (tokens2.current().type.toString() !== TOK_TYPE_NOOP) {
        tokens.addRef(tokens2.current());
      }
    }
    tokens.reset();
    return tokens;
  }
  const trim = function(inStr) {
    return inStr.replace(/^\s|\s$/, "");
  };
  const formatStr = function(inStr) {
    let formattedStr = inStr;
    let argIndex = 1;
    for (; argIndex < arguments.length; argIndex++) {
      const replaceIndex = argIndex - 1;
      const replaceRegex = new RegExp("\\{{1}" + replaceIndex.toString() + "{1}\\}{1}", "g");
      formattedStr = formattedStr.replace(replaceRegex, arguments[argIndex]);
    }
    return formattedStr;
  };
  function applyTokenTemplate(token, options, indent, lineBreak, override) {
    const lastToken = typeof arguments[5] === void 0 || arguments[5] === null ? null : arguments[5];
    const replaceTokenTmpl = function(inStr) {
      return inStr.replace(/\{\{token\}\}/gi, "{0}").replace(/\{\{autoindent\}\}/gi, "{1}").replace(/\{\{autolinebreak\}\}/gi, "{2}");
    };
    let tokenString = "";
    if (token.subtype === "text" || token.type === "text") {
      tokenString = token.value.toString();
    } else if (token.type === "operand" && token.subtype === "range") {
      tokenString = token.value.toString();
    } else {
      tokenString = (token.value.length === 0 ? " " : token.value.toString()).split(" ").join("").toString();
    }
    if (typeof override === "function") {
      const returnVal = override(tokenString, token, indent, lineBreak);
      tokenString = returnVal.tokenString;
      if (!returnVal.useTemplate) {
        return tokenString;
      }
    }
    switch (token.type) {
      case "function":
        switch (token.value) {
          case "ARRAY":
            tokenString = formatStr(replaceTokenTmpl(options.tmplFunctionStartArray), tokenString, indent, lineBreak);
            break;
          case "ARRAYROW":
            tokenString = formatStr(replaceTokenTmpl(options.tmplFunctionStartArrayRow), tokenString, indent, lineBreak);
            break;
          case "ARRAYSTOP":
            tokenString = formatStr(replaceTokenTmpl(options.tmplFunctionStopArray), tokenString, indent, lineBreak);
            break;
          case "ARRAYROWSTOP":
            tokenString = formatStr(replaceTokenTmpl(options.tmplFunctionStopArrayRow), tokenString, indent, lineBreak);
            break;
          default:
            if (token.subtype.toString() === "start") {
              tokenString = formatStr(replaceTokenTmpl(options.tmplFunctionStart), tokenString, indent, lineBreak);
            } else {
              tokenString = formatStr(replaceTokenTmpl(options.tmplFunctionStop), tokenString, indent, lineBreak);
            }
            break;
        }
        break;
      case "operand":
        switch (token.subtype.toString()) {
          case "error":
            tokenString = formatStr(replaceTokenTmpl(options.tmplOperandError), tokenString, indent, lineBreak);
            break;
          case "range":
            tokenString = formatStr(replaceTokenTmpl(options.tmplOperandRange), tokenString, indent, lineBreak);
            break;
          case "logical":
            tokenString = formatStr(replaceTokenTmpl(options.tmplOperandLogical), tokenString, indent, lineBreak);
            break;
          case "number":
            tokenString = formatStr(replaceTokenTmpl(options.tmplOperandNumber), tokenString, indent, lineBreak);
            break;
          case "text":
            tokenString = formatStr(replaceTokenTmpl(options.tmplOperandText), tokenString, indent, lineBreak);
            break;
          case "argument":
            tokenString = formatStr(replaceTokenTmpl(options.tmplArgument), tokenString, indent, lineBreak);
            break;
        }
        break;
      case "operator-infix":
        tokenString = formatStr(replaceTokenTmpl(options.tmplOperandOperatorInfix), tokenString, indent, lineBreak);
        break;
      case "logical":
        tokenString = formatStr(replaceTokenTmpl(options.tmplLogical), tokenString, indent, lineBreak);
        break;
      case "argument":
        if (lastToken.type !== "argument") {
          tokenString = formatStr(replaceTokenTmpl(options.tmplArgument), tokenString, indent, lineBreak);
        } else {
          tokenString = formatStr(replaceTokenTmpl("{{autoindent}}" + options.tmplArgument), tokenString, indent, lineBreak);
        }
        break;
      case "subexpression":
        if (token.subtype.toString() === "start") {
          tokenString = formatStr(replaceTokenTmpl(options.tmplSubexpressionStart), tokenString, indent, lineBreak);
        } else {
          tokenString = formatStr(replaceTokenTmpl(options.tmplSubexpressionStop), tokenString, indent, lineBreak);
        }
        break;
    }
    return tokenString;
  }
  const formatFormula = function(formula, options) {
    formula = formula.replace(/^\s*=\s+/, "=");
    const defaultOptions = {
      tmplFunctionStart: "{{autoindent}}{{token}}(\n",
      tmplFunctionStop: "\n{{autoindent}}{{token}})",
      tmplOperandError: " {{token}}",
      tmplOperandRange: "{{autoindent}}{{token}}",
      tmplLogical: "{{token}}{{autolinebreak}}",
      tmplOperandLogical: "{{autoindent}}{{token}}",
      tmplOperandNumber: "{{autoindent}}{{token}}",
      tmplOperandText: '{{autoindent}}"{{token}}"',
      tmplArgument: "{{token}}\n",
      tmplOperandOperatorInfix: " {{token}}{{autolinebreak}}",
      tmplFunctionStartArray: "",
      tmplFunctionStartArrayRow: "{",
      tmplFunctionStopArrayRow: "}",
      tmplFunctionStopArray: "",
      tmplSubexpressionStart: "{{autoindent}}(\n",
      tmplSubexpressionStop: "\n)",
      tmplIndentTab: "	",
      tmplIndentSpace: " ",
      autoLineBreak: "TOK_TYPE_FUNCTION | TOK_TYPE_ARGUMENT | TOK_SUBTYPE_LOGICAL | TOK_TYPE_OP_IN ",
      newLine: "\n",
      trim: true,
      customTokenRender: null,
      prefix: "",
      postfix: "",
      isEu: false
    };
    if (options) {
      options = Object.assign({}, defaultOptions, options);
    } else {
      options = defaultOptions;
    }
    let indentCount = 0;
    const indent_f = function() {
      let s = "";
      let i = 0;
      for (; i < indentCount; i += 1) {
        s += options.tmplIndentTab;
      }
      return s;
    };
    const tokens = getTokens$1(formula, options.isEu);
    let outputFormula = "";
    const autoBreakArray = options.autoLineBreak.replace(/\s/gi, "").split("|");
    let isNewLine = true;
    const testAutoBreak = function(nextToken) {
      let i = 0;
      for (; i < autoBreakArray.length; i += 1) {
        if (nextToken !== null && typeof nextToken !== "undefined" && (types[autoBreakArray[i]] === nextToken.type.toString() || types[autoBreakArray[i]] === nextToken.subtype.toString())) {
          return true;
        }
      }
      return false;
    };
    let lastToken = null;
    while (tokens.moveNext()) {
      const token = tokens.current();
      const nextToken = tokens.next();
      if (token.subtype.toString() === TOK_SUBTYPE_STOP) {
        indentCount -= indentCount > 0 ? 1 : 0;
      }
      new RegExp("^" + options.newLine, "");
      const matchEndNewLine = new RegExp(options.newLine + "$", "");
      const autoBreak = testAutoBreak(nextToken);
      const autoIndent = isNewLine;
      const indent = autoIndent ? indent_f() : options.tmplIndentSpace;
      const lineBreak = autoBreak ? options.newLine : "";
      outputFormula += applyTokenTemplate(token, options, indent, lineBreak, options.customTokenRender, lastToken);
      if (token.subtype.toString() === TOK_SUBTYPE_START) {
        indentCount += 1;
      }
      isNewLine = autoBreak || matchEndNewLine.test(outputFormula);
      lastToken = token;
    }
    outputFormula = options.prefix + options.trim ? trim(outputFormula) : outputFormula + options.postfix;
    return outputFormula;
  };
  const formatFormulaHTML = function(formula, options) {
    const tokRender = function(tokenStr, token, indent, lineBreak) {
      let outStr = tokenStr;
      switch (token.type.toString()) {
        case TOK_TYPE_OPERAND:
          if (token.subtype === TOK_SUBTYPE_TEXT) {
            outStr = tokenStr.replace(/</gi, "&lt;").replace(/>/gi, "&gt;");
          }
          break;
      }
      return {
        tokenString: outStr,
        useTemplate: true
      };
    };
    const defaultOptions = {
      tmplFunctionStart: '{{autoindent}}<span class="function">{{token}}</span><span class="function_start">(</span><br />',
      tmplFunctionStop: '<br />{{autoindent}}{{token}}<span class="function_stop">)</span>',
      tmplOperandText: '{{autoindent}}<span class="quote_mark">"</span><span class="text">{{token}}</span><span class="quote_mark">"</span>',
      tmplArgument: "{{token}}<br />",
      tmplSubexpressionStart: "{{autoindent}}(",
      tmplSubexpressionStop: " )",
      tmplIndentTab: '<span class="tabbed">&nbsp;&nbsp;&nbsp;&nbsp;</span>',
      tmplIndentSpace: "&nbsp;",
      newLine: "<br />",
      autoLineBreak: "TOK_TYPE_FUNCTION | TOK_TYPE_ARGUMENT | TOK_SUBTYPE_LOGICAL | TOK_TYPE_OP_IN ",
      trim: true,
      prefix: "=",
      customTokenRender: tokRender
    };
    if (options) {
      options = Object.assign({}, defaultOptions, options);
    } else {
      options = defaultOptions;
    }
    return formatFormula(formula, options);
  };
  const fromBase26 = function(number) {
    number = number.toUpperCase();
    let s = 0;
    let i = 0;
    let dec = 0;
    if (number !== null && typeof number !== "undefined" && number.length > 0) {
      for (; i < number.length; i++) {
        s = number.charCodeAt(number.length - i - 1) - "A".charCodeAt(0);
        dec += Math.pow(26, i) * (s + 1);
      }
    }
    return dec - 1;
  };
  const toBase26 = function(value) {
    value = Math.abs(value);
    let converted = "";
    let iteration = false;
    let remainder;
    do {
      remainder = value % 26;
      if (iteration && value < 25) {
        remainder--;
      }
      converted = String.fromCharCode(remainder + "A".charCodeAt(0)) + converted;
      value = Math.floor((value - remainder) / 26);
      iteration = true;
    } while (value > 0);
    return converted;
  };
  const breakOutRanges = (rangeStr, delimStr) => {
    if (!RegExp("[a-z]+[0-9]+:[a-z]+[0-9]+", "gi").test(rangeStr)) {
      throw "This is not a valid range: " + rangeStr;
    }
    const range = rangeStr.split(":");
    let endRow;
    let endCol;
    let totalRows;
    let totalCols;
    let curCol;
    let curRow;
    let curCell;
    let retStr;
    const startRow = parseInt(range[0].match(/[0-9]+/gi)[0]);
    const startCol = range[0].match(/[A-Z]+/gi)[0];
    const startColDec = fromBase26(startCol);
    endRow = parseInt(range[1].match(/[0-9]+/gi)[0]), endCol = range[1].match(/[A-Z]+/gi)[0], fromBase26(endCol), // Total rows and cols
    totalRows = endRow - startRow + 1, totalCols = fromBase26(endCol) - fromBase26(startCol) + 1, // Loop vars
    curCol = 0, curRow = 1, curCell = "", // Return String
    retStr = "";
    for (; curRow <= totalRows; curRow += 1) {
      for (; curCol < totalCols; curCol += 1) {
        curCell = toBase26(startColDec + curCol) + "" + (startRow + curRow - 1);
        retStr += curCell + (curRow === totalRows && curCol === totalCols - 1 ? "" : delimStr);
      }
      curCol = 0;
    }
    return retStr;
  };
  const formula2CSharp = function(formula, options) {
    const functionStack = [];
    const tokRender = function(tokenStr, token, indent, lineBreak) {
      let outStr = "";
      const tokenString = tokenStr;
      const directConversionMap = {
        "=": "==",
        "<>": "!=",
        MIN: "Math.min",
        MAX: "Math.max",
        ABS: "Math.abs",
        SUM: "",
        IF: "",
        "&": "+",
        AND: "",
        OR: ""
      };
      const currentFunctionOnStack = functionStack[functionStack.length - 1];
      let useTemplate = false;
      switch (token.type.toString()) {
        case TOK_TYPE_FUNCTION:
          switch (token.subtype) {
            case TOK_SUBTYPE_START:
              functionStack.push({
                name: tokenString,
                argumentNumber: 0
              });
              outStr = typeof directConversionMap[tokenString.toUpperCase()] === "string" ? directConversionMap[tokenString.toUpperCase()] : tokenString;
              useTemplate = true;
              break;
            case TOK_SUBTYPE_STOP:
              useTemplate = true;
              switch (currentFunctionOnStack.name.toLowerCase()) {
                case "if":
                  outStr = currentFunctionOnStack.argumentNumber === 1 ? ":0)" : ")";
                  useTemplate = false;
                  break;
                default:
                  outStr = typeof directConversionMap[tokenString.toUpperCase()] === "string" ? directConversionMap[tokenString.toUpperCase()] : tokenString;
                  break;
              }
              functionStack.pop();
              break;
          }
          break;
        case TOK_TYPE_ARGUMENT:
          switch (currentFunctionOnStack.name.toLowerCase()) {
            case "if":
              switch (currentFunctionOnStack.argumentNumber) {
                case 0:
                  outStr = "?";
                  break;
                case 1:
                  outStr = ":";
                  break;
              }
              break;
            case "sum":
              outStr = "+";
              break;
            case "and":
              outStr = "&&";
              break;
            case "or":
              outStr = "||";
              break;
            default:
              outStr = typeof directConversionMap[tokenString.toUpperCase()] === "string" ? directConversionMap[tokenString.toUpperCase()] : tokenString;
              useTemplate = true;
              break;
          }
          currentFunctionOnStack.argumentNumber += 1;
          break;
        case TOK_TYPE_OPERAND:
          switch (token.subtype) {
            case TOK_SUBTYPE_RANGE:
              if (!currentFunctionOnStack) {
                break;
              }
              switch (currentFunctionOnStack.name.toLowerCase()) {
                case "sum":
                  if (RegExp(":", "gi").test(tokenString)) {
                    outStr = breakOutRanges(tokenString, "+");
                  } else {
                    outStr = tokenString;
                  }
                  break;
                case "and":
                  if (RegExp(":", "gi").test(tokenString)) {
                    outStr = breakOutRanges(tokenString, "&&");
                  } else {
                    outStr = tokenString;
                  }
                  break;
                case "or":
                  if (RegExp(":", "gi").test(tokenString)) {
                    outStr = breakOutRanges(tokenString, "||");
                  } else {
                    outStr = tokenString;
                  }
                  break;
                default:
                  if (RegExp(":", "gi").test(tokenString)) {
                    outStr = "[" + breakOutRanges(tokenString, ",") + "]";
                  } else {
                    outStr = tokenString;
                  }
                  break;
              }
              break;
          }
        default:
          if (outStr === "") {
            outStr = typeof directConversionMap[tokenString.toUpperCase()] === "string" ? directConversionMap[tokenString.toUpperCase()] : tokenString;
          }
          useTemplate = true;
          break;
      }
      return {
        tokenString: outStr,
        useTemplate
      };
    };
    const defaultOptions = {
      tmplFunctionStart: "{{token}}(",
      tmplFunctionStop: "{{token}})",
      tmplOperandError: "{{token}}",
      tmplOperandRange: "{{token}}",
      tmplOperandLogical: "{{token}}",
      tmplOperandNumber: "{{token}}",
      tmplOperandText: '"{{token}}"',
      tmplArgument: "{{token}}",
      tmplOperandOperatorInfix: "{{token}}",
      tmplFunctionStartArray: "",
      tmplFunctionStartArrayRow: "{",
      tmplFunctionStopArrayRow: "}",
      tmplFunctionStopArray: "",
      tmplSubexpressionStart: "(",
      tmplSubexpressionStop: ")",
      tmplIndentTab: "	",
      tmplIndentSpace: " ",
      autoLineBreak: "TOK_SUBTYPE_STOP | TOK_SUBTYPE_START | TOK_TYPE_ARGUMENT",
      trim: true,
      customTokenRender: tokRender
    };
    if (options) {
      options = Object.assign({}, defaultOptions, options);
    } else {
      options = defaultOptions;
    }
    const cSharpOutput = formatFormula(formula, options);
    return cSharpOutput;
  };
  const formula2JavaScript = function(formula, options) {
    return formula2CSharp(formula, options).replace("==", "===");
  };
  const formula2Python = function(formula, options) {
    const functionStack = [];
    const tokRender = function(tokenStr, token, indent, lineBreak) {
      let outStr = "";
      const tokenString = tokenStr;
      const directConversionMap = {
        "=": "==",
        "<>": "!=",
        MIN: "min",
        MAX: "max",
        ABS: "math.fabs",
        SUM: "",
        IF: "",
        "&": "+",
        AND: "",
        OR: "",
        NOT: "!",
        TRUE: "True",
        FALSE: "False"
      };
      const currentFunctionOnStack = functionStack[functionStack.length - 1];
      let useTemplate = false;
      switch (token.type.toString()) {
        case TOK_TYPE_FUNCTION:
          switch (token.subtype) {
            case TOK_SUBTYPE_START:
              functionStack.push({
                name: tokenString,
                argumentNumber: 0
              });
              outStr = typeof directConversionMap[tokenString.toUpperCase()] === "string" ? directConversionMap[tokenString.toUpperCase()] : tokenString;
              useTemplate = true;
              break;
            case TOK_SUBTYPE_STOP:
              useTemplate = true;
              switch (currentFunctionOnStack.name.toLowerCase()) {
                case "if":
                  outStr = ",))[0]";
                  if (currentFunctionOnStack.argumentNumber === 1) {
                    outStr = " or (0" + outStr;
                  }
                  useTemplate = false;
                  break;
                default:
                  outStr = typeof directConversionMap[tokenString.toUpperCase()] === "string" ? directConversionMap[tokenString.toUpperCase()] : tokenString;
                  break;
              }
              functionStack.pop();
              break;
          }
          break;
        case TOK_TYPE_ARGUMENT:
          switch (currentFunctionOnStack.name.toLowerCase()) {
            case "if":
              switch (currentFunctionOnStack.argumentNumber) {
                case 0:
                  outStr = " and (";
                  break;
                case 1:
                  outStr = ",) or (";
                  break;
              }
              break;
            case "sum":
              outStr = "+";
              break;
            case "and":
              outStr = " and ";
              break;
            case "or":
              outStr = " or ";
              break;
            default:
              outStr = typeof directConversionMap[tokenString.toUpperCase()] === "string" ? directConversionMap[tokenString.toUpperCase()] : tokenString;
              useTemplate = true;
              break;
          }
          currentFunctionOnStack.argumentNumber += 1;
          break;
        case TOK_TYPE_OPERAND:
          switch (token.subtype) {
            case TOK_SUBTYPE_RANGE:
              if (!currentFunctionOnStack) {
                break;
              }
              if (RegExp("true|false", "gi").test(tokenString)) {
                outStr = typeof directConversionMap[tokenString.toUpperCase()] === "string" ? directConversionMap[tokenString.toUpperCase()] : tokenString;
                break;
              }
              switch (currentFunctionOnStack.name.toLowerCase()) {
                case "sum":
                  if (RegExp(":", "gi").test(tokenString)) {
                    outStr = breakOutRanges(tokenString, "+");
                  } else {
                    outStr = tokenString;
                  }
                  break;
                case "and":
                  if (RegExp(":", "gi").test(tokenString)) {
                    outStr = breakOutRanges(tokenString, " and ");
                  } else {
                    outStr = tokenString;
                  }
                  break;
                case "or":
                  if (RegExp(":", "gi").test(tokenString)) {
                    outStr = breakOutRanges(tokenString, " or ");
                  } else {
                    outStr = tokenString;
                  }
                  break;
                default:
                  if (RegExp(":", "gi").test(tokenString)) {
                    outStr = "[" + breakOutRanges(tokenString, ",") + "]";
                  } else {
                    outStr = tokenString;
                  }
                  break;
              }
              break;
          }
        default:
          if (outStr === "") {
            outStr = typeof directConversionMap[tokenString.toUpperCase()] === "string" ? directConversionMap[tokenString.toUpperCase()] : tokenString;
          }
          useTemplate = true;
          break;
      }
      return {
        tokenString: outStr,
        useTemplate
      };
    };
    const defaultOptions = {
      tmplFunctionStart: "{{token}}(",
      tmplFunctionStop: "{{token}})",
      tmplOperandError: "{{token}}",
      tmplOperandRange: "{{token}}",
      tmplOperandLogical: "{{token}}",
      tmplOperandNumber: "{{token}}",
      tmplOperandText: '"{{token}}"',
      tmplArgument: "{{token}}",
      tmplOperandOperatorInfix: "{{token}}",
      tmplFunctionStartArray: "",
      tmplFunctionStartArrayRow: "{",
      tmplFunctionStopArrayRow: "}",
      tmplFunctionStopArray: "",
      tmplSubexpressionStart: "(",
      tmplSubexpressionStop: ")",
      tmplIndentTab: "	",
      tmplIndentSpace: " ",
      autoLineBreak: "TOK_SUBTYPE_STOP | TOK_SUBTYPE_START | TOK_TYPE_ARGUMENT",
      trim: true,
      customTokenRender: tokRender
    };
    if (options) {
      options = Object.assign({}, defaultOptions, options);
    } else {
      options = defaultOptions;
    }
    const pythonOutput = formatFormula(formula, options);
    return pythonOutput;
  };
  const getTokens = (f, isEu) => getTokens$1(f, isEu).items;
  exports2.formatFormula = formatFormula;
  exports2.formatFormulaHTML = formatFormulaHTML;
  exports2.formula2CSharp = formula2CSharp;
  exports2.formula2JavaScript = formula2JavaScript;
  exports2.formula2Python = formula2Python;
  exports2.getTokens = getTokens;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
