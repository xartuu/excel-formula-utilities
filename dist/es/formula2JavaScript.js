import { formula2CSharp } from "./formula2CSharp.js";
const formula2JavaScript = function(formula, options) {
  return formula2CSharp(formula, options).replace("==", "===");
};
export {
  formula2JavaScript
};
