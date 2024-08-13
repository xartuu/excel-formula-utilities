"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const constants = require("./constants.js");
const formatFormula = require("./formatFormula.js");
const formatFormulaHTML = function(formula, options) {
  const tokRender = function(tokenStr, token, indent, lineBreak) {
    let outStr = tokenStr;
    switch (token.type.toString()) {
      case constants.TOK_TYPE_OPERAND:
        if (token.subtype === constants.TOK_SUBTYPE_TEXT) {
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
  return formatFormula.formatFormula(formula, options);
};
exports.formatFormulaHTML = formatFormulaHTML;
