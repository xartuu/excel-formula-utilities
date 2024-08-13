import { TOK_SUBTYPE_STOP, TOK_SUBTYPE_START, types } from "./constants.js";
import { getTokens } from "./getTokens.js";
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
  const tokens = getTokens(formula, options.isEu);
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
export {
  formatFormula,
  formatStr,
  trim
};
