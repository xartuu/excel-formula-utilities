import { formula2CSharp } from './formula2CSharp'

/**
 * Both the csharp and javascript are the same when converted, this is just an alias for convert2CSharp. there are some subtle differences such as == vrs ===, this will be addressed in a later version.
 * @param {string} formula
 * @returns {string}
 */
export const formula2JavaScript = function (formula, options) {
  return formula2CSharp(formula, options).replace('==', '===')
}
