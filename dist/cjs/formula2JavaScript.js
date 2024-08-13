"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const formula2CSharp = require("./formula2CSharp.js");
const formula2JavaScript = function(formula, options) {
  return formula2CSharp.formula2CSharp(formula, options).replace("==", "===");
};
exports.formula2JavaScript = formula2JavaScript;
